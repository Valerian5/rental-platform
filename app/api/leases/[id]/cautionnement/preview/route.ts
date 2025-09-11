import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase"
import n2words from "n2words"

function getByPath(obj: any, path: string) {
  return path.split(".").reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), obj)
}

function fillTemplate(templateContent: string, context: Record<string, any>): string {
  let output = templateContent

  // Blocs conditionnels
  const ifBlockRegex = /{{#if\s+([\w.]+)}}([\s\S]*?){{\/if}}/g
  output = output.replace(ifBlockRegex, (_m, condPath, inner) => {
    const [truthy, falsy] = inner.split(/{{else}}/)
    const value = getByPath(context, condPath)
    return value ? (truthy ?? "") : (falsy ?? "")
  })

  // Remplacements simples
  output = output.replace(/{{\s*([\w.]+)\s*}}/g, (match, placeholder) => {
    const value = getByPath(context, placeholder)
    return value !== undefined && value !== null ? String(value) : match
  })

  return output
}

function buildContext(lease: any, tenant: any, owner: any, guarantor: any, options: any) {
  const rentAmount = Number(lease?.monthly_rent || 0)
  const rentAmountInWords = rentAmount > 0 ? n2words(rentAmount, { lang: "fr" }) : ""

  // Durée
  const durationType = options?.engagement_type === "determinee" ? "déterminée" : "indéterminée"
  const isIndet = durationType === "indéterminée"

  // Référence IRL (priorité à trimestre_reference_irl)
  const rentRevisionReference = lease?.trimestre_reference_irl || lease?.date_reference_irl || ""

  // Date de révision du loyer selon le choix du propriétaire
  const choix = lease?.date_revision_loyer || ""
  const start = lease?.date_prise_effet || lease?.start_date || null
  let rentRevisionDate = ""

  const formatDateDayMonth = (d: string | Date | null) => {
    if (!d) return ""
    try {
      const date = new Date(d)
      if (isNaN(date.getTime())) return "" // Vérifie si la date est invalide
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    } catch {
      return ""
    }
  }

  if (choix === "anniversaire") {
    rentRevisionDate = formatDateDayMonth(start)
  } else if (choix === "1er") {
    const base = start ? new Date(start) : new Date()
    const firstDay = new Date(base.getFullYear(), base.getMonth(), 1)
    rentRevisionDate = formatDateDayMonth(firstDay)
  } else if (choix === "autre") {
    rentRevisionDate = "autre date"
  } else {
    rentRevisionDate = formatDateDayMonth(options?.rent_revision_date || lease?.date_revision)
  }

  // Montant maximum
  const maxAmount = options?.max_amount ? Number(options.max_amount) : 0
  const maxAmountInWords = maxAmount > 0 ? n2words(maxAmount, { lang: "fr" }) : ""

  // Fallback pour le nom du propriétaire
  const ownerFirstName = owner?.first_name || ""
  const ownerLastName = owner?.last_name || ""
  let finalOwnerFirstName = ownerFirstName
  let finalOwnerLastName = ownerLastName

  if ((!ownerFirstName || !ownerLastName) && lease?.bailleur_nom_prenom) {
    const parts = lease.bailleur_nom_prenom.split(' ').filter(Boolean)
    finalOwnerFirstName = parts[0] || ""
    finalOwnerLastName = parts.slice(1).join(' ') || ""
  }


  return {
    // Garant (form)
    guarantor: {
      first_name: guarantor.firstName || "",
      last_name: guarantor.lastName || "",
      birth_date: guarantor.birthDate ? new Date(guarantor.birthDate).toLocaleDateString("fr-FR") : "",
      birth_place: guarantor.birthPlace || "",
      address: guarantor.address || "",
    },

    // Arbre lease attendu par le template
    lease: {
      rent_amount: rentAmount,
      rent_amount_in_words: rentAmountInWords,
      rent_revision_date: rentRevisionDate,
      rent_revision_reference: rentRevisionReference,
      tenant: {
        first_name: tenant?.first_name || "",
        last_name: tenant?.last_name || "",
      },
      property: {
        address: lease?.adresse_logement || "",
        city: lease?.property?.city || lease?.ville || "",
        owner: {
          first_name: finalOwnerFirstName,
          last_name: finalOwnerLastName,
          address: lease?.adresse_bailleur || owner?.address || "",
        },
      },
    },

    // Durée + conditions
    duration_type: durationType,
    is_indetermined_duration: isIndet,
    duration_precision: options?.engagement_precision || "",

    // Montant max
    max_amount_in_words: maxAmountInWords,
    max_amount: maxAmount ? String(maxAmount) : "",

    // Type de caution (et alias pour {{Caution_type}})
    caution_type: options?.caution_type || "solidaire",
    Caution_type: options?.caution_type || "solidaire",

    // Divers
    today: new Date().toLocaleDateString("fr-FR"),
    lieu_signature: options?.lieu_signature || lease?.ville_signature || lease?.property?.city || "",
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const leaseId = params.id

  try {
    const { guarantor, options } = await request.json()

    // 1) Bail et propriété liée
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("*, property:properties(city)")
      .eq("id", leaseId)
      .single()
    if (leaseError || !lease) return NextResponse.json({ error: "Bail non trouvé." }, { status: 404 })

    // 2) Relations minimales par IDs (locataire, propriétaire)
    const [tenantRes, ownerRes] = await Promise.all([
      lease.tenant_id
        ? supabase.from("users").select("id, first_name, last_name").eq("id", lease.tenant_id).single()
        : Promise.resolve({ data: null }),
      lease.owner_id
        ? supabase.from("users").select("id, first_name, last_name, address").eq("id", lease.owner_id).single()
        : Promise.resolve({ data: null }),
    ])
    const tenant = tenantRes?.data || null
    const owner = ownerRes?.data || null

    // 3) Template par défaut
    const { data: template, error: templateError } = await supabase
      .from("surety_bond_templates")
      .select("*")
      .eq("is_default", true)
      .limit(1)
      .maybeSingle()
    if (templateError || !template?.content) {
      return NextResponse.json({ error: "Modèle d'acte de cautionnement introuvable." }, { status: 404 })
    }

    const context = buildContext(lease, tenant, owner, guarantor, options || {})
    const html = fillTemplate(template.content, context)
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


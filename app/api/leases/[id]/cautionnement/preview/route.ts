import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase"
import n2words from "n2words"

function fillTemplate(templateContent: string, context: Record<string, any>): string {
  return templateContent.replace(/{{\s*([\w.]+)\s*}}/g, (match, placeholder) => {
    const keys = placeholder.split(".")
    let value: any = context
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) return match
    }
    return value ?? ""
  })
}

function buildContext(lease: any, tenant: any, owner: any, guarantor: any, options: any) {
  const rentAmount = Number(lease?.monthly_rent || 0)
  const rentAmountInWords = rentAmount > 0 ? n2words(rentAmount, { lang: "fr" }) : ""

  const durationType = options?.engagement_type === "determinee" ? "déterminée" : "indéterminée"
  const isIndet = durationType === "indéterminée"
  const durationHint = isIndet ? "(3 ans)" : "" // champ dérivé si le template l’affiche

  return {
    // Garant (vient du formulaire, mais on peut le préremplir côté UI)
    guarantor: {
      first_name: guarantor.firstName || "",
      last_name: guarantor.lastName || "",
      birth_date: guarantor.birthDate ? new Date(guarantor.birthDate).toLocaleDateString("fr-FR") : "",
      birth_place: guarantor.birthPlace || "",
      address: guarantor.address || "",
    },

    // Arbre "lease" attendu par le template
    lease: {
      rent_amount: rentAmount,                        // {{lease.rent_amount}}
      rent_amount_in_words: rentAmountInWords,        // {{lease.rent_amount_in_words}}
      rent_revision_date: lease?.date_revision || "", // texte
      rent_revision_reference: lease?.revision_index_reference || "",
      tenant: {
        first_name: tenant?.first_name || "",
        last_name: tenant?.last_name || "",
      },
      property: {
        address: lease?.adresse_logement || "",       // adresse du bail depuis leases
        zip_code: lease?.code_postal || "",
        city: lease?.ville || "",
        owner: {
          first_name: owner?.first_name || "",
          last_name: owner?.last_name || "",
          address: lease?.bailleur_adresse || owner?.address || "",
        },
      },
    },

    // Durée d’engagement
    duration_type: durationType,                      // {{duration_type}}
    is_indetermined_duration: isIndet,               // {{is_indetermined_duration}}
    duration_precision: options?.engagement_precision || "", // {{duration_precision}}
    duration_hint: durationHint,                      // optionnel si tu l’utilises dans le template

    // Montant max garanti (si saisi)
    max_amount: options?.max_amount || "",
    max_amount_in_words:
      options?.max_amount ? n2words(Number(options.max_amount) || 0, { lang: "fr" }) : "",

    // Divers
    today: new Date().toLocaleDateString("fr-FR"),
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const leaseId = params.id

  try {
    const { guarantor, options } = await request.json()

    // 1) Bail
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("*")
      .eq("id", leaseId)
      .single()
    if (leaseError || !lease) return NextResponse.json({ error: "Bail non trouvé." }, { status: 404 })

    // 2) Relations minimales par IDs
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
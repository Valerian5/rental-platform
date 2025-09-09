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

function buildContext(lease: any, guarantor: any, options: any) {
  const rentAmount = Number(lease?.rent_amount || 0)
  const rentAmountInWords = rentAmount > 0 ? n2words(rentAmount, { lang: "fr" }) : ""

  const durationType = options?.engagement_type === "determinee" ? "déterminée" : "indéterminée"

  return {
    // Champs garant
    guarantor: {
      first_name: guarantor.firstName || "",
      last_name: guarantor.lastName || "",
      birth_date: guarantor.birthDate
        ? new Date(guarantor.birthDate).toLocaleDateString("fr-FR")
        : "",
      birth_place: guarantor.birthPlace || "",
      address: guarantor.address || "",
    },

    // Arbre "lease" attendu par le template
    lease: {
      rent_amount: rentAmount,
      rent_amount_in_words: rentAmountInWords,
      rent_revision_date: lease?.date_revision || "", // texte dans notre modèle
      rent_revision_reference: lease?.revision_index_reference || "",
      tenant: {
        first_name: lease?.tenant?.first_name || "",
        last_name: lease?.tenant?.last_name || "",
      },
      property: {
        address: lease?.property?.address || "",
        zip_code: lease?.property?.zip_code || "",
        city: lease?.property?.city || "",
        owner: {
          first_name: lease?.owner?.first_name || "",
          last_name: lease?.owner?.last_name || "",
          address: lease?.owner?.address || "",
        },
      },
    },

    // Durée d’engagement (à plat)
    duration_type: durationType,
    is_indetermined_duration: durationType === "indéterminée",
    duration_precision: options?.engagement_precision || "",

    // Montant maximum garanti (si non saisi pour l’instant)
    max_amount_in_words: options?.max_amount
      ? n2words(Number(options.max_amount) || 0, { lang: "fr" })
      : "",
    max_amount: options?.max_amount || "",

    // Divers
    today: new Date().toLocaleDateString("fr-FR"),
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient(request)
  const leaseId = params.id

  try {
    const { guarantor, leaseData: _unused, options } = await request.json()

    // Charger le bail + relations attendues par les placeholders
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select(`
        *,
        property:properties(address, zip_code, city),
        tenant:users!leases_tenant_id_fkey(first_name, last_name),
        owner:users!leases_owner_id_fkey(first_name, last_name, address)
      `)
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail non trouvé." }, { status: 404 })
    }

    // Récupérer le template par défaut d’acte de cautionnement
    const { data: template, error: templateError } = await supabase
      .from("surety_bond_templates")
      .select("*")
      .eq("is_default", true)
      .limit(1)
      .maybeSingle()

    if (templateError || !template?.content) {
      return NextResponse.json({ error: "Modèle d'acte de cautionnement introuvable." }, { status: 404 })
    }

    // Construire le contexte EXACT pour tes placeholders
    const context = buildContext(lease, guarantor, options || {})

    const html = fillTemplate(template.content, context)
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
// MODIFICATION: Importation plus robuste du module de génération PDF
import * as pdfGenerator from "@/lib/pdf-generator-final"

// --- FONCTIONS UTILITAIRES ---

function numberToWords(num: number): string {
  const toWords = (n: number): string => {
    if (n === 0) return ""
    const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"]
    const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"]
    const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"]
    if (n < 10) return units[n]
    if (n < 20) return teens[n - 10]
    if (n < 70) return tens[Math.floor(n / 10)] + (n % 10 === 1 ? " et un" : n % 10 !== 0 ? "-" + units[n % 10] : "")
    if (n < 80) return "soixante-" + (n === 71 ? " et onze" : teens[n - 60])
    if (n < 90) return "quatre-vingt" + (n % 10 !== 0 ? "-" + units[n % 10] : "s")
    if (n < 100) return "quatre-vingt-" + teens[n - 80]
    if (n < 200) return "cent" + (n % 100 !== 0 ? " " + toWords(n % 100) : "")
    if (n < 1000) return units[Math.floor(n / 100)] + " cent" + (n % 100 !== 0 ? " " + toWords(n % 100) : "s")
    if (n === 1000) return "mille"
    if (n < 2000) return "mille " + toWords(n % 1000)
    if (n < 1000000) {
      const thousands = toWords(Math.floor(n / 1000))
      return (thousands === "un" ? "" : thousands + " ") + "mille " + toWords(n % 1000)
    }
    if (n < 2000000) return "un million " + toWords(n % 1000000)
    if (n < 1000000000) return toWords(Math.floor(n / 1000000)) + " millions " + toWords(n % 1000000)
    return ""
  }
  if (typeof num !== "number") return ""
  if (num === 0) return "zéro"
  const integerPart = Math.floor(num)
  const decimalPart = Math.round((num - integerPart) * 100)
  const integerWords = toWords(integerPart).trim()
  if (decimalPart > 0) {
    const decimalWords = toWords(decimalPart).trim()
    return `${integerWords} euros et ${decimalWords} centimes`
  }
  return `${integerWords} euros`
}

function fillTemplate(templateContent: string, context: Record<string, any>): string {
  let content = templateContent
  const regex = /{{\s*([\w.]+)\s*}}/g
  content = content.replace(regex, (match, placeholder) => {
    const keys = placeholder.split(".")
    let value: any = context
    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key]
      } else {
        return match
      }
    }
    return value !== null && value !== undefined ? String(value) : ""
  })
  return content
}

// --- ROUTE HANDLER ---

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const leaseId = params.id

  try {
    const { guarantor, leaseData } = await request.json()

    if (!guarantor || !leaseData) {
      return NextResponse.json({ error: "Données du garant ou du bail manquantes." }, { status: 400 })
    }

    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select(`*, property:properties(address, city), tenant:users!leases_tenant_id_fkey(first_name, last_name), owner:users!leases_owner_id_fkey(first_name, last_name)`)
      .eq("id", leaseId)
      .single()

    if (leaseError) {
      console.error("Erreur récupération du bail:", leaseError)
      return NextResponse.json({ error: "Bail non trouvé." }, { status: 404 })
    }

    const { data: template, error: templateError } = await supabase
      .from("surety_bond_templates")
      .select("content")
      .eq("is_default", true)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: "Aucun modèle d'acte de cautionnement par défaut trouvé." }, { status: 500 })
    }

    const totalRent = (lease.rent_amount || 0) + (lease.charges_amount || 0)

    const context = {
      bailleur: {
        nom_prenom: leaseData.bailleur_nom_prenom,
        adresse: leaseData.bailleur_adresse || "Adresse non renseignée",
      },
      locataire: { nom_prenom: leaseData.locataire_nom_prenom },
      caution: {
        nom_prenom: `${guarantor.firstName} ${guarantor.lastName}`,
        adresse: guarantor.address,
        date_naissance: new Date(guarantor.birthDate).toLocaleDateString("fr-FR"),
        lieu_naissance: guarantor.birthPlace,
      },
      logement: { adresse: leaseData.adresse_logement },
      bail: {
        date_signature: new Date(lease.created_at).toLocaleDateString("fr-FR"),
        date_prise_effet: new Date(leaseData.date_prise_effet).toLocaleDateString("fr-FR"),
      },
      loyer: {
        montant_chiffres: leaseData.montant_loyer_mensuel,
        montant_lettres: numberToWords(leaseData.montant_loyer_mensuel),
        charges_chiffres: lease.charges_amount || 0,
        charges_lettres: numberToWords(lease.charges_amount || 0),
        total_chiffres: totalRent,
        total_lettres: numberToWords(totalRent),
        revision_annuelle_indice: lease.revision_index_reference || "[indice non spécifié]",
      },
      engagement: {
        duree: "la durée du bail initial et de ses renouvellements successifs",
        montant_max_chiffres: "non applicable",
        montant_max_lettres: "non applicable",
      },
      date_du_jour: new Date().toLocaleDateString("fr-FR"),
      ville_signature: "____________",
    }

    const htmlContent = fillTemplate(template.content, context)

    // MODIFICATION: Appel via l'objet du module importé
    const pdfBuffer = await pdfGenerator.generatePdfFromHtml(htmlContent)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="acte-de-cautionnement-${lease.id}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la génération de l'acte de cautionnement:", error)
    return NextResponse.json({ error: "Erreur serveur interne." }, { status: 500 })
  }
}


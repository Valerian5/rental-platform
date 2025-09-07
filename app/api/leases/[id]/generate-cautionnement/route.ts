import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
// Assurez-vous que ces utilitaires existent et sont correctement importés
import { generatePdfFromHtml } from "@/lib/pdf-generator-final"
import { numberToWords } from "@/lib/utils"

// Helper pour remplacer les placeholders dans le template
function fillTemplate(templateContent: string, context: Record<string, any>): string {
  let content = templateContent
  // Regex pour trouver tous les placeholders comme {{objet.propriete}}
  const regex = /{{\s*([\w.]+)\s*}}/g

  content = content.replace(regex, (match, placeholder) => {
    const keys = placeholder.split(".")
    let value: any = context
    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key]
      } else {
        return match // Laisse le placeholder si la clé n'est pas trouvée
      }
    }
    return value !== null && value !== undefined ? String(value) : ""
  })

  return content
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const leaseId = params.id

  try {
    const { guarantor } = await request.json()

    if (!guarantor) {
      return NextResponse.json({ error: "Données du garant manquantes." }, { status: 400 })
    }

    // 1. Récupérer les données complètes du bail (REQUÊTE CORRIGÉE)
    // L'erreur venait d'une jointure ambigüe sur la table 'users'.
    // J'ai précisé à Supabase comment joindre le locataire (tenant) et le propriétaire (owner).
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select(
        `
        *, 
        property:properties(*),
        tenant:users!leases_tenant_id_fkey(first_name, last_name, address),
        owner:users!leases_owner_id_fkey(first_name, last_name, address)
      `,
      )
      .eq("id", leaseId)
      .single()

    if (leaseError) {
      console.error("Erreur récupération du bail:", leaseError)
      return NextResponse.json({ error: "Bail non trouvé." }, { status: 404 })
    }

    // 2. Récupérer le modèle de caution par défaut
    const { data: template, error: templateError } = await supabase
      .from("surety_bond_templates")
      .select("content")
      .eq("is_default", true)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Aucun modèle d'acte de cautionnement par défaut trouvé." },
        { status: 500 },
      )
    }

    // 3. Préparer le contexte pour le template
    const rentInWords = numberToWords(lease.rent_amount)
    const chargesInWords = numberToWords(lease.charges_amount || 0)
    const totalRent = (lease.rent_amount || 0) + (lease.charges_amount || 0)

    const context = {
      bailleur: {
        nom_prenom: `${lease.owner.first_name} ${lease.owner.last_name}`,
        adresse: lease.owner.address || "Adresse non renseignée",
      },
      locataire: {
        nom_prenom: `${lease.tenant.first_name} ${lease.tenant.last_name}`,
      },
      caution: {
        nom_prenom: `${guarantor.firstName} ${guarantor.lastName}`,
        adresse: guarantor.address,
        date_naissance: new Date(guarantor.birthDate).toLocaleDateString("fr-FR"),
        lieu_naissance: guarantor.birthPlace,
      },
      logement: {
        adresse: `${lease.property.address}, ${lease.property.city}`,
      },
      bail: {
        date_signature: new Date(lease.created_at).toLocaleDateString("fr-FR"),
        date_prise_effet: new Date(lease.start_date).toLocaleDateString("fr-FR"),
      },
      loyer: {
        montant_chiffres: lease.rent_amount,
        montant_lettres: rentInWords,
        charges_chiffres: lease.charges_amount || 0,
        charges_lettres: chargesInWords,
        total_chiffres: totalRent,
        total_lettres: numberToWords(totalRent),
        revision_annuelle_indice: lease.revision_index_reference || "[indice non spécifié]",
      },
      engagement: {
        // Ces valeurs sont des exemples, à adapter selon la logique de votre application
        duree: "la durée du bail initial et de ses renouvellements successifs",
        montant_max_chiffres: "non applicable",
        montant_max_lettres: "non applicable",
      },
      date_du_jour: new Date().toLocaleDateString("fr-FR"),
      ville_signature: "____________",
    }

    // 4. Remplir le template avec les données
    const htmlContent = fillTemplate(template.content, context)

    // 5. Générer le PDF
    const pdfBuffer = await generatePdfFromHtml(htmlContent)

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


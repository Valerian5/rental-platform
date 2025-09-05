import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { generatePdfFromHtml } from "@/lib/pdf-generator"
import { replacePlaceholders, flattenObject } from "@/lib/lease-data-mapper"

export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createServerClient()
  const leaseId = params.id
  const { guarantor } = await request.json()

  if (!guarantor) {
    return NextResponse.json({ error: "Données du garant manquantes" }, { status: 400 })
  }

  try {
    // 1. Récupérer les données complètes du bail
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select(
        "*, property:properties(*, owner:users(*)), tenant:users(*), cotenants:users!leases_cotenants_fkey(*)",
      )
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      console.error("Erreur récupération du bail:", leaseError)
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    // 2. Récupérer le modèle de caution par défaut depuis la DB
    const { data: template, error: templateError } = await supabase
      .from("surety_bond_templates")
      .select("content")
      .eq("is_default", true)
      .single()

    if (templateError || !template || !template.content) {
      console.error("Erreur récupération du modèle:", templateError)
      return NextResponse.json(
        { error: "Aucun modèle d'acte de cautionnement par défaut trouvé" },
        { status: 404 },
      )
    }

    // 3. Préparer le contexte de données pour le template
    const context = {
      lease,
      guarantor,
      today: new Date().toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    }

    // 4. Aplatir l'objet de contexte et remplacer les placeholders
    const flattenedData = flattenObject(context)
    const htmlContent = replacePlaceholders(template.content, flattenedData)

    // 5. Générer le PDF à partir du contenu HTML
    const pdfBuffer = await generatePdfFromHtml(htmlContent)

    // 6. Renvoyer le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="acte-de-caution-${lease.id}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erreur serveur lors de la génération du cautionnement:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.json(
      { error: "Erreur serveur", details: errorMessage },
      { status: 500 },
    )
  }
}

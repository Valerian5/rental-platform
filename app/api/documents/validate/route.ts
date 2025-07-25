import { type NextRequest, NextResponse } from "next/server"
import { documentValidationService } from "@/lib/document-validation-service"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentUrl, documentType, tenantId } = body

    // Validation des paramètres
    if (!documentUrl || !documentType || !tenantId) {
      return NextResponse.json(
        { error: "Paramètres manquants: documentUrl, documentType et tenantId sont requis" },
        { status: 400 },
      )
    }

    // Vérifier que le type de document est supporté
    const supportedTypes = ["identity", "tax_notice", "payslip", "bank_statement"]
    if (!supportedTypes.includes(documentType)) {
      return NextResponse.json({ error: `Type de document non supporté: ${documentType}` }, { status: 400 })
    }

    // Vérifier que l'utilisateur existe
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, user_type")
      .eq("id", tenantId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Vérifier les limites de validation (anti-spam)
    const { data: recentValidations } = await supabase
      .from("document_validations")
      .select("id")
      .eq("tenant_id", tenantId)
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Dernière heure

    if (recentValidations && recentValidations.length >= 10) {
      return NextResponse.json(
        { error: "Limite de validations atteinte. Veuillez réessayer plus tard." },
        { status: 429 },
      )
    }

    console.log(`🚀 Démarrage validation pour ${documentType} - tenant: ${tenantId}`)

    // Lancer la validation
    const result = await documentValidationService.validateDocument(
      documentUrl,
      documentType,
      tenantId,
      tenantId, // userId = tenantId pour l'audit
    )

    console.log(`✅ Validation terminée - ID: ${result.documentId}, Valide: ${result.isValid}`)

    return NextResponse.json({
      success: true,
      data: result,
      message: result.isValid
        ? "Document validé avec succès"
        : "Document invalide - voir les erreurs pour plus de détails",
    })
  } catch (error) {
    console.error("❌ Erreur API validation document:", error)

    return NextResponse.json(
      {
        error: "Erreur lors de la validation du document",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")

    if (!tenantId) {
      return NextResponse.json({ error: "Paramètre tenantId requis" }, { status: 400 })
    }

    // Récupérer l'historique des validations
    const history = await documentValidationService.getValidationHistory(tenantId)

    // Récupérer les statistiques
    const stats = await documentValidationService.getValidationStats(tenantId)

    return NextResponse.json({
      success: true,
      data: {
        history,
        stats,
      },
    })
  } catch (error) {
    console.error("❌ Erreur récupération historique:", error)

    return NextResponse.json({ error: "Erreur lors de la récupération de l'historique" }, { status: 500 })
  }
}

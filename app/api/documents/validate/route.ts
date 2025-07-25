import { type NextRequest, NextResponse } from "next/server"
import { documentValidationService } from "@/lib/document-validation-service"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { extractedData, documentType, tenantId, documentUrl } = body

    console.log("🔍 API Validation - Données reçues:", {
      documentType,
      tenantId,
      hasExtractedData: !!extractedData,
      documentUrl: documentUrl ? "présent" : "absent",
    })

    // Validation des paramètres
    if (!extractedData || !documentType || !tenantId) {
      return NextResponse.json(
        { error: "Paramètres manquants: extractedData, documentType et tenantId sont requis" },
        { status: 400 },
      )
    }

    // Vérifier que le type de document est supporté
    const supportedTypes = ["identity", "tax_notice", "payslip", "bank_statement"]
    if (!supportedTypes.includes(documentType)) {
      return NextResponse.json({ error: `Type de document non supporté: ${documentType}` }, { status: 400 })
    }

    // Créer l'utilisateur s'il n'existe pas (pour les tests)
    let user
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id, user_type")
      .eq("id", tenantId)
      .single()

    if (userError || !existingUser) {
      console.log("👤 Utilisateur non trouvé, création automatique pour:", tenantId)

      // Créer l'utilisateur automatiquement
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          id: tenantId,
          email: `${tenantId}@example.com`,
          user_type: "tenant",
          full_name: "Utilisateur Test",
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        console.error("❌ Erreur création utilisateur:", createError)
        return NextResponse.json({ error: "Impossible de créer l'utilisateur" }, { status: 500 })
      }

      user = newUser
      console.log("✅ Utilisateur créé:", user)
    } else {
      user = existingUser
    }

    // Vérifier les limites de validation (anti-spam)
    const { data: recentValidations } = await supabase
      .from("document_validations")
      .select("id")
      .eq("tenant_id", tenantId)
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Dernière heure

    if (recentValidations && recentValidations.length >= 20) {
      return NextResponse.json(
        { error: "Limite de validations atteinte. Veuillez réessayer plus tard." },
        { status: 429 },
      )
    }

    console.log(`🚀 Démarrage validation pour ${documentType} - tenant: ${tenantId}`)

    // Lancer la validation avec les données extraites côté client
    const result = await documentValidationService.validateDocument(
      extractedData,
      documentType,
      tenantId,
      tenantId, // userId = tenantId pour l'audit
      documentUrl,
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

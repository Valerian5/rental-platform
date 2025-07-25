import { type NextRequest, NextResponse } from "next/server"
import { documentValidationService } from "@/lib/document-validation-service"
import { authService } from "@/lib/auth-service"

export async function POST(request: NextRequest) {
  try {
    console.log("📋 API Validation Document - Début")

    // Vérifier l'authentification
    const user = await authService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Parser les données de la requête
    const body = await request.json()
    const { documentUrl, documentType, tenantId } = body

    // Validation des paramètres
    if (!documentUrl || !documentType) {
      return NextResponse.json({ error: "URL du document et type requis" }, { status: 400 })
    }

    // Utiliser l'ID de l'utilisateur connecté si tenantId n'est pas fourni
    const targetTenantId = tenantId || user.id

    // Vérifier les permissions
    if (user.user_type !== "admin" && user.id !== targetTenantId) {
      // Vérifier si l'utilisateur est propriétaire et peut valider ce document
      if (user.user_type !== "owner") {
        return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
      }
    }

    console.log(`🔍 Validation document ${documentType} pour tenant ${targetTenantId}`)

    // Lancer la validation
    const validationResult = await documentValidationService.validateDocument(documentUrl, documentType, targetTenantId)

    console.log(`✅ Validation terminée: ${validationResult.isValid ? "VALIDE" : "INVALIDE"}`)

    return NextResponse.json({
      success: true,
      validation: validationResult,
    })
  } catch (error) {
    console.error("❌ Erreur API validation document:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la validation du document",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("📋 API Récupération historique validations")

    // Vérifier l'authentification
    const user = await authService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer le tenantId depuis les paramètres de requête
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId") || user.id

    // Vérifier les permissions
    if (user.user_type !== "admin" && user.id !== tenantId) {
      if (user.user_type !== "owner") {
        return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
      }
    }

    // Récupérer l'historique
    const validationHistory = await documentValidationService.getValidationHistory(tenantId)

    return NextResponse.json({
      success: true,
      validations: validationHistory,
    })
  } catch (error) {
    console.error("❌ Erreur récupération historique:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération de l'historique",
      },
      { status: 500 },
    )
  }
}

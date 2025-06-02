import { type NextRequest, NextResponse } from "next/server"
import { applicationService } from "@/lib/application-service"
import { authService } from "@/lib/auth-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicationId = params.id
    console.log("📋 API Applications GET by ID:", applicationId)

    const application = await applicationService.getApplicationById(applicationId)

    return NextResponse.json({
      success: true,
      application,
    })
  } catch (error) {
    console.error("❌ Erreur API application:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors de la récupération de la candidature",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicationId = params.id
    const body = await request.json()
    console.log("🔄 API Applications PATCH:", applicationId, body)

    // Vérifier l'authentification
    const user = await authService.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentification requise",
        },
        { status: 401 },
      )
    }

    // Vérifier que l'utilisateur est bien le propriétaire
    if (user.user_type !== "owner") {
      return NextResponse.json(
        {
          success: false,
          error: "Accès non autorisé",
        },
        { status: 403 },
      )
    }

    // Mettre à jour le statut de la candidature
    const { status, notes } = body
    const application = await applicationService.updateApplicationStatus(applicationId, status, notes)

    return NextResponse.json({
      success: true,
      application,
    })
  } catch (error) {
    console.error("❌ Erreur API mise à jour candidature:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors de la mise à jour de la candidature",
      },
      { status: 500 },
    )
  }
}

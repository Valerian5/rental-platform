import { type NextRequest, NextResponse } from "next/server"
import { applicationService } from "@/lib/application-service"
import { authService } from "@/lib/auth-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("owner_id")
    const tenantId = searchParams.get("tenant_id")

    console.log("📋 API Applications GET - ownerId:", ownerId, "tenantId:", tenantId)

    if (ownerId) {
      // Récupérer les candidatures pour un propriétaire
      const applications = await applicationService.getOwnerApplications(ownerId)
      console.log("✅ Candidatures propriétaire récupérées:", applications.length)

      return NextResponse.json({
        success: true,
        applications,
      })
    } else if (tenantId) {
      // Récupérer les candidatures pour un locataire
      const applications = await applicationService.getTenantApplications(tenantId)
      console.log("✅ Candidatures locataire récupérées:", applications.length)

      return NextResponse.json({
        success: true,
        applications,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "owner_id ou tenant_id requis",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("❌ Erreur API applications:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors de la récupération des candidatures",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📝 API Applications POST:", body)

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

    // Créer la candidature
    const application = await applicationService.createApplication({
      ...body,
      tenant_id: user.id,
    })

    console.log("✅ Candidature créée:", application)

    return NextResponse.json({
      success: true,
      application,
    })
  } catch (error) {
    console.error("❌ Erreur création candidature:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors de la création de la candidature",
      },
      { status: 500 },
    )
  }
}

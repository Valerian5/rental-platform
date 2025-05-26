import { type NextRequest, NextResponse } from "next/server"
import { applicationService } from "@/lib/application-service"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const ownerId = searchParams.get("owner_id")
    const applicationId = searchParams.get("id")

    if (applicationId) {
      const application = await applicationService.getApplicationById(applicationId)
      return NextResponse.json({ application })
    }

    if (tenantId) {
      const applications = await applicationService.getTenantApplications(tenantId)
      return NextResponse.json({ applications })
    }

    if (ownerId) {
      const applications = await applicationService.getOwnerApplications(ownerId)
      return NextResponse.json({ applications })
    }

    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  } catch (error) {
    console.error("Erreur API applications:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Calculer le score de compatibilité
    const { data: property } = await supabase.from("properties").select("*").eq("id", body.property_id).single()

    if (property) {
      body.match_score = applicationService.calculateMatchScore(body, property)
    }

    const application = await applicationService.createApplication(body)
    return NextResponse.json({ application }, { status: 201 })
  } catch (error) {
    console.error("Erreur création candidature:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes } = body

    if (!id || !status) {
      return NextResponse.json({ error: "ID et statut requis" }, { status: 400 })
    }

    const application = await applicationService.updateApplicationStatus(id, status, notes)
    return NextResponse.json({ application })
  } catch (error) {
    console.error("Erreur mise à jour candidature:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { visitService } from "@/lib/visit-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const ownerId = searchParams.get("owner_id")

    if (tenantId) {
      const visits = await visitService.getTenantVisits(tenantId)
      return NextResponse.json({ visits })
    }

    if (ownerId) {
      const visits = await visitService.getOwnerVisits(ownerId)
      return NextResponse.json({ visits })
    }

    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  } catch (error) {
    console.error("Erreur API visites:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (type === "propose_slots") {
      const { application_id, slots } = body
      const visits = await visitService.proposeVisitSlots(application_id, slots)
      return NextResponse.json({ visits }, { status: 201 })
    } else {
      const visit = await visitService.createVisit(body)
      return NextResponse.json({ visit }, { status: 201 })
    }
  } catch (error) {
    console.error("Erreur création visite:", error)
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

    const visit = await visitService.updateVisitStatus(id, status, notes)
    return NextResponse.json({ visit })
  } catch (error) {
    console.error("Erreur mise à jour visite:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

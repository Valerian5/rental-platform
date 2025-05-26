import { type NextRequest, NextResponse } from "next/server"
import { propertyService } from "@/lib/property-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const slots = await propertyService.getPropertyVisitAvailabilities(params.id)
    return NextResponse.json({ slots })
  } catch (error) {
    console.error("Erreur API créneaux visite:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

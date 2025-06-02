import { type NextRequest, NextResponse } from "next/server"
import { propertyService } from "@/lib/property-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Récupérer les paramètres de recherche
    const filters = {
      city: searchParams.get("city") || "",
      property_type: searchParams.get("property_type") || "",
      min_price: searchParams.get("min_price") ? Number.parseInt(searchParams.get("min_price")!) : undefined,
      max_price: searchParams.get("max_price") ? Number.parseInt(searchParams.get("max_price")!) : undefined,
      min_rooms: searchParams.get("min_rooms") ? Number.parseInt(searchParams.get("min_rooms")!) : undefined,
      min_bedrooms: searchParams.get("min_bedrooms") ? Number.parseInt(searchParams.get("min_bedrooms")!) : undefined,
      min_surface: searchParams.get("min_surface") ? Number.parseInt(searchParams.get("min_surface")!) : undefined,
      max_surface: searchParams.get("max_surface") ? Number.parseInt(searchParams.get("max_surface")!) : undefined,
      furnished: searchParams.get("furnished") === "true" ? true : undefined,
    }

    // Pagination
    const page = searchParams.get("page") ? Number.parseInt(searchParams.get("page")!) : 1
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 12

    // Récupérer les propriétés
    const result = await propertyService.getProperties(filters, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ Erreur API search:", error)
    return NextResponse.json({ error: error.message || "Erreur lors de la recherche" }, { status: 500 })
  }
}

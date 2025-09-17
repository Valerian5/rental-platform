import { type NextRequest, NextResponse } from "next/server"
import { propertyService } from "@/lib/property-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Récupérer les paramètres de recherche
    const filters = {
      city: searchParams.getAll("city") || [], // Support pour plusieurs villes
      property_type: searchParams.get("property_type") || "",
      min_price: searchParams.get("min_price") ? Number.parseInt(searchParams.get("min_price")!) : undefined,
      max_price: searchParams.get("max_price") ? Number.parseInt(searchParams.get("max_price")!) : undefined,
      min_rooms: searchParams.get("min_rooms") ? Number.parseInt(searchParams.get("min_rooms")!) : undefined,
      min_bedrooms: searchParams.get("min_bedrooms") ? Number.parseInt(searchParams.get("min_bedrooms")!) : undefined,
      min_surface: searchParams.get("min_surface") ? Number.parseInt(searchParams.get("min_surface")!) : undefined,
      max_surface: searchParams.get("max_surface") ? Number.parseInt(searchParams.get("max_surface")!) : undefined,
      furnished: searchParams.get("furnished") === "true" ? true : undefined,
      // Nouveaux filtres
      has_parking: searchParams.get("has_parking") === "true" ? true : undefined,
      has_balcony: searchParams.get("has_balcony") === "true" ? true : undefined,
      has_elevator: searchParams.get("has_elevator") === "true" ? true : undefined,
      has_security: searchParams.get("has_security") === "true" ? true : undefined,
      internet: searchParams.get("internet") === "true" ? true : undefined,
      pets_allowed: searchParams.get("pets_allowed") === "true" ? true : undefined,
      energy_class: searchParams.get("energy_class") || "",
      min_compatibility_score: searchParams.get("min_compatibility_score") ? Number.parseInt(searchParams.get("min_compatibility_score")!) : undefined,
      available_from: searchParams.get("available_from") || "",
      equipment: searchParams.getAll("equipment") || [],
      radius: searchParams.get("radius") ? Number.parseInt(searchParams.get("radius")!) : undefined,
    }

    // Pagination et tri
    const page = searchParams.get("page") ? Number.parseInt(searchParams.get("page")!) : 1
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 12
    const sortBy = searchParams.get("sort_by") || "date"

    // Récupérer les propriétés
    const result = await propertyService.getProperties(filters, page, limit, sortBy)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ Erreur API search:", error)
    return NextResponse.json({ error: error.message || "Erreur lors de la recherche" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { searchService } from "@/lib/search-service"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      city: searchParams.get("city") || undefined,
      property_type: searchParams.get("property_type") || undefined,
      rental_type: searchParams.get("rental_type") || undefined,
      min_price: searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined,
      max_price: searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined,
      min_rooms: searchParams.get("min_rooms") ? Number(searchParams.get("min_rooms")) : undefined,
      min_bedrooms: searchParams.get("min_bedrooms") ? Number(searchParams.get("min_bedrooms")) : undefined,
      min_surface: searchParams.get("min_surface") ? Number(searchParams.get("min_surface")) : undefined,
      max_surface: searchParams.get("max_surface") ? Number(searchParams.get("max_surface")) : undefined,
      furnished: searchParams.get("furnished") ? searchParams.get("furnished") === "true" : undefined,
    }

    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 20

    const result = await searchService.searchProperties(filters, page, limit)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Erreur API recherche:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

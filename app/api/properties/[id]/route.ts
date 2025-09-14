import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET /api/properties/[id]
// Récupère les informations d'une propriété
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const propertyId = params.id
    const server = createServerClient()

    const { data: property, error } = await server
      .from("properties")
      .select(`
        id,
        title,
        description,
        address,
        city,
        postal_code,
        price,
        surface,
        rooms,
        bedrooms,
        bathrooms,
        property_type,
        furnished,
        owner_id
      `)
      .eq("id", propertyId)
      .single()

    if (error || !property) {
      return NextResponse.json({ error: "Propriété introuvable" }, { status: 404 })
    }

    return NextResponse.json({ property })
  } catch (error) {
    console.error("Erreur GET property:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
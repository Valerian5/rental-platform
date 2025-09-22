import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET - Récupérer tous les biens ou filtrer
export async function GET(request: NextRequest) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Créer un client Supabase avec le token
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const type = searchParams.get("type")
    const rooms = searchParams.get("rooms")

    // Construire la requête
    let query = supabase
      .from("properties")
      .select("*")
      .eq("owner_id", user.id)
      .eq("available", true)

    // Appliquer les filtres
    if (city) {
      query = query.ilike("city", `%${city}%`)
    }
    if (minPrice) {
      query = query.gte("price", Number.parseInt(minPrice))
    }
    if (maxPrice) {
      query = query.lte("price", Number.parseInt(maxPrice))
    }
    if (type) {
      query = query.eq("type", type)
    }
    if (rooms) {
      query = query.gte("rooms", Number.parseInt(rooms))
    }

    const { data: properties, error } = await query

    if (error) {
      console.error("Erreur récupération propriétés:", error)
      return NextResponse.json({ success: false, error: "Erreur récupération propriétés" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      properties: properties || [],
      total: properties?.length || 0,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des biens:", error)
    return NextResponse.json({ success: false, error: "Erreur interne du serveur" }, { status: 500 })
  }
}


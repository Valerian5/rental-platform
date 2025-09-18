import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server-utils"
import { favoritesService } from "@/lib/favorites-service"

// GET /api/favorites/check?property_id=... - Vérifier si un bien est en favori
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const property_id = searchParams.get("property_id")

    if (!property_id) {
      return NextResponse.json(
        { error: "property_id requis" },
        { status: 400 }
      )
    }

    const server = createServerClient()
    
    // Vérifier que l'utilisateur est authentifié
    const { data: { user }, error: authError } = await server.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    console.log("🔍 API Favorites Check", { userId: user.id, propertyId: property_id })

    const isFavorite = await favoritesService.isFavorite(user.id, property_id)

    return NextResponse.json({
      success: true,
      isFavorite,
    })
  } catch (error) {
    console.error("❌ Erreur API Favorites Check:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    )
  }
}

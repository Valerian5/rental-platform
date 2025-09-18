import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server-utils"
import { favoritesService } from "@/lib/favorites-service"

// GET /api/favorites - Récupérer les favoris de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const server = createServerClient()
    
    // Vérifier que l'utilisateur est authentifié
    const { data: { user }, error: authError } = await server.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    console.log("❤️ API Favorites GET", { userId: user.id })

    const favorites = await favoritesService.getUserFavorites(user.id)

    return NextResponse.json({
      success: true,
      data: favorites,
    })
  } catch (error) {
    console.error("❌ Erreur API Favorites GET:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    )
  }
}

// POST /api/favorites - Ajouter un bien aux favoris
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { property_id } = body

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

    console.log("❤️ API Favorites POST", { userId: user.id, propertyId: property_id })

    await favoritesService.addToFavorites(user.id, property_id)

    return NextResponse.json({
      success: true,
      message: "Bien ajouté aux favoris",
    })
  } catch (error) {
    console.error("❌ Erreur API Favorites POST:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    )
  }
}

// DELETE /api/favorites - Retirer un bien des favoris
export async function DELETE(request: NextRequest) {
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

    console.log("💔 API Favorites DELETE", { userId: user.id, propertyId: property_id })

    await favoritesService.removeFromFavorites(user.id, property_id)

    return NextResponse.json({
      success: true,
      message: "Bien retiré des favoris",
    })
  } catch (error) {
    console.error("❌ Erreur API Favorites DELETE:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    )
  }
}
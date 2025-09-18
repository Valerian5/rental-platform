import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth-token-service"
import { favoritesService } from "@/lib/favorites-service"

// POST /api/favorites/toggle - Toggle favori (ajouter ou retirer)
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

    // Vérifier que l'utilisateur est authentifié
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    console.log("🔄 API Favorites Toggle", { userId: user.id, propertyId: property_id })

    const isFavorite = await favoritesService.toggleFavorite(user.id, property_id)

    return NextResponse.json({
      success: true,
      isFavorite,
      message: isFavorite ? "Bien ajouté aux favoris" : "Bien retiré des favoris",
    })
  } catch (error) {
    console.error("❌ Erreur API Favorites Toggle:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    )
  }
}

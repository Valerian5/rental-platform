import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth-token-service"
import { favoritesService } from "@/lib/favorites-service"

export const dynamic = 'force-dynamic'

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

    // Vérifier que l'utilisateur est authentifié
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
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

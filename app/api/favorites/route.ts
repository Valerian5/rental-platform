import { type NextRequest, NextResponse } from "next/server"
import { favoritesService } from "@/lib/favorites-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "user_id requis" }, { status: 400 })
    }

    const favorites = await favoritesService.getUserFavorites(userId)
    return NextResponse.json({ favorites })
  } catch (error) {
    console.error("Erreur API favoris:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, property_id, action } = body

    if (!user_id || !property_id) {
      return NextResponse.json({ error: "user_id et property_id requis" }, { status: 400 })
    }

    if (action === "toggle") {
      const isFavorite = await favoritesService.toggleFavorite(user_id, property_id)
      return NextResponse.json({ is_favorite: isFavorite })
    } else {
      await favoritesService.addToFavorites(user_id, property_id)
      return NextResponse.json({ success: true }, { status: 201 })
    }
  } catch (error) {
    console.error("Erreur toggle favori:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const propertyId = searchParams.get("property_id")

    if (!userId || !propertyId) {
      return NextResponse.json({ error: "user_id et property_id requis" }, { status: 400 })
    }

    await favoritesService.removeFromFavorites(userId, propertyId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression favori:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { searchService } from "@/lib/search-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "user_id requis" }, { status: 400 })
    }

    const favorites = await searchService.getUserFavorites(userId)
    return NextResponse.json({ favorites })
  } catch (error) {
    console.error("Erreur API favoris:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, property_id } = body

    if (!user_id || !property_id) {
      return NextResponse.json({ error: "user_id et property_id requis" }, { status: 400 })
    }

    const result = await searchService.toggleFavorite(user_id, property_id)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Erreur toggle favori:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

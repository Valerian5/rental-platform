import { type NextRequest, NextResponse } from "next/server"
import { savedSearchService } from "@/lib/saved-search-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "user_id requis" }, { status: 400 })
    }

    const searches = await savedSearchService.getUserSavedSearches(userId)
    return NextResponse.json({ searches })
  } catch (error) {
    console.error("Erreur API recherches sauvegardées:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, ...searchData } = body

    if (!user_id) {
      return NextResponse.json({ error: "user_id requis" }, { status: 400 })
    }

    const search = await savedSearchService.createSavedSearch(user_id, searchData)
    return NextResponse.json({ search }, { status: 201 })
  } catch (error) {
    console.error("Erreur création recherche:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { search_id, ...updates } = body

    if (!search_id) {
      return NextResponse.json({ error: "search_id requis" }, { status: 400 })
    }

    const search = await savedSearchService.updateSavedSearch(search_id, updates)
    return NextResponse.json({ search })
  } catch (error) {
    console.error("Erreur mise à jour recherche:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchId = searchParams.get("search_id")

    if (!searchId) {
      return NextResponse.json({ error: "search_id requis" }, { status: 400 })
    }

    await savedSearchService.deleteSavedSearch(searchId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression recherche:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

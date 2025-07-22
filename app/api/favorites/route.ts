import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 })
    }

    // Récupérer les favoris de l'utilisateur
    const { data: favorites, error: favoritesError } = await supabase
      .from("favorites")
      .select(`
        id,
        created_at,
        property:properties (
          id,
          title,
          address,
          city,
          rent,
          property_images (
            url,
            is_primary
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (favoritesError) {
      console.error("Erreur récupération favoris:", favoritesError)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    // Compter le total
    const { count: totalCount } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    return NextResponse.json({
      favorites: favorites || [],
      total: totalCount || 0,
    })
  } catch (error) {
    console.error("Erreur API favoris:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, property_id } = body

    if (!user_id || !property_id) {
      return NextResponse.json({ error: "user_id et property_id requis" }, { status: 400 })
    }

    // Vérifier si déjà en favoris
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user_id)
      .eq("property_id", property_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Déjà en favoris" }, { status: 409 })
    }

    // Ajouter aux favoris
    const { data: favorite, error: favoriteError } = await supabase
      .from("favorites")
      .insert({ user_id, property_id })
      .select()
      .single()

    if (favoriteError) {
      console.error("Erreur ajout favori:", favoriteError)
      return NextResponse.json({ error: "Erreur ajout favori" }, { status: 500 })
    }

    return NextResponse.json({ favorite }, { status: 201 })
  } catch (error) {
    console.error("Erreur POST favoris:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
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

    const { error: deleteError } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("property_id", propertyId)

    if (deleteError) {
      console.error("Erreur suppression favori:", deleteError)
      return NextResponse.json({ error: "Erreur suppression favori" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur DELETE favoris:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const limit = searchParams.get("limit") || "10"

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 })
    }

    console.log("📋 API Favorites - GET", { userId, limit })

    // Vérifier si la table favorites existe
    const { data: tableExists, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "favorites")
      .single()

    if (tableError || !tableExists) {
      console.log("⚠️ Table favorites n'existe pas encore")
      return NextResponse.json({
        success: true,
        data: [],
        message: "Table favorites not found, returning empty array",
      })
    }

    // Récupérer les favoris avec les informations des propriétés
    const { data: favorites, error } = await supabase
      .from("favorites")
      .select(`
        id,
        property_id,
        created_at,
        properties (
          id,
          title,
          description,
          price,
          location,
          bedrooms,
          bathrooms,
          surface_area,
          images,
          status,
          created_at
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(Number.parseInt(limit))

    if (error) {
      console.error("❌ Erreur récupération favoris:", error)
      // Retourner des données vides au lieu d'une erreur 500
      return NextResponse.json({
        success: true,
        data: [],
        message: "Error fetching favorites, returning empty array",
      })
    }

    console.log(`✅ ${favorites?.length || 0} favoris récupérés`)

    return NextResponse.json({
      success: true,
      data: favorites || [],
    })
  } catch (error) {
    console.error("❌ Erreur dans API favorites:", error)
    // Retourner des données vides au lieu d'une erreur 500
    return NextResponse.json({
      success: true,
      data: [],
      message: "Unexpected error, returning empty array",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, property_id } = body

    if (!user_id || !property_id) {
      return NextResponse.json({ error: "user_id and property_id are required" }, { status: 400 })
    }

    console.log("📋 API Favorites - POST", { user_id, property_id })

    // Vérifier si déjà en favoris
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user_id)
      .eq("property_id", property_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Property already in favorites" }, { status: 409 })
    }

    // Ajouter aux favoris
    const { data, error } = await supabase
      .from("favorites")
      .insert({
        user_id,
        property_id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur ajout favori:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Favori ajouté")
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("❌ Erreur dans POST favorites:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const propertyId = searchParams.get("property_id")

    if (!userId || !propertyId) {
      return NextResponse.json({ error: "user_id and property_id are required" }, { status: 400 })
    }

    console.log("📋 API Favorites - DELETE", { userId, propertyId })

    const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("property_id", propertyId)

    if (error) {
      console.error("❌ Erreur suppression favori:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Favori supprimé")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erreur dans DELETE favorites:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

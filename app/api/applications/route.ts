import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("📋 API Applications GET")

    const supabase = createServerSupabaseClient()

    // Récupérer l'utilisateur authentifié
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Erreur authentification:", authError)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userId = user.id
    console.log("👤 User ID:", userId)

    // Déterminer si c'est un propriétaire ou un locataire
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const ownerId = searchParams.get("owner_id")

    let applications = []

    if (tenantId) {
      // Récupérer les candidatures du locataire
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          property:properties(
            id,
            title,
            address,
            city,
            price,
            rent,
            property_images(id, url, is_primary)
          )
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération candidatures locataire:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      applications = data || []
    } else {
      // Mode propriétaire - récupérer toutes les candidatures pour ses propriétés

      // D'abord récupérer les propriétés du propriétaire
      const { data: properties, error: propError } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_id", userId)

      if (propError) {
        console.error("❌ Erreur récupération propriétés:", propError)
        return NextResponse.json({ error: propError.message }, { status: 500 })
      }

      if (!properties || properties.length === 0) {
        console.log("✅ Aucune propriété trouvée")
        return NextResponse.json([])
      }

      const propertyIds = properties.map((p) => p.id)
      console.log("🏠 Propriétés trouvées:", propertyIds.length)

      // Récupérer les candidatures pour ces propriétés
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          property:properties(
            id,
            title,
            address,
            city,
            price,
            rent,
            property_images(id, url, is_primary)
          ),
          tenant:users(
            id,
            email,
            first_name,
            last_name,
            phone,
            avatar_url
          )
        `)
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération candidatures:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      applications = data || []

      // Enrichir avec les dossiers de location et visites
      applications = await Promise.all(
        applications.map(async (app) => {
          try {
            // Récupérer le dossier de location
            const { data: rentalFile } = await supabase
              .from("rental_files")
              .select("*")
              .eq("user_id", app.tenant_id)
              .single()

            // Récupérer les visites
            const { data: visits } = await supabase
              .from("visits")
              .select("*")
              .eq("tenant_id", app.tenant_id)
              .eq("property_id", app.property_id)
              .order("visit_date", { ascending: true })

            return {
              ...app,
              rental_file: rentalFile || null,
              visits: visits || [],
            }
          } catch (enrichError) {
            console.error("❌ Erreur enrichissement candidature:", enrichError)
            return {
              ...app,
              rental_file: null,
              visits: [],
            }
          }
        }),
      )
    }

    console.log(`✅ ${applications.length} candidatures récupérées`)
    return NextResponse.json(applications)
  } catch (error) {
    console.error("❌ Erreur API applications:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📋 API Applications POST")

    const supabase = createServerSupabaseClient()
    const body = await request.json()

    // Récupérer l'utilisateur authentifié
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Erreur authentification:", authError)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Créer la candidature
    const { data, error } = await supabase
      .from("applications")
      .insert({
        tenant_id: user.id,
        property_id: body.property_id,
        message: body.message,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur création candidature:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Candidature créée:", data.id)
    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ Erreur API applications POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

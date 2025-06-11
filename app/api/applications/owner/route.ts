import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("📋 API Applications Owner GET")

    // Récupérer l'utilisateur depuis les cookies
    const cookieStore = cookies()
    const userCookie = cookieStore.get("user")

    if (!userCookie) {
      console.error("❌ Pas de cookie utilisateur")
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    let userData
    try {
      userData = JSON.parse(userCookie.value)
    } catch (e) {
      console.error("❌ Erreur parsing cookie:", e)
      return NextResponse.json({ error: "Cookie invalide" }, { status: 401 })
    }

    const ownerId = userData.id
    console.log("👤 Owner ID:", ownerId)

    // Récupérer les propriétés du propriétaire
    const { data: properties, error: propError } = await supabase
      .from("properties")
      .select("id")
      .eq("owner_id", ownerId)

    if (propError) {
      console.error("❌ Erreur récupération propriétés:", propError)
      return NextResponse.json({ error: propError.message }, { status: 500 })
    }

    if (!properties || properties.length === 0) {
      console.log("✅ Aucune propriété trouvée")
      return NextResponse.json({ applications: [] })
    }

    const propertyIds = properties.map((p) => p.id)
    console.log("🏠 Propriétés trouvées:", propertyIds.length)

    // Récupérer les candidatures pour ces propriétés
    const { data: applications, error } = await supabase
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

    // Enrichir avec les dossiers de location et visites
    const enrichedApplications = await Promise.all(
      (applications || []).map(async (app) => {
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

    console.log(`✅ ${enrichedApplications.length} candidatures récupérées`)
    return NextResponse.json({ applications: enrichedApplications })
  } catch (error) {
    console.error("❌ Erreur API applications owner:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

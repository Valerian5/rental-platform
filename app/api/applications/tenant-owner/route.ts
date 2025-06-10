import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const ownerId = searchParams.get("owner_id")

    if (!tenantId || !ownerId) {
      return NextResponse.json({ error: "tenant_id et owner_id sont requis" }, { status: 400 })
    }

    console.log("🔍 Recherche candidatures:", { tenantId, ownerId })

    // Utiliser le client serveur pour avoir les permissions nécessaires
    const supabase = createServerClient()

    // D'abord récupérer les propriétés du propriétaire
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id")
      .eq("owner_id", ownerId)

    if (propertiesError) {
      console.error("❌ Erreur récupération propriétés:", propertiesError)
      return NextResponse.json({ error: "Erreur lors de la récupération des propriétés" }, { status: 500 })
    }

    if (!properties || properties.length === 0) {
      console.log("ℹ️ Aucune propriété trouvée pour ce propriétaire")
      return NextResponse.json({ applications: [], count: 0 })
    }

    const propertyIds = properties.map((p) => p.id)
    console.log("🏠 Propriétés du propriétaire:", propertyIds)

    // Ensuite récupérer les candidatures du locataire pour ces propriétés
    const { data: applications, error: applicationsError } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        created_at,
        message,
        property_id,
        properties(
          id,
          title,
          address,
          city,
          price,
          images
        )
      `)
      .eq("tenant_id", tenantId)
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false })

    if (applicationsError) {
      console.error("❌ Erreur récupération candidatures:", applicationsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des candidatures" }, { status: 500 })
    }

    console.log("✅ Candidatures trouvées:", applications?.length || 0)
    console.log("📋 Détail candidatures:", JSON.stringify(applications))

    // Transformer les données pour avoir la structure attendue
    const formattedApplications =
      applications?.map((app) => ({
        id: app.id,
        status: app.status,
        created_at: app.created_at,
        message: app.message,
        property: app.properties,
      })) || []

    return NextResponse.json({
      applications: formattedApplications,
      count: formattedApplications.length,
    })
  } catch (error) {
    console.error("❌ Erreur API candidatures tenant-owner:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

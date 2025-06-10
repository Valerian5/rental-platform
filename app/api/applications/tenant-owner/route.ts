import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const ownerId = searchParams.get("owner_id")

    if (!tenantId || !ownerId) {
      return NextResponse.json({ error: "tenant_id et owner_id sont requis" }, { status: 400 })
    }

    console.log("🔍 Recherche candidatures:", { tenantId, ownerId })

    // Étape 1: Récupérer les propriétés du propriétaire
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, title, address, city, price, images")
      .eq("owner_id", ownerId)

    if (propertiesError) {
      console.error("❌ Erreur récupération propriétés:", propertiesError)
      return NextResponse.json({ error: "Erreur lors de la récupération des propriétés" }, { status: 500 })
    }

    console.log("🏠 Propriétés trouvées:", properties?.length || 0)

    if (!properties || properties.length === 0) {
      console.log("ℹ️ Aucune propriété trouvée pour ce propriétaire")
      return NextResponse.json({ applications: [], count: 0 })
    }

    const propertyIds = properties.map((p) => p.id)
    console.log("🏠 IDs des propriétés:", propertyIds)

    // Étape 2: Récupérer les candidatures du locataire pour ces propriétés (SANS jointure)
    const { data: applications, error: applicationsError } = await supabase
      .from("applications")
      .select("id, status, created_at, message, property_id")
      .eq("tenant_id", tenantId)
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false })

    if (applicationsError) {
      console.error("❌ Erreur récupération candidatures:", applicationsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des candidatures" }, { status: 500 })
    }

    console.log("✅ Candidatures trouvées:", applications?.length || 0)

    // Étape 3: Enrichir les candidatures avec les informations des propriétés
    const enrichedApplications =
      applications?.map((app) => {
        const property = properties.find((p) => p.id === app.property_id)
        return {
          id: app.id,
          status: app.status,
          created_at: app.created_at,
          message: app.message,
          property: property || null,
        }
      }) || []

    console.log("📋 Candidatures enrichies:", enrichedApplications.length)

    return NextResponse.json({
      applications: enrichedApplications,
      count: enrichedApplications.length,
    })
  } catch (error) {
    console.error("❌ Erreur API candidatures tenant-owner:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

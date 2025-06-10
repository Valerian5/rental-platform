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

    // Utilisons exactement la même approche que l'API de débogage qui fonctionne

    // Étape 1: Récupérer les candidatures du tenant
    const { data: tenantApplications, error: tenantError } = await supabase
      .from("applications")
      .select("*")
      .eq("tenant_id", tenantId)

    if (tenantError) {
      console.error("❌ Erreur récupération candidatures tenant:", tenantError)
      return NextResponse.json({ error: "Erreur lors de la récupération des candidatures" }, { status: 500 })
    }

    console.log("📋 Candidatures du tenant:", tenantApplications?.length || 0)

    // Étape 2: Récupérer les propriétés du propriétaire
    const { data: ownerProperties, error: ownerError } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_id", ownerId)

    if (ownerError) {
      console.error("❌ Erreur récupération propriétés owner:", ownerError)
      return NextResponse.json({ error: "Erreur lors de la récupération des propriétés" }, { status: 500 })
    }

    console.log("🏠 Propriétés du propriétaire:", ownerProperties?.length || 0)

    // Étape 3: Filtrer les candidatures pour ne garder que celles qui concernent les propriétés du propriétaire
    const propertyIds = ownerProperties.map((p) => p.id)

    const filteredApplications = tenantApplications.filter((app) => propertyIds.includes(app.property_id))

    console.log("📋 Candidatures filtrées:", filteredApplications.length)

    // Étape 4: Enrichir les candidatures avec les informations des propriétés
    const enrichedApplications = filteredApplications.map((app) => {
      const property = ownerProperties.find((p) => p.id === app.property_id)

      // Extraire seulement les champs nécessaires de la propriété
      const simplifiedProperty = property
        ? {
            id: property.id,
            title: property.title,
            address: property.address,
            city: property.city,
            price: property.price,
            images: property.images,
          }
        : null

      return {
        id: app.id,
        status: app.status,
        created_at: app.created_at,
        message: app.message,
        property: simplifiedProperty,
      }
    })

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

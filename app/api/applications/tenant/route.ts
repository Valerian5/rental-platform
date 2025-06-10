import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")

    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id est requis" }, { status: 400 })
    }

    console.log("🔍 Récupération candidatures pour locataire:", tenantId)

    // Récupérer les candidatures avec les informations des propriétés et propriétaires
    const { data: applications, error } = await supabase
      .from("applications")
      .select(`
        id,
        property_id,
        status,
        created_at,
        message,
        property:properties(
          id,
          title,
          address,
          city,
          price,
          owner_id,
          owner:users!properties_owner_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération candidatures:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des candidatures" }, { status: 500 })
    }

    console.log("✅ Candidatures récupérées:", applications?.length || 0)

    // Créer un mapping property_id -> owner_id pour faciliter l'usage
    const propertyOwnerMap = {}
    applications?.forEach((app) => {
      if (app.property && app.property.owner) {
        propertyOwnerMap[app.property_id] = {
          owner_id: app.property.owner_id,
          owner: app.property.owner,
          property: {
            id: app.property.id,
            title: app.property.title,
            address: app.property.address,
            city: app.property.city,
            price: app.property.price,
          },
        }
      }
    })

    return NextResponse.json({
      applications: applications || [],
      propertyOwnerMap,
      count: applications?.length || 0,
    })
  } catch (error) {
    console.error("❌ Erreur API candidatures tenant:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

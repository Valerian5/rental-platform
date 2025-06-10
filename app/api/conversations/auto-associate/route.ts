import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenant_id } = body

    if (!tenant_id) {
      return NextResponse.json({ error: "tenant_id est requis" }, { status: 400 })
    }

    console.log("🔄 Association automatique pour locataire:", tenant_id)

    // 1. Récupérer les conversations du locataire sans property_id
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id, owner_id, property_id")
      .eq("tenant_id", tenant_id)
      .is("property_id", null)

    if (convError) {
      console.error("❌ Erreur récupération conversations:", convError)
      return NextResponse.json({ error: "Erreur lors de la récupération des conversations" }, { status: 500 })
    }

    console.log("📋 Conversations sans propriété:", conversations?.length || 0)

    // 2. Récupérer les candidatures du locataire
    const { data: applications, error: appError } = await supabase
      .from("applications")
      .select(`
        property_id,
        property:properties(
          id,
          owner_id,
          title
        )
      `)
      .eq("tenant_id", tenant_id)

    if (appError) {
      console.error("❌ Erreur récupération candidatures:", appError)
      return NextResponse.json({ error: "Erreur lors de la récupération des candidatures" }, { status: 500 })
    }

    console.log("📋 Candidatures trouvées:", applications?.length || 0)

    // 3. Créer un mapping owner_id -> property_id
    const ownerPropertyMap = {}
    applications?.forEach((app) => {
      if (app.property && app.property.owner_id) {
        // Prendre la première propriété trouvée pour chaque propriétaire
        if (!ownerPropertyMap[app.property.owner_id]) {
          ownerPropertyMap[app.property.owner_id] = {
            property_id: app.property_id,
            title: app.property.title,
          }
        }
      }
    })

    console.log("🗺️ Mapping propriétaire->propriété:", Object.keys(ownerPropertyMap).length)

    // 4. Associer les conversations aux propriétés
    const updates = []
    for (const conversation of conversations || []) {
      if (ownerPropertyMap[conversation.owner_id]) {
        const propertyInfo = ownerPropertyMap[conversation.owner_id]
        console.log(`🔗 Association conversation ${conversation.id} avec propriété ${propertyInfo.title}`)

        const { error: updateError } = await supabase
          .from("conversations")
          .update({ property_id: propertyInfo.property_id })
          .eq("id", conversation.id)

        if (updateError) {
          console.error("❌ Erreur mise à jour conversation:", conversation.id, updateError)
        } else {
          updates.push({
            conversation_id: conversation.id,
            property_id: propertyInfo.property_id,
            property_title: propertyInfo.title,
          })
        }
      }
    }

    console.log("✅ Associations réalisées:", updates.length)

    return NextResponse.json({
      success: true,
      updates,
      message: `${updates.length} conversation(s) associée(s) à des propriétés`,
    })
  } catch (error) {
    console.error("❌ Erreur API auto-associate:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { notificationsService } from "@/lib/notifications-service"

export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret cron
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔔 Démarrage job recherches sauvegardées")

    // Récupérer les recherches sauvegardées actives
    const { data: savedSearches, error: searchError } = await supabase
      .from("saved_searches")
      .select(`
        *,
        user:users(id, first_name, last_name, email)
      `)
      .eq("active", true)

    if (searchError) {
      console.error("❌ Erreur récupération recherches:", searchError)
      return NextResponse.json({ error: searchError.message }, { status: 500 })
    }

    console.log(`🔍 ${savedSearches?.length || 0} recherches sauvegardées trouvées`)

    // Récupérer les nouveaux biens (ajoutés dans les dernières 24h)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: newProperties, error: propError } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "available")
      .gte("created_at", yesterday.toISOString())

    if (propError) {
      console.error("❌ Erreur récupération nouveaux biens:", propError)
      return NextResponse.json({ error: propError.message }, { status: 500 })
    }

    console.log(`🏠 ${newProperties?.length || 0} nouveaux biens trouvés`)

    let notificationsSent = 0

    // Vérifier les correspondances
    for (const search of savedSearches || []) {
      try {
        const matchingProperties = (newProperties || []).filter((property) => {
          const criteria = search.criteria || {}

          // Vérifier les critères de base
          if (criteria.city && property.city !== criteria.city) return false
          if (criteria.minPrice && property.price < criteria.minPrice) return false
          if (criteria.maxPrice && property.price > criteria.maxPrice) return false
          if (criteria.minSurface && property.surface < criteria.minSurface) return false
          if (criteria.maxSurface && property.surface > criteria.maxSurface) return false
          if (criteria.rooms && property.rooms !== criteria.rooms) return false
          if (criteria.propertyType && property.property_type !== criteria.propertyType) return false

          return true
        })

        if (matchingProperties.length > 0 && search.user) {
          // Envoyer une notification pour chaque bien correspondant
          for (const property of matchingProperties) {
            await notificationsService.notifyNewPropertyMatch(property, search.user, search.criteria)
            notificationsSent++
          }
        }
      } catch (error) {
        console.error("❌ Erreur traitement recherche:", error)
      }
    }

    console.log(`✅ ${notificationsSent} notifications envoyées`)

    return NextResponse.json({
      success: true,
      savedSearches: savedSearches?.length || 0,
      newProperties: newProperties?.length || 0,
      notificationsSent,
    })
  } catch (error) {
    console.error("❌ Erreur job recherches sauvegardées:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { notificationsService } from "@/lib/notifications-service"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret cron
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔔 Démarrage job rappels de visite")

    // Récupérer les visites de demain
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
    const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1)

    const { data: visits, error } = await supabase
      .from("visits")
      .select(`
        *,
        property:properties(id, title, address, city),
        tenant:users(id, first_name, last_name, email)
      `)
      .eq("status", "scheduled")
      .gte("visit_date", tomorrowStart.toISOString())
      .lt("visit_date", tomorrowEnd.toISOString())

    if (error) {
      console.error("❌ Erreur récupération visites:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`📅 ${visits?.length || 0} visites trouvées pour demain`)

    let remindersSent = 0

    // Envoyer les rappels
    for (const visit of visits || []) {
      try {
        if (visit.tenant && visit.property) {
          await notificationsService.notifyVisitReminder(visit, visit.tenant, visit.property)
          remindersSent++
        }
      } catch (error) {
        console.error("❌ Erreur envoi rappel:", error)
      }
    }

    console.log(`✅ ${remindersSent} rappels de visite envoyés`)

    return NextResponse.json({
      success: true,
      visitsFound: visits?.length || 0,
      remindersSent,
    })
  } catch (error) {
    console.error("❌ Erreur job rappels:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

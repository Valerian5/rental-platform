import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { notificationsService } from "@/lib/notifications-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("✅ Confirmation d'acceptation pour candidature:", params.id)

    const { confirmed } = await request.json()

    if (confirmed) {
      // Mettre à jour le statut vers "approved" (prêt pour génération de bail)
      const { error } = await supabase
        .from("applications")
        .update({
          status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) throw error

      // Récupérer les infos pour notification
      const { data: application } = await supabase
        .from("applications")
        .select(`
          tenant_id,
          property:properties(title, owner_id)
        `)
        .eq("id", params.id)
        .single()

      if (application) {
        // Notifier le propriétaire
        await notificationsService.createNotification(application.property.owner_id, {
          title: "Candidature confirmée",
          content: `Le locataire a confirmé son intérêt pour ${application.property.title}. Vous pouvez maintenant générer le bail.`,
          type: "application_confirmed",
          action_url: `/owner/leases/new?application=${params.id}`,
        })
      }

      console.log("✅ Candidature confirmée et approuvée")
    } else {
      // Le locataire refuse - remettre en "pending"
      const { error } = await supabase
        .from("applications")
        .update({
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) throw error

      console.log("❌ Candidature refusée par le locataire")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erreur confirmation:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la confirmation" }, { status: 500 })
  }
}

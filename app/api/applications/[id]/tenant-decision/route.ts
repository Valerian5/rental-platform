import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
// Assurez-vous que le service d'email est importé correctement
import { emailService } from "@/lib/email-service" 
import { notificationsService } from "@/lib/notifications-service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const applicationId = params.id

  try {
    const { decision, reason } = await request.json()
    console.log(`✅ Décision du locataire pour ${applicationId}: ${decision}`)

    if (!["accept", "refuse"].includes(decision)) {
      return NextResponse.json({ error: "Décision invalide" }, { status: 400 })
    }

    // 1. Mettre à jour le statut de la candidature
    const newStatus = decision === "accept" ? "confirmed_by_tenant" : "rejected"
    const { data: updatedApplication, error: updateError } = await supabase
      .from("applications")
      .update({
        status: newStatus,
        ...(decision === "refuse" && { rejection_reason: `Refusé par le locataire: ${reason || "Aucun motif"}` }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select(`
        *,
        property: properties(*, owner: users(*)),
        tenant: users(*)
      `)
      .single()

    if (updateError) {
      console.error("❌ Erreur MàJ candidature:", updateError)
      throw new Error(updateError.message)
    }

    if (!updatedApplication) {
      throw new Error("Candidature non trouvée après mise à jour.")
    }

    // 2. Envoyer les notifications
    const { property, tenant } = updatedApplication
    if (!property || !tenant || !property.owner) {
      console.warn("⚠️ Données incomplètes pour la notification (propriété, locataire ou propriétaire manquant)")
      return NextResponse.json({ success: true, message: "Statut mis à jour, mais notification non envoyée (données manquantes)." })
    }

    if (decision === "accept") {
      // Notifier le propriétaire par email et notification in-app
      try {
        // *** DÉBUT DE LA CORRECTION ***
        // Appel corrigé en utilisant le service email importé
        await emailService.sendTenantConfirmedApplicationEmailToOwner(property.owner, tenant, property)
        // *** FIN DE LA CORRECTION ***

        await notificationsService.createNotification(property.owner.id, {
          title: "Votre offre a été acceptée !",
          content: `${tenant.first_name} ${tenant.last_name} a confirmé son intérêt pour votre logement "${property.title}". Vous pouvez maintenant générer le bail.`,
          type: "application_confirmed",
          action_url: `/owner/leases/new?applicationId=${applicationId}`,
        })
        console.log("✅ Notification et email envoyés au propriétaire.")
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email de confirmation:", emailError)
        // Ne pas bloquer la réponse pour une erreur d'email
      }
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication,
    })
  } catch (error) {
    console.error("❌ Erreur dans tenant-decision:", error)
    return NextResponse.json(
      { success: false, error: "Erreur lors du traitement de la décision." },
      { status: 500 }
    )
  }
}
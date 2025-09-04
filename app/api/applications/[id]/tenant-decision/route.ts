import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
// Assurez-vous que le service d'email est importé correctement
import { 
  sendTenantConfirmedApplicationEmailToOwner,
  sendTenantConfirmedApplicationEmailToTenant,
  sendTenantRefusedApplicationEmailToOwner,
  sendTenantRefusedApplicationEmailToTenant
} from "@/lib/email-service"
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
      try {
        // Email au propriétaire
        await sendTenantConfirmedApplicationEmailToOwner(
          {
            id: property.owner.id,
            name: `${property.owner.first_name} ${property.owner.last_name}`,
            email: property.owner.email,
          },
          `${tenant.first_name} ${tenant.last_name}`,
          { id: property.id, title: property.title, address: property.address },
          `${process.env.NEXT_PUBLIC_SITE_URL}/owner/applications/${applicationId}`,
        )

        // Email au locataire
        await sendTenantConfirmedApplicationEmailToTenant(
          {
            id: tenant.id,
            name: `${tenant.first_name} ${tenant.last_name}`,
            email: tenant.email,
          },
          { id: property.id, title: property.title, address: property.address },
        )

        // Notifications classiques
        await notificationsService.createNotification(property.owner.id, {
          title: "Le locataire a confirmé",
          content: `${tenant.first_name} ${tenant.last_name} a confirmé vouloir louer "${property.title}". Vous pouvez générer le bail.`,
          action_url: `/owner/applications/${applicationId}`
        })
        await notificationsService.createNotification(tenant.id, {
          title: "Confirmation enregistrée",
          content: `Votre confirmation pour "${property.title}" a bien été prise en compte.`,
          action_url: `/tenant/applications`
        })
      } catch (e) {
        console.error("❌ Erreur notif/email confirmation:", e)
      }
    } else {
      try {
        // Email au propriétaire
        await sendTenantRefusedApplicationEmailToOwner(
          {
            id: property.owner.id,
            name: `${property.owner.first_name} ${property.owner.last_name}`,
            email: property.owner.email,
          },
          `${tenant.first_name} ${tenant.last_name}`,
          { id: property.id, title: property.title, address: property.address },
          reason,
          `${process.env.NEXT_PUBLIC_SITE_URL}/owner/applications/${applicationId}`,
        )

        // Email au locataire
        await sendTenantRefusedApplicationEmailToTenant(
          {
            id: tenant.id,
            name: `${tenant.first_name} ${tenant.last_name}`,
            email: tenant.email,
          },
          { id: property.id, title: property.title, address: property.address },
          reason,
        )

        // Notifications classiques
        await notificationsService.createNotification(property.owner.id, {
          title: "Le locataire a refusé",
          content: `${tenant.first_name} ${tenant.last_name} a refusé la location pour "${property.title}".`,
          action_url: `/owner/applications/${applicationId}`
        })
        await notificationsService.createNotification(tenant.id, {
          title: "Refus enregistré",
          content: `Votre refus pour "${property.title}" a bien été pris en compte.`,
          action_url: `/tenant/applications`
        })
      } catch (e) {
        console.error("❌ Erreur notif/email refus:", e)
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
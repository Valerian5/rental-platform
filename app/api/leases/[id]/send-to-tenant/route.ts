import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { emailService } from "@/lib/email-service"
import { notificationsService } from "@/lib/notifications-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    console.log("📧 [SEND-TO-TENANT] Envoi bail au locataire:", leaseId)

    // 1. Récupérer le bail avec toutes les informations
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select(`
        *,
        property:properties(*),
        tenant:users!leases_tenant_id_fkey(*),
        owner:users!leases_owner_id_fkey(*)
      `)
      .eq("id", leaseId)
      .single()

    if (leaseError) {
      console.error("❌ [SEND-TO-TENANT] Erreur récupération bail:", leaseError)
      return NextResponse.json({ success: false, error: "Bail non trouvé" }, { status: 404 })
    }

    // 2. Vérifier que le document est généré
    if (!lease.generated_document) {
      console.log("❌ [SEND-TO-TENANT] Document non généré")
      return NextResponse.json({ success: false, error: "Le document doit être généré avant envoi" }, { status: 400 })
    }

    // 3. Mettre à jour le statut du bail
    const { error: updateError } = await supabase
      .from("leases")
      .update({
        status: "sent_to_tenant",
        sent_to_tenant_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", leaseId)

    if (updateError) {
      console.error("❌ [SEND-TO-TENANT] Erreur mise à jour statut:", updateError)
      return NextResponse.json({ success: false, error: "Erreur mise à jour statut" }, { status: 500 })
    }

    // 4. Créer une notification pour le locataire
    try {
      await notificationsService.createNotification(lease.tenant_id, {
        title: "Nouveau bail à signer",
        content: `Votre bail pour ${lease.property?.title || "la propriété"} est prêt à être signé. Consultez votre espace personnel pour le visualiser et le signer.`,
        type: "lease_ready",
        action_url: `/tenant/leases/${leaseId}`,
      })
      console.log("✅ [SEND-TO-TENANT] Notification créée")
    } catch (notifError) {
      console.warn("⚠️ [SEND-TO-TENANT] Erreur notification:", notifError)
    }

    // 5. Envoyer un email au locataire
    try {
      await emailService.sendEmail({
        to: lease.tenant?.email || "",
        template: "lease_ready",
        data: {
          tenantName: `${lease.tenant?.first_name} ${lease.tenant?.last_name}`,
          propertyTitle: lease.property?.title || "Propriété",
          propertyAddress: lease.property?.address || "",
          ownerName: `${lease.owner?.first_name} ${lease.owner?.last_name}`,
          leaseUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tenant/leases/${leaseId}`,
          monthlyRent: lease.montant_loyer_mensuel,
          startDate: lease.date_prise_effet ? new Date(lease.date_prise_effet).toLocaleDateString("fr-FR") : "",
        },
      })
      console.log("✅ [SEND-TO-TENANT] Email envoyé")
    } catch (emailError) {
      console.warn("⚠️ [SEND-TO-TENANT] Erreur email:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: "Bail envoyé au locataire avec succès",
      lease: {
        id: lease.id,
        status: "sent_to_tenant",
        sentAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ [SEND-TO-TENANT] Erreur:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'envoi au locataire",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

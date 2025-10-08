import { NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase-server-client"

// Cron job pour envoyer des rappels pour les provisions de charges à finaliser
export async function GET() {
  try {
    const supabase = createServiceSupabaseClient()

    // Récupérer les provisions actives qui approchent de leur date de finalisation
    const today = new Date()
    const reminderDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 jours

    const { data: provisionsToRemind, error: fetchError } = await supabase
      .from("charge_provisions")
      .select(`
        *,
        leases!inner(
          id,
          tenant_id,
          owner_id,
          properties!inner(
            id,
            address,
            owner:users!properties_owner_id_fkey(id, first_name, last_name, email)
          ),
          tenant:users!leases_tenant_id_fkey(id, first_name, last_name, email)
        )
      `)
      .eq("status", "active")
      .lte("expected_finalization_date", reminderDate.toISOString().split('T')[0])
      .not("expected_finalization_date", "is", null)

    if (fetchError) {
      console.error("Erreur récupération provisions:", fetchError)
      return NextResponse.json({ error: "Erreur récupération provisions" }, { status: 500 })
    }

    if (!provisionsToRemind || provisionsToRemind.length === 0) {
      return NextResponse.json({ 
        message: "Aucune provision à rappeler",
        count: 0
      })
    }

    let remindersSent = 0
    const errors: string[] = []

    for (const provision of provisionsToRemind) {
      try {
        const lease = provision.leases
        const expectedDate = new Date(provision.expected_finalization_date)
        const daysUntilDeadline = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // Notifier le propriétaire
        const { notificationsService } = await import("@/lib/notifications-service")
        
        await notificationsService.createNotification(lease.owner_id, {
          type: 'charge_provision_reminder',
          title: 'Rappel: Finalisation provision de charges',
          content: `La provision de charges pour ${lease.properties.address} doit être finalisée dans ${daysUntilDeadline} jour(s). Montant provision: ${provision.provision_amount.toFixed(2)}€.`,
          action_url: `/owner/leases/${lease.id}`,
          metadata: { 
            lease_id: lease.id,
            provision_id: provision.id,
            days_until_deadline: daysUntilDeadline,
            provision_amount: provision.provision_amount
          }
        })

        // Notifier le locataire si la date est dépassée
        if (daysUntilDeadline <= 0) {
          await notificationsService.createNotification(lease.tenant_id, {
            type: 'charge_provision_overdue',
            title: 'Provision de charges en retard',
            content: `La régularisation des charges pour votre logement ${lease.properties.address} est en retard. Contactez votre propriétaire.`,
            action_url: `/tenant/leases/${lease.id}`,
            metadata: { 
              lease_id: lease.id,
              provision_id: provision.id,
              days_overdue: Math.abs(daysUntilDeadline)
            }
          })
        }

        remindersSent++

        // Envoyer un email au propriétaire si c'est urgent (7 jours ou moins)
        if (daysUntilDeadline <= 7 && lease.properties.owner?.email) {
          try {
            const { sendEmail } = await import("@/lib/email-service")
            await sendEmail({
              to: lease.properties.owner.email,
              subject: `Rappel urgent: Finalisation provision de charges - ${lease.properties.address}`,
              html: `
                <h2>Rappel urgent: Finalisation provision de charges</h2>
                <p>Bonjour ${lease.properties.owner.first_name || ''} ${lease.properties.owner.last_name || ''},</p>
                <p>La provision de charges pour le logement <strong>${lease.properties.address}</strong> doit être finalisée dans <strong>${daysUntilDeadline} jour(s)</strong>.</p>
                <p><strong>Détails:</strong></p>
                <ul>
                  <li>Montant de la provision: ${provision.provision_amount.toFixed(2)}€</li>
                  <li>Date prévue de finalisation: ${provision.expected_finalization_date}</li>
                  <li>Locataire: ${lease.tenant?.first_name || ''} ${lease.tenant?.last_name || ''}</li>
                </ul>
                <p>Veuillez procéder à la régularisation définitive des charges dans les plus brefs délais.</p>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/owner/leases/${lease.id}">Gérer ce bail</a></p>
              `
            })
          } catch (emailError) {
            console.warn(`Erreur envoi email propriétaire ${lease.properties.owner.email}:`, emailError)
          }
        }

      } catch (error) {
        console.error(`Erreur rappel provision ${provision.id}:`, error)
        errors.push(`Provision ${provision.id}: ${error}`)
      }
    }

    return NextResponse.json({ 
      message: "Rappels envoyés",
      remindersSent,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error("Erreur cron rappels provisions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

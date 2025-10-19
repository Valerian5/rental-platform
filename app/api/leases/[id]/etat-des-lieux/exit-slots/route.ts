import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// POST /api/leases/[id]/etat-des-lieux/exit-slots
// Enregistre les créneaux proposés par le propriétaire pour le jour d'EDL de sortie
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const { slots } = await request.json()
    const server = createServerClient()

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: "Format invalide" }, { status: 400 })
    }

    // Stocker dans metadata du document EDL de sortie (ou créer si manquant)
    const { data: existing, error: findErr } = await server
      .from('etat_des_lieux_documents')
      .select('*')
      .eq('lease_id', leaseId)
      .eq('type', 'sortie')
      .maybeSingle()

    if (findErr) {
      console.error('Erreur recherche doc EDL:', findErr)
    }

    if (!existing) {
      return NextResponse.json({ error: "EDL de sortie introuvable" }, { status: 404 })
    }

    const newMetadata = { ...(existing.metadata || {}), exit_visit_slots: slots }

    const { error: updErr } = await server
      .from('etat_des_lieux_documents')
      .update({ metadata: newMetadata, updated_at: new Date().toISOString() })
      .eq('id', existing.id)

    if (updErr) {
      console.error('Erreur maj créneaux EDL:', updErr)
      return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 })
    }

    // Récupérer les informations du bail et du locataire pour les notifications
    const { data: lease, error: leaseError } = await server
      .from("leases")
      .select(`
        id,
        tenant_id,
        property_id,
        property:properties(id, title, address),
        tenant:users!leases_tenant_id_fkey(id, first_name, last_name, email)
      `)
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      console.warn("Impossible de récupérer les infos du bail pour les notifications")
    } else {
      // Notifier le locataire
      try {
        const { notificationsService } = await import("@/lib/notifications-service")
        await notificationsService.createNotification(lease.tenant.id, {
          type: "edl_exit_slots_proposed",
          title: "Créneaux proposés pour l'EDL de sortie",
          content: `Votre propriétaire vous propose ${slots.length} créneau${slots.length > 1 ? 'x' : ''} pour l'état des lieux de sortie.`,
          action_url: `/tenant/leases/${leaseId}`,
        })
      } catch (e) {
        console.warn("Notification locataire EDL échouée:", e)
      }

      // Envoyer email au locataire
      try {
        const { sendEdlExitSlotsProposalEmail } = await import("@/lib/email-service")
        await sendEdlExitSlotsProposalEmail(
          {
            id: lease.tenant.id,
            name: `${lease.tenant.first_name} ${lease.tenant.last_name}`,
            email: lease.tenant.email,
          },
          {
            id: lease.property.id,
            title: lease.property.title,
            address: lease.property.address,
          },
          slots,
          leaseId,
        )
      } catch (e) {
        console.warn("Email locataire EDL échoué:", e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Erreur exit-slots:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}



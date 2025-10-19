import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// POST /api/leases/[id]/etat-des-lieux/select-slot
// Permet au locataire de sélectionner un créneau pour l'EDL de sortie
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const { slot } = await request.json()
    console.log("[EDL select-slot] START", { leaseId, slot })
    const server = createServerClient()

    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    console.log("[EDL select-slot] Authorization header present:", Boolean(authHeader))

    const { data: { user }, error: userError } = await server.auth.getUser()
    if (userError) console.warn("[EDL select-slot] getUser error:", userError)
    console.log("[EDL select-slot] user:", user ? { id: user.id } : null)
    if (userError || !user) {
      console.warn("[EDL select-slot] Unauthorized: no user")
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer le bail et vérifier que l'utilisateur est le locataire
    const { data: lease, error: leaseError } = await server
      .from("leases")
      .select(`
        id,
        tenant_id,
        property_id,
        property:properties(id, title, address, owner_id),
        owner:users!leases_owner_id_fkey(id, first_name, last_name, email)
      `)
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      console.error("[EDL select-slot] Lease fetch error:", leaseError)
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    if (lease.tenant_id !== user.id) {
      console.warn("[EDL select-slot] Forbidden: user is not tenant of lease", { tenant_id: lease.tenant_id, user_id: user.id })
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer l'EDL de sortie
    const { data: edlDoc, error: edlError } = await server
      .from("etat_des_lieux_documents")
      .select("*")
      .eq("lease_id", leaseId)
      .eq("type", "sortie")
      .single()

    if (edlError || !edlDoc) {
      console.error("[EDL select-slot] EDL doc fetch error:", edlError)
      return NextResponse.json({ error: "EDL de sortie introuvable" }, { status: 404 })
    }

    // Vérifier que des créneaux sont disponibles
    let meta: any = {}
    try {
      meta = typeof edlDoc.metadata === 'string' ? JSON.parse(edlDoc.metadata) : (edlDoc.metadata || {})
    } catch (e) {
      console.warn('[EDL select-slot] metadata parse error:', e)
      meta = {}
    }
    const slots = meta.exit_visit_slots || meta.exit_slots || meta.slots || []
    if (slots.length === 0) {
      console.warn("[EDL select-slot] No slots available in metadata")
      return NextResponse.json({ error: "Aucun créneau disponible" }, { status: 400 })
    }

    // Vérifier que le créneau sélectionné est valide
    const selectedSlot = slots.find(s => 
      s.date === slot.date && 
      s.start_time === slot.start_time && 
      s.end_time === slot.end_time
    )

    if (!selectedSlot) {
      return NextResponse.json({ error: "Créneau invalide" }, { status: 400 })
    }

    // Mettre à jour l'EDL avec le créneau sélectionné
    const updatedMetadata = {
      ...meta,
      selected_slot: selectedSlot,
      slot_selected_at: new Date().toISOString(),
      slot_selected_by: user.id
    }

    const { error: updateError } = await server
      .from("etat_des_lieux_documents")
      .update({ 
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq("id", edlDoc.id)

    if (updateError) {
      console.error("[EDL select-slot] Update EDL error:", updateError)
      return NextResponse.json({ error: "Erreur lors de la sélection" }, { status: 500 })
    }

    // Notifier le propriétaire
    try {
      const { notificationsService } = await import("@/lib/notifications-service")
      await notificationsService.createNotification(lease.owner.id, {
        type: "edl_exit_slot_selected",
        title: "Créneau EDL de sortie confirmé",
        content: `${lease.owner.first_name} ${lease.owner.last_name} a confirmé sa disponibilité pour l'état des lieux de sortie.`,
        action_url: `/owner/leases/${leaseId}`,
      })
    } catch (e) {
      console.warn("[EDL select-slot] Notification owner failed:", e)
    }

    // Envoyer email au propriétaire
    try {
      const { sendEdlExitSlotConfirmedEmail } = await import("@/lib/email-service")
      await sendEdlExitSlotConfirmedEmail(
        {
          id: lease.owner.id,
          name: `${lease.owner.first_name} ${lease.owner.last_name}`,
          email: lease.owner.email,
        },
        `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim(),
        {
          id: lease.property.id,
          title: lease.property.title,
          address: lease.property.address,
        },
        selectedSlot,
        leaseId,
      )
    } catch (e) {
      console.warn("[EDL select-slot] Email owner failed:", e)
    }

    return NextResponse.json({ 
      success: true, 
      selectedSlot,
      message: "Créneau sélectionné avec succès"
    })

  } catch (e) {
    console.error("[EDL select-slot] Unhandled error:", e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

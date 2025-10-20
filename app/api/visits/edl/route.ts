import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET /api/visits/edl
// Récupère les créneaux EDL de sortie pour un utilisateur (owner ou tenant)
export async function GET(request: NextRequest) {
  try {
    const server = createServerClient()
    
    // Récupérer l'utilisateur connecté avec le token du header
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    
    const { data: { user }, error: userError } = token
      ? await server.auth.getUser(token)
      : await server.auth.getUser()
      
    if (userError || !user) {
      console.error("[visits/edl] Auth error:", userError)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer les baux de l'utilisateur
    const { data: leases, error: leasesError } = await server
      .from("leases")
      .select(`
        id,
        property_id,
        property:properties(id, title, address),
        tenant_id,
        owner_id
      `)
      .or(`tenant_id.eq.${user.id},owner_id.eq.${user.id}`)

    if (leasesError) {
      console.error("Erreur récupération baux:", leasesError)
      return NextResponse.json({ error: "Erreur lors de la récupération des baux" }, { status: 500 })
    }

    if (!leases || leases.length === 0) {
      return NextResponse.json({ visits: [] })
    }

    const leaseIds = leases.map(lease => lease.id)

    // Récupérer les documents EDL de sortie avec créneaux sélectionnés
    const { data: edlDocs, error: edlError } = await server
      .from("etat_des_lieux_documents")
      .select("*")
      .in("lease_id", leaseIds)
      .eq("type", "sortie")

    if (edlError) {
      console.error("Erreur récupération EDL:", edlError)
      return NextResponse.json({ error: "Erreur lors de la récupération des EDL" }, { status: 500 })
    }

    // Transformer les créneaux EDL en format visite
    const edlVisits = []
    
    for (const doc of edlDocs || []) {
      let meta: any = {}
      try {
        meta = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : (doc.metadata || {})
      } catch (e) {
        continue
      }

      const selectedSlot = meta.selected_slot
      if (!selectedSlot) continue

      const lease = leases.find(l => l.id === doc.lease_id)
      if (!lease) continue

      // Déterminer si l'utilisateur est le propriétaire ou le locataire
      const isOwner = lease.owner_id === user.id
      const otherUser = isOwner ? 
        { id: lease.tenant_id, name: "Locataire" } : 
        { id: lease.owner_id, name: "Propriétaire" }

      const visitDate = new Date(`${selectedSlot.date}T${selectedSlot.start_time}`)
      
      edlVisits.push({
        id: `edl-${doc.id}`,
        visit_date: visitDate.toISOString(),
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        status: "confirmed",
        is_edl_exit: true,
        edl_type: "sortie",
        property: {
          id: lease.property.id,
          title: lease.property.title,
          address: lease.property.address,
          city: "",
          property_images: [],
        },
        application: undefined,
        tenant_interest: undefined,
        owner_feedback: undefined,
        tenant_feedback: undefined,
        other_user: otherUser,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      } as any)
    }

    // Trier par date de visite
    edlVisits.sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())

    return NextResponse.json({ visits: edlVisits })
  } catch (error) {
    console.error("Erreur GET visits/edl:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

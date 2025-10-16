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

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Erreur exit-slots:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}



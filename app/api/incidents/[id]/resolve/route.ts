import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase-server-client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// POST /api/incidents/[id]/resolve - marquer résolu + créer dépense + upload justificatif
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceSupabaseClient()
    const incidentId = params.id

    const formData = await request.formData()
    const amount = Number(formData.get('amount') || 0)
    const date = String(formData.get('date') || '')
    const description = String(formData.get('description') || '')
    const category = String(formData.get('category') || 'repair')
    const file = formData.get('file') as File | null

    // Authentification avec token Bearer
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined

    const { data: { user }, error: userError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    // Charger incident + bail + propriété
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select('id, title, lease_id, property_id, lease:leases(id, owner_id, tenant_id), property:properties(id,title)')
      .eq('id', incidentId)
      .single()

    if (incidentError || !incident) {
      return NextResponse.json({ success: false, error: 'Incident introuvable' }, { status: 404 })
    }

    // Vérifier ownership
    if (incident.lease?.owner_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }

    // Upload justificatif si fourni (vers documents/expenses)
    let receipt_url: string | null = null
    if (file) {
      const uploadForm = new FormData()
      uploadForm.append('file', file)
      uploadForm.append('bucket', 'documents')
      uploadForm.append('folder', `expenses/${incident.property_id || 'general'}`)

      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/upload-supabase`, {
        method: 'POST',
        body: uploadForm,
      })
      const uploadData = await uploadRes.json()
      if (uploadRes.ok && uploadData.success) {
        receipt_url = uploadData.url
      }
    }

    // Créer la dépense
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        owner_id: user.id,
        property_id: incident.property_id,
        lease_id: incident.lease_id,
        type: 'incident',
        category: category || 'repair',
        amount: amount,
        date: date || new Date().toISOString().slice(0,10),
        description: description || `Résolution incident: ${incident.title}`,
        deductible: true,
        receipt_url: receipt_url,
      })
      .select('*')
      .single()

    if (expenseError) {
      console.error('Erreur création dépense:', expenseError)
      return NextResponse.json({ success: false, error: 'Erreur création dépense' }, { status: 500 })
    }

    // Marquer l'incident résolu
    const { data: updatedIncident, error: updateError } = await supabase
      .from('incidents')
      .update({ status: 'resolved', resolved_date: new Date().toISOString(), cost: amount, resolution_notes: description })
      .eq('id', incidentId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Erreur MAJ incident:', updateError)
      return NextResponse.json({ success: false, error: 'Erreur mise à jour incident' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      expense, 
      incident: updatedIncident,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Erreur POST /api/incidents/[id]/resolve:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}



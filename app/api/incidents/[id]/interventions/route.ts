import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { emailService } from "@/lib/email-service"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// POST /api/incidents/[id]/interventions - planifier une intervention (owner)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const incidentId = params.id
    
    // Gérer FormData ou JSON
    let body: any = {}
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()
      body = {
        type: formData.get('type') || 'owner',
        scheduled_date: formData.get('scheduled_date'),
        description: formData.get('description'),
        provider_name: formData.get('provider_name'),
        provider_contact: formData.get('provider_contact'),
        estimated_cost: formData.get('estimated_cost'),
        user_id: formData.get('user_id'), // Ajouter user_id depuis le frontend
      }
    } else {
      body = await request.json()
    }
    
    const { type = 'owner', scheduled_date, description, provider_name, provider_contact, estimated_cost, user_id } = body

    if (!user_id) {
      console.error("❌ [API INTERVENTIONS] user_id manquant")
      return NextResponse.json({ success: false, error: "user_id requis" }, { status: 400 })
    }

    console.log("🔍 [API INTERVENTIONS] Création intervention pour user_id:", user_id)

    // Charger incident + bail
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select('id, title, lease:leases(id, owner_id, tenant:users!leases_tenant_id_fkey(id,email,first_name,last_name)), property:properties(id,title)')
      .eq('id', incidentId)
      .single()

    if (incidentError || !incident) {
      console.error("❌ [API INTERVENTIONS] Erreur récupération incident:", incidentError)
      return NextResponse.json({ success: false, error: 'Incident introuvable' }, { status: 404 })
    }

    // Vérifier ownership
    if (incident.lease?.owner_id !== user_id) {
      console.error("❌ [API INTERVENTIONS] Accès refusé - user_id:", user_id, "owner_id:", incident.lease?.owner_id)
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }

    // Créer intervention
    const { data: intervention, error } = await supabase
      .from('incident_interventions')
      .insert({
        incident_id: incidentId,
        type,
        scheduled_date: scheduled_date || null,
        description: description || null,
        provider_name: provider_name || null,
        provider_contact: provider_contact || null,
        estimated_cost: estimated_cost ?? null,
        status: 'scheduled',
      })
      .select('*')
      .single()

    if (error) {
      console.error('❌ [API INTERVENTIONS] Erreur création intervention:', error)
      return NextResponse.json({ success: false, error: 'Erreur base de données' }, { status: 500 })
    }

    console.log("✅ [API INTERVENTIONS] Intervention créée avec succès:", intervention.id)

    // Notifier le locataire (email + classique)
    try {
      const tenant = incident.lease?.tenant
      if (tenant?.email) {
        await emailService.sendIncidentInterventionScheduledEmail(
          { id: tenant.id, name: `${tenant.first_name} ${tenant.last_name}`, email: tenant.email },
          { id: incident.id, title: incident.title },
          { id: incident.property.id, title: incident.property.title },
          {
            scheduledDate: scheduled_date,
            description: description,
            providerName: provider_name,
            providerContact: provider_contact,
          },
          `${process.env.NEXT_PUBLIC_SITE_URL}/tenant/incidents/${incidentId}`
        )
      }
    } catch (e) {
      console.warn('Alerte: échec email intervention:', e)
    }

    return NextResponse.json({ success: true, intervention })
  } catch (error) {
    console.error('Erreur POST /api/incidents/[id]/interventions:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}



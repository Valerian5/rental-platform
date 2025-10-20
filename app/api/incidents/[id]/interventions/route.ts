import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// POST /api/incidents/[id]/interventions - planifier une intervention (owner)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const server = createServerClient()
    const incidentId = params.id
    const body = await request.json()
    const { type = 'owner', scheduled_date, description, provider_name, provider_contact, estimated_cost } = body || {}

    // Auth
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })

    // Charger incident + bail
    const { data: incident, error: incidentError } = await server
      .from('incidents')
      .select('id, title, lease:leases(id, owner_id, tenant:users!leases_tenant_id_fkey(id,email,first_name,last_name)), property:properties(id,title)')
      .eq('id', incidentId)
      .single()

    if (incidentError || !incident) {
      return NextResponse.json({ success: false, error: 'Incident introuvable' }, { status: 404 })
    }

    // Vérifier ownership
    if (incident.lease?.owner_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }

    // Créer intervention
    const { data: intervention, error } = await server
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
      console.error('Erreur création intervention:', error)
      return NextResponse.json({ success: false, error: 'Erreur base de données' }, { status: 500 })
    }

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



import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { emailService } from "@/lib/email-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const incidentId = params.id

    // Récupérer l'incident avec toutes les informations liées
    const { data: incident, error } = await supabase
      .from("incidents")
      .select(`
        *,
        property:properties(
          id,
          title,
          address,
          city,
          postal_code,
          property_type,
          surface
        ),
        lease:leases(
          id,
          tenant:users!leases_tenant_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          owner:users!leases_owner_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq("id", incidentId)
      .single()

    if (error) {
      console.error("Erreur récupération incident:", error)
      return NextResponse.json({ success: false, error: "Incident non trouvé" }, { status: 404 })
    }

    // Récupérer les réponses séparément pour éviter l'ambiguïté
    console.log("🔍 [API INCIDENT DETAIL] Récupération réponses pour incident:", incidentId)
    const { data: responses, error: responsesError } = await supabase
      .from("incident_responses")
      .select(`
        id,
        message,
        author_type,
        author_name,
        attachments,
        created_at,
        author_id
      `)
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: true })

    console.log("🔍 [API INCIDENT DETAIL] Réponses trouvées:", responses?.length || 0, responses)

    if (responsesError) {
      console.error("❌ [API INCIDENT DETAIL] Erreur récupération réponses:", responsesError)
    }

    // Combiner les données
    const mappedResponses = (responses || []).map((r: any) => ({ 
      ...r, 
      user_type: r.author_type,
      user_id: r.author_id,
      user_name: r.author_name || 'Utilisateur'
    }))
    
    console.log("🔍 [API INCIDENT DETAIL] Réponses mappées:", mappedResponses.length, mappedResponses)

    const incidentWithResponses = {
      ...incident,
      responses: mappedResponses,
    }

    return NextResponse.json({
      success: true,
      incident: incidentWithResponses,
    })
  } catch (error) {
    console.error("Erreur API incident:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const incidentId = params.id
    const body = await request.json()
    const { status, resolution_notes, cost } = body

    const updateData: any = {}

    if (status) updateData.status = status
    if (resolution_notes) updateData.resolution_notes = resolution_notes
    if (cost !== undefined) updateData.cost = cost
    if (status === "resolved") updateData.resolved_date = new Date().toISOString()

    const { data, error } = await supabase.from("incidents").update(updateData).eq("id", incidentId).select().single()

    if (error) {
      console.error("Erreur mise à jour incident:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    if (status && ["resolved", "in_progress", "cancelled"].includes(status)) {
      try {
        // Get incident details with tenant and owner info
        const { data: incident } = await supabase
          .from("incidents")
          .select(`
            *,
            property:properties(*),
            lease:leases(
              tenant:users!leases_tenant_id_fkey(*),
              owner:users!leases_owner_id_fkey(*)
            )
          `)
          .eq("id", incidentId)
          .single()

        if (incident && incident.lease) {
          const statusMessages = {
            resolved: "résolu",
            in_progress: "en cours de traitement",
            cancelled: "annulé",
          }

          // Notify tenant
          if (incident.lease.tenant) {
            await emailService.sendEmail({
              to: incident.lease.tenant.email,
              template: "incident_status_update",
              data: {
                tenantName: `${incident.lease.tenant.first_name} ${incident.lease.tenant.last_name}`,
                incidentTitle: incident.title,
                propertyTitle: incident.property.title,
                status: statusMessages[status as keyof typeof statusMessages] || status,
                resolutionNotes: resolution_notes || "",
                incidentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/tenant/incidents/${incidentId}`,
              },
            })
          }

          // Notify owner if status is resolved
          if (status === "resolved" && incident.lease.owner) {
            await emailService.sendEmail({
              to: incident.lease.owner.email,
              template: "incident_resolved_owner",
              data: {
                ownerName: `${incident.lease.owner.first_name} ${incident.lease.owner.last_name}`,
                incidentTitle: incident.title,
                propertyTitle: incident.property.title,
                resolutionNotes: resolution_notes || "",
                cost: cost || 0,
                incidentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/owner/incidents/${incidentId}`,
              },
            })
          }
        }
      } catch (emailError) {
        console.error("❌ Erreur envoi email statut incident:", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      incident: data,
    })
  } catch (error) {
    console.error("Erreur API mise à jour incident:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

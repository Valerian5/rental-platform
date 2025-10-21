import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { emailService } from "@/lib/email-service"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const incidentId = params.id
    const body = await request.json()
    const { status, resolution_notes, cost } = body

    // Préparer les champs à mettre à jour
    const updateData: any = {}
    if (status) updateData.status = status
    if (resolution_notes) updateData.resolution_notes = resolution_notes
    if (cost !== undefined) updateData.cost = cost
    if (status === "resolved") updateData.resolved_date = new Date().toISOString()

    // Mettre à jour l'incident
    const { data, error } = await supabase
      .from("incidents")
      .update(updateData)
      .eq("id", incidentId)
      .select()
      .single()

    if (error) {
      console.error("Erreur mise à jour incident:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    // Envoyer les emails si nécessaire
    if (status && ["resolved", "in_progress", "cancelled"].includes(status)) {
      try {
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

          // Notifier le locataire
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

          // Notifier le propriétaire si résolu
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

    // 🔹 Récupérer l'incident complet avec réponses pour retourner au client
    const { data: fullIncident, error: incidentError } = await supabase
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

    if (incidentError) {
      console.error("Erreur récupération incident complet:", incidentError)
      return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
    }

    const { data: responses, error: responsesError } = await supabase
      .from("incident_responses")
      .select("*")
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: true })

    if (responsesError) {
      console.error("Erreur récupération réponses:", responsesError)
    }

    // Mapper les réponses comme côté GET
    const mappedResponses = (responses || []).map((r: any) => ({
      ...r,
      user_type: r.author_type,
      user_id: r.author_id,
      user_name: r.author_name || "Utilisateur",
    }))

    return NextResponse.json({
      success: true,
      incident: {
        ...fullIncident,
        responses: mappedResponses,
      },
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error("Erreur API mise à jour incident:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

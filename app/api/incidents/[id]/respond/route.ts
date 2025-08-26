import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { emailService } from "@/lib/email-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const incidentId = params.id
    const body = await request.json()
    const { user_id, message, user_type, attachments } = body

    if (!user_id || !message || !user_type) {
      return NextResponse.json({ success: false, error: "Données manquantes" }, { status: 400 })
    }

    // Insérer la réponse
    const { data: response, error } = await supabase
      .from("incident_responses")
      .insert({
        incident_id: incidentId,
        user_id: user_id,
        message: message,
        user_type: user_type,
        attachments: attachments || [],
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur insertion réponse:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de l'envoi" }, { status: 500 })
    }

    // Mettre à jour la date de dernière activité de l'incident
    await supabase.from("incidents").update({ updated_at: new Date().toISOString() }).eq("id", incidentId)

    try {
      // Get incident details with all parties involved
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

      const { data: responder } = await supabase.from("users").select("*").eq("id", user_id).single()

      if (incident && responder && incident.lease) {
        // Determine who to notify (the other party)
        const isOwnerResponding = user_type === "owner"
        const recipientData = isOwnerResponding ? incident.lease.tenant : incident.lease.owner

        if (recipientData) {
          await emailService.sendEmail({
            to: recipientData.email,
            template: "incident_response",
            data: {
              recipientName: `${recipientData.first_name} ${recipientData.last_name}`,
              responderName: `${responder.first_name} ${responder.last_name}`,
              responderType: user_type === "owner" ? "propriétaire" : "locataire",
              incidentTitle: incident.title,
              propertyTitle: incident.property.title,
              message: message,
              incidentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/${user_type === "owner" ? "tenant" : "owner"}/incidents/${incidentId}`,
            },
          })
        }
      }
    } catch (emailError) {
      console.error("❌ Erreur envoi email réponse incident:", emailError)
    }

    return NextResponse.json({
      success: true,
      response: response,
    })
  } catch (error) {
    console.error("Erreur API réponse incident:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

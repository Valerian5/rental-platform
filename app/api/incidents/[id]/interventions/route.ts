import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const incidentId = params.id

    console.log("🔧 [INTERVENTIONS API] Récupération interventions pour incident:", incidentId)

    const server = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: interventions, error } = await server
      .from("incident_interventions")
      .select("*")
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ [INTERVENTIONS API] Erreur récupération interventions:", error)
      return NextResponse.json({ error: "Erreur lors du chargement des interventions" }, { status: 500 })
    }

    console.log("✅ [INTERVENTIONS API] Interventions récupérées:", interventions?.length || 0)
    return NextResponse.json({ success: true, interventions: interventions || [] })
  } catch (error) {
    console.error("❌ [INTERVENTIONS API] Erreur:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const incidentId = params.id
    const body = await request.json()
    const { 
      type, 
      scheduled_date, 
      description, 
      provider_name, 
      provider_contact, 
      estimated_cost,
      user_id 
    } = body

    if (!incidentId || !type || !scheduled_date || !description || !user_id) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    console.log("🔧 [INTERVENTIONS API] Création intervention pour incident:", incidentId)

    const server = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Créer l'intervention
    const { data: intervention, error } = await server
      .from("incident_interventions")
      .insert({
        incident_id: incidentId,
        type,
        scheduled_date,
        description,
        provider_name: provider_name || null,
        provider_contact: provider_contact || null,
        estimated_cost: estimated_cost ? parseFloat(estimated_cost) : null,
        status: "scheduled",
        created_by: user_id
      })
      .select()
      .single()

    if (error) {
      console.error("❌ [INTERVENTIONS API] Erreur création intervention:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mettre à jour le statut de l'incident
    await server
      .from("incidents")
      .update({ 
        status: "in_progress",
        updated_at: new Date().toISOString()
      })
      .eq("id", incidentId)

    // Récupérer les informations de l'incident pour la notification
    const { data: incident, error: incidentError } = await server
      .from("incidents")
      .select(`
        *,
        property:properties(id, title, address, city),
        lease:leases(
          id,
          tenant:users!leases_tenant_id_fkey(id, first_name, last_name, email, phone),
          owner:users!leases_owner_id_fkey(id, first_name, last_name, email, phone)
        )
      `)
      .eq("id", incidentId)
      .single()

    if (!incidentError && incident) {
      // Envoyer une notification au locataire
      try {
        const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: incident.lease?.tenant?.id,
            type: "intervention_scheduled",
            title: "Intervention programmée",
            message: `Une intervention a été programmée pour l'incident "${incident.title}" le ${new Date(scheduled_date).toLocaleDateString("fr-FR")}`,
            data: {
              incident_id: incidentId,
              intervention_id: intervention.id,
              scheduled_date,
              type
            }
          })
        })

        if (notificationResponse.ok) {
          console.log("✅ [INTERVENTIONS API] Notification envoyée au locataire")
        }
      } catch (notificationError) {
        console.error("❌ [INTERVENTIONS API] Erreur envoi notification:", notificationError)
      }

      // Envoyer un email au locataire
      try {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: incident.lease?.tenant?.email,
            subject: "Intervention programmée pour votre incident",
            template: "intervention_scheduled",
            data: {
              tenant_name: `${incident.lease?.tenant?.first_name} ${incident.lease?.tenant?.last_name}`,
              incident_title: incident.title,
              scheduled_date: new Date(scheduled_date).toLocaleDateString("fr-FR"),
              scheduled_time: new Date(scheduled_date).toLocaleTimeString("fr-FR"),
              description,
              type: type === "owner" ? "par le propriétaire" : "par un professionnel",
              provider_name: provider_name || "Non spécifié",
              property_address: incident.property?.address
            }
          })
        })

        if (emailResponse.ok) {
          console.log("✅ [INTERVENTIONS API] Email envoyé au locataire")
        }
      } catch (emailError) {
        console.error("❌ [INTERVENTIONS API] Erreur envoi email:", emailError)
      }
    }

    console.log("✅ [INTERVENTIONS API] Intervention créée:", intervention.id)
    return NextResponse.json({ success: true, intervention })
  } catch (error) {
    console.error("❌ [INTERVENTIONS API] Erreur:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
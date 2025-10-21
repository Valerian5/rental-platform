import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { emailService } from "@/lib/email-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const incidentId = params.id

    if (!incidentId) {
      return NextResponse.json({ error: "ID d'incident requis" }, { status: 400 })
    }

    console.log("🔍 Récupération messages pour incident:", incidentId)

    const server = createServerClient()
    const { data: messages, error } = await server
      .from("incident_responses")
      .select(`
        id,
        message,
        author_type,
        author_name,
        author_id,
        created_at,
        attachments
      `)
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("❌ Erreur récupération messages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Messages récupérés:", messages.length)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error("❌ Erreur API messages incident:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const incidentId = params.id
    const body = await request.json()
    const { user_id, message, user_type, attachments } = body

    if (!incidentId || !user_id || !message || !user_type) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    console.log("📨 Création message pour incident:", incidentId)

    const server = createServerClient()
    
    // Récupérer le nom de l'utilisateur
    const { data: user, error: userError } = await server
      .from("users")
      .select("first_name, last_name")
      .eq("id", user_id)
      .single()

    if (userError || !user) {
      console.error("Erreur récupération utilisateur:", userError)
      return NextResponse.json({ success: false, error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const authorName = `${user.first_name} ${user.last_name}`

    // Créer le message
    const { data: response, error } = await server
      .from("incident_responses")
      .insert({
        incident_id: incidentId,
        author_id: user_id,
        author_name: authorName,
        message: message.trim(),
        author_type: user_type,
        attachments: attachments || [],
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur création message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mettre à jour la date de dernière activité de l'incident
    await server.from("incidents").update({ updated_at: new Date().toISOString() }).eq("id", incidentId)

    // Récupérer les détails de l'incident pour la notification
    const { data: incident } = await server
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
      try {
        // Déterminer le destinataire (l'autre partie)
        const isOwnerResponding = user_type === "owner"
        const recipientData = isOwnerResponding ? incident.lease.tenant : incident.lease.owner

        if (recipientData) {
          await emailService.sendIncidentResponseEmail(
            { id: recipientData.id, name: `${recipientData.first_name} ${recipientData.last_name}`, email: recipientData.email },
            { id: user.id, name: `${user.first_name} ${user.last_name}` },
            { id: incident.id, title: incident.title },
            { id: incident.property.id, title: incident.property.title },
            message,
            `${process.env.NEXT_PUBLIC_SITE_URL}/${user_type === "owner" ? "tenant" : "owner"}/incidents/${incidentId}`
          )
          
          console.log(`📧 Notification email envoyée à ${recipientData.email}`)
        }
      } catch (emailError) {
        console.error("❌ Erreur envoi notification message:", emailError)
        // Ne pas échouer la requête pour autant
      }
    }

    console.log("✅ Message créé:", response.id)
    return NextResponse.json({ 
      success: true,
      message: response,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("❌ Erreur API création message incident:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

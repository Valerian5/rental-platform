import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const incidentId = params.id
    const server = createServerClient()
    
    console.log("🎫 [TICKETS API] Récupération tickets pour incident:", incidentId)

    const { data: tickets, error } = await server
      .from("incident_responses")
      .select("*")
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("❌ [TICKETS API] Erreur récupération tickets:", error)
      return NextResponse.json({ error: "Erreur lors du chargement des tickets" }, { status: 500 })
    }

    console.log("✅ [TICKETS API] Tickets récupérés:", tickets?.length || 0)
    return NextResponse.json({ success: true, tickets: tickets || [] })
  } catch (error) {
    console.error("❌ [TICKETS API] Erreur:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
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

    console.log("🎫 [TICKETS API] Création ticket pour incident:", incidentId)

    const server = createServerClient()
    
    // Récupérer le nom de l'utilisateur
    const { data: user, error: userError } = await server
      .from("users")
      .select("first_name, last_name")
      .eq("id", user_id)
      .single()

    if (userError || !user) {
      console.error("❌ [TICKETS API] Erreur récupération utilisateur:", userError)
      return NextResponse.json({ success: false, error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const authorName = `${user.first_name} ${user.last_name}`

    // Créer le ticket
    const { data: ticket, error } = await server
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
      console.error("❌ [TICKETS API] Erreur création ticket:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mettre à jour la date de dernière activité de l'incident
    await server.from("incidents").update({ updated_at: new Date().toISOString() }).eq("id", incidentId)

    console.log("✅ [TICKETS API] Ticket créé:", ticket.id)
    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    console.error("❌ [TICKETS API] Erreur:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

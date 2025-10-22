import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase-server-client"

// GET /api/maintenance/tenant
// Retourne la liste des demandes de maintenance (incidents) pour le locataire connecté
export async function GET(request: NextRequest) {
  try {
    // Utiliser le client service role pour contourner RLS
    const supabase = createServiceSupabaseClient()

    // Support Bearer token (depuis le client) OU cookies
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined

    // Vérifier l'authentification avec le token
    const { data: { user }, error: userError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est bien un locataire
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("id, user_type")
      .eq("id", user.id)
      .single()

    if (userDataError || !userData || userData.user_type !== "tenant") {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer les incidents (demandes de maintenance) du locataire
    const { data: incidents, error } = await supabase
      .from("incidents")
      .select(`
        id,
        title,
        description,
        category,
        priority,
        status,
        estimated_cost,
        created_at,
        property:properties(
          id,
          title,
          address
        ),
        responses:incident_responses(
          id,
          message,
          author_type,
          created_at
        )
      `)
      .eq("reported_by", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ [TENANT MAINTENANCE] Erreur récupération incidents:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la récupération des demandes" }, { status: 500 })
    }

    // Mapper les incidents vers le format attendu par la page
    const mapped = (incidents || []).map((incident: any) => ({
      id: incident.id,
      title: incident.title,
      description: incident.description,
      category: incident.category,
      priority: incident.priority || "medium",
      status: incident.status,
      estimated_cost: incident.estimated_cost,
      created_at: incident.created_at,
      property: incident.property,
      responses: incident.responses || []
    }))

    return NextResponse.json({ success: true, requests: mapped }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("❌ [TENANT MAINTENANCE] Erreur:", err)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

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

    // Récupérer les travaux de maintenance programmés pour les propriétés du locataire
    const { data: maintenanceWorks, error } = await supabase
      .from("maintenance_works")
      .select(`
        id,
        title,
        description,
        type,
        category,
        scheduled_date,
        completed_date,
        cost,
        provider_name,
        status,
        created_at,
        property:properties(
          id,
          title,
          address,
          lease:leases!leases_property_id_fkey(
            tenant_id
          )
        )
      `)
      .eq("property.lease.tenant_id", user.id)
      .order("scheduled_date", { ascending: false })

    if (error) {
      console.error("❌ [TENANT MAINTENANCE] Erreur récupération travaux:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la récupération des travaux" }, { status: 500 })
    }

    // Mapper les travaux vers le format attendu par la page
    const mapped = (maintenanceWorks || []).map((work: any) => ({
      id: work.id,
      title: work.title,
      description: work.description,
      category: work.category,
      priority: work.type === "corrective" ? "high" : work.type === "preventive" ? "medium" : "low",
      status: work.status === "scheduled" ? "pending" : work.status === "in_progress" ? "in_progress" : work.status === "completed" ? "completed" : "rejected",
      estimated_cost: work.cost,
      created_at: work.created_at,
      property: work.property,
      responses: [] // Pas de système de réponses pour les travaux programmés
    }))

    return NextResponse.json({ success: true, requests: mapped }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("❌ [TENANT MAINTENANCE] Erreur:", err)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

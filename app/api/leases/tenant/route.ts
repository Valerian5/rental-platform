import { type NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase-server-client"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient()

    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined

    const { data: { user }, error: userError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un locataire
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("id, user_type")
      .eq("id", user.id)
      .single()

    if (userDataError || !userData || userData.user_type !== "tenant") {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer les baux du locataire
    const { data: leases, error } = await supabase
      .from("leases")
      .select(`
        id,
        start_date,
        end_date,
        status,
        property:properties(
          id,
          title,
          address
        )
      `)
      .eq("tenant_id", user.id)
      .order("start_date", { ascending: false })

    if (error) {
      console.error("❌ [TENANT LEASES] Erreur récupération baux:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la récupération des baux" }, { status: 500 })
    }

    return NextResponse.json({ success: true, leases: leases || [] }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("❌ [TENANT LEASES] Erreur:", err)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

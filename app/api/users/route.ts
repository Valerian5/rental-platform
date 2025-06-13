import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase"
import { authService } from "@/lib/auth-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    console.log("👥 API Users GET")

    // Vérifier l'authentification
    const user = await authService.getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    let query = supabase.from("users").select("*")

    if (type) {
      query = query.eq("user_type", type)
    }

    const { data: users, error } = await query

    if (error) {
      console.error("❌ Erreur récupération utilisateurs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ ${users?.length || 0} utilisateurs récupérés`)
    return NextResponse.json({ success: true, users: users || [] })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

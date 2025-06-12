import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authService } from "@/lib/auth-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await authService.getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const id = searchParams.get("id")

    let query = supabase.from("users").select("*")

    // Filtrer par type si spécifié
    if (type) {
      query = query.eq("user_type", type)
    }

    // Filtrer par ID si spécifié
    if (id) {
      query = query.eq("id", id)
    }

    // Limiter les résultats pour éviter de surcharger
    query = query.limit(100)

    const { data: users, error } = await query

    if (error) {
      console.error("Erreur récupération utilisateurs:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des utilisateurs" }, { status: 500 })
    }

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { authService } from "@/lib/auth-service"

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const user = await authService.getCurrentUser()
    if (!user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer toutes les préférences système
    const { data, error } = await supabase
      .from("scoring_preferences")
      .select("*")
      .eq("is_system", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur récupération préférences système:", error)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Erreur API préférences système:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const user = await authService.getCurrentUser()
    if (!user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()

    // Valider les données
    if (!body.name || !body.weights) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    // Si c'est défini comme défaut, désactiver les autres
    if (body.is_default) {
      await supabase.from("scoring_preferences").update({ is_default: false }).eq("is_system", true)
    }

    // Créer la nouvelle préférence système
    const { data, error } = await supabase
      .from("scoring_preferences")
      .insert({
        ...body,
        owner_id: "system",
        is_system: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création préférence système:", error)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erreur API création préférence système:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

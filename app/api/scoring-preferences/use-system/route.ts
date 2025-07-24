import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { authService } from "@/lib/auth-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { owner_id, system_preference_id } = body

    console.log("🔄 Application du modèle système:", { owner_id, system_preference_id })

    // Vérifier l'authentification
    const user = await authService.getCurrentUser()
    if (!user || user.user_type !== "owner" || user.id !== owner_id) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    if (!system_preference_id) {
      return NextResponse.json({ error: "ID du modèle système requis" }, { status: 400 })
    }

    // Récupérer le modèle système
    const { data: systemPreference, error: systemError } = await supabase
      .from("scoring_preferences")
      .select("*")
      .eq("id", system_preference_id)
      .eq("is_system", true)
      .single()

    if (systemError || !systemPreference) {
      console.error("Erreur récupération modèle système:", systemError)
      return NextResponse.json({ error: "Modèle système introuvable" }, { status: 404 })
    }

    console.log("📊 Modèle système trouvé:", systemPreference.name)

    // Supprimer l'ancienne préférence par défaut de l'utilisateur
    await supabase.from("scoring_preferences").delete().eq("owner_id", owner_id).eq("is_default", true)

    // Créer une nouvelle préférence basée sur le modèle système
    const newPreference = {
      owner_id,
      name: `${systemPreference.name} (personnalisé)`,
      is_default: true,
      is_system: false,
      system_preference_id: system_preference_id,
      criteria: systemPreference.criteria,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: createdPreference, error: createError } = await supabase
      .from("scoring_preferences")
      .insert(newPreference)
      .select()
      .single()

    if (createError) {
      console.error("Erreur création préférence:", createError)
      return NextResponse.json({ error: "Erreur lors de la création de la préférence" }, { status: 500 })
    }

    console.log("✅ Préférence créée:", createdPreference.id)

    return NextResponse.json({
      preference: createdPreference,
      message: "Modèle appliqué avec succès",
    })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { application, property, owner_id } = body

    if (!application || !property || !owner_id) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    // Récupérer les préférences par défaut du propriétaire
    const { data: preferences, error } = await supabase
      .from("scoring_preferences")
      .select("*")
      .eq("owner_id", owner_id)
      .eq("is_default", true)
      .single()

    if (error || !preferences) {
      // Si pas de préférences personnalisées, utiliser les préférences par défaut
      const defaultPrefs = scoringPreferencesService.getDefaultPreferences(owner_id)
      const result = scoringPreferencesService.calculateCustomScore(application, property, defaultPrefs)
      return NextResponse.json({ score: result.totalScore, breakdown: result.breakdown })
    }

    // Calculer le score avec les préférences personnalisées
    const result = scoringPreferencesService.calculateCustomScore(application, property, preferences)

    return NextResponse.json({ score: result.totalScore, breakdown: result.breakdown })
  } catch (error) {
    console.error("Erreur calcul score:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

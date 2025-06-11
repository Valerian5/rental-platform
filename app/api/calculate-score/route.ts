import { NextResponse, type NextRequest } from "next/server"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { application, property, owner_id } = body

    if (!application || !property || !owner_id) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    console.log("🎯 Calcul de score pour:", { owner_id, application: application.id || "nouveau" })

    // Récupérer les préférences du propriétaire
    const preferences = await scoringPreferencesService.getOwnerDefaultPreference(owner_id)

    if (!preferences) {
      console.error("❌ Aucune préférence trouvée pour le propriétaire:", owner_id)
      return NextResponse.json({ error: "Préférences de scoring non trouvées" }, { status: 404 })
    }

    console.log("✅ Préférences trouvées:", preferences.name)

    // Calculer le score avec les nouvelles préférences
    const result = scoringPreferencesService.calculateScore(application, property, preferences)

    console.log("📊 Score calculé:", {
      totalScore: result.totalScore,
      compatible: result.compatible,
      breakdown: Object.entries(result.breakdown).map(([key, value]) => ({
        criterion: key,
        score: value.score,
        max: value.max,
        compatible: value.compatible,
      })),
    })

    return NextResponse.json({
      score: result.totalScore,
      compatible: result.compatible,
      breakdown: result.breakdown,
      recommendations: result.recommendations,
      warnings: result.warnings,
      preferences_used: {
        id: preferences.id,
        name: preferences.name,
        is_system: preferences.is_system,
      },
    })
  } catch (error) {
    console.error("❌ Erreur calcul score:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur lors du calcul du score",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

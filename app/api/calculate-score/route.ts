import { NextResponse, type NextRequest } from "next/server"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { application, property, owner_id, force_recalculation = false } = body

    if (!application || !property || !owner_id) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    console.log("🎯 Calcul de score pour:", { owner_id, application: application.id || "nouveau" })

    // Utiliser le service avec cache
    const result = await scoringPreferencesService.calculateScoreWithCache(
      application,
      property,
      owner_id,
      !force_recalculation,
    )

    console.log("📊 Score calculé:", {
      totalScore: result.totalScore,
      compatible: result.compatible,
      model_used: result.model_used,
      model_version: result.model_version,
      calculated_at: result.calculated_at,
    })

    return NextResponse.json({
      score: result.totalScore,
      compatible: result.compatible,
      breakdown: result.breakdown,
      recommendations: result.recommendations,
      warnings: result.warnings,
      model_used: result.model_used,
      model_version: result.model_version,
      calculated_at: result.calculated_at,
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

// Nouvelle route pour le calcul en masse
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { applications, owner_id, force_recalculation = false } = body

    if (!applications || !Array.isArray(applications) || !owner_id) {
      return NextResponse.json({ error: "Données manquantes ou invalides" }, { status: 400 })
    }

    if (applications.length > 1000) {
      return NextResponse.json({ error: "Trop de candidatures (max: 1000)" }, { status: 400 })
    }

    console.log(`🎯 Calcul en masse de ${applications.length} scores pour:`, owner_id)

    const startTime = Date.now()

    // Utiliser le service optimisé pour le calcul en masse
    const results = await scoringPreferencesService.recalculateScoresForApplications(
      applications,
      owner_id,
      force_recalculation,
    )

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`✅ ${results.size} scores calculés en ${duration}ms`)

    // Convertir la Map en objet pour la sérialisation JSON
    const scoresObject: Record<string, any> = {}
    results.forEach((result, applicationId) => {
      scoresObject[applicationId] = {
        score: result.totalScore,
        compatible: result.compatible,
        breakdown: result.breakdown,
        recommendations: result.recommendations,
        warnings: result.warnings,
        model_used: result.model_used,
        model_version: result.model_version,
        calculated_at: result.calculated_at,
      }
    })

    return NextResponse.json({
      scores: scoresObject,
      total_calculated: results.size,
      duration_ms: duration,
      model_used: results.size > 0 ? Array.from(results.values())[0].model_used : null,
    })
  } catch (error) {
    console.error("❌ Erreur calcul scores en masse:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur lors du calcul des scores",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

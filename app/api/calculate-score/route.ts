import { NextResponse, type NextRequest } from "next/server"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { application, property, owner_id, force_recalculation = false } = body

    if (!application || !property || !owner_id) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    console.log("🎯 API Calculate Score - Données reçues:", {
      applicationId: application.id || "nouveau",
      propertyId: property.id || "nouveau",
      propertyPrice: property.price,
      ownerId: owner_id,
      forceRecalculation: force_recalculation,
    })

    // Utiliser le service unifié
    const result = await scoringPreferencesService.calculateScore(application, property, owner_id, !force_recalculation)

    console.log("📊 API Calculate Score - Résultat:", {
      totalScore: result.totalScore,
      compatible: result.compatible,
      model_used: result.model_used,
      breakdown: Object.entries(result.breakdown).map(([key, value]) => ({
        critere: key,
        score: value.score,
        max: value.max,
      })),
    })

    return NextResponse.json({
      score: result.totalScore,
      compatible: result.compatible,
      breakdown: result.breakdown,
      recommendations: result.recommendations,
      warnings: result.warnings,
      exclusions: result.exclusions,
      model_used: result.model_used,
      model_version: result.model_version,
      calculated_at: result.calculated_at,
      household_type: result.household_type,
    })
  } catch (error) {
    console.error("❌ Erreur API Calculate Score:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur lors du calcul du score",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

// Calcul en masse pour optimiser les performances
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

    console.log(`🎯 API Calculate Score Batch - ${applications.length} candidatures pour:`, owner_id)

    const startTime = Date.now()
    const results: Record<string, any> = {}

    // Traitement par batch pour optimiser les performances
    const batchSize = 50
    for (let i = 0; i < applications.length; i += batchSize) {
      const batch = applications.slice(i, i + batchSize)

      const batchPromises = batch.map(async (app) => {
        try {
          const result = await scoringPreferencesService.calculateScore(
            app,
            app.property,
            owner_id,
            !force_recalculation,
          )

          results[app.id] = {
            score: result.totalScore,
            compatible: result.compatible,
            breakdown: result.breakdown,
            recommendations: result.recommendations,
            warnings: result.warnings,
            exclusions: result.exclusions,
            model_used: result.model_used,
            model_version: result.model_version,
            calculated_at: result.calculated_at,
          }
        } catch (error) {
          console.error(`❌ Erreur calcul score pour candidature ${app.id}:`, error)
          results[app.id] = {
            score: 0,
            compatible: false,
            breakdown: {},
            recommendations: [],
            warnings: ["Erreur de calcul"],
            exclusions: ["Données insuffisantes"],
            model_used: "Erreur",
            calculated_at: new Date().toISOString(),
          }
        }
      })

      await Promise.all(batchPromises)
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`✅ API Calculate Score Batch - ${Object.keys(results).length} scores calculés en ${duration}ms`)

    return NextResponse.json({
      scores: results,
      total_calculated: Object.keys(results).length,
      duration_ms: duration,
      model_used: Object.keys(results).length > 0 ? Object.values(results)[0].model_used : null,
    })
  } catch (error) {
    console.error("❌ Erreur API Calculate Score Batch:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur lors du calcul des scores",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

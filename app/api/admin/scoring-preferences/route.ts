import { type NextRequest, NextResponse } from "next/server"
import { scoringPreferencesService } from "@/lib/scoring-preferences-service"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Récupérer les modèles système prédéfinis depuis le service
    const systemModels = [
      {
        id: "strict-model-default",
        owner_id: "00000000-0000-0000-0000-000000000000",
        ...scoringPreferencesService.getStrictModel(),
        is_default: false,
        is_system: true,
        system_preference_id: "strict",
        version: 1,
      },
      {
        id: "standard-model-default",
        owner_id: "00000000-0000-0000-0000-000000000000",
        ...scoringPreferencesService.getStandardModel(),
        is_default: false,
        is_system: true,
        system_preference_id: "standard",
        version: 1,
      },
      {
        id: "flexible-model-default",
        owner_id: "00000000-0000-0000-0000-000000000000",
        ...scoringPreferencesService.getFlexibleModel(),
        is_default: false,
        is_system: true,
        system_preference_id: "flexible",
        version: 1,
      },
    ]

    console.log("✅ Modèles système générés:", systemModels.length)

    return NextResponse.json({ preferences: systemModels })
  } catch (error) {
    console.error("❌ Erreur API admin/scoring-preferences GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

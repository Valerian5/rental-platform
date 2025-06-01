import { type NextRequest, NextResponse } from "next/server"
import { userSettingsService } from "@/lib/user-settings-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "user_id requis" }, { status: 400 })
    }

    const settings = await userSettingsService.getUserSettings(userId)
    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Erreur API paramètres utilisateur:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, ...updates } = body

    if (!user_id) {
      return NextResponse.json({ error: "user_id requis" }, { status: 400 })
    }

    const settings = await userSettingsService.updateUserSettings(user_id, updates)
    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Erreur mise à jour paramètres:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

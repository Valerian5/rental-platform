import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth-service"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug Auth - Début")

    // Vérifier les cookies
    const cookies = request.cookies.getAll()
    console.log(
      "🍪 Cookies disponibles:",
      cookies.map((c) => c.name),
    )

    // Tenter de récupérer l'utilisateur
    const user = await getCurrentUserFromRequest(request)

    return NextResponse.json({
      success: true,
      user,
      cookies: cookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Erreur debug auth:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth-token-service"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug Auth API - Début")

    // Récupérer tous les cookies
    const cookies = request.cookies.getAll()
    console.log(
      "🍪 Tous les cookies:",
      cookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
    )

    // Récupérer les headers d'authentification
    const authHeader = request.headers.get("authorization")
    console.log("🔑 Auth header:", authHeader ? "présent" : "absent")

    // Tester avec notre fonction d'auth
    const userProfile = await getCurrentUserFromRequest(request)

    return NextResponse.json({
      success: true,
      user: userProfile,
      hasAuthHeader: !!authHeader,
      cookies: cookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Erreur dans debug auth:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      user: null,
      timestamp: new Date().toISOString(),
    })
  }
}

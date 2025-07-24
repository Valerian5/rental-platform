import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth-service"
import { createApiSupabaseClient } from "@/lib/supabase-server-client"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug Auth API - Début")

    // Récupérer tous les cookies
    const cookies = request.cookies.getAll()
    console.log(
      "🍪 Tous les cookies:",
      cookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
    )

    // Chercher les cookies Supabase spécifiquement
    const supabaseCookies = cookies.filter(
      (c) => c.name.includes("supabase") || c.name.includes("sb-") || c.name.includes("auth-token"),
    )
    console.log(
      "🔑 Cookies Supabase trouvés:",
      supabaseCookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
    )

    // Tester avec le client API
    const supabase = createApiSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("👤 Auth result:", { user: user?.id, error: authError?.message })

    // Tester avec notre fonction d'auth
    const userProfile = await getCurrentUserFromRequest(request)

    return NextResponse.json({
      success: true,
      user: userProfile,
      authUser: user ? { id: user.id, email: user.email } : null,
      authError: authError?.message,
      cookies: cookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
      supabaseCookies: supabaseCookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
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

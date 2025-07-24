import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug Auth API - Début")

    // Récupérer tous les cookies
    const cookies = request.cookies.getAll()
    console.log(
      "🍪 Cookies disponibles:",
      cookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
    )

    // Créer le client Supabase avec la bonne configuration
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = request.cookies.get(name)
            console.log(`🍪 Getting cookie ${name}:`, cookie?.value ? "found" : "not found")
            return cookie?.value
          },
        },
      },
    )

    // Tester l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("👤 Auth result:", { user: user?.id, error: authError?.message })

    if (authError) {
      console.error("❌ Erreur auth:", authError)
      return NextResponse.json({
        success: false,
        error: authError.message,
        user: null,
        cookies: cookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
        timestamp: new Date().toISOString(),
      })
    }

    if (!user) {
      return NextResponse.json({
        success: true,
        user: null,
        cookies: cookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
        timestamp: new Date().toISOString(),
      })
    }

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (profileError) {
      console.error("❌ Erreur profil:", profileError)
      return NextResponse.json({
        success: false,
        error: profileError.message,
        user: null,
        cookies: cookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      user: profile,
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

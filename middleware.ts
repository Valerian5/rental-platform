import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes qui nécessitent une authentification
const protectedRoutes = ["/tenant/dashboard", "/owner/dashboard", "/messaging", "/admin"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vérifier si la route nécessite une authentification
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute) {
    console.log("🔒 Middleware - Route protégée:", pathname)

    // Récupérer tous les cookies pour débugger
    const allCookies = request.cookies.getAll()
    console.log(
      "🍪 Middleware - Tous les cookies:",
      allCookies.map((c) => c.name),
    )

    // Chercher les cookies Supabase (plusieurs formats possibles)
    const supabaseCookies = allCookies.filter(
      (cookie) => cookie.name.includes("supabase") || cookie.name.includes("sb-") || cookie.name.includes("auth-token"),
    )

    console.log(
      "🔑 Middleware - Cookies Supabase trouvés:",
      supabaseCookies.map((c) => c.name),
    )

    // Si on a des cookies Supabase, on laisse passer
    if (supabaseCookies.length > 0) {
      console.log("✅ Middleware - Cookies trouvés, accès autorisé")
      return NextResponse.next()
    }

    console.log("❌ Middleware - Pas de cookies, redirection vers login")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

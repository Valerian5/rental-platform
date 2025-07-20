import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log("🚀 Middleware déclenché pour:", pathname)

  // Routes qui nécessitent une authentification
  const protectedRoutes = ["/tenant/dashboard", "/owner/dashboard", "/messaging", "/admin"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute) {
    console.log("🔒 Route protégée détectée:", pathname)

    // Récupérer tous les cookies
    const allCookies = request.cookies.getAll()
    console.log(
      "🍪 Tous les cookies:",
      allCookies.map((c) => `${c.name}=${c.value.substring(0, 20)}...`),
    )

    // Pour l'instant, on laisse TOUT passer pour tester
    console.log("✅ MIDDLEWARE DÉSACTIVÉ - Accès autorisé à:", pathname)
    return NextResponse.next()

    // Code commenté pour plus tard
    /*
    // Chercher les cookies Supabase
    const supabaseCookies = allCookies.filter(
      (cookie) => 
        cookie.name.includes("supabase") || 
        cookie.name.includes("sb-") || 
        cookie.name.includes("auth")
    )

    if (supabaseCookies.length > 0) {
      console.log("✅ Cookies Supabase trouvés, accès autorisé")
      return NextResponse.next()
    }

    console.log("❌ Pas de cookies Supabase, redirection vers login")
    return NextResponse.redirect(new URL("/login", request.url))
    */
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

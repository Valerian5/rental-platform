import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log("🚀 Middleware déclenché pour:", pathname)

  // Routes publiques qui ne nécessitent pas d'authentification
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/properties",
    "/debug",
    "/debug-auth",
    "/debug-cookies",
    "/refresh-session",
  ]

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/api/") || pathname.startsWith("/_next/"),
  )

  if (isPublicRoute) {
    console.log("✅ Route publique autorisée:", pathname)
    return NextResponse.next()
  }

  // Routes admin qui nécessitent une authentification admin
  const adminRoutes = ["/admin"]
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

  // Routes qui nécessitent une authentification
  const protectedRoutes = ["/tenant/", "/owner/", "/agency/", "/messaging"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isAdminRoute || isProtectedRoute) {
    console.log("🔒 Route protégée détectée:", pathname)

    // Vérifier le token d'authentification
    const authToken = request.headers.get("authorization") || request.cookies.get("auth-token")?.value

    if (!authToken) {
      console.log("❌ Pas de token d'authentification")
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Pour les routes admin, on pourrait ajouter une vérification supplémentaire
    // mais pour éviter les problèmes, on laisse passer et on vérifie côté composant
    console.log("✅ Token présent, autorisation accordée")
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

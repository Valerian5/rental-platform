import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes qui nécessitent une authentification
const protectedRoutes = ["/tenant/dashboard", "/owner/dashboard", "/messaging", "/admin"]

// Routes réservées aux propriétaires
const ownerRoutes = ["/owner/dashboard", "/owner/properties", "/owner/applications", "/owner/statistics"]

// Routes réservées aux locataires
const tenantRoutes = ["/tenant/dashboard", "/tenant/applications", "/tenant/visits"]

// Routes réservées aux administrateurs
const adminRoutes = ["/admin"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vérifier si la route nécessite une authentification
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute) {
    try {
      // Récupérer les cookies Supabase
      const accessToken = request.cookies.get("sb-access-token")?.value
      const refreshToken = request.cookies.get("sb-refresh-token")?.value

      console.log("Middleware - Tokens:", {
        access: accessToken ? "✅ Présent" : "❌ Absent",
        refresh: refreshToken ? "✅ Présent" : "❌ Absent",
      })

      // Si pas de tokens, rediriger vers login
      if (!accessToken && !refreshToken) {
        console.log("Middleware - Pas de tokens, redirection vers login")
        return NextResponse.redirect(new URL("/login", request.url))
      }

      // Pour l'instant, on laisse passer si on a des tokens
      // La vérification des permissions se fera côté client
      console.log("Middleware - Tokens présents, accès autorisé à:", pathname)
      return NextResponse.next()
    } catch (error) {
      console.error("Middleware - Erreur:", error)
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

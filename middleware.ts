import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

// Routes qui nécessitent une authentification
const protectedRoutes = ["/tenant/dashboard", "/owner/dashboard", "/messaging", "/admin"]

// Routes réservées aux propriétaires
const ownerRoutes = ["/owner/dashboard", "/owner/properties", "/owner/applications", "/owner/statistics"]

// Routes réservées aux locataires
const tenantRoutes = ["/tenant/dashboard", "/tenant/applications", "/tenant/visits"]

// Routes réservées aux administrateurs
const adminRoutes = ["/admin"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vérifier si la route nécessite une authentification
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute) {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      // Rediriger vers la page de connexion
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

      // Vérifier les permissions selon le type d'utilisateur
      if (ownerRoutes.some((route) => pathname.startsWith(route)) && decoded.userType !== "owner") {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }

      if (tenantRoutes.some((route) => pathname.startsWith(route)) && decoded.userType !== "tenant") {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }

      if (adminRoutes.some((route) => pathname.startsWith(route)) && decoded.userType !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
    } catch (error) {
      // Token invalide, rediriger vers la connexion
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

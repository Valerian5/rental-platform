import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
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
      // Créer le client Supabase pour le middleware
      const res = NextResponse.next()
      const supabase = createMiddlewareClient({ req: request, res })

      // Récupérer la session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      console.log("Middleware - Session:", session ? "✅ Connecté" : "❌ Non connecté")

      if (!session) {
        console.log("Middleware - Redirection vers login")
        return NextResponse.redirect(new URL("/login", request.url))
      }

      // Récupérer les informations utilisateur
      const { data: userData, error } = await supabase
        .from("users")
        .select("user_type")
        .eq("id", session.user.id)
        .single()

      console.log("Middleware - Données utilisateur:", userData)

      if (error || !userData) {
        // Utiliser les métadonnées de l'utilisateur comme fallback
        const userType = session.user.user_metadata?.user_type || "tenant"
        console.log("Middleware - Type utilisateur (fallback):", userType)

        // Vérifier les permissions avec le fallback
        if (ownerRoutes.some((route) => pathname.startsWith(route)) && userType !== "owner") {
          return NextResponse.redirect(new URL("/unauthorized", request.url))
        }

        if (tenantRoutes.some((route) => pathname.startsWith(route)) && userType !== "tenant") {
          return NextResponse.redirect(new URL("/unauthorized", request.url))
        }

        if (adminRoutes.some((route) => pathname.startsWith(route)) && userType !== "admin") {
          return NextResponse.redirect(new URL("/unauthorized", request.url))
        }
      } else {
        // Vérifier les permissions avec les données de la base
        if (ownerRoutes.some((route) => pathname.startsWith(route)) && userData.user_type !== "owner") {
          return NextResponse.redirect(new URL("/unauthorized", request.url))
        }

        if (tenantRoutes.some((route) => pathname.startsWith(route)) && userData.user_type !== "tenant") {
          return NextResponse.redirect(new URL("/unauthorized", request.url))
        }

        if (adminRoutes.some((route) => pathname.startsWith(route)) && userData.user_type !== "admin") {
          return NextResponse.redirect(new URL("/unauthorized", request.url))
        }
      }

      console.log("Middleware - Accès autorisé à:", pathname)
      return res
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

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log("🚀 Middleware déclenché pour:", pathname)

  // Routes admin qui nécessitent une authentification admin
  const adminRoutes = ["/admin"]
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

  // Routes qui nécessitent une authentification
  const protectedRoutes = ["/tenant/dashboard", "/owner/dashboard", "/messaging"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isAdminRoute) {
    console.log("🔒 Route admin détectée:", pathname)

    try {
      const supabase = createServerClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        console.log("❌ Pas d'utilisateur authentifié pour route admin")
        return NextResponse.redirect(new URL("/login", request.url))
      }

      // Vérifier si l'utilisateur est admin
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("user_type")
        .eq("id", user.id)
        .single()

      if (profileError || !profile || profile.user_type !== "admin") {
        console.log("❌ Utilisateur non admin tente d'accéder à:", pathname)
        return NextResponse.redirect(new URL("/", request.url))
      }

      console.log("✅ Accès admin autorisé pour:", user.id)
      return NextResponse.next()
    } catch (error) {
      console.error("❌ Erreur middleware admin:", error)
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  if (isProtectedRoute) {
    console.log("🔒 Route protégée détectée:", pathname)

    try {
      const supabase = createServerClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        console.log("❌ Pas d'utilisateur authentifié, redirection vers login")
        return NextResponse.redirect(new URL("/login", request.url))
      }

      console.log("✅ Utilisateur authentifié, accès autorisé")
      return NextResponse.next()
    } catch (error) {
      console.error("❌ Erreur middleware:", error)
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log("🚀 Middleware déclenché pour:", pathname)

  // Créer une réponse
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Créer le client Supabase avec gestion des cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    },
  )

  // Rafraîchir la session si nécessaire
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Routes admin qui nécessitent une authentification admin
  const adminRoutes = ["/admin"]
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

  // Routes qui nécessitent une authentification
  const protectedRoutes = ["/tenant/dashboard", "/owner/dashboard", "/agency/dashboard", "/messaging"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isAdminRoute) {
    console.log("🔒 Route admin détectée:", pathname)

    if (error || !user) {
      console.log("❌ Pas d'utilisateur authentifié pour route admin")
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Vérifier si l'utilisateur est admin
    try {
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("user_type")
        .eq("id", user.id)
        .single()

      if (profileError || !profile || profile.user_type !== "admin") {
        console.log("❌ Utilisateur non admin pour route admin")
        return NextResponse.redirect(new URL("/", request.url))
      }

      console.log("✅ Utilisateur admin autorisé")
    } catch (authError) {
      console.error("❌ Erreur vérification admin:", authError)
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  if (isProtectedRoute) {
    console.log("🔒 Route protégée détectée:", pathname)

    if (error || !user) {
      console.log("❌ Pas d'utilisateur authentifié pour route protégée")
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    console.log("✅ Utilisateur authentifié pour route protégée")
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
}

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
  await supabase.auth.getUser()

  // Routes admin qui nécessitent une authentification admin
  const adminRoutes = ["/admin"]
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

  // Routes qui nécessitent une authentification
  const protectedRoutes = ["/tenant/dashboard", "/owner/dashboard", "/messaging"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isAdminRoute) {
    console.log("🔒 Route admin détectée:", pathname)

    // Pour l'instant, on laisse passer pour déboguer
    console.log("⚠️ MIDDLEWARE ADMIN TEMPORAIREMENT DÉSACTIVÉ")
    return response
  }

  if (isProtectedRoute) {
    console.log("🔒 Route protégée détectée:", pathname)

    // Pour l'instant, on laisse passer pour déboguer
    console.log("⚠️ MIDDLEWARE PROTECTION TEMPORAIREMENT DÉSACTIVÉ")
    return response
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

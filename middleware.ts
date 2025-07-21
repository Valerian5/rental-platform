import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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

    // Pour l'instant, on laisse passer pour déboguer
    console.log("⚠️ MIDDLEWARE ADMIN TEMPORAIREMENT DÉSACTIVÉ")
    return NextResponse.next()
  }

  if (isProtectedRoute) {
    console.log("🔒 Route protégée détectée:", pathname)

    // Pour l'instant, on laisse passer pour déboguer
    console.log("⚠️ MIDDLEWARE PROTECTION TEMPORAIREMENT DÉSACTIVÉ")
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

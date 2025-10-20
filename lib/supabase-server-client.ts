import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"

// Pour les API Routes uniquement
export function createServerClient(request: NextRequest) {
  return createSupabaseServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        // Dans les API routes, on ne peut pas modifier les cookies de la requête
      },
      remove(name: string, options: any) {
        // Dans les API routes, on ne peut pas modifier les cookies de la requête
      },
    },
  })
}

// Alias pour compatibilité
export function createApiSupabaseClient(request: NextRequest) {
  return createServerClient(request)
}

// Export de createClient pour compatibilité
export { createServerClient as createClient }

// Client avec service role pour les opérations admin
export function createServiceSupabaseClient() {
  return createSupabaseServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get() {
        return undefined
      },
      set() {},
      remove() {},
    },
  })
}

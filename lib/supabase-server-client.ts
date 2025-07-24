import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"

// Pour les API Routes uniquement
export function createApiSupabaseClient(request: NextRequest) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
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

// Client avec service role pour les opérations admin
export function createServiceSupabaseClient() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get() {
        return undefined
      },
      set() {},
      remove() {},
    },
  })
}

import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"

// Créer un client Supabase pour les API routes
export function createSupabaseServerClient(request: NextRequest) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
    },
  })
}

// Créer un client Supabase avec service role pour les opérations admin
export function createSupabaseServiceClient() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get() {
        return undefined
      },
    },
  })
}

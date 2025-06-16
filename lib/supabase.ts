import { createBrowserClient, createServerClient } from "@supabase/ssr"

// Client pour le côté client (navigateur)
export const supabase = createBrowserClient()

// Client pour le côté serveur (dans une API Route ou Server Component, par exemple)
export { createServerClient }

// Fonction pour vérifier si Supabase est configuré
export const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
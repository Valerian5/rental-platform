import { createClient } from "@supabase/supabase-js"

// Valeurs par défaut pour le build
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "placeholder-key"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key"

// Client pour le côté client (navigateur)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client pour le côté serveur
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Fonction pour vérifier si Supabase est configuré
export const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

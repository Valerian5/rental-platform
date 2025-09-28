/**
 * Client Supabase côté serveur sécurisé
 * Utilise les cookies de session et le service role de manière sécurisée
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// Client public pour le frontend
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Client admin avec service role (uniquement côté serveur)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Crée un client Supabase lié à la requête (utilise les cookies de session)
 * Utilise createServerClient pour récupérer l'utilisateur authentifié
 */
export async function createServerClient(request: NextRequest) {
  const cookieStore = cookies()
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

/**
 * Récupère l'utilisateur authentifié depuis la requête
 * Utilise les cookies de session Supabase
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const supabase = await createServerClient(request)
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Utilisateur non authentifié')
  }
  
  return user
}

/**
 * Récupère l'utilisateur authentifié depuis l'Authorization header
 * Utilise le token JWT dans l'en-tête
 */
export async function getAuthenticatedUserFromToken(authHeader: string) {
  const token = authHeader.replace('Bearer ', '')
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw new Error('Token invalide ou utilisateur non authentifié')
  }
  
  return user
}

/**
 * Vérifie qu'un utilisateur existe dans la base de données
 * Utilise le service role pour contourner RLS
 */
export async function verifyUserExists(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    
    return !error && !!data
  } catch (error) {
    console.error('Erreur vérification utilisateur:', error)
    return false
  }
}
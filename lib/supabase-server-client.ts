/**
 * Client Supabase côté serveur sécurisé
 * Utilise les tokens JWT et le service role de manière sécurisée
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

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
 * Crée un client Supabase avec un token JWT spécifique
 * Utilisé pour les requêtes authentifiées côté serveur
 */
export function createClientWithToken(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  )
}

/**
 * Récupère l'utilisateur authentifié depuis l'Authorization header
 * Utilise le token JWT dans l'en-tête
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    throw new Error('Token d\'authentification requis')
  }

  return getAuthenticatedUserFromToken(authHeader)
}

/**
 * Récupère l'utilisateur authentifié depuis l'Authorization header
 * Utilise le token JWT dans l'en-tête
 */
export async function getAuthenticatedUserFromToken(authHeader: string) {
  const token = authHeader.replace('Bearer ', '')
  
  // Créer un client avec le token pour vérifier l'utilisateur
  const client = createClientWithToken(token)
  const { data: { user }, error } = await client.auth.getUser()
  
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
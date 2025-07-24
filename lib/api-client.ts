import { supabase } from "./supabase"

// Fonction pour faire des requêtes API avec le token d'authentification
export async function apiRequest(url: string, options: RequestInit = {}) {
  try {
    // Récupérer la session actuelle
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    // Ajouter le token d'authentification si disponible
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
      console.log("🔑 Token ajouté à la requête:", session.access_token.substring(0, 20) + "...")
    } else {
      console.log("⚠️ Pas de token disponible")
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API Error ${response.status}:`, errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("❌ Erreur API request:", error)
    throw error
  }
}

// Fonctions spécifiques pour les agences
export const agencyApi = {
  async getAll() {
    console.log("📋 Récupération de toutes les agences")
    return apiRequest("/api/agencies")
  },

  async create(agencyData: {
    name: string
    logo_url?: string
    primary_color?: string
    secondary_color?: string
    accent_color?: string
  }) {
    console.log("➕ Création d'une nouvelle agence:", agencyData.name)
    return apiRequest("/api/agencies", {
      method: "POST",
      body: JSON.stringify(agencyData),
    })
  },

  async getById(id: string) {
    console.log("🔍 Récupération de l'agence:", id)
    return apiRequest(`/api/agencies/${id}`)
  },

  async update(id: string, updates: any) {
    console.log("✏️ Mise à jour de l'agence:", id)
    return apiRequest(`/api/agencies/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  },

  async delete(id: string) {
    console.log("🗑️ Suppression de l'agence:", id)
    return apiRequest(`/api/agencies/${id}`, {
      method: "DELETE",
    })
  },
}

// Fonctions pour d'autres entités (à étendre selon les besoins)
export const userApi = {
  async getProfile() {
    return apiRequest("/api/user/profile")
  },

  async updateProfile(updates: any) {
    return apiRequest("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  },
}

// Fonction générique pour les requêtes authentifiées
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  return apiRequest(url, options)
}

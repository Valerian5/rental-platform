import { supabase } from "./supabase"

export interface SavedSearchData {
  name: string
  city?: string
  property_type?: string
  min_price?: number
  max_price?: number
  min_rooms?: number
  min_surface?: number
  max_surface?: number
  furnished?: boolean
  notifications_enabled?: boolean
}

export interface SavedSearch extends SavedSearchData {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  match_count?: number
  new_matches?: number
}

export const savedSearchService = {
  // Créer une nouvelle recherche sauvegardée
  async createSavedSearch(userId: string, searchData: SavedSearchData): Promise<SavedSearch> {
    console.log("💾 SavedSearchService.createSavedSearch", { userId, searchData })

    try {
      const { data, error } = await supabase
        .from("saved_searches")
        .insert({
          user_id: userId,
          ...searchData,
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création recherche:", error)
        throw new Error(error.message)
      }

      console.log("✅ Recherche créée:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans createSavedSearch:", error)
      throw error
    }
  },

  // Récupérer les recherches d'un utilisateur
  async getUserSavedSearches(userId: string): Promise<SavedSearch[]> {
    console.log("📋 SavedSearchService.getUserSavedSearches", userId)

    try {
      const { data, error } = await supabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération recherches:", error)
        throw new Error(error.message)
      }

      // Calculer le nombre de correspondances pour chaque recherche
      const searchesWithMatches = await Promise.all(
        (data || []).map(async (search) => {
          const matchCount = await this.getSearchMatchCount(search)
          return {
            ...search,
            match_count: matchCount,
            new_matches: Math.floor(Math.random() * 3), // Simulé pour l'instant
          }
        }),
      )

      console.log("✅ Recherches récupérées:", searchesWithMatches.length)
      return searchesWithMatches
    } catch (error) {
      console.error("❌ Erreur dans getUserSavedSearches:", error)
      throw error
    }
  },

  // Calculer le nombre de correspondances pour une recherche
  async getSearchMatchCount(search: SavedSearch): Promise<number> {
    try {
      let query = supabase.from("properties").select("id", { count: "exact", head: true }).eq("available", true)

      if (search.city) {
        query = query.ilike("city", `%${search.city}%`)
      }
      if (search.property_type) {
        query = query.eq("property_type", search.property_type)
      }
      if (search.min_price) {
        query = query.gte("price", search.min_price)
      }
      if (search.max_price) {
        query = query.lte("price", search.max_price)
      }
      if (search.min_rooms) {
        query = query.gte("rooms", search.min_rooms)
      }
      if (search.min_surface) {
        query = query.gte("surface", search.min_surface)
      }
      if (search.max_surface) {
        query = query.lte("surface", search.max_surface)
      }
      if (search.furnished !== undefined) {
        query = query.eq("furnished", search.furnished)
      }

      const { count, error } = await query

      if (error) {
        console.error("❌ Erreur calcul correspondances:", error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error("❌ Erreur dans getSearchMatchCount:", error)
      return 0
    }
  },

  // Mettre à jour une recherche
  async updateSavedSearch(searchId: string, updates: Partial<SavedSearchData>): Promise<SavedSearch> {
    console.log("🔄 SavedSearchService.updateSavedSearch", { searchId, updates })

    try {
      const { data, error } = await supabase
        .from("saved_searches")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", searchId)
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur mise à jour recherche:", error)
        throw new Error(error.message)
      }

      console.log("✅ Recherche mise à jour:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans updateSavedSearch:", error)
      throw error
    }
  },

  // Supprimer une recherche
  async deleteSavedSearch(searchId: string): Promise<void> {
    console.log("🗑️ SavedSearchService.deleteSavedSearch", searchId)

    try {
      const { error } = await supabase.from("saved_searches").delete().eq("id", searchId)

      if (error) {
        console.error("❌ Erreur suppression recherche:", error)
        throw new Error(error.message)
      }

      console.log("✅ Recherche supprimée")
    } catch (error) {
      console.error("❌ Erreur dans deleteSavedSearch:", error)
      throw error
    }
  },

  // Activer/désactiver les notifications pour une recherche
  async toggleNotifications(searchId: string, enabled: boolean): Promise<void> {
    console.log("🔔 SavedSearchService.toggleNotifications", { searchId, enabled })

    try {
      const { error } = await supabase
        .from("saved_searches")
        .update({ notifications_enabled: enabled })
        .eq("id", searchId)

      if (error) {
        console.error("❌ Erreur toggle notifications:", error)
        throw new Error(error.message)
      }

      console.log("✅ Notifications mises à jour")
    } catch (error) {
      console.error("❌ Erreur dans toggleNotifications:", error)
      throw error
    }
  },
}

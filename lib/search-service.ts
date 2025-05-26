import { supabase } from "./supabase"

export interface SearchFilters {
  city?: string
  property_type?: string
  rental_type?: string
  min_price?: number
  max_price?: number
  min_rooms?: number
  min_bedrooms?: number
  min_surface?: number
  max_surface?: number
  furnished?: boolean
  available?: boolean
}

export interface SavedSearchData {
  user_id: string
  name: string
  city?: string
  property_type?: string
  rental_type?: string
  max_rent?: number
  min_rooms?: number
  min_bedrooms?: number
  min_surface?: number
  max_surface?: number
  furnished?: boolean
  search_criteria?: any
}

export const searchService = {
  // Rechercher des propriétés
  async searchProperties(filters: SearchFilters, page = 1, limit = 20) {
    console.log("🔍 SearchService.searchProperties", filters)

    try {
      let query = supabase
        .from("properties")
        .select(`
          *,
          property_images(id, url, is_primary),
          owner:users!properties_owner_id_fkey(id, first_name, last_name)
        `)
        .eq("available", true)

      // Appliquer les filtres
      if (filters.city) {
        query = query.ilike("city", `%${filters.city}%`)
      }

      if (filters.property_type) {
        query = query.eq("property_type", filters.property_type)
      }

      if (filters.min_price) {
        query = query.gte("price", filters.min_price)
      }

      if (filters.max_price) {
        query = query.lte("price", filters.max_price)
      }

      if (filters.min_rooms) {
        query = query.gte("rooms", filters.min_rooms)
      }

      if (filters.min_bedrooms) {
        query = query.gte("bedrooms", filters.min_bedrooms)
      }

      if (filters.min_surface) {
        query = query.gte("surface", filters.min_surface)
      }

      if (filters.max_surface) {
        query = query.lte("surface", filters.max_surface)
      }

      if (filters.furnished !== undefined) {
        query = query.eq("furnished", filters.furnished)
      }

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to).order("created_at", { ascending: false })

      const { data, error, count } = await query

      if (error) {
        console.error("❌ Erreur recherche propriétés:", error)
        throw new Error(error.message)
      }

      console.log("✅ Propriétés trouvées:", data?.length || 0)
      return {
        properties: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }
    } catch (error) {
      console.error("❌ Erreur dans searchProperties:", error)
      throw error
    }
  },

  // Sauvegarder une recherche
  async saveSearch(searchData: SavedSearchData) {
    console.log("💾 SearchService.saveSearch", searchData)

    try {
      const { data, error } = await supabase.from("saved_searches").insert(searchData).select().single()

      if (error) {
        console.error("❌ Erreur sauvegarde recherche:", error)
        throw new Error(error.message)
      }

      console.log("✅ Recherche sauvegardée:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans saveSearch:", error)
      throw error
    }
  },

  // Récupérer les recherches sauvegardées d'un utilisateur
  async getUserSavedSearches(userId: string) {
    console.log("📋 SearchService.getUserSavedSearches", userId)

    try {
      const { data, error } = await supabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération recherches:", error)
        throw new Error(error.message)
      }

      console.log("✅ Recherches récupérées:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("❌ Erreur dans getUserSavedSearches:", error)
      throw error
    }
  },

  // Ajouter/retirer des favoris
  async toggleFavorite(userId: string, propertyId: string) {
    console.log("❤️ SearchService.toggleFavorite", userId, propertyId)

    try {
      // Vérifier si déjà en favori
      const { data: existing } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("property_id", propertyId)
        .single()

      if (existing) {
        // Retirer des favoris
        const { error } = await supabase.from("favorites").delete().eq("id", existing.id)

        if (error) throw new Error(error.message)

        console.log("✅ Retiré des favoris")
        return { isFavorite: false }
      } else {
        // Ajouter aux favoris
        const { data, error } = await supabase
          .from("favorites")
          .insert({ user_id: userId, property_id: propertyId })
          .select()
          .single()

        if (error) throw new Error(error.message)

        console.log("✅ Ajouté aux favoris")
        return { isFavorite: true, favorite: data }
      }
    } catch (error) {
      console.error("❌ Erreur dans toggleFavorite:", error)
      throw error
    }
  },

  // Récupérer les favoris d'un utilisateur
  async getUserFavorites(userId: string) {
    console.log("❤️ SearchService.getUserFavorites", userId)

    try {
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          *,
          property:properties(
            *,
            property_images(id, url, is_primary)
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération favoris:", error)
        throw new Error(error.message)
      }

      console.log("✅ Favoris récupérés:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("❌ Erreur dans getUserFavorites:", error)
      throw error
    }
  },
}

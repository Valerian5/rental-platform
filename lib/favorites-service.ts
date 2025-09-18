import { supabase } from "./supabase"

export interface FavoriteProperty {
  id: string
  user_id: string
  property_id: string
  created_at: string
  property: {
    id: string
    title: string
    address: string
    city: string
    postal_code: string
    price: number
    surface: number
    rooms: number
    bedrooms?: number
    bathrooms?: number
    property_type: string
    furnished: boolean
    available: boolean
    property_images: Array<{
      id: string
      url: string
      is_primary: boolean
    }>
    owner: {
      first_name: string
      last_name: string
      phone?: string
    }
  }
}

export const favoritesService = {
  // Ajouter aux favoris
  async addToFavorites(userId: string, propertyId: string): Promise<void> {
    console.log("❤️ FavoritesService.addToFavorites", { userId, propertyId })

    try {
      const { error } = await supabase.from("favorites").insert({
        user_id: userId,
        property_id: propertyId,
      })

      if (error) {
        console.error("❌ Erreur ajout favori:", error)
        throw new Error(error.message)
      }

      console.log("✅ Ajouté aux favoris")
    } catch (error) {
      console.error("❌ Erreur dans addToFavorites:", error)
      throw error
    }
  },

  // Retirer des favoris
  async removeFromFavorites(userId: string, propertyId: string): Promise<void> {
    console.log("💔 FavoritesService.removeFromFavorites", { userId, propertyId })

    try {
      const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("property_id", propertyId)

      if (error) {
        console.error("❌ Erreur suppression favori:", error)
        throw new Error(error.message)
      }

      console.log("✅ Retiré des favoris")
    } catch (error) {
      console.error("❌ Erreur dans removeFromFavorites:", error)
      throw error
    }
  },

  // Vérifier si une propriété est en favori
  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("property_id", propertyId)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("❌ Erreur vérification favori:", error)
        return false
      }

      return !!data
    } catch (error) {
      console.error("❌ Erreur dans isFavorite:", error)
      return false
    }
  },

  // Récupérer les favoris d'un utilisateur
  async getUserFavorites(userId: string): Promise<FavoriteProperty[]> {
    console.log("📋 FavoritesService.getUserFavorites", userId)

    try {
      // D'abord récupérer les favoris
      const { data: favorites, error: favoritesError } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (favoritesError) {
        console.error("❌ Erreur récupération favoris:", favoritesError)
        throw new Error(favoritesError.message)
      }

      if (!favorites || favorites.length === 0) {
        console.log("✅ Aucun favori trouvé")
        return []
      }

      // Récupérer les IDs des propriétés
      const propertyIds = favorites.map(fav => fav.property_id)

      // Récupérer les propriétés avec leurs images et propriétaires
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select(`
          *,
          property_images(id, url, is_primary),
          owner:users!properties_owner_id_fkey(first_name, last_name, phone)
        `)
        .in("id", propertyIds)

      if (propertiesError) {
        console.error("❌ Erreur récupération propriétés:", propertiesError)
        throw new Error(propertiesError.message)
      }

      // Combiner les données
      const result = favorites.map(favorite => {
        const property = properties?.find(p => p.id === favorite.property_id)
        return {
          ...favorite,
          property: property || null
        }
      }).filter(item => item.property !== null) // Filtrer les propriétés supprimées

      console.log("✅ Favoris récupérés:", result.length)
      return result as FavoriteProperty[]
    } catch (error) {
      console.error("❌ Erreur dans getUserFavorites:", error)
      throw error
    }
  },

  // Toggle favori (ajouter ou retirer)
  async toggleFavorite(userId: string, propertyId: string): Promise<boolean> {
    console.log("🔄 FavoritesService.toggleFavorite", { userId, propertyId })

    try {
      const isFav = await this.isFavorite(userId, propertyId)

      if (isFav) {
        await this.removeFromFavorites(userId, propertyId)
        return false
      } else {
        await this.addToFavorites(userId, propertyId)
        return true
      }
    } catch (error) {
      console.error("❌ Erreur dans toggleFavorite:", error)
      throw error
    }
  },
}

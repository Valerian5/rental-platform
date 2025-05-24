import { supabase } from "./supabase"

export interface PropertyData {
  title: string
  description: string
  price: number
  surface: number
  rooms: number
  bedrooms: number
  bathrooms: number
  address: string
  city: string
  postal_code: string
  property_type: "apartment" | "house" | "studio" | "loft"
  furnished: boolean
  owner_id: string
}

export const propertyService = {
  // Créer une nouvelle propriété
  async createProperty(propertyData: PropertyData) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .insert({
          ...propertyData,
          available: true,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error("Erreur lors de la création de la propriété:", error)
      throw error
    }
  },

  // Récupérer les propriétés d'un propriétaire
  async getOwnerProperties(ownerId: string) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          property_images(id, url, is_primary)
        `)
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error("Erreur lors de la récupération des propriétés:", error)
      throw error
    }
  },

  // Récupérer une propriété par son ID
  async getPropertyById(id: string) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          owner:users(id, first_name, last_name, email, phone),
          property_images(id, url, is_primary)
        `)
        .eq("id", id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error("Erreur lors de la récupération de la propriété:", error)
      throw error
    }
  },

  // Mettre à jour une propriété
  async updateProperty(id: string, updates: Partial<PropertyData>) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la propriété:", error)
      throw error
    }
  },

  // Supprimer une propriété
  async deleteProperty(id: string) {
    try {
      const { error } = await supabase.from("properties").delete().eq("id", id)

      if (error) {
        throw new Error(error.message)
      }

      return true
    } catch (error) {
      console.error("Erreur lors de la suppression de la propriété:", error)
      throw error
    }
  },

  // Ajouter une image à une propriété
  async addPropertyImage(propertyId: string, imageUrl: string, isPrimary = false) {
    try {
      const { data, error } = await supabase
        .from("property_images")
        .insert({
          property_id: propertyId,
          url: imageUrl,
          is_primary: isPrimary,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'image:", error)
      throw error
    }
  },
}

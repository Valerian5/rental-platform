import { supabase } from "./supabase"

export interface Property {
  id: string
  title: string
  description: string
  address: string
  city: string
  postal_code: string
  price: number
  charges?: number
  surface: number
  rooms: number
  bedrooms: number
  bathrooms: number
  floor?: number
  property_type: string
  furnished: boolean
  available: boolean
  available_from?: string
  energy_class?: string
  ges_class?: string
  has_parking: boolean
  has_balcony: boolean
  has_elevator: boolean
  has_security: boolean
  internet: boolean
  pets_allowed: boolean
  equipment?: string[]
  owner_id: string
  owner?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  property_images?: Array<{
    id: string
    url: string
    is_primary: boolean
  }>
  created_at: string
  updated_at: string
}

export const propertyService = {
  async getProperties(
    filters: any = {},
    page = 1,
    limit = 10,
  ): Promise<{ properties: Property[]; total: number; totalPages: number }> {
    console.log("🏠 PropertyService.getProperties", { filters, page, limit })

    try {
      let query = supabase.from("properties").select(`
          *,
          owner:users!owner_id (id, first_name, last_name, email, phone),
          property_images (id, url, is_primary)
        `)

      // Appliquer les filtres
      if (filters.city) {
        query = query.ilike("city", `%${filters.city}%`)
      }

      if (filters.property_type && filters.property_type !== "all") {
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

      if (filters.furnished === true) {
        query = query.eq("furnished", true)
      }

      // Compter le total
      const { count, error: countError } = await supabase.from("properties").select("*", { count: "exact", head: true })

      if (countError) {
        console.error("❌ Erreur comptage propriétés:", countError)
        throw new Error(countError.message)
      }

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      // Exécuter la requête
      const { data, error } = await query

      if (error) {
        console.error("❌ Erreur récupération propriétés:", error)
        throw new Error(error.message)
      }

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      console.log(`✅ ${data.length} propriétés récupérées sur ${total}`)

      return {
        properties: data as Property[],
        total,
        totalPages,
      }
    } catch (error) {
      console.error("❌ Erreur dans getProperties:", error)
      throw error
    }
  },

  async getPropertyById(id: string): Promise<Property> {
    console.log("🏠 PropertyService.getPropertyById", id)

    try {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          owner:users!owner_id (id, first_name, last_name, email, phone),
          property_images (id, url, is_primary)
        `)
        .eq("id", id)
        .single()

      if (error) {
        console.error("❌ Erreur récupération propriété:", error)
        throw new Error(error.message)
      }

      console.log("✅ Propriété récupérée:", data)
      return data as Property
    } catch (error) {
      console.error("❌ Erreur dans getPropertyById:", error)
      throw error
    }
  },

  async getPublicPropertyById(id: string): Promise<Property> {
    // Pour les propriétés publiques, on utilise la même fonction
    // mais on pourrait ajouter des restrictions si nécessaire
    return this.getPropertyById(id)
  },

  async createProperty(propertyData: Partial<Property>): Promise<Property> {
    console.log("🏠 PropertyService.createProperty")

    try {
      const { data, error } = await supabase.from("properties").insert(propertyData).select().single()

      if (error) {
        console.error("❌ Erreur création propriété:", error)
        throw new Error(error.message)
      }

      console.log("✅ Propriété créée:", data)
      return data as Property
    } catch (error) {
      console.error("❌ Erreur dans createProperty:", error)
      throw error
    }
  },

  async updateProperty(id: string, propertyData: Partial<Property>): Promise<Property> {
    console.log("🏠 PropertyService.updateProperty", id)

    try {
      const { data, error } = await supabase.from("properties").update(propertyData).eq("id", id).select().single()

      if (error) {
        console.error("❌ Erreur mise à jour propriété:", error)
        throw new Error(error.message)
      }

      console.log("✅ Propriété mise à jour:", data)
      return data as Property
    } catch (error) {
      console.error("❌ Erreur dans updateProperty:", error)
      throw error
    }
  },

  async deleteProperty(id: string): Promise<void> {
    console.log("🏠 PropertyService.deleteProperty", id)

    try {
      const { error } = await supabase.from("properties").delete().eq("id", id)

      if (error) {
        console.error("❌ Erreur suppression propriété:", error)
        throw new Error(error.message)
      }

      console.log("✅ Propriété supprimée")
    } catch (error) {
      console.error("❌ Erreur dans deleteProperty:", error)
      throw error
    }
  },

  async addPropertyImage(propertyId: string, imageUrl: string, isPrimary = false): Promise<any> {
    console.log("🏠 PropertyService.addPropertyImage", { propertyId, imageUrl, isPrimary })

    try {
      // Si l'image est définie comme principale, mettre à jour les autres images
      if (isPrimary) {
        await supabase.from("property_images").update({ is_primary: false }).eq("property_id", propertyId)
      }

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
        console.error("❌ Erreur ajout image:", error)
        throw new Error(error.message)
      }

      console.log("✅ Image ajoutée:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans addPropertyImage:", error)
      throw error
    }
  },

  async deletePropertyImage(imageId: string): Promise<void> {
    console.log("🏠 PropertyService.deletePropertyImage", imageId)

    try {
      const { error } = await supabase.from("property_images").delete().eq("id", imageId)

      if (error) {
        console.error("❌ Erreur suppression image:", error)
        throw new Error(error.message)
      }

      console.log("✅ Image supprimée")
    } catch (error) {
      console.error("❌ Erreur dans deletePropertyImage:", error)
      throw error
    }
  },
}

import { supabase } from "./supabase"

export interface Property {
  id: string
  title: string
  description: string
  address: string
  city: string
  postal_code: string
  price: number
  charges_amount?: number
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
    return this.getPropertyById(id)
  },

  async createProperty(propertyData: any): Promise<Property> {
    console.log("🏠 PropertyService.createProperty", propertyData)

    try {
      // Nettoyer les données en ne gardant que les champs qui existent vraiment
      const cleanData = {
        title: propertyData.title,
        description: propertyData.description,
        address: propertyData.address,
        city: propertyData.city,
        postal_code: propertyData.postal_code,
        price: propertyData.price || 0,
        surface: propertyData.surface || 0,
        rooms: propertyData.rooms || 1,
        bedrooms: propertyData.bedrooms || 0,
        bathrooms: propertyData.bathrooms || 0,
        property_type: propertyData.property_type || "apartment",
        furnished: propertyData.furnished || false,
        available: propertyData.available !== false,
        owner_id: propertyData.owner_id,
        // Ajouter seulement les champs qui existent dans la table
        ...(propertyData.charges_amount && { charges_amount: propertyData.charges_amount }),
        ...(propertyData.security_deposit && { security_deposit: propertyData.security_deposit }),
        ...(propertyData.energy_class && { energy_class: propertyData.energy_class }),
        ...(propertyData.ges_class && { ges_class: propertyData.ges_class }),
        ...(propertyData.equipment && { equipment: propertyData.equipment }),
      }

      console.log("🧹 Données nettoyées:", cleanData)

      const { data, error } = await supabase.from("properties").insert(cleanData).select().single()

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

  async getOwnerProperties(ownerId: string): Promise<Property[]> {
    console.log("🏠 PropertyService.getOwnerProperties", ownerId)

    try {
      const { data, error } = await supabase
        .from("properties")
        .select(`
        *,
        owner:users!owner_id (id, first_name, last_name, email, phone),
        property_images (id, url, is_primary)
      `)
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération propriétés propriétaire:", error)
        throw new Error(error.message)
      }

      console.log(`✅ ${data.length} propriétés récupérées pour le propriétaire`)
      return data as Property[]
    } catch (error) {
      console.error("❌ Erreur dans getOwnerProperties:", error)
      throw error
    }
  },

  async searchProperties(filters: any = {}): Promise<Property[]> {
    console.log("🔍 PropertyService.searchProperties", filters)

    try {
      let query = supabase
        .from("properties")
        .select(`
        *,
        owner:users!owner_id (id, first_name, last_name, email, phone),
        property_images (id, url, is_primary)
      `)
        .eq("available", true)

      // Appliquer les filtres de recherche
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

      if (filters.min_surface) {
        query = query.gte("surface", filters.min_surface)
      }

      if (filters.max_surface) {
        query = query.lte("surface", filters.max_surface)
      }

      if (filters.furnished === true) {
        query = query.eq("furnished", true)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur recherche propriétés:", error)
        throw new Error(error.message)
      }

      console.log(`✅ ${data.length} propriétés trouvées`)
      return data as Property[]
    } catch (error) {
      console.error("❌ Erreur dans searchProperties:", error)
      throw error
    }
  },

  // CORRECTION : Utiliser property_visit_slots au lieu de visit_availabilities
  getPropertyVisitSlots: async (propertyId: string) => {
    try {
      console.log("🔍 Récupération des créneaux de visite pour la propriété:", propertyId)

      const { data, error } = await supabase
        .from("property_visit_slots")
        .select("*")
        .eq("property_id", propertyId)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })

      if (error) {
        console.error("❌ Erreur lors de la récupération des créneaux:", error)
        throw error
      }

      console.log(`✅ ${data?.length || 0} créneaux récupérés`)
      return data || []
    } catch (error) {
      console.error("❌ Erreur service getPropertyVisitSlots:", error)
      throw error
    }
  },

  // CORRECTION : Sauvegarder dans property_visit_slots
  savePropertyVisitSlots: async (propertyId: string, slots: any[]) => {
    try {
      console.log("💾 Sauvegarde des créneaux pour la propriété:", propertyId)

      // D'abord supprimer les créneaux existants
      const { error: deleteError } = await supabase.from("property_visit_slots").delete().eq("property_id", propertyId)

      if (deleteError) {
        console.error("❌ Erreur lors de la suppression des anciens créneaux:", deleteError)
        throw deleteError
      }

      // Si aucun créneau à ajouter, on s'arrête là
      if (slots.length === 0) {
        return { success: true, message: "Tous les créneaux ont été supprimés" }
      }

      // Préparer les données pour l'insertion
      const slotsToInsert = slots.map((slot) => ({
        property_id: propertyId,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_visitors: Number(slot.max_visitors) || Number(slot.max_capacity) || 1,
        is_available: slot.is_available !== false,
        current_bookings: Number(slot.current_bookings) || 0,
      }))

      // Insérer les nouveaux créneaux
      const { data, error } = await supabase.from("property_visit_slots").insert(slotsToInsert).select()

      if (error) {
        console.error("❌ Erreur lors de l'insertion des créneaux:", error)
        throw error
      }

      console.log(`✅ ${data?.length || 0} créneaux sauvegardés`)
      return { success: true, slots: data, message: `${data?.length || 0} créneaux sauvegardés` }
    } catch (error) {
      console.error("❌ Erreur service savePropertyVisitSlots:", error)
      throw error
    }
  },
}

import { supabase } from "./supabase"

export interface PropertyData {
  title: string
  description: string
  address: string
  city: string
  postal_code: string
  hide_exact_address: boolean
  surface: number
  rent_excluding_charges: number
  charges_amount: number
  property_type: "apartment" | "house" | "studio" | "loft"
  rental_type: "unfurnished" | "furnished" | "shared"
  construction_year: number
  security_deposit: number
  rooms: number
  bedrooms: number
  bathrooms: number
  exterior_type: string
  equipment: string[]
  energy_class: string
  ges_class: string
  heating_type: string
  required_income: number
  professional_situation: string
  guarantor_required: boolean
  lease_duration: number
  move_in_date: string
  rent_payment_day: number
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
          price: propertyData.rent_excluding_charges + propertyData.charges_amount, // Prix total pour compatibilité
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

  // Récupérer les propriétés d'un propriétaire avec statistiques
  async getOwnerPropertiesWithStats(ownerId: string) {
    try {
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select(`
          *,
          property_images(id, url, is_primary),
          applications(id, status),
          visits(id, status, visit_date)
        `)
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })

      if (propertiesError) {
        throw new Error(propertiesError.message)
      }

      return properties || []
    } catch (error) {
      console.error("Erreur lors de la récupération des propriétés:", error)
      throw error
    }
  },

  // Récupérer les candidatures d'un propriétaire
  async getOwnerApplications(ownerId: string) {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          property:properties(id, title, city),
          tenant:users(id, first_name, last_name, email, phone)
        `)
        .eq("properties.owner_id", ownerId)
        .order("created_at", { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error("Erreur lors de la récupération des candidatures:", error)
      throw error
    }
  },

  // Récupérer les visites d'un propriétaire
  async getOwnerVisits(ownerId: string) {
    try {
      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          property:properties(id, title, address, city),
          tenant:users(id, first_name, last_name, phone)
        `)
        .eq("properties.owner_id", ownerId)
        .order("visit_date", { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error("Erreur lors de la récupération des visites:", error)
      throw error
    }
  },

  // Récupérer les messages d'un propriétaire
  async getOwnerMessages(ownerId: string) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          conversation:conversations(id, subject),
          sender:users(id, first_name, last_name)
        `)
        .eq("conversations.participants", ownerId)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error)
      throw error
    }
  },

  // Ajouter un document à une propriété
  async addPropertyDocument(propertyId: string, documentType: string, fileName: string, fileUrl: string) {
    try {
      const { data, error } = await supabase
        .from("property_documents")
        .insert({
          property_id: propertyId,
          document_type: documentType,
          file_name: fileName,
          file_url: fileUrl,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error("Erreur lors de l'ajout du document:", error)
      throw error
    }
  },

  // Ajouter des disponibilités de visite
  async addVisitAvailability(propertyId: string, date: string, startTime: string, endTime: string) {
    try {
      const { data, error } = await supabase
        .from("visit_availabilities")
        .insert({
          property_id: propertyId,
          date,
          start_time: startTime,
          end_time: endTime,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error("Erreur lors de l'ajout de la disponibilité:", error)
      throw error
    }
  },
}

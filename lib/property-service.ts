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

export interface VisitSlot {
  id?: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  is_group_visit: boolean
  current_bookings: number
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

  // Récupérer une propriété par son ID
  async getPropertyById(id: string) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          owner:users(id, first_name, last_name, email, phone),
          property_images(id, url, is_primary),
          visit_availabilities(id, date, start_time, end_time, max_capacity, is_group_visit, current_bookings)
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

  // Générer des créneaux de visite automatiques
  async generateDefaultVisitSlots(propertyId: string, daysAhead = 14) {
    try {
      const slots: VisitSlot[] = []
      const today = new Date()

      for (let i = 1; i <= daysAhead; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)

        // Éviter les dimanches
        if (date.getDay() === 0) continue

        const dateStr = date.toISOString().split("T")[0]

        // Créneaux de semaine (lundi-vendredi)
        if (date.getDay() >= 1 && date.getDay() <= 5) {
          // Matin : 9h-12h (créneaux de 30min)
          for (let hour = 9; hour < 12; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
              const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
              const endHour = minute === 30 ? hour + 1 : hour
              const endMinute = minute === 30 ? 0 : 30
              const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`

              slots.push({
                date: dateStr,
                start_time: startTime,
                end_time: endTime,
                max_capacity: 1,
                is_group_visit: false,
                current_bookings: 0,
              })
            }
          }

          // Après-midi : 14h-18h (créneaux de 30min)
          for (let hour = 14; hour < 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
              const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
              const endHour = minute === 30 ? hour + 1 : hour
              const endMinute = minute === 30 ? 0 : 30
              const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`

              slots.push({
                date: dateStr,
                start_time: startTime,
                end_time: endTime,
                max_capacity: 1,
                is_group_visit: false,
                current_bookings: 0,
              })
            }
          }
        }

        // Créneaux de samedi (10h-17h)
        if (date.getDay() === 6) {
          for (let hour = 10; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
              const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
              const endHour = minute === 30 ? hour + 1 : hour
              const endMinute = minute === 30 ? 0 : 30
              const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`

              slots.push({
                date: dateStr,
                start_time: startTime,
                end_time: endTime,
                max_capacity: 1,
                is_group_visit: false,
                current_bookings: 0,
              })
            }
          }
        }
      }

      // Insérer tous les créneaux en une fois
      const slotsToInsert = slots.map((slot) => ({
        property_id: propertyId,
        ...slot,
      }))

      const { data, error } = await supabase.from("visit_availabilities").insert(slotsToInsert).select()

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error("Erreur lors de la génération des créneaux:", error)
      throw error
    }
  },

  // Ajouter une disponibilité de visite personnalisée
  async addVisitAvailability(
    propertyId: string,
    date: string,
    startTime: string,
    endTime: string,
    maxCapacity = 1,
    isGroupVisit = false,
  ) {
    try {
      const { data, error } = await supabase
        .from("visit_availabilities")
        .insert({
          property_id: propertyId,
          date,
          start_time: startTime,
          end_time: endTime,
          max_capacity: maxCapacity,
          is_group_visit: isGroupVisit,
          current_bookings: 0,
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

  // Mettre à jour une disponibilité de visite
  async updateVisitAvailability(
    availabilityId: string,
    updates: {
      date?: string
      start_time?: string
      end_time?: string
      max_capacity?: number
      is_group_visit?: boolean
    },
  ) {
    try {
      const { data, error } = await supabase
        .from("visit_availabilities")
        .update(updates)
        .eq("id", availabilityId)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la disponibilité:", error)
      throw error
    }
  },

  // Supprimer une disponibilité de visite
  async deleteVisitAvailability(availabilityId: string) {
    try {
      const { error } = await supabase.from("visit_availabilities").delete().eq("id", availabilityId)

      if (error) {
        throw new Error(error.message)
      }

      return true
    } catch (error) {
      console.error("Erreur lors de la suppression de la disponibilité:", error)
      throw error
    }
  },

  // Récupérer les disponibilités de visite d'une propriété
  async getPropertyVisitAvailabilities(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from("visit_availabilities")
        .select("*")
        .eq("property_id", propertyId)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error("Erreur lors de la récupération des disponibilités:", error)
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
          property:properties!inner(id, title, city, owner_id),
          tenant:users(id, first_name, last_name, email, phone)
        `)
        .eq("property.owner_id", ownerId)
        .order("created_at", { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error("Erreur lors de la récupération des candidatures:", error)
      return []
    }
  },

  // Récupérer les visites d'un propriétaire
  async getOwnerVisits(ownerId: string) {
    try {
      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          property:properties!inner(id, title, address, city, owner_id),
          tenant:users(id, first_name, last_name, phone)
        `)
        .eq("property.owner_id", ownerId)
        .order("visit_date", { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error("Erreur lors de la récupération des visites:", error)
      return []
    }
  },

  // Récupérer les messages d'un propriétaire
  async getOwnerMessages(ownerId: string) {
    try {
      // Pour l'instant, retourner un tableau vide car la table messages n'est pas encore implémentée
      return []
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error)
      return []
    }
  },
}

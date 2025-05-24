import { supabase } from "./supabase"

export interface Property {
  id: string
  title: string
  description: string
  address: string
  city: string
  postal_code?: string
  hide_exact_address: boolean
  surface: number
  rent_excluding_charges: number
  charges_amount: number
  property_type: "apartment" | "house" | "studio" | "loft"
  rental_type: "unfurnished" | "furnished" | "shared"
  construction_year?: number
  security_deposit: number
  rooms: number
  bedrooms?: number
  bathrooms?: number
  exterior_type?: string
  equipment: string[]
  energy_class?: string
  ges_class?: string
  heating_type?: string
  required_income?: number
  professional_situation?: string
  guarantor_required: boolean
  lease_duration?: number
  move_in_date?: string
  rent_payment_day?: number
  owner_id: string
  status: "available" | "rented" | "maintenance"
  created_at: string
  updated_at: string
}

export interface CreatePropertyData {
  title: string
  description: string
  address: string
  city: string
  postal_code?: string
  hide_exact_address: boolean
  surface: number
  rent_excluding_charges: number
  charges_amount: number
  property_type: "apartment" | "house" | "studio" | "loft"
  rental_type: "unfurnished" | "furnished" | "shared"
  construction_year?: number
  security_deposit: number
  rooms: number
  bedrooms?: number
  bathrooms?: number
  exterior_type?: string
  equipment: string[]
  energy_class?: string
  ges_class?: string
  heating_type?: string
  required_income?: number
  professional_situation?: string
  guarantor_required: boolean
  lease_duration?: number
  move_in_date?: string
  rent_payment_day?: number
  owner_id: string
}

class PropertyService {
  async createProperty(data: CreatePropertyData): Promise<Property> {
    console.log("🏠 PropertyService.createProperty called with:", data)

    try {
      // Vérifier la connexion Supabase
      console.log("🔗 Vérification de la connexion Supabase...")
      const { data: testData, error: testError } = await supabase.from("properties").select("count").limit(1)

      if (testError) {
        console.error("❌ Erreur de connexion Supabase:", testError)
        throw new Error(`Erreur de connexion à la base de données: ${testError.message}`)
      }

      console.log("✅ Connexion Supabase OK")

      // Préparer les données pour l'insertion
      const insertData = {
        ...data,
        status: "available" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("📝 Données préparées pour insertion:", insertData)

      // Insérer la propriété
      const { data: property, error } = await supabase.from("properties").insert([insertData]).select().single()

      if (error) {
        console.error("❌ Erreur lors de l'insertion:", error)
        throw new Error(`Erreur lors de la création de la propriété: ${error.message}`)
      }

      if (!property) {
        console.error("❌ Aucune propriété retournée après insertion")
        throw new Error("Aucune propriété retournée après création")
      }

      console.log("✅ Propriété créée avec succès:", property)
      return property
    } catch (error) {
      console.error("❌ Erreur dans PropertyService.createProperty:", error)
      throw error
    }
  }

  async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
    console.log("📋 PropertyService.getPropertiesByOwner called with:", ownerId)

    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur lors de la récupération des propriétés:", error)
        throw new Error(`Erreur lors de la récupération des propriétés: ${error.message}`)
      }

      console.log("✅ Propriétés récupérées:", data)
      return data || []
    } catch (error) {
      console.error("❌ Erreur dans PropertyService.getPropertiesByOwner:", error)
      throw error
    }
  }

  async getPropertyById(id: string): Promise<Property | null> {
    console.log("🔍 PropertyService.getPropertyById called with:", id)

    try {
      const { data, error } = await supabase.from("properties").select("*").eq("id", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          console.log("ℹ️ Propriété non trouvée")
          return null
        }
        console.error("❌ Erreur lors de la récupération de la propriété:", error)
        throw new Error(`Erreur lors de la récupération de la propriété: ${error.message}`)
      }

      console.log("✅ Propriété récupérée:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans PropertyService.getPropertyById:", error)
      throw error
    }
  }

  async addVisitAvailability(
    propertyId: string,
    date: string,
    startTime: string,
    endTime: string,
    maxCapacity = 1,
    isGroupVisit = false,
  ) {
    console.log("📅 PropertyService.addVisitAvailability called with:", {
      propertyId,
      date,
      startTime,
      endTime,
      maxCapacity,
      isGroupVisit,
    })

    try {
      const { data, error } = await supabase
        .from("visit_slots")
        .insert([
          {
            property_id: propertyId,
            date,
            start_time: startTime,
            end_time: endTime,
            max_capacity: maxCapacity,
            is_group_visit: isGroupVisit,
            current_bookings: 0,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur lors de l'ajout de disponibilité:", error)
        throw new Error(`Erreur lors de l'ajout de disponibilité: ${error.message}`)
      }

      console.log("✅ Disponibilité ajoutée:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans PropertyService.addVisitAvailability:", error)
      throw error
    }
  }

  async generateDefaultVisitSlots(propertyId: string, daysAhead = 14) {
    console.log("🔄 PropertyService.generateDefaultVisitSlots called with:", { propertyId, daysAhead })

    try {
      const slots = []
      const today = new Date()

      for (let i = 1; i <= daysAhead; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)

        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue

        const dateStr = date.toISOString().split("T")[0]

        // Morning slots (9h-12h)
        slots.push(
          { date: dateStr, start: "09:00", end: "09:30" },
          { date: dateStr, start: "09:30", end: "10:00" },
          { date: dateStr, start: "10:00", end: "10:30" },
          { date: dateStr, start: "10:30", end: "11:00" },
          { date: dateStr, start: "11:00", end: "11:30" },
          { date: dateStr, start: "11:30", end: "12:00" },
        )

        // Afternoon slots (14h-18h)
        slots.push(
          { date: dateStr, start: "14:00", end: "14:30" },
          { date: dateStr, start: "14:30", end: "15:00" },
          { date: dateStr, start: "15:00", end: "15:30" },
          { date: dateStr, start: "15:30", end: "16:00" },
          { date: dateStr, start: "16:00", end: "16:30" },
          { date: dateStr, start: "16:30", end: "17:00" },
          { date: dateStr, start: "17:00", end: "17:30" },
          { date: dateStr, start: "17:30", end: "18:00" },
        )
      }

      console.log(`📅 Génération de ${slots.length} créneaux par défaut`)

      for (const slot of slots) {
        await this.addVisitAvailability(propertyId, slot.date, slot.start, slot.end, 1, false)
      }

      console.log("✅ Créneaux par défaut générés avec succès")
      return slots.length
    } catch (error) {
      console.error("❌ Erreur dans PropertyService.generateDefaultVisitSlots:", error)
      throw error
    }
  }
}

export const propertyService = new PropertyService()

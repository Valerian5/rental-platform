import { supabase } from "./supabase"
import { findCitiesInRadius, calculateDistance } from "./french-cities"

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
  total_floors?: number
  latitude?: number
  longitude?: number
  property_type: string
  furnished: boolean
  available: boolean
  available_from?: string
  energy_class?: string
  ges_class?: string
  heating_type?: string
  hot_water_production?: string
  heating_mode?: string
  orientation?: string
  wc_count?: number
  wc_separate?: boolean
  wheelchair_accessible?: boolean
  availability_date?: string
  rent_control_zone?: boolean
  reference_rent?: number
  reference_rent_increased?: number
  rent_supplement?: number
  agency_fees_tenant?: number
  inventory_fees_tenant?: number
  colocation_possible?: boolean
  max_colocation_occupants?: number
  hide_exact_address?: boolean
  hide_owner_contact?: boolean
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

// Fonction utilitaire pour mapper les équipements du formulaire vers un tableau
function mapEquipmentToArray(formData: any): string[] {
  const equipment: string[] = []

  // Équipements de cuisine
  if (formData.equipped_kitchen) equipment.push("cuisine_equipee")
  if (formData.dishwasher) equipment.push("lave_vaisselle")
  if (formData.washing_machine) equipment.push("lave_linge")
  if (formData.dryer) equipment.push("seche_linge")
  if (formData.fridge) equipment.push("refrigerateur")
  if (formData.oven) equipment.push("four")
  if (formData.microwave) equipment.push("micro_ondes")

  // Équipements de salle de bain
  if (formData.bathtub) equipment.push("baignoire")
  if (formData.shower) equipment.push("douche")

  // Équipements de confort
  if (formData.air_conditioning) equipment.push("climatisation")
  if (formData.fireplace) equipment.push("cheminee")
  if (formData.parking) equipment.push("parking")
  if (formData.cellar) equipment.push("cave")
  if (formData.elevator) equipment.push("ascenseur")
  if (formData.intercom) equipment.push("interphone")
  if (formData.digicode) equipment.push("digicode")

  // Extérieur
  if (formData.balcony) equipment.push("balcon")
  if (formData.terrace) equipment.push("terrasse")
  if (formData.garden) equipment.push("jardin")
  if (formData.loggia) equipment.push("loggia")

  return equipment
}

// Fonction utilitaire pour déterminer le type d'extérieur
function getExteriorType(formData: any): string | null {
  if (formData.garden) return "jardin"
  if (formData.terrace) return "terrasse"
  if (formData.balcony) return "balcon"
  if (formData.loggia) return "loggia"
  return null
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
        .eq("available", true) // Filtrer uniquement les propriétés disponibles

      // Appliquer les filtres
      if (filters.city && Array.isArray(filters.city) && filters.city.length > 0) {
        // Si plusieurs villes sont sélectionnées
        const cityConditions = filters.city.map(city => {
          const match = city.match(/^(.+?)\s*\((\d{5})\)$/)
          if (match) {
            const [, cityName, postalCode] = match
            return { city: cityName, postal_code: postalCode }
          }
          return { city: city }
        })
        
        // Construire la condition OR pour les villes
        const cityOrConditions = cityConditions.map(condition => 
          `(city.ilike.%${condition.city}%${condition.postal_code ? `,postal_code.eq.${condition.postal_code}` : ''})`
        ).join(',')
        
        query = query.or(cityOrConditions)
      } else if (filters.city && typeof filters.city === 'string') {
        // Filtre simple par ville
        query = query.ilike("city", `%${filters.city}%`)
      }

      // Gérer le rayon de recherche si spécifié
      if (filters.radius && filters.city && Array.isArray(filters.city) && filters.city.length > 0) {
        // Pour chaque ville sélectionnée, trouver les villes dans le rayon
        const allCitiesInRadius = new Set<string>()
        
        for (const city of filters.city) {
          const match = city.match(/^(.+?)\s*\((\d{5})\)$/)
          if (match) {
            const [, cityName, postalCode] = match
            // Trouver la ville dans notre base de données
            const cityData = findCitiesInRadius(
              { nom: cityName, codePostal: postalCode, latitude: 0, longitude: 0 },
              filters.radius
            )
            cityData.forEach(c => allCitiesInRadius.add(`${c.nom} (${c.codePostal})`))
          }
        }
        
        // Appliquer le filtre sur toutes les villes trouvées
        if (allCitiesInRadius.size > 0) {
          const radiusConditions = Array.from(allCitiesInRadius).map(city => {
            const match = city.match(/^(.+?)\s*\((\d{5})\)$/)
            if (match) {
              const [, cityName, postalCode] = match
              return `(city.ilike.%${cityName}%,postal_code.eq.${postalCode})`
            }
            return `city.ilike.%${city}%`
          }).join(',')
          
          query = query.or(radiusConditions)
        }
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

      // Compter le total (avec le même filtre available)
      const { count, error: countError } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("available", true)

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
      // Mapper les équipements vers un tableau
      const equipment = mapEquipmentToArray(propertyData)

      // Déterminer le type d'extérieur
      const exteriorType = getExteriorType(propertyData)

      // Mapper les données du formulaire vers la structure de la table
      const cleanData = {
        // Champs de base (correspondent à la table)
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

        // Champs financiers (noms corrects de la table)
        charges_amount: propertyData.charges || 0,
        security_deposit: propertyData.deposit || 0, // deposit -> security_deposit

        // Champs supplémentaires
        construction_year: propertyData.construction_year,
        hide_exact_address: propertyData.hide_exact_address || false,
        energy_class: propertyData.energy_class || null,
        ges_class: propertyData.ges_class || null,
        heating_type: propertyData.heating_type || null,
        exterior_type: exteriorType,
        equipment: equipment, // Tableau d'équipements

        // Nouveaux champs ajoutés
        floor: propertyData.floor || null,
        total_floors: propertyData.total_floors || null,
        latitude: propertyData.latitude || null,
        longitude: propertyData.longitude || null,
        hot_water_production: propertyData.hot_water_production || null,
        heating_mode: propertyData.heating_mode || null,
        orientation: propertyData.orientation || null,
        wc_count: propertyData.wc_count || 1,
        wc_separate: propertyData.wc_separate || false,
        wheelchair_accessible: propertyData.wheelchair_accessible || false,
        availability_date: propertyData.availability_date || null,
        rent_control_zone: propertyData.rent_control_zone || false,
        reference_rent: propertyData.reference_rent || null,
        reference_rent_increased: propertyData.reference_rent_increased || null,
        rent_supplement: propertyData.rent_supplement || null,
        agency_fees_tenant: propertyData.agency_fees_tenant || null,
        inventory_fees_tenant: propertyData.inventory_fees_tenant || null,
        colocation_possible: propertyData.colocation_possible || false,
        max_colocation_occupants: propertyData.max_colocation_occupants || null,

        // Dates
        move_in_date: propertyData.availability_date || null,

        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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

  // FONCTION CORRIGÉE : Récupérer les propriétés avec les statistiques
  async getOwnerPropertiesWithStats(ownerId: string): Promise<any[]> {
    console.log("📊 PropertyService.getOwnerPropertiesWithStats", ownerId)

    try {
      // Récupérer les propriétés
      const properties = await this.getOwnerProperties(ownerId)

      // Récupérer les statistiques pour chaque propriété
      const propertiesWithStats = await Promise.all(
        properties.map(async (property) => {
          try {
            console.log(`📊 Récupération stats pour propriété ${property.id}`)

            // CORRECTION : Compter les candidatures avec une requête plus simple
            const { data: applications, error: appError } = await supabase
              .from("applications")
              .select("id, status")
              .eq("property_id", property.id)

            if (appError) {
              console.error(`❌ Erreur candidatures pour ${property.id}:`, appError)
            }

            // Filtrer les candidatures actives
            const activeApplications =
              applications?.filter((app) => ["pending", "visit_proposed", "visit_scheduled"].includes(app.status)) || []

            console.log(`📊 Propriété ${property.id}: ${activeApplications.length} candidatures actives`)

            // Vérifier s'il y a un bail actif (propriété louée)
            const { data: activeLease, error: leaseError } = await supabase
              .from("leases")
              .select(`
                id,
                tenant_id,
                start_date,
                users!tenant_id (first_name, last_name)
              `)
              .eq("property_id", property.id)
              .eq("status", "active")
              .maybeSingle() // Utiliser maybeSingle au lieu de single

            if (leaseError) {
              console.error(`❌ Erreur bail pour ${property.id}:`, leaseError)
            }

            // Déterminer le statut
            let status = "paused"
            let tenant_name = undefined
            let rental_start_date = undefined

            if (activeLease) {
              status = "rented"
              const tenant = activeLease.users
              tenant_name = tenant ? `${tenant.first_name} ${tenant.last_name}`.trim() : "Locataire"
              rental_start_date = activeLease.start_date
            } else if (property.available && property.is_published !== false) {
              status = "active"
            }

            console.log(`📊 Propriété ${property.id}: statut=${status}, candidatures=${activeApplications.length}`)

            return {
              ...property,
              status,
              applications_count: activeApplications.length,
              tenant_name,
              rental_start_date,
            }
          } catch (error) {
            console.error(`❌ Erreur stats pour propriété ${property.id}:`, error)
            // En cas d'erreur, retourner la propriété avec des valeurs par défaut
            return {
              ...property,
              status: property.available ? "active" : "paused",
              applications_count: 0,
            }
          }
        }),
      )

      console.log(`✅ ${propertiesWithStats.length} propriétés avec statistiques récupérées`)
      return propertiesWithStats
    } catch (error) {
      console.error("❌ Erreur dans getOwnerPropertiesWithStats:", error)
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
        max_capacity: Number(slot.max_capacity) || Number(slot.max_visitors) || 1, // Utiliser max_capacity
        is_group_visit: Boolean(slot.is_group_visit) || false,
        current_bookings: Number(slot.current_bookings) || 0,
        is_available: slot.is_available !== false,
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

  // Méthode pour uploader plusieurs images - CORRIGÉE
  uploadPropertyImages: async (propertyId: string, imageUrls: string[]): Promise<any[]> => {
    try {
      console.log(`📸 Sauvegarde de ${imageUrls.length} images pour la propriété:`, propertyId)

      const results = []

      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i]
        const isPrimary = i === 0 // La première image est principale

        const result = await propertyService.addPropertyImage(propertyId, imageUrl, isPrimary)
        results.push(result)
      }

      console.log(`✅ ${results.length} images sauvegardées`)
      return results
    } catch (error) {
      console.error("❌ Erreur uploadPropertyImages:", error)
      throw error
    }
  },
}

import { supabase } from "./supabase"

export interface ApplicationData {
  property_id: string
  tenant_id: string
  message?: string
  income?: number
  profession?: string
  company?: string
  contract_type?: string
  has_guarantor?: boolean
  guarantor_name?: string
  guarantor_relationship?: string
  guarantor_profession?: string
  guarantor_income?: number
  move_in_date?: string
  duration_preference?: string
  presentation?: string
}

export const applicationService = {
  // Créer une nouvelle candidature
  async createApplication(applicationData: ApplicationData) {
    console.log("📝 ApplicationService.createApplication", applicationData)

    try {
      // Vérifier si une candidature existe déjà
      const { data: existing } = await supabase
        .from("applications")
        .select("id")
        .eq("property_id", applicationData.property_id)
        .eq("tenant_id", applicationData.tenant_id)
        .single()

      if (existing) {
        throw new Error("Vous avez déjà postulé pour ce bien")
      }

      const { data, error } = await supabase.from("applications").insert(applicationData).select().single()

      if (error) {
        console.error("❌ Erreur création candidature:", error)
        throw new Error(error.message)
      }

      console.log("✅ Candidature créée:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans createApplication:", error)
      throw error
    }
  },

  // Récupérer les candidatures d'un locataire
  async getTenantApplications(tenantId: string) {
    console.log("📋 ApplicationService.getTenantApplications", tenantId)

    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          property:properties(*)
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération candidatures:", error)
        throw new Error(error.message)
      }

      console.log("✅ Candidatures récupérées:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("❌ Erreur dans getTenantApplications:", error)
      throw error
    }
  },

  // Récupérer les candidatures d'un propriétaire via les propriétés
  async getOwnerApplications(ownerId: string) {
    console.log("📋 ApplicationService.getOwnerApplications", ownerId)

    try {
      // D'abord récupérer les propriétés du propriétaire
      const { data: properties, error: propError } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_id", ownerId)

      if (propError) {
        console.error("❌ Erreur récupération propriétés:", propError)
        throw new Error(propError.message)
      }

      if (!properties || properties.length === 0) {
        console.log("✅ Aucune propriété trouvée pour ce propriétaire")
        return []
      }

      const propertyIds = properties.map((p) => p.id)

      // Ensuite récupérer les candidatures pour ces propriétés
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          property:properties(*),
          tenant:users!applications_tenant_id_fkey(*)
        `)
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération candidatures propriétaire:", error)
        throw new Error(error.message)
      }

      console.log("✅ Candidatures propriétaire récupérées:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("❌ Erreur dans getOwnerApplications:", error)
      throw error
    }
  },

  // Récupérer une candidature par ID
  async getApplicationById(applicationId: string) {
    console.log("🔍 ApplicationService.getApplicationById", applicationId)

    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          property:properties(*),
          tenant:users!applications_tenant_id_fkey(*)
        `)
        .eq("id", applicationId)
        .single()

      if (error) {
        console.error("❌ Erreur récupération candidature:", error)
        throw new Error(error.message)
      }

      console.log("✅ Candidature récupérée:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans getApplicationById:", error)
      throw error
    }
  },

  // Mettre à jour le statut d'une candidature
  async updateApplicationStatus(applicationId: string, status: string, notes?: string) {
    console.log("🔄 ApplicationService.updateApplicationStatus", applicationId, status)

    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (notes) {
        updateData.notes = notes
      }

      const { data, error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", applicationId)
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur mise à jour statut:", error)
        throw new Error(error.message)
      }

      console.log("✅ Statut mis à jour:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans updateApplicationStatus:", error)
      throw error
    }
  },

  // Calculer le score de compatibilité
  calculateMatchScore(application: any, property: any): number {
    let score = 0
    const maxScore = 100

    // Ratio revenus/loyer (40 points max)
    if (application.income && property.price) {
      const rentRatio = application.income / property.price
      if (rentRatio >= 3) score += 40
      else if (rentRatio >= 2.5) score += 30
      else if (rentRatio >= 2) score += 20
      else score += 10
    } else {
      score += 10 // Score de base si pas d'info
    }

    // Stabilité professionnelle (20 points max)
    if (application.contract_type === "CDI") score += 20
    else if (application.contract_type === "CDD") score += 15
    else score += 10

    // Présence d'un garant (20 points max)
    if (application.has_guarantor) {
      score += 20
      // Bonus si le garant a des revenus suffisants
      if (application.guarantor_income && property.price && application.guarantor_income >= property.price * 3) {
        score += 5
      }
    }

    // Présentation personnalisée (15 points max)
    if (application.presentation && application.presentation.length > 50) {
      score += 15
    } else if (application.message && application.message.length > 20) {
      score += 10
    }

    // Bonus pour les informations complètes (5 points max)
    if (application.profession && application.company) {
      score += 5
    }

    return Math.min(score, maxScore)
  },
}

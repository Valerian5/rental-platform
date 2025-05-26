import { supabase } from "./supabase"

export interface ApplicationData {
  property_id: string
  tenant_id: string
  owner_id: string
  message?: string
  income: number
  profession: string
  company?: string
  contract_type: string
  has_guarantor: boolean
  guarantor_name?: string
  guarantor_relationship?: string
  guarantor_profession?: string
  guarantor_income?: number
  move_in_date: string
  duration_preference?: string
  presentation?: string
}

export interface ApplicationDocument {
  document_type: string
  file_name: string
  file_url: string
  file_size?: number
  mime_type?: string
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
          property:properties(
            id, title, address, city, price, surface, rooms, bedrooms,
            property_images(id, url, is_primary)
          ),
          owner:users!applications_owner_id_fkey(
            id, first_name, last_name, email, phone
          )
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

  // Récupérer les candidatures d'un propriétaire
  async getOwnerApplications(ownerId: string) {
    console.log("📋 ApplicationService.getOwnerApplications", ownerId)

    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          property:properties(
            id, title, address, city, price, surface, rooms, bedrooms,
            property_images(id, url, is_primary)
          ),
          tenant:users!applications_tenant_id_fkey(
            id, first_name, last_name, email, phone
          ),
          documents(id, document_type, status, created_at)
        `)
        .eq("owner_id", ownerId)
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
          property:properties(
            id, title, address, city, price, surface, rooms, bedrooms,
            property_images(id, url, is_primary)
          ),
          tenant:users!applications_tenant_id_fkey(
            id, first_name, last_name, email, phone
          ),
          owner:users!applications_owner_id_fkey(
            id, first_name, last_name, email, phone
          ),
          documents(id, document_type, file_name, file_url, status, created_at),
          visits(id, visit_date, start_time, end_time, status, notes)
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

  // Ajouter un document à une candidature
  async addDocument(applicationId: string, userId: string, document: ApplicationDocument) {
    console.log("📎 ApplicationService.addDocument", applicationId, document)

    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          application_id: applicationId,
          user_id: userId,
          ...document,
          status: "pending",
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur ajout document:", error)
        throw new Error(error.message)
      }

      console.log("✅ Document ajouté:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans addDocument:", error)
      throw error
    }
  },

  // Calculer le score de compatibilité
  calculateMatchScore(application: any, property: any): number {
    let score = 0
    const maxScore = 100

    // Ratio revenus/loyer (40 points max)
    const rentRatio = application.income / property.price
    if (rentRatio >= 3) score += 40
    else if (rentRatio >= 2.5) score += 30
    else if (rentRatio >= 2) score += 20
    else score += 10

    // Stabilité professionnelle (20 points max)
    if (application.contract_type === "CDI") score += 20
    else if (application.contract_type === "CDD") score += 15
    else score += 10

    // Présence d'un garant (20 points max)
    if (application.has_guarantor) {
      score += 20
      // Bonus si le garant a des revenus suffisants
      if (application.guarantor_income && application.guarantor_income >= property.price * 3) {
        score += 5
      }
    }

    // Documents fournis (15 points max)
    // Cette partie sera calculée en fonction des documents réellement fournis
    score += 10 // Score de base pour les documents

    // Présentation personnalisée (5 points max)
    if (application.presentation && application.presentation.length > 50) {
      score += 5
    }

    return Math.min(score, maxScore)
  },
}

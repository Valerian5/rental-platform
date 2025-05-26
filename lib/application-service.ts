import { supabase, isSupabaseConfigured } from "./supabase"

export const applicationService = {
  async createApplication(applicationData: any) {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured, returning mock data")
      return { id: "mock-id", ...applicationData, created_at: new Date().toISOString() }
    }

    try {
      const { data, error } = await supabase.from("applications").insert(applicationData).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating application:", error)
      throw error
    }
  },

  async getApplicationById(id: string) {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured, returning mock data")
      return { id, status: "pending", created_at: new Date().toISOString() }
    }

    try {
      const { data, error } = await supabase.from("applications").select("*").eq("id", id).single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching application:", error)
      throw error
    }
  },

  async getTenantApplications(tenantId: string) {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured, returning mock data")
      return []
    }

    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching tenant applications:", error)
      throw error
    }
  },

  async getOwnerApplications(ownerId: string) {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured, returning mock data")
      return []
    }

    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          properties (
            title,
            address
          )
        `)
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching owner applications:", error)
      throw error
    }
  },

  async updateApplicationStatus(id: string, status: string, notes?: string) {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured, returning mock data")
      return { id, status, notes, updated_at: new Date().toISOString() }
    }

    try {
      const updateData: any = { status, updated_at: new Date().toISOString() }
      if (notes) updateData.notes = notes

      const { data, error } = await supabase.from("applications").update(updateData).eq("id", id).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error updating application:", error)
      throw error
    }
  },

  calculateMatchScore(application: any, property: any): number {
    let score = 0

    // Score basé sur le budget (30%)
    if (application.budget >= property.rent) {
      score += 30
    } else if (application.budget >= property.rent * 0.9) {
      score += 20
    } else if (application.budget >= property.rent * 0.8) {
      score += 10
    }

    // Score basé sur le type de logement (20%)
    if (application.preferred_property_type === property.type) {
      score += 20
    }

    // Score basé sur la localisation (20%)
    if (
      application.preferred_location &&
      property.address.toLowerCase().includes(application.preferred_location.toLowerCase())
    ) {
      score += 20
    }

    // Score basé sur la date de disponibilité (15%)
    const applicationDate = new Date(application.move_in_date)
    const propertyDate = new Date(property.available_from)
    const daysDiff = Math.abs((applicationDate.getTime() - propertyDate.getTime()) / (1000 * 3600 * 24))

    if (daysDiff <= 7) {
      score += 15
    } else if (daysDiff <= 30) {
      score += 10
    } else if (daysDiff <= 60) {
      score += 5
    }

    // Score basé sur le profil (15%)
    if (application.employment_status === "employed") {
      score += 10
    }
    if (application.income >= property.rent * 3) {
      score += 5
    }

    return Math.min(score, 100)
  },
}

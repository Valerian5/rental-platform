import { supabase } from "./supabase"

export interface Visit {
  id: string
  property_id: string
  tenant_id?: string
  application_id?: string
  visitor_name: string
  tenant_email: string
  visitor_phone: string
  visit_date: string // timestamp with time zone
  start_time?: string // time without time zone
  end_time?: string // time without time zone
  status: "scheduled" | "completed" | "cancelled" | "no_show" | "proposed" | "confirmed"
  notes?: string
  created_at: string
  updated_at?: string
  property?: {
    id: string
    title: string
    address: string
    property_type: string
    owner_id: string
    owner?: {
      first_name: string
      last_name: string
      email: string
      phone?: string
    }
  }
}

export const visitService = {
  // ========== MÉTHODES PROPRIÉTAIRES ==========

  async getOwnerVisits(ownerId: string): Promise<Visit[]> {
    console.log("📅 VisitService.getOwnerVisits", ownerId)

    try {
      // Récupérer les visites via les propriétés du propriétaire
      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          property:properties!inner (
            id,
            title,
            address,
            property_type,
            owner_id
          )
        `)
        .eq("property.owner_id", ownerId)
        .order("visit_date", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération visites propriétaire:", error)
        throw new Error(error.message)
      }

      console.log(`✅ ${data.length} visites récupérées pour le propriétaire`)
      return data as Visit[]
    } catch (error) {
      console.error("❌ Erreur dans getOwnerVisits:", error)
      throw error
    }
  },

  async createVisit(visitData: Partial<Visit>): Promise<Visit> {
    console.log("📅 VisitService.createVisit")

    try {
      const { data, error } = await supabase.from("visits").insert(visitData).select().single()

      if (error) {
        console.error("❌ Erreur création visite:", error)
        throw new Error(error.message)
      }

      console.log("✅ Visite créée:", data)

      // Créer une notification pour le locataire si tenant_id est fourni
      if (visitData.tenant_id) {
        try {
          const { data: property } = await supabase
            .from("properties")
            .select("title")
            .eq("id", visitData.property_id)
            .single()

          if (property) {
            // Ici on pourrait ajouter la création de notification
            console.log("✅ Notification à créer pour le locataire:", visitData.tenant_id)
          }
        } catch (notifError) {
          console.error("❌ Erreur création notification:", notifError)
          // On ne bloque pas le processus si la notification échoue
        }
      }

      return data as Visit
    } catch (error) {
      console.error("❌ Erreur dans createVisit:", error)
      throw error
    }
  },

  async updateVisitStatus(visitId: string, status: Visit["status"]): Promise<Visit> {
    console.log("📅 VisitService.updateVisitStatus", { visitId, status })

    try {
      const { data, error } = await supabase
        .from("visits")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", visitId)
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur mise à jour statut visite:", error)
        throw new Error(error.message)
      }

      console.log("✅ Statut visite mis à jour:", data)
      return data as Visit
    } catch (error) {
      console.error("❌ Erreur dans updateVisitStatus:", error)
      throw error
    }
  },

  async deleteVisit(visitId: string): Promise<void> {
    console.log("📅 VisitService.deleteVisit", visitId)

    try {
      const { error } = await supabase.from("visits").delete().eq("id", visitId)

      if (error) {
        console.error("❌ Erreur suppression visite:", error)
        throw new Error(error.message)
      }

      console.log("✅ Visite supprimée")
    } catch (error) {
      console.error("❌ Erreur dans deleteVisit:", error)
      throw error
    }
  },

  // ========== MÉTHODES LOCATAIRES ==========

  async getTenantVisits(tenantId: string): Promise<Visit[]> {
    console.log("📅 VisitService.getTenantVisits", tenantId)

    try {
      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          property:properties (
            id,
            title,
            address,
            property_type,
            owner_id,
            owner:users!properties_owner_id_fkey (
              first_name,
              last_name,
              email,
              phone
            )
          )
        `)
        .eq("tenant_id", tenantId)
        .order("visit_date", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération visites locataire:", error)
        throw new Error(error.message)
      }

      console.log(`✅ ${data.length} visites récupérées pour le locataire`)
      return data as Visit[]
    } catch (error) {
      console.error("❌ Erreur dans getTenantVisits:", error)
      throw error
    }
  },

  // ========== MÉTHODES COMMUNES ==========

  async getVisitById(visitId: string): Promise<Visit | null> {
    console.log("📅 VisitService.getVisitById", visitId)

    try {
      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          property:properties (
            id,
            title,
            address,
            property_type,
            owner_id,
            owner:users!properties_owner_id_fkey (
              first_name,
              last_name,
              email,
              phone
            )
          )
        `)
        .eq("id", visitId)
        .single()

      if (error) {
        console.error("❌ Erreur récupération visite par ID:", error)
        throw new Error(error.message)
      }

      console.log("✅ Visite récupérée:", data)
      return data as Visit
    } catch (error) {
      console.error("❌ Erreur dans getVisitById:", error)
      throw error
    }
  },

  async updateVisit(visitId: string, updates: Partial<Visit>): Promise<Visit> {
    console.log("📅 VisitService.updateVisit", { visitId, updates })

    try {
      const { data, error } = await supabase
        .from("visits")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", visitId)
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur mise à jour visite:", error)
        throw new Error(error.message)
      }

      console.log("✅ Visite mise à jour:", data)
      return data as Visit
    } catch (error) {
      console.error("❌ Erreur dans updateVisit:", error)
      throw error
    }
  },

  // ========== MÉTHODES UTILITAIRES ==========

  async getVisitsByProperty(propertyId: string): Promise<Visit[]> {
    console.log("📅 VisitService.getVisitsByProperty", propertyId)

    try {
      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          property:properties (
            id,
            title,
            address,
            property_type
          )
        `)
        .eq("property_id", propertyId)
        .order("visit_date", { ascending: true })

      if (error) {
        console.error("❌ Erreur récupération visites par propriété:", error)
        throw new Error(error.message)
      }

      console.log(`✅ ${data.length} visites récupérées pour la propriété`)
      return data as Visit[]
    } catch (error) {
      console.error("❌ Erreur dans getVisitsByProperty:", error)
      throw error
    }
  },

  async getUpcomingVisits(userId: string, userType: "owner" | "tenant"): Promise<Visit[]> {
    console.log("📅 VisitService.getUpcomingVisits", { userId, userType })

    try {
      const today = new Date().toISOString()

      let query = supabase
        .from("visits")
        .select(`
          *,
          property:properties (
            id,
            title,
            address,
            property_type,
            owner_id
          )
        `)
        .gte("visit_date", today)
        .in("status", ["scheduled", "confirmed", "proposed"])
        .order("visit_date", { ascending: true })

      if (userType === "owner") {
        query = query.eq("property.owner_id", userId)
      } else {
        query = query.eq("tenant_id", userId)
      }

      const { data, error } = await query

      if (error) {
        console.error("❌ Erreur récupération visites à venir:", error)
        throw new Error(error.message)
      }

      console.log(`✅ ${data.length} visites à venir récupérées`)
      return data as Visit[]
    } catch (error) {
      console.error("❌ Erreur dans getUpcomingVisits:", error)
      throw error
    }
  },

  // ========== MÉTHODES DE STATISTIQUES ==========

  async getVisitStats(
    userId: string,
    userType: "owner" | "tenant",
  ): Promise<{
    total: number
    scheduled: number
    completed: number
    cancelled: number
    proposed: number
  }> {
    console.log("📅 VisitService.getVisitStats", { userId, userType })

    try {
      let query = supabase.from("visits").select("status")

      if (userType === "owner") {
        // Pour les propriétaires, on joint avec les propriétés
        query = query.select("status, property:properties!inner(owner_id)").eq("property.owner_id", userId)
      } else {
        // Pour les locataires, on filtre directement
        query = query.eq("tenant_id", userId)
      }

      const { data, error } = await query

      if (error) {
        console.error("❌ Erreur récupération stats visites:", error)
        throw new Error(error.message)
      }

      const stats = {
        total: data.length,
        scheduled: data.filter((v) => v.status === "scheduled").length,
        completed: data.filter((v) => v.status === "completed").length,
        cancelled: data.filter((v) => v.status === "cancelled").length,
        proposed: data.filter((v) => v.status === "proposed").length,
      }

      console.log("✅ Stats visites:", stats)
      return stats
    } catch (error) {
      console.error("❌ Erreur dans getVisitStats:", error)
      throw error
    }
  },
}

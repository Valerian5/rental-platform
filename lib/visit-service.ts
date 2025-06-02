import { supabase } from "./supabase"

export interface Visit {
  id: string
  property_id: string
  visitor_name: string
  visitor_email: string
  visitor_phone: string
  visit_date: string
  visit_time: string
  status: "scheduled" | "completed" | "cancelled" | "no_show"
  notes?: string
  created_at: string
  property?: {
    id: string
    title: string
    address: string
    type: string
    owner_id: string
  }
}

export const visitService = {
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
            owner_id
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

  async createVisit(visitData: Partial<Visit>): Promise<Visit> {
    console.log("📅 VisitService.createVisit")

    try {
      const { data, error } = await supabase.from("visits").insert(visitData).select().single()

      if (error) {
        console.error("❌ Erreur création visite:", error)
        throw new Error(error.message)
      }

      console.log("✅ Visite créée:", data)
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
}

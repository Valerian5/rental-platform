import { supabase } from "./supabase"

export interface VisitData {
  application_id: string
  property_id: string
  tenant_id: string
  owner_id: string
  visit_date: string
  start_time: string
  end_time: string
  notes?: string
}

export const visitService = {
  // Créer une nouvelle visite
  async createVisit(visitData: VisitData) {
    console.log("📅 VisitService.createVisit", visitData)

    try {
      const { data, error } = await supabase
        .from("visits")
        .insert({
          ...visitData,
          status: "scheduled",
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création visite:", error)
        throw new Error(error.message)
      }

      console.log("✅ Visite créée:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans createVisit:", error)
      throw error
    }
  },

  // Récupérer les visites d'un locataire
  async getTenantVisits(tenantId: string) {
    console.log("📋 VisitService.getTenantVisits", tenantId)

    try {
      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          property:properties(
            id, title, address, city, price
          ),
          owner:users!visits_owner_id_fkey(
            id, first_name, last_name, phone
          )
        `)
        .eq("tenant_id", tenantId)
        .order("visit_date", { ascending: true })

      if (error) {
        console.error("❌ Erreur récupération visites:", error)
        throw new Error(error.message)
      }

      console.log("✅ Visites récupérées:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("❌ Erreur dans getTenantVisits:", error)
      throw error
    }
  },

  // Récupérer les visites d'un propriétaire
  async getOwnerVisits(ownerId: string) {
    console.log("📋 VisitService.getOwnerVisits", ownerId)

    try {
      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          property:properties(
            id, title, address, city
          ),
          tenant:users!visits_tenant_id_fkey(
            id, first_name, last_name, phone
          )
        `)
        .eq("owner_id", ownerId)
        .order("visit_date", { ascending: true })

      if (error) {
        console.error("❌ Erreur récupération visites propriétaire:", error)
        throw new Error(error.message)
      }

      console.log("✅ Visites propriétaire récupérées:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("❌ Erreur dans getOwnerVisits:", error)
      throw error
    }
  },

  // Mettre à jour le statut d'une visite
  async updateVisitStatus(visitId: string, status: string, notes?: string) {
    console.log("🔄 VisitService.updateVisitStatus", visitId, status)

    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (notes) {
        updateData.notes = notes
      }

      const { data, error } = await supabase.from("visits").update(updateData).eq("id", visitId).select().single()

      if (error) {
        console.error("❌ Erreur mise à jour visite:", error)
        throw new Error(error.message)
      }

      console.log("✅ Visite mise à jour:", data)
      return data
    } catch (error) {
      console.error("❌ Erreur dans updateVisitStatus:", error)
      throw error
    }
  },

  // Proposer des créneaux de visite
  async proposeVisitSlots(applicationId: string, slots: Array<{ date: string; start_time: string; end_time: string }>) {
    console.log("📅 VisitService.proposeVisitSlots", applicationId, slots)

    try {
      // Récupérer les infos de la candidature
      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("property_id, tenant_id, owner_id")
        .eq("id", applicationId)
        .single()

      if (appError || !application) {
        throw new Error("Candidature non trouvée")
      }

      // Créer les visites proposées
      const visitsToCreate = slots.map((slot) => ({
        application_id: applicationId,
        property_id: application.property_id,
        tenant_id: application.tenant_id,
        owner_id: application.owner_id,
        visit_date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: "scheduled",
      }))

      const { data, error } = await supabase.from("visits").insert(visitsToCreate).select()

      if (error) {
        console.error("❌ Erreur proposition créneaux:", error)
        throw new Error(error.message)
      }

      // Mettre à jour le statut de la candidature
      await supabase.from("applications").update({ status: "visit_scheduled" }).eq("id", applicationId)

      console.log("✅ Créneaux proposés:", data?.length || 0)
      return data
    } catch (error) {
      console.error("❌ Erreur dans proposeVisitSlots:", error)
      throw error
    }
  },
}

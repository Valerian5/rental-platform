/**
 * Service travaux côté client qui respecte RLS
 * Utilise l'authentification utilisateur pour les requêtes frontend
 */

import { supabase } from "./supabase"

export interface MaintenanceWork {
  id: string
  property_id: string
  title: string
  description: string
  status: string
  priority: string
  start_date: string
  end_date: string | null
  estimated_cost: number | null
  actual_cost: number | null
  created_at: string
  updated_at: string
  property: {
    id: string
    title: string
    address: string
  }
}

export class MaintenanceServiceClient {
  /**
   * Récupère tous les travaux d'une propriété (côté client)
   */
  static async getPropertyMaintenanceWorks(propertyId: string): Promise<MaintenanceWork[]> {
    console.log("🔧 MaintenanceServiceClient.getPropertyMaintenanceWorks", { propertyId })

    try {
      const { data: works, error } = await supabase
        .from("maintenance_works")
        .select(`
          id,
          property_id,
          title,
          description,
          status,
          priority,
          start_date,
          end_date,
          estimated_cost,
          actual_cost,
          created_at,
          updated_at,
          property:properties(
            id,
            title,
            address
          )
        `)
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération travaux:", error)
        throw new Error(`Erreur base de données: ${error.message}`)
      }

      console.log(`✅ ${works?.length || 0} travaux récupérés pour la propriété ${propertyId}`)
      return (works || []) as MaintenanceWork[]
    } catch (error) {
      console.error("❌ Erreur dans getPropertyMaintenanceWorks:", error)
      throw error
    }
  }

  /**
   * Récupère tous les travaux d'un locataire (côté client)
   */
  static async getTenantMaintenanceWorks(tenantId: string): Promise<MaintenanceWork[]> {
    console.log("🔧 MaintenanceServiceClient.getTenantMaintenanceWorks", { tenantId })

    try {
      const { data: works, error } = await supabase
        .from("maintenance_works")
        .select(`
          id,
          property_id,
          title,
          description,
          status,
          priority,
          start_date,
          end_date,
          estimated_cost,
          actual_cost,
          created_at,
          updated_at,
          property:properties(
            id,
            title,
            address,
            lease:leases!leases_property_id_fkey(
              tenant_id
            )
          )
        `)
        .eq("property.lease.tenant_id", tenantId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération travaux locataire:", error)
        throw new Error(`Erreur base de données: ${error.message}`)
      }

      console.log(`✅ ${works?.length || 0} travaux récupérés pour le locataire ${tenantId}`)
      return (works || []) as MaintenanceWork[]
    } catch (error) {
      console.error("❌ Erreur dans getTenantMaintenanceWorks:", error)
      throw error
    }
  }
}

/**
 * Service baux côté client qui respecte RLS
 * Utilise l'authentification utilisateur pour les requêtes frontend
 */

import { supabase } from "./supabase"

export interface Lease {
  id: string
  property: {
    id: string
    title: string
    address: string
    city: string
  }
  owner: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  tenant: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  start_date: string
  end_date: string
  monthly_rent: number
  charges: number
  deposit: number
  status: string
  generated_document: string
  document_generated_at: string
  sent_to_tenant_at: string
  signed_by_tenant: boolean
  signed_by_owner: boolean
  tenant_signature_date: string
  owner_signature_date: string
  created_at: string
  updated_at: string
}

export class LeaseServiceClient {
  /**
   * Récupère tous les baux d'un locataire (côté client)
   */
  static async getTenantLeases(tenantId: string): Promise<Lease[]> {
    console.log("🏠 LeaseServiceClient.getTenantLeases", { tenantId })

    try {
      const { data: leases, error } = await supabase
        .from("leases")
        .select(`
          id,
          start_date,
          end_date,
          monthly_rent,
          charges,
          deposit,
          status,
          generated_document,
          document_generated_at,
          sent_to_tenant_at,
          signed_by_tenant,
          signed_by_owner,
          tenant_signature_date,
          owner_signature_date,
          created_at,
          updated_at,
          property:properties(
            id,
            title,
            address,
            city
          ),
          owner:users!leases_owner_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          tenant:users!leases_tenant_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération baux:", error)
        throw new Error(`Erreur base de données: ${error.message}`)
      }

      console.log(`✅ ${leases?.length || 0} baux récupérés pour le locataire ${tenantId}`)
      return (leases || []) as Lease[]
    } catch (error) {
      console.error("❌ Erreur dans getTenantLeases:", error)
      throw error
    }
  }

  /**
   * Récupère le bail actif d'un locataire (côté client)
   */
  static async getActiveTenantLease(tenantId: string): Promise<Lease | null> {
    console.log("🏠 LeaseServiceClient.getActiveTenantLease", { tenantId })

    try {
      const { data: lease, error } = await supabase
        .from("leases")
        .select(`
          id,
          start_date,
          end_date,
          monthly_rent,
          charges,
          deposit,
          status,
          generated_document,
          document_generated_at,
          sent_to_tenant_at,
          signed_by_tenant,
          signed_by_owner,
          tenant_signature_date,
          owner_signature_date,
          created_at,
          updated_at,
          property:properties(
            id,
            title,
            address,
            city
          ),
          owner:users!leases_owner_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          tenant:users!leases_tenant_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("tenant_id", tenantId)
        .in("status", ["active", "signed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error("❌ Erreur récupération bail actif:", error)
        throw new Error(`Erreur base de données: ${error.message}`)
      }

      console.log(`✅ Bail actif récupéré pour le locataire ${tenantId}:`, lease ? "Oui" : "Non")
      return lease as Lease | null
    } catch (error) {
      console.error("❌ Erreur dans getActiveTenantLease:", error)
      throw error
    }
  }

  /**
   * Récupère tous les baux d'un propriétaire (côté client)
   */
  static async getOwnerLeases(ownerId: string): Promise<Lease[]> {
    console.log("🏠 LeaseServiceClient.getOwnerLeases", { ownerId })

    try {
      const { data: leases, error } = await supabase
        .from("leases")
        .select(`
          id,
          start_date,
          end_date,
          monthly_rent,
          charges,
          deposit,
          status,
          generated_document,
          document_generated_at,
          sent_to_tenant_at,
          signed_by_tenant,
          signed_by_owner,
          tenant_signature_date,
          owner_signature_date,
          created_at,
          updated_at,
          property:properties(
            id,
            title,
            address,
            city
          ),
          owner:users!leases_owner_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          tenant:users!leases_tenant_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération baux propriétaire:", error)
        throw new Error(`Erreur base de données: ${error.message}`)
      }

      console.log(`✅ ${leases?.length || 0} baux récupérés pour le propriétaire ${ownerId}`)
      return (leases || []) as Lease[]
    } catch (error) {
      console.error("❌ Erreur dans getOwnerLeases:", error)
      throw error
    }
  }
}


/**
 * Service quittances côté client qui respecte RLS
 * Utilise l'authentification utilisateur pour les requêtes frontend
 */

import { supabase } from "./supabase"

export interface RentReceipt {
  id: string
  lease_id: string
  month: number
  year: number
  rent_amount: number
  charges_amount: number
  total_amount: number
  status: string
  payment_date: string | null
  receipt_url: string | null
  created_at: string
  updated_at: string
}

export class ReceiptServiceClient {
  /**
   * Récupère toutes les quittances d'un bail (côté client)
   */
  static async getLeaseReceipts(leaseId: string): Promise<RentReceipt[]> {
    console.log("🧾 ReceiptServiceClient.getLeaseReceipts", { leaseId })

    try {
      const { data: receipts, error } = await supabase
        .from("receipts")
        .select(`
          id,
          lease_id,
          month,
          year,
          rent_amount,
          charges_amount,
          total_amount,
          status,
          payment_date,
          receipt_url,
          created_at,
          updated_at
        `)
        .eq("lease_id", leaseId)
        .order("year", { ascending: false })
        .order("month", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération quittances:", error)
        throw new Error(`Erreur base de données: ${error.message}`)
      }

      console.log(`✅ ${receipts?.length || 0} quittances récupérées pour le bail ${leaseId}`)
      return (receipts || []) as RentReceipt[]
    } catch (error) {
      console.error("❌ Erreur dans getLeaseReceipts:", error)
      throw error
    }
  }

  /**
   * Récupère toutes les quittances d'un locataire (côté client)
   */
  static async getTenantReceipts(tenantId: string): Promise<RentReceipt[]> {
    console.log("🧾 ReceiptServiceClient.getTenantReceipts", { tenantId })

    try {
      const { data: receipts, error } = await supabase
        .from("receipts")
        .select(`
          id,
          lease_id,
          month,
          year,
          rent_amount,
          charges_amount,
          total_amount,
          status,
          payment_date,
          receipt_url,
          created_at,
          updated_at,
          lease:leases!receipts_lease_id_fkey(
            tenant_id
          )
        `)
        .eq("lease.tenant_id", tenantId)
        .order("year", { ascending: false })
        .order("month", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération quittances locataire:", error)
        throw new Error(`Erreur base de données: ${error.message}`)
      }

      console.log(`✅ ${receipts?.length || 0} quittances récupérées pour le locataire ${tenantId}`)
      return (receipts || []) as RentReceipt[]
    } catch (error) {
      console.error("❌ Erreur dans getTenantReceipts:", error)
      throw error
    }
  }
}

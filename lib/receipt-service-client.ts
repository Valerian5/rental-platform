/**
 * Service quittances côté client qui respecte RLS
 * Utilise l'authentification utilisateur pour les requêtes frontend
 */

import { supabase } from "./supabase"

export interface RentReceipt {
  id: string
  lease_id: string
  payment_id: string
  reference: string
  month: string // Format: "2025-03"
  year: number
  rent_amount: number
  charges_amount: number
  total_amount: number
  pdf_path: string | null
  pdf_filename: string | null
  pdf_url: string | null
  generated_at: string
  sent_to_tenant: boolean
  sent_at: string | null
  created_at: string
  updated_at: string
  status?: string // Calculé à partir du paiement
  payment_date?: string | null // Calculé à partir du paiement
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
          payment_id,
          reference,
          month,
          year,
          rent_amount,
          charges_amount,
          total_amount,
          pdf_path,
          pdf_filename,
          generated_at,
          sent_to_tenant,
          sent_at,
          created_at,
          updated_at,
          payment:payments(
            status,
            payment_date
          )
        `)
        .eq("lease_id", leaseId)
        .order("year", { ascending: false })
        .order("month", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération quittances:", error)
        throw new Error(`Erreur base de données: ${error.message}`)
      }

      console.log(`✅ ${receipts?.length || 0} quittances récupérées pour le bail ${leaseId}`)
      
      // Transformer les données pour inclure le statut et la date de paiement
      const transformedReceipts = (receipts || []).map(receipt => ({
        ...receipt,
        status: receipt.payment?.status || 'pending',
        payment_date: receipt.payment?.payment_date || null,
        pdf_url: receipt.pdf_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${receipt.pdf_path}` : null
      }))
      
      return transformedReceipts as RentReceipt[]
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
          payment_id,
          reference,
          month,
          year,
          rent_amount,
          charges_amount,
          total_amount,
          pdf_path,
          pdf_filename,
          generated_at,
          sent_to_tenant,
          sent_at,
          created_at,
          updated_at,
          payment:payments(
            status,
            payment_date
          ),
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
      
      // Transformer les données pour inclure le statut et la date de paiement
      const transformedReceipts = (receipts || []).map(receipt => ({
        ...receipt,
        status: receipt.payment?.status || 'pending',
        payment_date: receipt.payment?.payment_date || null,
        pdf_url: receipt.pdf_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${receipt.pdf_path}` : null
      }))
      
      return transformedReceipts as RentReceipt[]
    } catch (error) {
      console.error("❌ Erreur dans getTenantReceipts:", error)
      throw error
    }
  }
}

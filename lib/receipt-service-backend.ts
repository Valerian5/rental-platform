/**
 * Service backend pour la gestion des quittances
 * Utilise service_role pour les opérations CRUD
 * Validation côté serveur
 */

import { createServerClient } from "./supabase"

export interface ReceiptData {
  id?: string
  payment_id: string
  lease_id: string
  reference: string
  month: string
  year: number
  rent_amount: number
  charges_amount: number
  total_amount: number
  pdf_path?: string
  pdf_filename?: string
  sent_to_tenant?: boolean
  sent_at?: string
}

export class ReceiptServiceBackend {
  private static supabase = createServerClient()

  /**
   * Créer une quittance
   */
  static async createReceipt(receiptData: Omit<ReceiptData, 'id'>): Promise<ReceiptData> {
    try {
      // Validation côté serveur
      if (!receiptData.payment_id || !receiptData.lease_id) {
        throw new Error("payment_id et lease_id sont requis")
      }

      if (receiptData.rent_amount < 0 || receiptData.charges_amount < 0) {
        throw new Error("Les montants ne peuvent pas être négatifs")
      }

      // Vérifier que le paiement existe et appartient au propriétaire
      const { data: payment, error: paymentError } = await this.supabase
        .from("payments")
        .select(`
          id,
          lease_id,
          lease:leases!payments_lease_id_fkey(
            owner_id
          )
        `)
        .eq("id", receiptData.payment_id)
        .single()

      if (paymentError || !payment) {
        throw new Error("Paiement non trouvé")
      }

      // Créer la quittance
      const { data: newReceipt, error: createError } = await this.supabase
        .from("receipts")
        .insert({
          payment_id: receiptData.payment_id,
          lease_id: receiptData.lease_id,
          reference: receiptData.reference,
          month: receiptData.month,
          year: receiptData.year,
          rent_amount: receiptData.rent_amount,
          charges_amount: receiptData.charges_amount,
          total_amount: receiptData.total_amount,
          pdf_path: receiptData.pdf_path,
          pdf_filename: receiptData.pdf_filename,
          sent_to_tenant: receiptData.sent_to_tenant || false,
          sent_at: receiptData.sent_at
        })
        .select()
        .single()

      if (createError) {
        throw new Error(`Erreur création quittance: ${createError.message}`)
      }

      return newReceipt
    } catch (error) {
      console.error("Erreur création quittance:", error)
      throw error
    }
  }

  /**
   * Mettre à jour une quittance
   */
  static async updateReceipt(receiptId: string, updates: Partial<ReceiptData>): Promise<ReceiptData> {
    try {
      // Validation côté serveur
      if (updates.rent_amount !== undefined && updates.rent_amount < 0) {
        throw new Error("Le montant du loyer ne peut pas être négatif")
      }

      if (updates.charges_amount !== undefined && updates.charges_amount < 0) {
        throw new Error("Le montant des charges ne peut pas être négatif")
      }

      // Vérifier que la quittance existe
      const { data: existingReceipt, error: fetchError } = await this.supabase
        .from("receipts")
        .select("id")
        .eq("id", receiptId)
        .single()

      if (fetchError || !existingReceipt) {
        throw new Error("Quittance non trouvée")
      }

      // Mettre à jour
      const { data: updatedReceipt, error: updateError } = await this.supabase
        .from("receipts")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", receiptId)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Erreur mise à jour quittance: ${updateError.message}`)
      }

      return updatedReceipt
    } catch (error) {
      console.error("Erreur mise à jour quittance:", error)
      throw error
    }
  }

  /**
   * Supprimer une quittance
   */
  static async deleteReceipt(receiptId: string): Promise<boolean> {
    try {
      // Vérifier que la quittance existe
      const { data: existingReceipt, error: fetchError } = await this.supabase
        .from("receipts")
        .select("id")
        .eq("id", receiptId)
        .single()

      if (fetchError || !existingReceipt) {
        throw new Error("Quittance non trouvée")
      }

      // Supprimer
      const { error: deleteError } = await this.supabase
        .from("receipts")
        .delete()
        .eq("id", receiptId)

      if (deleteError) {
        throw new Error(`Erreur suppression quittance: ${deleteError.message}`)
      }

      return true
    } catch (error) {
      console.error("Erreur suppression quittance:", error)
      throw error
    }
  }

  /**
   * Récupérer une quittance par ID (pour validation)
   */
  static async getReceiptById(receiptId: string): Promise<ReceiptData | null> {
    try {
      const { data: receipt, error } = await this.supabase
        .from("receipts")
        .select("*")
        .eq("id", receiptId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Quittance non trouvée
        }
        throw new Error(`Erreur récupération quittance: ${error.message}`)
      }

      return receipt
    } catch (error) {
      console.error("Erreur récupération quittance:", error)
      throw error
    }
  }
}

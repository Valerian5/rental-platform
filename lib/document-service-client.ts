/**
 * Service documents côté client qui respecte RLS
 * Utilise l'authentification utilisateur pour les requêtes frontend
 */

import { supabase } from "./supabase"

export interface Document {
  id: string
  type: string
  title: string
  url: string
  created_at: string
  metadata?: any
}

export class DocumentServiceClient {
  /**
   * Récupère tous les documents d'un locataire (côté client)
   */
  static async getTenantDocuments(tenantId: string): Promise<Document[]> {
    console.log("📄 DocumentServiceClient.getTenantDocuments", { tenantId })

    try {
      const documents: Document[] = []

      // Récupérer les notifications de type charge_regularization
      const { data: chargeNotifications, error: chargeError } = await supabase
        .from("notifications")
        .select(`
          id,
          type,
          title,
          content,
          action_url,
          created_at
        `)
        .eq("user_id", tenantId)
        .eq("type", "charge_regularization")
        .order("created_at", { ascending: false })

      if (chargeError) {
        console.error("❌ Erreur récupération notifications charges:", chargeError)
      } else {
        chargeNotifications?.forEach(notification => {
          if (notification.action_url) {
            try {
              const url = new URL(notification.action_url)
              const dataParam = url.searchParams.get('data')
              if (dataParam) {
                const metadata = JSON.parse(decodeURIComponent(dataParam))
                documents.push({
                  id: notification.id,
                  type: 'charge_regularization',
                  title: notification.title,
                  url: notification.action_url.split('?')[0], // URL sans les paramètres
                  created_at: notification.created_at,
                  metadata: {
                    year: metadata.year,
                    balance: metadata.balance,
                    balance_type: metadata.balance_type
                  }
                })
              }
            } catch (e) {
              console.error("❌ Erreur parsing action_url:", e)
            }
          }
        })
      }

      // Récupérer les notifications de type rent_revision
      const { data: rentNotifications, error: rentError } = await supabase
        .from("notifications")
        .select(`
          id,
          type,
          title,
          content,
          action_url,
          created_at
        `)
        .eq("user_id", tenantId)
        .eq("type", "rent_revision")
        .order("created_at", { ascending: false })

      if (rentError) {
        console.error("❌ Erreur récupération notifications loyer:", rentError)
      } else {
        rentNotifications?.forEach(notification => {
          if (notification.action_url) {
            try {
              const url = new URL(notification.action_url)
              const dataParam = url.searchParams.get('data')
              if (dataParam) {
                const metadata = JSON.parse(decodeURIComponent(dataParam))
                documents.push({
                  id: notification.id,
                  type: 'rent_revision',
                  title: notification.title,
                  url: notification.action_url.split('?')[0], // URL sans les paramètres
                  created_at: notification.created_at,
                  metadata: {
                    year: metadata.year,
                    new_rent: metadata.new_rent,
                    increase_percentage: metadata.increase_percentage
                  }
                })
              }
            } catch (e) {
              console.error("❌ Erreur parsing action_url:", e)
            }
          }
        })
      }

      console.log(`✅ ${documents.length} documents récupérés pour le locataire ${tenantId}`)
      return documents
    } catch (error) {
      console.error("❌ Erreur dans getTenantDocuments:", error)
      throw error
    }
  }
}

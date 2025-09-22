// Service de gestion des paiements
import { 
  Payment, 
  Receipt, 
  Reminder, 
  LeasePaymentConfig, 
  PaymentStats, 
  PaymentHistory,
  PaymentValidationInput,
  PaymentValidationOutput,
  ReminderInput,
  ReminderOutput,
  PaymentStatus
} from './payment-models'
import { supabase } from './supabase'

class PaymentService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'

  // Récupérer tous les paiements d'un propriétaire
  async getOwnerPayments(ownerId: string): Promise<Payment[]> {
    try {
      // Vérifier que ownerId est une chaîne UUID valide
      if (!ownerId || typeof ownerId !== 'string') {
        console.error('ownerId invalide:', ownerId)
        throw new Error('ID propriétaire invalide')
      }

      // Utiliser directement Supabase côté client
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          *,
          leases!inner(
            id,
            owner_id,
            property:properties(
              id,
              title,
              address
            ),
            tenant:users!leases_tenant_id_fkey(
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('leases.owner_id', ownerId)
        .order('due_date', { ascending: false })

      if (error) {
        console.error('Erreur récupération paiements:', error)
        throw new Error('Erreur lors de la récupération des paiements')
      }

      return payments || []
    } catch (error) {
      console.error('Erreur getOwnerPayments:', error)
      throw error
    }
  }

  // Récupérer les paiements d'un bail spécifique
  async getLeasePayments(leaseId: string): Promise<Payment[]> {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          *,
          leases!inner(
            id,
            owner_id,
            property:properties(
              id,
              title,
              address
            ),
            tenant:users!leases_tenant_id_fkey(
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('lease_id', leaseId)
        .order('due_date', { ascending: false })

      if (error) {
        console.error('Erreur récupération paiements bail:', error)
        throw new Error('Erreur lors de la récupération des paiements du bail')
      }

      return payments || []
    } catch (error) {
      console.error('Erreur getLeasePayments:', error)
      throw error
    }
  }

  // Récupérer l'historique complet d'un paiement
  async getPaymentHistory(paymentId: string): Promise<PaymentHistory> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}/history`)
      if (!response.ok) throw new Error('Erreur lors de la récupération de l\'historique')
      return await response.json()
    } catch (error) {
      console.error('Erreur getPaymentHistory:', error)
      throw error
    }
  }

  // Valider un paiement (marquer comme payé ou impayé)
  async validatePayment(input: PaymentValidationInput): Promise<PaymentValidationOutput> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${input.payment_id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      if (!response.ok) throw new Error('Erreur lors de la validation du paiement')
      return await response.json()
    } catch (error) {
      console.error('Erreur validatePayment:', error)
      throw error
    }
  }

  // Envoyer un rappel pour un paiement
  async sendReminder(input: ReminderInput): Promise<ReminderOutput> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${input.payment_id}/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      if (!response.ok) throw new Error('Erreur lors de l\'envoi du rappel')
      return await response.json()
    } catch (error) {
      console.error('Erreur sendReminder:', error)
      throw error
    }
  }

  // Générer les paiements mensuels pour tous les baux actifs
  async generateMonthlyPayments(): Promise<Payment[]> {
    try {
      // Générer le mois actuel au format "2025-03"
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      // Utiliser la fonction SQL pour générer les paiements
      const { data: payments, error } = await supabase
        .rpc('generate_monthly_payments', { target_month: currentMonth })

      if (error) {
        console.error('Erreur génération paiements:', error)
        throw new Error('Erreur lors de la génération des paiements mensuels')
      }

      return payments || []
    } catch (error) {
      console.error('Erreur generateMonthlyPayments:', error)
      throw error
    }
  }

  // Récupérer les statistiques des paiements
  async getPaymentStats(ownerId: string, period?: string): Promise<PaymentStats> {
    try {
      // Vérifier que ownerId est une chaîne UUID valide
      if (!ownerId || typeof ownerId !== 'string') {
        console.error('ownerId invalide:', ownerId)
        throw new Error('ID propriétaire invalide')
      }

      // Calculer les dates selon la période
      const now = new Date()
      let startDate: Date
      let endDate: Date = now

      switch (period) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'quarter':
          const quarterStart = Math.floor(now.getMonth() / 3) * 3
          startDate = new Date(now.getFullYear(), quarterStart, 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0) // Toutes les périodes
      }

      // Récupérer les paiements du propriétaire
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          amount_due,
          status,
          payment_date,
          due_date,
          leases!inner(owner_id)
        `)
        .eq('leases.owner_id', ownerId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (error) {
        console.error('Erreur récupération statistiques:', error)
        throw new Error('Erreur lors de la récupération des statistiques')
      }

      // Calculer les statistiques
      const totalReceived = payments
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount_due), 0) || 0

      const totalPending = payments
        ?.filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount_due), 0) || 0

      const totalOverdue = payments
        ?.filter(p => p.status === 'overdue')
        .reduce((sum, p) => sum + Number(p.amount_due), 0) || 0

      const totalAmount = totalReceived + totalPending + totalOverdue
      const collectionRate = totalAmount > 0 ? (totalReceived / totalAmount) * 100 : 0

      // Calculer le délai moyen de paiement
      const paidPayments = payments?.filter(p => p.status === 'paid' && p.payment_date) || []
      const averageDelay = paidPayments.length > 0 
        ? paidPayments.reduce((sum, payment) => {
            const dueDate = new Date(payment.due_date)
            const paidDate = new Date(payment.payment_date)
            const delay = Math.max(0, (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
            return sum + delay
          }, 0) / paidPayments.length
        : 0

      return {
        total_received: totalReceived,
        total_pending: totalPending,
        total_overdue: totalOverdue,
        collection_rate: Math.round(collectionRate * 100) / 100,
        average_delay: Math.round(averageDelay)
      }
    } catch (error) {
      console.error('Erreur getPaymentStats:', error)
      throw error
    }
  }

  // Récupérer les paiements en attente (pour notifications)
  async getPendingPayments(ownerId: string): Promise<Payment[]> {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          *,
          leases!inner(
            id,
            owner_id,
            property:properties(
              id,
              title,
              address
            ),
            tenant:users!leases_tenant_id_fkey(
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('leases.owner_id', ownerId)
        .eq('status', 'pending')
        .order('due_date', { ascending: false })

      if (error) {
        console.error('Erreur récupération paiements en attente:', error)
        throw new Error('Erreur lors de la récupération des paiements en attente')
      }

      return payments || []
    } catch (error) {
      console.error('Erreur getPendingPayments:', error)
      throw error
    }
  }

  // Récupérer les paiements en retard
  async getOverduePayments(ownerId: string): Promise<Payment[]> {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          *,
          leases!inner(
            id,
            owner_id,
            property:properties(
              id,
              title,
              address
            ),
            tenant:users!leases_tenant_id_fkey(
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('leases.owner_id', ownerId)
        .eq('status', 'overdue')
        .order('due_date', { ascending: false })

      if (error) {
        console.error('Erreur récupération paiements en retard:', error)
        throw new Error('Erreur lors de la récupération des paiements en retard')
      }

      return payments || []
    } catch (error) {
      console.error('Erreur getOverduePayments:', error)
      throw error
    }
  }

  // Télécharger une quittance PDF
  async downloadReceipt(receiptId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/receipts/${receiptId}/download`)
      if (!response.ok) throw new Error('Erreur lors du téléchargement de la quittance')
      return await response.blob()
    } catch (error) {
      console.error('Erreur downloadReceipt:', error)
      throw error
    }
  }

  // Marquer une quittance comme envoyée au locataire
  async markReceiptAsSent(receiptId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/receipts/${receiptId}/mark-sent`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Erreur lors de la mise à jour de la quittance')
    } catch (error) {
      console.error('Erreur markReceiptAsSent:', error)
      throw error
    }
  }

  // Récupérer la configuration de paiement d'un bail
  async getLeasePaymentConfig(leaseId: string): Promise<LeasePaymentConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/config/${leaseId}`)
      if (!response.ok) throw new Error('Erreur lors de la récupération de la configuration')
      return await response.json()
    } catch (error) {
      console.error('Erreur getLeasePaymentConfig:', error)
      throw error
    }
  }

  // Mettre à jour la configuration de paiement d'un bail
  async updateLeasePaymentConfig(leaseId: string, config: Partial<LeasePaymentConfig>): Promise<LeasePaymentConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/config/${leaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      if (!response.ok) throw new Error('Erreur lors de la mise à jour de la configuration')
      return await response.json()
    } catch (error) {
      console.error('Erreur updateLeasePaymentConfig:', error)
      throw error
    }
  }
}

export const paymentService = new PaymentService()

// Version simplifiée du service de paiements pour éviter les problèmes de relations multiples
import { supabase } from './supabase'
import { Payment, PaymentStats } from './payment-models'

class PaymentServiceSimple {
  // Récupérer tous les paiements d'un propriétaire (version simplifiée)
  async getOwnerPayments(ownerId: string): Promise<Payment[]> {
    try {
      // Requête simplifiée sans relations complexes
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('lease_id', 
          supabase
            .from('leases')
            .select('id')
            .eq('owner_id', ownerId)
        )
        .order('due_date', { ascending: false })

      if (error) {
        console.error('Erreur récupération paiements:', error)
        throw new Error('Erreur lors de la récupération des paiements')
      }

      // Enrichir les données avec des requêtes séparées
      const enrichedPayments = await Promise.all(
        (payments || []).map(async (payment) => {
          // Récupérer les informations du bail
          const { data: lease } = await supabase
            .from('leases')
            .select('id, owner_id, property_id')
            .eq('id', payment.lease_id)
            .single()

          // Récupérer les informations du locataire
          const { data: tenant } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .eq('id', lease?.tenant_id)
            .single()

          // Récupérer les informations de la propriété
          const { data: property } = await supabase
            .from('properties')
            .select('id, title, address')
            .eq('id', lease?.property_id)
            .single()

          return {
            ...payment,
            leases: {
              id: lease?.id,
              owner_id: lease?.owner_id,
              property: property,
              tenant: tenant
            }
          }
        })
      )

      return enrichedPayments
    } catch (error) {
      console.error('Erreur getOwnerPayments:', error)
      throw error
    }
  }

  // Récupérer les statistiques des paiements (version simplifiée)
  async getPaymentStats(ownerId: string, period?: string): Promise<PaymentStats> {
    try {
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

      // Récupérer les baux du propriétaire
      const { data: leases } = await supabase
        .from('leases')
        .select('id')
        .eq('owner_id', ownerId)

      if (!leases || leases.length === 0) {
        return {
          total_received: 0,
          total_pending: 0,
          total_overdue: 0,
          collection_rate: 0,
          average_delay: 0
        }
      }

      const leaseIds = leases.map(l => l.id)

      // Récupérer les paiements pour ces baux
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount_due, status, payment_date, due_date')
        .in('lease_id', leaseIds)
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

  // Générer les paiements mensuels (version simplifiée)
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
}

export const paymentServiceSimple = new PaymentServiceSimple()

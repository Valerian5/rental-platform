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
      // Utiliser directement Supabase côté client
      const { data: payment, error: paymentError } = await supabase
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
        .eq('id', paymentId)
        .single()

      if (paymentError) {
        console.error('Erreur récupération paiement:', paymentError)
        throw new Error('Erreur lors de la récupération du paiement')
      }

      // Récupérer les rappels
      const { data: reminders, error: remindersError } = await supabase
        .from('reminders')
        .select('*')
        .eq('payment_id', paymentId)
        .order('created_at', { ascending: false })

      if (remindersError) {
        console.error('Erreur récupération rappels:', remindersError)
      }

      // Récupérer la quittance
      let receipt = null
      if (payment.receipt_id) {
        const { data: receiptData, error: receiptError } = await supabase
          .from('receipts')
          .select('*')
          .eq('id', payment.receipt_id)
          .single()

        if (!receiptError) {
          receipt = receiptData
        }
      }

      return {
        payment,
        receipt,
        reminders: reminders || []
      }
    } catch (error) {
      console.error('Erreur getPaymentHistory:', error)
      throw error
    }
  }

  // Valider un paiement (marquer comme payé ou impayé)
  async validatePayment(input: PaymentValidationInput): Promise<PaymentValidationOutput> {
    try {
      let result
      
      if (input.status === 'paid') {
        // Marquer comme payé
        const { data, error } = await supabase
          .rpc('mark_payment_as_paid', {
            payment_id_param: input.payment_id,
            payment_date_param: input.payment_date || new Date().toISOString(),
            payment_method: input.payment_method || 'virement'
          })

        if (error) {
          console.error('Erreur marquage payé:', error)
          throw new Error('Erreur lors de la validation du paiement')
        }

        result = data?.[0]
      } else {
        // Marquer comme impayé
        const { data, error } = await supabase
          .rpc('mark_payment_as_unpaid', {
            payment_id_param: input.payment_id,
            notes_param: input.notes
          })

        if (error) {
          console.error('Erreur marquage impayé:', error)
          throw new Error('Erreur lors de la validation du paiement')
        }

        result = data?.[0]
      }

      // Récupérer l'historique complet
      const history = await this.getPaymentHistory(input.payment_id)

      return {
        payment: history.payment,
        receipt: history.receipt,
        notification_sent: false, // TODO: Implémenter les notifications
        history
      }
    } catch (error) {
      console.error('Erreur validatePayment:', error)
      throw error
    }
  }

  // Envoyer un rappel pour un paiement
  async sendReminder(input: ReminderInput): Promise<ReminderOutput> {
    try {
      const { data, error } = await supabase
        .rpc('create_payment_reminder', {
          payment_id_param: input.payment_id,
          reminder_type: input.reminder_type,
          custom_message: input.custom_message
        })

      if (error) {
        console.error('Erreur création rappel:', error)
        throw new Error('Erreur lors de l\'envoi du rappel')
      }

      const reminder = data?.[0]

      return {
        reminder,
        email_sent: false, // TODO: Implémenter l'envoi d'email
        notification_sent: false // TODO: Implémenter les notifications
      }
    } catch (error) {
      console.error('Erreur sendReminder:', error)
      throw error
    }
  }

  // Générer les paiements mensuels pour tous les baux actifs
  async generateMonthlyPayments(): Promise<{ count: number, payments: Payment[] }> {
    try {
      // Générer le mois actuel au format "2025-03"
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      // Utiliser la fonction SQL pour générer les paiements
      const { data: count, error } = await supabase
        .rpc('generate_monthly_payments', { target_month: currentMonth })

      if (error) {
        console.error('Erreur génération paiements:', error)
        throw new Error('Erreur lors de la génération des paiements mensuels')
      }

      // Récupérer les paiements générés pour ce mois
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          lease:leases!payments_lease_id_fkey(
            id,
            monthly_rent,
            charges,
            property:properties!leases_property_id_fkey(
              id,
              address,
              title
            ),
            tenant:users!leases_tenant_id_fkey(
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('month', currentMonth)
        .order('due_date', { ascending: true })

      if (paymentsError) {
        console.error('Erreur récupération paiements générés:', paymentsError)
        throw new Error('Erreur lors de la récupération des paiements générés')
      }

      return {
        count: count || 0,
        payments: payments || []
      }
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
      // Récupérer les données de la quittance
      const { data: receipt, error } = await supabase
        .from('receipts')
        .select(`
          *,
          payment:payments(
            *,
            leases!inner(
              *,
              property:properties(*),
              tenant:users!leases_tenant_id_fkey(*)
            )
          )
        `)
        .eq('id', receiptId)
        .single()

      if (error) {
        console.error('Erreur récupération quittance:', error)
        throw new Error('Erreur lors de la récupération de la quittance')
      }

      // TODO: Implémenter la génération PDF réelle
      // Pour l'instant, retourner un blob vide
      const pdfContent = `Quittance ${receipt.reference}\nMontant: ${receipt.total_amount}€`
      return new Blob([pdfContent], { type: 'application/pdf' })
    } catch (error) {
      console.error('Erreur downloadReceipt:', error)
      throw error
    }
  }

  // Marquer une quittance comme envoyée au locataire
  async markReceiptAsSent(receiptId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('receipts')
        .update({ 
          sent_to_tenant: true,
          sent_at: new Date().toISOString()
        })
        .eq('id', receiptId)

      if (error) {
        console.error('Erreur mise à jour quittance:', error)
        throw new Error('Erreur lors de la mise à jour de la quittance')
      }
    } catch (error) {
      console.error('Erreur markReceiptAsSent:', error)
      throw error
    }
  }

  // Récupérer la configuration de paiement d'un bail
  async getLeasePaymentConfig(leaseId: string): Promise<LeasePaymentConfig> {
    try {
      // Récupérer les informations du bail
      const { data: lease, error } = await supabase
        .from('leases')
        .select(`
          id,
          property_id,
          tenant_id,
          monthly_rent,
          charges
        `)
        .eq('id', leaseId)
        .single()

      if (error) {
        console.error('Erreur récupération bail:', error)
        throw new Error('Erreur lors de la récupération de la configuration')
      }

      return {
        lease_id: lease.id,
        property_id: lease.property_id,
        tenant_id: lease.tenant_id,
        monthly_rent: lease.monthly_rent,
        monthly_charges: lease.charges || 0,
        payment_day: 1,
        payment_method: 'virement',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Erreur getLeasePaymentConfig:', error)
      throw error
    }
  }

  // Mettre à jour la configuration de paiement d'un bail
  async updateLeasePaymentConfig(leaseId: string, config: Partial<LeasePaymentConfig>): Promise<LeasePaymentConfig> {
    try {
      // Mettre à jour le bail
      const { error } = await supabase
        .from('leases')
        .update({
          monthly_rent: config.monthly_rent,
          charges: config.monthly_charges,
          updated_at: new Date().toISOString()
        })
        .eq('id', leaseId)

      if (error) {
        console.error('Erreur mise à jour bail:', error)
        throw new Error('Erreur lors de la mise à jour de la configuration')
      }

      // Retourner la configuration mise à jour
      return await this.getLeasePaymentConfig(leaseId)
    } catch (error) {
      console.error('Erreur updateLeasePaymentConfig:', error)
      throw error
    }
  }
}

export const paymentService = new PaymentService()

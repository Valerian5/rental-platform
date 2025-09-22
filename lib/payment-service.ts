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

class PaymentService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'

  // Récupérer tous les paiements d'un propriétaire
  async getOwnerPayments(ownerId: string): Promise<Payment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/owner/${ownerId}`)
      if (!response.ok) throw new Error('Erreur lors de la récupération des paiements')
      return await response.json()
    } catch (error) {
      console.error('Erreur getOwnerPayments:', error)
      throw error
    }
  }

  // Récupérer les paiements d'un bail spécifique
  async getLeasePayments(leaseId: string): Promise<Payment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/lease/${leaseId}`)
      if (!response.ok) throw new Error('Erreur lors de la récupération des paiements du bail')
      return await response.json()
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
      const response = await fetch(`${this.baseUrl}/payments/generate-monthly`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Erreur lors de la génération des paiements mensuels')
      return await response.json()
    } catch (error) {
      console.error('Erreur generateMonthlyPayments:', error)
      throw error
    }
  }

  // Récupérer les statistiques des paiements
  async getPaymentStats(ownerId: string, period?: string): Promise<PaymentStats> {
    try {
      const url = period 
        ? `${this.baseUrl}/payments/stats/${ownerId}?period=${period}`
        : `${this.baseUrl}/payments/stats/${ownerId}`
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Erreur lors de la récupération des statistiques')
      return await response.json()
    } catch (error) {
      console.error('Erreur getPaymentStats:', error)
      throw error
    }
  }

  // Récupérer les paiements en attente (pour notifications)
  async getPendingPayments(ownerId: string): Promise<Payment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/pending/${ownerId}`)
      if (!response.ok) throw new Error('Erreur lors de la récupération des paiements en attente')
      return await response.json()
    } catch (error) {
      console.error('Erreur getPendingPayments:', error)
      throw error
    }
  }

  // Récupérer les paiements en retard
  async getOverduePayments(ownerId: string): Promise<Payment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/overdue/${ownerId}`)
      if (!response.ok) throw new Error('Erreur lors de la récupération des paiements en retard')
      return await response.json()
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

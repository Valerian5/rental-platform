// Gestionnaire de paiements - Logique métier pour la gestion des paiements
import { 
  Payment, 
  Receipt, 
  Reminder, 
  LeasePaymentConfig, 
  PaymentStats,
  PaymentStatus,
  PaymentValidationInput,
  PaymentValidationOutput,
  ReminderInput,
  ReminderOutput
} from './payment-models'

class PaiementManager {
  constructor() {
    this.payments = new Map()
    this.receipts = new Map()
    this.reminders = new Map()
    this.leaseConfigs = new Map()
  }

  // Générer les paiements mensuels pour tous les baux actifs
  generateMonthlyPayments(activeLeases, currentMonth) {
    const payments = []
    const currentDate = new Date(currentMonth)
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const monthKey = `${year}-${month}`

    for (const lease of activeLeases) {
      const config = this.leaseConfigs.get(lease.id)
      if (!config || !config.is_active) continue

      // Vérifier si le paiement existe déjà
      const existingPayment = this.getPaymentByLeaseAndMonth(lease.id, monthKey)
      if (existingPayment) continue

      const dueDate = this.calculateDueDate(year, currentDate.getMonth(), config.payment_day)
      const status = this.determinePaymentStatus(dueDate, currentDate)

      const payment = {
        id: this.generatePaymentId(lease.id, monthKey),
        lease_id: lease.id,
        month: monthKey,
        year,
        month_name: this.getMonthName(currentDate.getMonth()),
        amount_due: config.monthly_rent + config.monthly_charges,
        rent_amount: config.monthly_rent,
        charges_amount: config.monthly_charges,
        due_date: dueDate.toISOString(),
        status,
        payment_method: config.payment_method,
        reference: this.generatePaymentReference(lease.id, monthKey),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      this.payments.set(payment.id, payment)
      payments.push(payment)
    }

    return payments
  }

  // Valider un paiement (marquer comme payé ou impayé)
  validatePayment(input) {
    const payment = this.payments.get(input.payment_id)
    if (!payment) {
      throw new Error('Paiement non trouvé')
    }

    const now = new Date()
    const updatedPayment = {
      ...payment,
      status: input.status,
      payment_date: input.status === 'paid' ? (input.payment_date || now.toISOString()) : null,
      payment_method: input.payment_method || payment.payment_method,
      updated_at: now.toISOString()
    }

    this.payments.set(payment.id, updatedPayment)

    let receipt = null
    let notificationSent = false

    // Si le paiement est marqué comme payé, générer une quittance
    if (input.status === 'paid') {
      receipt = this.generateReceipt(updatedPayment)
      notificationSent = this.sendPaymentNotification(updatedPayment, receipt)
    }

    // Si le paiement est marqué comme impayé, envoyer une notification de rappel
    if (input.status === 'unpaid') {
      notificationSent = this.sendOverdueNotification(updatedPayment)
    }

    const history = this.getPaymentHistory(payment.id)

    return {
      payment: updatedPayment,
      receipt,
      notification_sent: notificationSent,
      history
    }
  }

  // Envoyer un rappel pour un paiement
  sendReminder(input) {
    const payment = this.payments.get(input.payment_id)
    if (!payment) {
      throw new Error('Paiement non trouvé')
    }

    if (payment.status === 'paid') {
      throw new Error('Impossible d\'envoyer un rappel pour un paiement déjà payé')
    }

    const reminder = {
      id: this.generateReminderId(payment.id, input.reminder_type),
      payment_id: payment.id,
      lease_id: payment.lease_id,
      tenant_id: this.getTenantIdFromLease(payment.lease_id),
      sent_at: new Date().toISOString(),
      message: input.custom_message || this.generateReminderMessage(payment, input.reminder_type),
      status: 'sent',
      reminder_type: input.reminder_type
    }

    this.reminders.set(reminder.id, reminder)

    // Envoyer l'email et la notification
    const emailSent = this.sendReminderEmail(reminder)
    const notificationSent = this.sendReminderNotification(reminder)

    return {
      reminder,
      email_sent: emailSent,
      notification_sent: notificationSent
    }
  }

  // Générer une quittance PDF
  generateReceipt(payment) {
    const receipt = {
      id: this.generateReceiptId(payment.id),
      payment_id: payment.id,
      lease_id: payment.lease_id,
      reference: this.generateReceiptReference(payment),
      month: payment.month,
      year: payment.year,
      rent_amount: payment.rent_amount,
      charges_amount: payment.charges_amount,
      total_amount: payment.amount_due,
      generated_at: new Date().toISOString(),
      sent_to_tenant: false
    }

    this.receipts.set(receipt.id, receipt)
    return receipt
  }

  // Calculer les statistiques des paiements
  calculatePaymentStats(ownerId, period = 'month') {
    const payments = Array.from(this.payments.values())
      .filter(p => this.getOwnerIdFromLease(p.lease_id) === ownerId)

    const filteredPayments = this.filterPaymentsByPeriod(payments, period)

    const totalReceived = filteredPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount_due, 0)

    const totalPending = filteredPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount_due, 0)

    const totalOverdue = filteredPayments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount_due, 0)

    const totalAmount = totalReceived + totalPending + totalOverdue
    const collectionRate = totalAmount > 0 ? (totalReceived / totalAmount) * 100 : 0

    const averageDelay = this.calculateAverageDelay(filteredPayments)

    return {
      total_received: totalReceived,
      total_pending: totalPending,
      total_overdue: totalOverdue,
      collection_rate: Math.round(collectionRate * 100) / 100,
      average_delay: averageDelay
    }
  }

  // Récupérer l'historique d'un paiement
  getPaymentHistory(paymentId) {
    const payment = this.payments.get(paymentId)
    if (!payment) return null

    const receipt = Array.from(this.receipts.values())
      .find(r => r.payment_id === paymentId)

    const reminders = Array.from(this.reminders.values())
      .filter(r => r.payment_id === paymentId)
      .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))

    return {
      payment,
      receipt,
      reminders
    }
  }

  // Méthodes utilitaires privées
  calculateDueDate(year, month, day) {
    const dueDate = new Date(year, month, day)
    // Si le jour n'existe pas dans le mois, prendre le dernier jour du mois
    if (dueDate.getMonth() !== month) {
      dueDate.setDate(0)
    }
    return dueDate
  }

  determinePaymentStatus(dueDate, currentDate) {
    if (currentDate > dueDate) {
      return 'overdue'
    }
    return 'pending'
  }

  generatePaymentId(leaseId, month) {
    return `payment_${leaseId}_${month}`
  }

  generateReceiptId(paymentId) {
    return `receipt_${paymentId}`
  }

  generateReminderId(paymentId, type) {
    return `reminder_${paymentId}_${type}_${Date.now()}`
  }

  generatePaymentReference(leaseId, month) {
    return `PAY-${month}-${leaseId.slice(-6).toUpperCase()}`
  }

  generateReceiptReference(payment) {
    const monthKey = payment.month.replace('-', '-')
    return `Quittance #${monthKey}-${payment.lease_id.slice(-6).toUpperCase()}`
  }

  getMonthName(monthIndex) {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    return months[monthIndex]
  }

  generateReminderMessage(payment, type) {
    const messages = {
      first: `Bonjour, nous vous rappelons que le paiement du loyer de ${payment.month_name} d'un montant de ${payment.amount_due}€ est attendu depuis le ${new Date(payment.due_date).toLocaleDateString('fr-FR')}. Merci de régulariser rapidement.`,
      second: `Bonjour, nous vous relançons concernant le paiement du loyer de ${payment.month_name} d'un montant de ${payment.amount_due}€. Le délai de paiement est dépassé. Merci de régulariser dans les plus brefs délais.`,
      final: `Bonjour, nous vous informons que le paiement du loyer de ${payment.month_name} d'un montant de ${payment.amount_due}€ est en retard. Des mesures de recouvrement pourraient être engagées. Merci de nous contacter immédiatement.`
    }
    return messages[type] || messages.first
  }

  filterPaymentsByPeriod(payments, period) {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    switch (period) {
      case 'month':
        return payments.filter(p => {
          const paymentDate = new Date(p.created_at)
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
        })
      case 'quarter':
        const quarterStart = Math.floor(currentMonth / 3) * 3
        return payments.filter(p => {
          const paymentDate = new Date(p.created_at)
          return paymentDate.getMonth() >= quarterStart && 
                 paymentDate.getMonth() < quarterStart + 3 && 
                 paymentDate.getFullYear() === currentYear
        })
      case 'year':
        return payments.filter(p => {
          const paymentDate = new Date(p.created_at)
          return paymentDate.getFullYear() === currentYear
        })
      default:
        return payments
    }
  }

  calculateAverageDelay(payments) {
    const paidPayments = payments.filter(p => p.status === 'paid' && p.payment_date)
    
    if (paidPayments.length === 0) return 0

    const totalDelay = paidPayments.reduce((sum, payment) => {
      const dueDate = new Date(payment.due_date)
      const paidDate = new Date(payment.payment_date)
      const delay = Math.max(0, (paidDate - dueDate) / (1000 * 60 * 60 * 24))
      return sum + delay
    }, 0)

    return Math.round(totalDelay / paidPayments.length)
  }

  // Méthodes de notification (à implémenter selon votre système de notification)
  sendPaymentNotification(payment, receipt) {
    // TODO: Implémenter l'envoi de notification au propriétaire
    console.log(`Notification envoyée: Paiement reçu pour ${payment.month_name}`)
    return true
  }

  sendOverdueNotification(payment) {
    // TODO: Implémenter l'envoi de notification de retard
    console.log(`Notification envoyée: Paiement en retard pour ${payment.month_name}`)
    return true
  }

  sendReminderEmail(reminder) {
    // TODO: Implémenter l'envoi d'email de rappel
    console.log(`Email de rappel envoyé: ${reminder.message}`)
    return true
  }

  sendReminderNotification(reminder) {
    // TODO: Implémenter l'envoi de notification de rappel
    console.log(`Notification de rappel envoyée`)
    return true
  }

  // Méthodes d'accès aux données (à adapter selon votre base de données)
  getPaymentByLeaseAndMonth(leaseId, month) {
    return Array.from(this.payments.values())
      .find(p => p.lease_id === leaseId && p.month === month)
  }

  getTenantIdFromLease(leaseId) {
    // TODO: Récupérer l'ID du locataire depuis la base de données
    return `tenant_${leaseId}`
  }

  getOwnerIdFromLease(leaseId) {
    // TODO: Récupérer l'ID du propriétaire depuis la base de données
    return `owner_${leaseId}`
  }

  // Configuration des baux
  setLeasePaymentConfig(leaseId, config) {
    this.leaseConfigs.set(leaseId, {
      ...config,
      lease_id: leaseId,
      updated_at: new Date().toISOString()
    })
  }

  getLeasePaymentConfig(leaseId) {
    return this.leaseConfigs.get(leaseId)
  }
}

export default PaiementManager

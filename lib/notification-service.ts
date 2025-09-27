// Service de notifications pour les paiements
import { Payment, Reminder } from './payment-models'

export interface NotificationData {
  type: 'payment_received' | 'payment_overdue' | 'reminder_sent' | 'receipt_generated' | 'charge_regularization' | 'rent_revision'
  payment?: Payment
  recipient: {
    email: string
    name: string
  }
  data?: any
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

class NotificationService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'

  // Envoyer une notification de paiement reçu
  async sendPaymentReceivedNotification(payment: Payment, ownerEmail: string, ownerName: string) {
    const notification: NotificationData = {
      type: 'payment_received',
      payment,
      recipient: {
        email: ownerEmail,
        name: ownerName
      }
    }

    return this.sendNotification(notification)
  }

  // Envoyer une notification de paiement en retard
  async sendPaymentOverdueNotification(payment: Payment, ownerEmail: string, ownerName: string) {
    const notification: NotificationData = {
      type: 'payment_overdue',
      payment,
      recipient: {
        email: ownerEmail,
        name: ownerName
      }
    }

    return this.sendNotification(notification)
  }

  // Envoyer un rappel au locataire
  async sendReminderToTenant(reminder: Reminder, tenantEmail: string, tenantName: string) {
    const notification: NotificationData = {
      type: 'reminder_sent',
      payment: reminder as any, // Type conversion temporaire
      recipient: {
        email: tenantEmail,
        name: tenantName
      },
      data: { reminder }
    }

    return this.sendNotification(notification)
  }

  // Envoyer une quittance générée
  async sendReceiptGeneratedNotification(payment: Payment, tenantEmail: string, tenantName: string) {
    const notification: NotificationData = {
      type: 'receipt_generated',
      payment,
      recipient: {
        email: tenantEmail,
        name: tenantName
      }
    }

    return this.sendNotification(notification)
  }

  // Envoyer une notification de régularisation des charges
  async sendChargeRegularizationNotification(
    tenantEmail: string, 
    tenantName: string, 
    propertyTitle: string, 
    year: number, 
    balance: number, 
    balanceType: 'refund' | 'additional_payment',
    pdfUrl: string
  ) {
    const notification: NotificationData = {
      type: 'charge_regularization',
      recipient: {
        email: tenantEmail,
        name: tenantName
      },
      data: {
        propertyTitle,
        year,
        balance,
        balanceType,
        pdfUrl
      }
    }

    return this.sendNotification(notification)
  }

  // Envoyer une notification de révision de loyer
  async sendRentRevisionNotification(
    tenantEmail: string, 
    tenantName: string, 
    propertyTitle: string, 
    year: number, 
    oldRent: number, 
    newRent: number, 
    increase: number, 
    increasePercentage: number,
    pdfUrl: string
  ) {
    const notification: NotificationData = {
      type: 'rent_revision',
      recipient: {
        email: tenantEmail,
        name: tenantName
      },
      data: {
        propertyTitle,
        year,
        oldRent,
        newRent,
        increase,
        increasePercentage,
        pdfUrl
      }
    }

    return this.sendNotification(notification)
  }

  // Méthode générique pour envoyer des notifications
  private async sendNotification(notification: NotificationData) {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la notification')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur NotificationService:', error)
      throw error
    }
  }

  // Générer le template email pour paiement reçu
  generatePaymentReceivedEmail(payment: Payment, ownerName: string): EmailTemplate {
    const subject = `✅ Paiement reçu - ${payment.month_name}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Paiement reçu avec succès</h2>
        <p>Bonjour ${ownerName},</p>
        <p>Nous vous informons que le paiement du loyer pour <strong>${payment.month_name}</strong> a été reçu.</p>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0c4a6e;">Détails du paiement</h3>
          <p><strong>Montant:</strong> ${payment.amount_due.toLocaleString()} €</p>
          <p><strong>Période:</strong> ${payment.month_name}</p>
          <p><strong>Date de paiement:</strong> ${new Date(payment.payment_date!).toLocaleDateString('fr-FR')}</p>
          <p><strong>Référence:</strong> ${payment.reference}</p>
        </div>

        <p>La quittance de loyer a été générée automatiquement et envoyée au locataire.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #6b7280;">
            Cette notification a été envoyée automatiquement par Louer Ici.
          </p>
        </div>
      </div>
    `

    const text = `
      Paiement reçu avec succès
      
      Bonjour ${ownerName},
      
      Le paiement du loyer pour ${payment.month_name} a été reçu.
      
      Détails:
      - Montant: ${payment.amount_due.toLocaleString()} €
      - Période: ${payment.month_name}
      - Date: ${new Date(payment.payment_date!).toLocaleDateString('fr-FR')}
      - Référence: ${payment.reference}
      
      La quittance a été générée et envoyée au locataire.
    `

    return { subject, html, text }
  }

  // Générer le template email pour paiement en retard
  generatePaymentOverdueEmail(payment: Payment, ownerName: string): EmailTemplate {
    const subject = `⚠️ Paiement en retard - ${payment.month_name}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Paiement en retard</h2>
        <p>Bonjour ${ownerName},</p>
        <p>Nous vous informons que le paiement du loyer pour <strong>${payment.month_name}</strong> est en retard.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #991b1b;">Détails du paiement</h3>
          <p><strong>Montant dû:</strong> ${payment.amount_due.toLocaleString()} €</p>
          <p><strong>Période:</strong> ${payment.month_name}</p>
          <p><strong>Date d'échéance:</strong> ${new Date(payment.due_date).toLocaleDateString('fr-FR')}</p>
          <p><strong>Référence:</strong> ${payment.reference}</p>
        </div>

        <p>Vous pouvez envoyer un rappel au locataire depuis votre espace propriétaire.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #6b7280;">
            Cette notification a été envoyée automatiquement par Louer Ici.
          </p>
        </div>
      </div>
    `

    const text = `
      Paiement en retard
      
      Bonjour ${ownerName},
      
      Le paiement du loyer pour ${payment.month_name} est en retard.
      
      Détails:
      - Montant dû: ${payment.amount_due.toLocaleString()} €
      - Période: ${payment.month_name}
      - Échéance: ${new Date(payment.due_date).toLocaleDateString('fr-FR')}
      - Référence: ${payment.reference}
      
      Vous pouvez envoyer un rappel au locataire.
    `

    return { subject, html, text }
  }

  // Générer le template email pour rappel locataire
  generateReminderEmail(reminder: Reminder, tenantName: string): EmailTemplate {
    const subject = `🔔 Rappel de paiement - ${reminder.message.split(' ')[8]}` // Extraction du mois du message
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">Rappel de paiement</h2>
        <p>Bonjour ${tenantName},</p>
        <p>${reminder.message}</p>
        
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e;">Actions à effectuer</h3>
          <p>Merci de régulariser votre paiement dans les plus brefs délais.</p>
          <p>Vous pouvez nous contacter si vous rencontrez des difficultés.</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #6b7280;">
            Ce rappel a été envoyé automatiquement par Louer Ici.
          </p>
        </div>
      </div>
    `

    const text = `
      Rappel de paiement
      
      Bonjour ${tenantName},
      
      ${reminder.message}
      
      Merci de régulariser votre paiement dans les plus brefs délais.
    `

    return { subject, html, text }
  }

  // Générer le template email pour quittance générée
  generateReceiptGeneratedEmail(payment: Payment, tenantName: string): EmailTemplate {
    const subject = `📄 Quittance de loyer - ${payment.month_name}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Quittance de loyer générée</h2>
        <p>Bonjour ${tenantName},</p>
        <p>Votre quittance de loyer pour <strong>${payment.month_name}</strong> a été générée et est disponible en téléchargement.</p>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0c4a6e;">Détails de la quittance</h3>
          <p><strong>Montant payé:</strong> ${payment.amount_due.toLocaleString()} €</p>
          <p><strong>Période:</strong> ${payment.month_name}</p>
          <p><strong>Date de paiement:</strong> ${new Date(payment.payment_date!).toLocaleDateString('fr-FR')}</p>
        </div>

        <p>Vous pouvez télécharger votre quittance depuis votre espace locataire.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #6b7280;">
            Cette quittance a été générée automatiquement par Louer Ici.
          </p>
        </div>
      </div>
    `

    const text = `
      Quittance de loyer générée
      
      Bonjour ${tenantName},
      
      Votre quittance de loyer pour ${payment.month_name} a été générée.
      
      Détails:
      - Montant payé: ${payment.amount_due.toLocaleString()} €
      - Période: ${payment.month_name}
      - Date: ${new Date(payment.payment_date!).toLocaleDateString('fr-FR')}
      
      Téléchargez votre quittance depuis votre espace locataire.
    `

    return { subject, html, text }
  }
}

export const notificationService = new NotificationService()

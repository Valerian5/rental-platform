interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface EmailData {
  to: string
  template: string
  data: Record<string, any>
}

class EmailService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || ""
    this.baseUrl = "https://api.sendgrid.com/v3"
  }

  private getTemplate(templateName: string, data: Record<string, any>): EmailTemplate {
    const templates = {
      application_received: {
        subject: `Nouvelle candidature pour ${data.propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Nouvelle candidature reçue</h2>
            <p>Bonjour ${data.ownerName},</p>
            <p>Vous avez reçu une nouvelle candidature pour votre bien :</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.propertyTitle}</h3>
              <p style="margin: 0;"><strong>Candidat :</strong> ${data.tenantName}</p>
              <p style="margin: 0;"><strong>Revenus :</strong> ${data.income}€/mois</p>
              <p style="margin: 0;"><strong>Score :</strong> ${data.score}/100</p>
            </div>
            <a href="${data.applicationUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir la candidature
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Nouvelle candidature reçue pour ${data.propertyTitle} par ${data.tenantName}. Score: ${data.score}/100. Voir: ${data.applicationUrl}`,
      },

      lease_ready: {
        subject: `Votre bail est prêt à signer - ${data.propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Votre bail est prêt !</h2>
            <p>Bonjour ${data.tenantName},</p>
            <p>Excellente nouvelle ! Votre bail de location est maintenant prêt à être signé.</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.propertyTitle}</h3>
              <p style="margin: 0;"><strong>Adresse :</strong> ${data.propertyAddress}</p>
              <p style="margin: 0;"><strong>Loyer mensuel :</strong> ${data.monthlyRent}€</p>
              <p style="margin: 0;"><strong>Date de prise d'effet :</strong> ${data.startDate}</p>
              <p style="margin: 0;"><strong>Propriétaire :</strong> ${data.ownerName}</p>
            </div>
            <p><strong>Prochaines étapes :</strong></p>
            <ol style="padding-left: 20px;">
              <li>Consultez le bail dans votre espace personnel</li>
              <li>Vérifiez toutes les informations</li>
              <li>Signez électroniquement le document</li>
              <li>Recevez votre exemplaire signé</li>
            </ol>
            <a href="${data.leaseUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
              Consulter et signer mon bail
            </a>
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Important :</strong> Vous avez 7 jours pour signer ce bail. Passé ce délai, vous devrez contacter votre propriétaire.
            </p>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Votre bail pour ${data.propertyTitle} est prêt à signer. Consultez votre espace personnel: ${data.leaseUrl}`,
      },

      visit_scheduled: {
        subject: `Visite programmée - ${data.propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Visite programmée</h2>
            <p>Bonjour ${data.recipientName},</p>
            <p>Une visite a été programmée pour le bien suivant :</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.propertyTitle}</h3>
              <p style="margin: 0;"><strong>Date :</strong> ${data.visitDate}</p>
              <p style="margin: 0;"><strong>Heure :</strong> ${data.visitTime}</p>
              <p style="margin: 0;"><strong>Adresse :</strong> ${data.propertyAddress}</p>
            </div>
            <p><strong>Rappel :</strong> Pensez à apporter une pièce d'identité.</p>
            <a href="${data.visitUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir les détails
            </a>
          </div>
        `,
        text: `Visite programmée pour ${data.propertyTitle} le ${data.visitDate} à ${data.visitTime}. Adresse: ${data.propertyAddress}`,
      },

      payment_reminder: {
        subject: `Rappel de paiement - Loyer ${data.month}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Rappel de paiement</h2>
            <p>Bonjour ${data.tenantName},</p>
            <p>Nous vous rappelons que le loyer du mois de ${data.month} est dû.</p>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Montant :</strong> ${data.amount}€</p>
              <p style="margin: 0;"><strong>Échéance :</strong> ${data.dueDate}</p>
              <p style="margin: 0;"><strong>Propriété :</strong> ${data.propertyTitle}</p>
            </div>
            <p>Merci de procéder au paiement dans les plus brefs délais.</p>
            <a href="${data.paymentUrl}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Payer maintenant
            </a>
          </div>
        `,
        text: `Rappel: Loyer de ${data.amount}€ dû le ${data.dueDate} pour ${data.propertyTitle}`,
      },

      welcome: {
        subject: "Bienvenue sur RentalPlatform !",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Bienvenue sur RentalPlatform !</h2>
            <p>Bonjour ${data.userName},</p>
            <p>Votre compte a été créé avec succès. Vous pouvez maintenant :</p>
            <ul>
              <li>Rechercher des biens à louer</li>
              <li>Postuler en ligne</li>
              <li>Gérer vos candidatures</li>
              <li>Communiquer avec les propriétaires</li>
            </ul>
            <a href="${data.dashboardUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accéder à mon compte
            </a>
            <p style="margin-top: 30px;">
              Besoin d'aide ? Consultez notre <a href="${data.helpUrl}">centre d'aide</a> ou contactez-nous.
            </p>
          </div>
        `,
        text: `Bienvenue ${data.userName} ! Votre compte RentalPlatform est prêt. Accédez à votre tableau de bord: ${data.dashboardUrl}`,
      },
    }

    return (
      templates[templateName as keyof typeof templates] || {
        subject: "Notification RentalPlatform",
        html: "<p>Vous avez une nouvelle notification.</p>",
        text: "Vous avez une nouvelle notification.",
      }
    )
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const template = this.getTemplate(emailData.template, emailData.data)

      const payload = {
        personalizations: [
          {
            to: [{ email: emailData.to }],
            subject: template.subject,
          },
        ],
        from: {
          email: "noreply@rentalplatform.com",
          name: "RentalPlatform",
        },
        content: [
          {
            type: "text/plain",
            value: template.text,
          },
          {
            type: "text/html",
            value: template.html,
          },
        ],
      }

      const response = await fetch(`${this.baseUrl}/mail/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      return response.ok
    } catch (error) {
      console.error("Erreur envoi email:", error)
      return false
    }
  }

  // Méthodes spécialisées
  async sendApplicationNotification(ownerEmail: string, data: any) {
    return this.sendEmail({
      to: ownerEmail,
      template: "application_received",
      data,
    })
  }

  async sendLeaseReadyNotification(tenantEmail: string, data: any) {
    return this.sendEmail({
      to: tenantEmail,
      template: "lease_ready",
      data,
    })
  }

  async sendVisitConfirmation(recipientEmail: string, data: any) {
    return this.sendEmail({
      to: recipientEmail,
      template: "visit_scheduled",
      data,
    })
  }

  async sendPaymentReminder(tenantEmail: string, data: any) {
    return this.sendEmail({
      to: tenantEmail,
      template: "payment_reminder",
      data,
    })
  }

  async sendWelcomeEmail(userEmail: string, data: any) {
    return this.sendEmail({
      to: userEmail,
      template: "welcome",
      data,
    })
  }
}

export const emailService = new EmailService()

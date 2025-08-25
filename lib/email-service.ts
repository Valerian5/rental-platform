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

      application_status_update: {
        subject: `Mise à jour de votre candidature - ${data.propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${data.status === "accepted" ? "#059669" : data.status === "rejected" ? "#dc2626" : "#2563eb"};">
              Candidature ${data.statusLabel}
            </h2>
            <p>Bonjour ${data.tenantName},</p>
            <p>Votre candidature pour <strong>${data.propertyTitle}</strong> a été mise à jour.</p>
            <div style="background: ${data.status === "accepted" ? "#f0fdf4" : data.status === "rejected" ? "#fef2f2" : "#f8fafc"}; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Nouveau statut :</strong> ${data.statusLabel}</p>
              <p style="margin: 0;"><strong>Propriété :</strong> ${data.propertyTitle}</p>
              ${data.message ? `<p style="margin: 10px 0 0 0;"><strong>Message :</strong> ${data.message}</p>` : ""}
            </div>
            <a href="${data.applicationUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir mes candidatures
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Votre candidature pour ${data.propertyTitle} est maintenant : ${data.statusLabel}. ${data.message || ""}`,
      },

      visit_slots_proposed: {
        subject: `Créneaux de visite proposés - ${data.propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Créneaux de visite proposés</h2>
            <p>Bonjour ${data.tenantName},</p>
            <p>Le propriétaire vous propose des créneaux de visite pour :</p>
            <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.propertyTitle}</h3>
              <p style="margin: 0;"><strong>Adresse :</strong> ${data.propertyAddress}</p>
            </div>
            <p>Connectez-vous à votre espace pour choisir le créneau qui vous convient le mieux.</p>
            <a href="${data.applicationUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Choisir un créneau
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Des créneaux de visite ont été proposés pour ${data.propertyTitle}. Choisissez votre créneau : ${data.applicationUrl}`,
      },

      visit_scheduled: {
        subject: `Visite confirmée - ${data.propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Visite confirmée</h2>
            <p>Bonjour ${data.tenantName},</p>
            <p>Votre visite a été confirmée pour :</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.propertyTitle}</h3>
              <p style="margin: 0;"><strong>Date :</strong> ${data.visitDate}</p>
              <p style="margin: 0;"><strong>Heure :</strong> ${data.visitTime}</p>
              <p style="margin: 0;"><strong>Adresse :</strong> ${data.propertyAddress}</p>
            </div>
            <p><strong>N'oubliez pas :</strong> Apportez une pièce d'identité et soyez ponctuel.</p>
            <a href="${data.applicationUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir les détails
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Visite confirmée pour ${data.propertyTitle} le ${data.visitDate} à ${data.visitTime}. Adresse: ${data.propertyAddress}`,
      },

      visit_reminder: {
        subject: `Rappel : Visite demain - ${data.propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Rappel de visite</h2>
            <p>Bonjour ${data.tenantName},</p>
            <p>Nous vous rappelons que vous avez une visite programmée <strong>demain</strong> :</p>
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.propertyTitle}</h3>
              <p style="margin: 0;"><strong>Date :</strong> ${data.visitDate}</p>
              <p style="margin: 0;"><strong>Heure :</strong> ${data.visitTime}</p>
              <p style="margin: 0;"><strong>Adresse :</strong> ${data.propertyAddress}</p>
            </div>
            <p><strong>Checklist :</strong></p>
            <ul>
              <li>Pièce d'identité</li>
              <li>Questions préparées</li>
              <li>Arriver 5 minutes en avance</li>
            </ul>
            <a href="${data.applicationUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir les détails
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Rappel : Visite demain pour ${data.propertyTitle} à ${data.visitTime}. Adresse: ${data.propertyAddress}`,
      },

      new_message: {
        subject: `Nouveau message de ${data.senderName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Nouveau message</h2>
            <p>Bonjour ${data.recipientName},</p>
            <p>Vous avez reçu un nouveau message de <strong>${data.senderName}</strong> concernant ${data.propertyTitle} :</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <p style="margin: 0; font-style: italic;">"${data.messageContent}"</p>
            </div>
            <a href="${data.conversationUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Répondre au message
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Nouveau message de ${data.senderName} : "${data.messageContent}". Répondre : ${data.conversationUrl}`,
      },

      new_property_match: {
        subject: `${data.matchCount} nouveau${data.matchCount > 1 ? "x" : ""} bien${data.matchCount > 1 ? "s" : ""} correspondant à votre recherche`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Nouveaux biens disponibles !</h2>
            <p>Bonjour ${data.userName},</p>
            <p>Nous avons trouvé <strong>${data.matchCount} nouveau${data.matchCount > 1 ? "x" : ""} bien${data.matchCount > 1 ? "s" : ""}</strong> correspondant à votre recherche sauvegardée :</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.searchName}</h3>
              <p style="margin: 0;"><strong>Critères :</strong> ${data.searchCriteria}</p>
            </div>
            ${data.properties
              .map(
                (property: any) => `
              <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <h4 style="margin: 0 0 8px 0; color: #1f2937;">${property.title}</h4>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">${property.address}</p>
                <p style="margin: 8px 0 0 0;"><strong>${property.price}€/mois</strong> • ${property.surface}m² • ${property.rooms} pièces</p>
              </div>
            `,
              )
              .join("")}
            <a href="${data.searchUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir tous les biens
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Vous recevez cet email car vous avez activé les notifications pour cette recherche.<br>
              <a href="${data.unsubscribeUrl}" style="color: #6b7280;">Se désabonner</a>
            </p>
          </div>
        `,
        text: `${data.matchCount} nouveaux biens trouvés pour "${data.searchName}". Voir : ${data.searchUrl}`,
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
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
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
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Bienvenue ${data.userName} ! Votre compte RentalPlatform est prêt. Accédez à votre tableau de bord: ${data.dashboardUrl}`,
      },

      visit_scheduled_owner: {
        subject: `Visite programmée - ${data.propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Visite programmée</h2>
            <p>Bonjour ${data.ownerName},</p>
            <p>Une visite a été programmée pour votre bien :</p>
            <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.propertyTitle}</h3>
              <p style="margin: 0;"><strong>Visiteur :</strong> ${data.tenantName}</p>
              <p style="margin: 0;"><strong>Date :</strong> ${data.visitDate}</p>
              <p style="margin: 0;"><strong>Adresse :</strong> ${data.propertyAddress}</p>
            </div>
            <a href="${data.visitUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Gérer mes visites
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Visite programmée pour ${data.propertyTitle} le ${data.visitDate} avec ${data.tenantName}`,
      },

      message_received: {
        subject: `Nouveau message de ${data.senderName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Nouveau message</h2>
            <p>Bonjour ${data.recipientName},</p>
            <p>Vous avez reçu un nouveau message de <strong>${data.senderName}</strong>${data.propertyTitle ? ` concernant ${data.propertyTitle}` : ""} :</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <p style="margin: 0; font-style: italic;">"${data.messagePreview}"</p>
            </div>
            <a href="${data.messageUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Répondre au message
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Nouveau message de ${data.senderName} : "${data.messagePreview}". Répondre : ${data.messageUrl}`,
      },

      property_match: {
        subject: `Nouveau bien disponible - ${data.propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Nouveau bien disponible !</h2>
            <p>Bonjour ${data.tenantName},</p>
            <p>Un nouveau bien correspondant à vos critères de recherche est disponible :</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.propertyTitle}</h3>
              <p style="margin: 0;"><strong>Adresse :</strong> ${data.propertyAddress}</p>
              <p style="margin: 0;"><strong>Prix :</strong> ${data.price}€/mois</p>
            </div>
            <p>Ne tardez pas, les biens intéressants partent vite !</p>
            <a href="${data.propertyUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir le bien
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Nouveau bien disponible : ${data.propertyTitle} à ${data.price}€/mois. Voir : ${data.propertyUrl}`,
      },

      payment_received: {
        subject: `Paiement reçu - ${data.propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Paiement reçu</h2>
            <p>Bonjour ${data.ownerName},</p>
            <p>Vous avez reçu un paiement de <strong>${data.tenantName}</strong> :</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Montant :</strong> ${data.amount}€</p>
              <p style="margin: 0;"><strong>Date :</strong> ${data.paymentDate}</p>
              <p style="margin: 0;"><strong>Propriété :</strong> ${data.propertyTitle}</p>
              <p style="margin: 0;"><strong>Locataire :</strong> ${data.tenantName}</p>
            </div>
            <a href="${data.paymentsUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir mes paiements
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Paiement de ${data.amount}€ reçu de ${data.tenantName} pour ${data.propertyTitle}`,
      },

      payment_confirmed: {
        subject: `Paiement confirmé - ${data.amount}€`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Paiement confirmé</h2>
            <p>Bonjour ${data.tenantName},</p>
            <p>Votre paiement a été confirmé avec succès :</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Montant :</strong> ${data.amount}€</p>
              <p style="margin: 0;"><strong>Date :</strong> ${data.paymentDate}</p>
              <p style="margin: 0;"><strong>Propriété :</strong> ${data.propertyTitle}</p>
            </div>
            <p>Merci pour votre ponctualité !</p>
            <a href="${data.paymentsUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir mes paiements
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Paiement de ${data.amount}€ confirmé pour ${data.propertyTitle}`,
      },

      agency_new_property: {
        subject: `Nouveau bien ajouté - ${data.propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Nouveau bien ajouté</h2>
            <p>Bonjour ${data.userName},</p>
            <p>Un nouveau bien a été ajouté à votre portefeuille :</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.propertyTitle}</h3>
              <p style="margin: 0;"><strong>Adresse :</strong> ${data.propertyAddress}</p>
              <p style="margin: 0;"><strong>Prix :</strong> ${data.price}€/mois</p>
              <p style="margin: 0;"><strong>Ajouté par :</strong> ${data.addedBy}</p>
            </div>
            <a href="${data.propertyUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir le bien
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Nouveau bien ajouté : ${data.propertyTitle} à ${data.price}€/mois`,
      },

      agency_new_application: {
        subject: `Nouvelle candidature - ${data.propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Nouvelle candidature</h2>
            <p>Bonjour ${data.userName},</p>
            <p>Une nouvelle candidature a été reçue :</p>
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
        text: `Nouvelle candidature pour ${data.propertyTitle} par ${data.tenantName}`,
      },

      agency_visit_scheduled: {
        subject: `Visite programmée - ${data.propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Visite programmée</h2>
            <p>Bonjour ${data.userName},</p>
            <p>Une visite a été programmée :</p>
            <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.propertyTitle}</h3>
              <p style="margin: 0;"><strong>Visiteur :</strong> ${data.tenantName}</p>
              <p style="margin: 0;"><strong>Date :</strong> ${data.visitDate}</p>
              <p style="margin: 0;"><strong>Agent responsable :</strong> ${data.agentName}</p>
            </div>
            <a href="${data.visitUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Gérer les visites
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Visite programmée pour ${data.propertyTitle} le ${data.visitDate}`,
      },

      document_uploaded: {
        subject: `Nouveau document - ${data.documentType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Nouveau document</h2>
            <p>Bonjour ${data.recipientName},</p>
            <p>Un nouveau document a été ajouté :</p>
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Type :</strong> ${data.documentType}</p>
              <p style="margin: 0;"><strong>Nom :</strong> ${data.documentName}</p>
              <p style="margin: 0;"><strong>Ajouté par :</strong> ${data.uploaderName}</p>
              ${data.propertyTitle ? `<p style="margin: 0;"><strong>Propriété :</strong> ${data.propertyTitle}</p>` : ""}
            </div>
            <a href="${data.documentUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir le document
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Nouveau document ajouté : ${data.documentType} - ${data.documentName}`,
      },

      lease_signed: {
        subject: `Bail signé - ${data.propertyTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Bail signé avec succès</h2>
            <p>Bonjour ${data.recipientName},</p>
            <p>Le bail de location a été signé par toutes les parties :</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.propertyTitle}</h3>
              <p style="margin: 0;"><strong>Locataire :</strong> ${data.tenantName}</p>
              <p style="margin: 0;"><strong>Propriétaire :</strong> ${data.ownerName}</p>
              <p style="margin: 0;"><strong>Date de signature :</strong> ${data.signatureDate}</p>
              <p style="margin: 0;"><strong>Début du bail :</strong> ${data.startDate}</p>
            </div>
            <a href="${data.leaseUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Télécharger le bail
            </a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe RentalPlatform
            </p>
          </div>
        `,
        text: `Bail signé pour ${data.propertyTitle}. Début du bail : ${data.startDate}`,
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

  async sendNewPropertyMatch(userEmail: string, data: any) {
    return this.sendEmail({
      to: userEmail,
      template: "new_property_match",
      data,
    })
  }

  async sendVisitScheduledOwnerNotification(ownerEmail: string, data: any) {
    return this.sendEmail({
      to: ownerEmail,
      template: "visit_scheduled_owner",
      data,
    })
  }

  async sendMessageReceivedNotification(recipientEmail: string, data: any) {
    return this.sendEmail({
      to: recipientEmail,
      template: "message_received",
      data,
    })
  }

  async sendPropertyMatchNotification(tenantEmail: string, data: any) {
    return this.sendEmail({
      to: tenantEmail,
      template: "property_match",
      data,
    })
  }

  async sendPaymentReceivedNotification(ownerEmail: string, data: any) {
    return this.sendEmail({
      to: ownerEmail,
      template: "payment_received",
      data,
    })
  }

  async sendPaymentConfirmedNotification(tenantEmail: string, data: any) {
    return this.sendEmail({
      to: tenantEmail,
      template: "payment_confirmed",
      data,
    })
  }

  async sendAgencyNewPropertyNotification(userEmail: string, data: any) {
    return this.sendEmail({
      to: userEmail,
      template: "agency_new_property",
      data,
    })
  }

  async sendAgencyNewApplicationNotification(userEmail: string, data: any) {
    return this.sendEmail({
      to: userEmail,
      template: "agency_new_application",
      data,
    })
  }

  async sendAgencyVisitScheduledNotification(userEmail: string, data: any) {
    return this.sendEmail({
      to: userEmail,
      template: "agency_visit_scheduled",
      data,
    })
  }

  async sendDocumentUploadedNotification(recipientEmail: string, data: any) {
    return this.sendEmail({
      to: recipientEmail,
      template: "document_uploaded",
      data,
    })
  }

  async sendLeaseSignedNotification(recipientEmail: string, data: any) {
    return this.sendEmail({
      to: recipientEmail,
      template: "lease_signed",
      data,
    })
  }
}

export const emailService = new EmailService()

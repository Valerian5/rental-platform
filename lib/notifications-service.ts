import { supabase } from "./supabase"
import { emailService } from "./email-service"

export interface Notification {
  id: string
  user_id: string
  title: string
  content: string
  type: string
  read: boolean | null
  action_url: string | null
  created_at: string
}

export const notificationsService = {
  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    console.log("🔔 NotificationsService.getUserNotifications", { userId, unreadOnly })

    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (unreadOnly) {
        query = query.or("read.is.null,read.eq.false")
      }

      const { data, error } = await query

      if (error) {
        console.error("❌ Erreur récupération notifications:", error)
        throw new Error(`Erreur base de données: ${error.message}`)
      }

      console.log(`✅ ${data?.length || 0} notifications récupérées pour l'utilisateur ${userId}`)

      // Transformer les données pour s'assurer que read est un boolean
      const transformedData = (data || []).map((notification) => ({
        ...notification,
        read: notification.read === true,
      }))

      return transformedData as Notification[]
    } catch (error) {
      console.error("❌ Erreur dans getUserNotifications:", error)
      throw error
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    console.log("🔔 NotificationsService.getUnreadCount", userId)

    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .or("read.is.null,read.eq.false")

      if (error) {
        console.error("❌ Erreur comptage non lues:", error)
        throw new Error(`Erreur comptage: ${error.message}`)
      }

      console.log(`✅ ${count || 0} notifications non lues pour l'utilisateur ${userId}`)
      return count || 0
    } catch (error) {
      console.error("❌ Erreur dans getUnreadCount:", error)
      return 0
    }
  },

  async createNotification(
    userId: string,
    notificationData: Partial<Notification>,
    emailData?: any,
  ): Promise<Notification> {
    console.log("🔔 NotificationsService.createNotification", { userId, notificationData, emailData })

    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title: notificationData.title,
          content: notificationData.content,
          type: notificationData.type,
          action_url: notificationData.action_url,
          read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création notification:", error)
        throw new Error(`Erreur création: ${error.message}`)
      }

      console.log("✅ Notification créée:", data.id)

      if (emailData && emailData.userEmail && emailData.template) {
        try {
          console.log("📧 Envoi email automatique pour notification:", emailData.template)

          const emailSent = await emailService.sendEmail({
            to: emailData.userEmail,
            template: emailData.template,
            data: emailData.data || {},
          })

          if (emailSent) {
            console.log("✅ Email de notification envoyé")
          } else {
            console.log("⚠️ Échec envoi email de notification")
          }
        } catch (emailError) {
          console.error("❌ Erreur envoi email notification:", emailError)
          // On ne bloque pas le processus si l'email échoue
        }
      }

      return data as Notification
    } catch (error) {
      console.error("❌ Erreur dans createNotification:", error)
      throw error
    }
  },

  async createNotificationWithEmail(
    userId: string,
    userEmail: string,
    notificationData: Partial<Notification>,
    emailTemplate: string,
    emailData: Record<string, any>,
  ): Promise<Notification> {
    return this.createNotification(userId, notificationData, {
      userEmail,
      template: emailTemplate,
      data: emailData,
    })
  },

  async markAsRead(notificationId: string): Promise<void> {
    console.log("🔔 NotificationsService.markAsRead", notificationId)

    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

      if (error) {
        console.error("❌ Erreur marquage notification:", error)
        throw new Error(`Erreur marquage: ${error.message}`)
      }

      console.log("✅ Notification marquée comme lue")
    } catch (error) {
      console.error("❌ Erreur dans markAsRead:", error)
      throw error
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    console.log("🔔 NotificationsService.markAllAsRead", userId)

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .or("read.is.null,read.eq.false")

      if (error) {
        console.error("❌ Erreur marquage toutes notifications:", error)
        throw new Error(`Erreur marquage toutes: ${error.message}`)
      }

      console.log("✅ Toutes les notifications marquées comme lues")
    } catch (error) {
      console.error("❌ Erreur dans markAllAsRead:", error)
      throw error
    }
  },

  async deleteNotification(notificationId: string): Promise<void> {
    console.log("🔔 NotificationsService.deleteNotification", notificationId)

    try {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

      if (error) {
        console.error("❌ Erreur suppression notification:", error)
        throw new Error(`Erreur suppression: ${error.message}`)
      }

      console.log("✅ Notification supprimée")
    } catch (error) {
      console.error("❌ Erreur dans deleteNotification:", error)
      throw error
    }
  },

  // Notifications pour les candidatures
  async notifyNewApplication(applicationData: any, propertyData: any, tenantData: any, ownerData: any) {
    console.log("🔔 Notification nouvelle candidature")

    const tenantName = `${tenantData.first_name || ""} ${tenantData.last_name || ""}`.trim() || "Un locataire"
    const propertyTitle = propertyData.title || "votre bien"

    await this.createNotificationWithEmail(
      propertyData.owner_id,
      ownerData.email,
      {
        title: "Nouvelle candidature",
        content: `${tenantName} a postulé pour ${propertyTitle}`,
        type: "application_received",
        action_url: `/owner/applications/${applicationData.id}`,
      },
      "application_received",
      {
        ownerName: `${ownerData.first_name || ""} ${ownerData.last_name || ""}`.trim(),
        tenantName,
        propertyTitle,
        propertyAddress: `${propertyData.address}, ${propertyData.city}`,
        income: applicationData.income || 0,
        applicationUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/owner/applications/${applicationData.id}`,
      },
    )
  },

  // Notifications pour les changements de statut de candidature
  async notifyApplicationStatusChange(
    applicationData: any,
    newStatus: string,
    tenantData: any,
    ownerData: any,
    propertyData: any,
  ) {
    console.log("🔔 Notification changement statut candidature", newStatus)

    const statusMessages = {
      accepted: "Votre candidature a été acceptée",
      rejected: "Votre candidature a été refusée",
      pending: "Votre candidature est en cours d'examen",
      shortlisted: "Votre candidature a été présélectionnée",
      interview_scheduled: "Un entretien a été programmé pour votre candidature",
    }

    const message =
      statusMessages[newStatus as keyof typeof statusMessages] || "Le statut de votre candidature a changé"

    // Notification au locataire
    await this.createNotification(tenantData.id, {
      title: "Mise à jour de candidature",
      content: `${message} pour ${propertyData.title}`,
      type: "application_status_change",
      action_url: `/tenant/applications/${applicationData.id}`,
    })

    // Notification au propriétaire si acceptée
    if (newStatus === "accepted") {
      await this.createNotification(ownerData.id, {
        title: "Candidature acceptée",
        content: `Vous avez accepté la candidature de ${tenantData.first_name} ${tenantData.last_name}`,
        type: "application_accepted",
        action_url: `/owner/applications/${applicationData.id}`,
      })
    }
  },

  // Notifications pour les documents
  async notifyDocumentValidated(documentData: any, userData: any, validatorData: any) {
    console.log("🔔 Notification document validé")

    await this.createNotification(userData.id, {
      title: "Document validé",
      content: `Votre document "${documentData.name}" a été validé`,
      type: "document_validated",
      action_url: `/tenant/documents`,
    })
  },

  async notifyDocumentRejected(documentData: any, userData: any, validatorData: any, reason?: string) {
    console.log("🔔 Notification document rejeté")

    const reasonText = reason ? ` Raison: ${reason}` : ""

    await this.createNotification(userData.id, {
      title: "Document rejeté",
      content: `Votre document "${documentData.name}" a été rejeté.${reasonText}`,
      type: "document_rejected",
      action_url: `/tenant/documents`,
    })
  },

  async notifyDocumentUploaded(documentData: any, uploaderData: any, recipientData: any) {
    console.log("🔔 Notification nouveau document")

    await this.createNotification(recipientData.id, {
      title: "Nouveau document",
      content: `${uploaderData.first_name} ${uploaderData.last_name} a ajouté un document: ${documentData.name}`,
      type: "document_uploaded",
      action_url: `/owner/documents`,
    })
  },

  // Notifications pour les baux
  async notifyLeaseCreated(leaseData: any, tenantData: any, ownerData: any, propertyData: any) {
    console.log("🔔 Notification bail créé")

    // Notification au locataire
    await this.createNotification(tenantData.id, {
      title: "Bail généré",
      content: `Votre bail pour ${propertyData.title} est prêt à être signé`,
      type: "lease_created",
      action_url: `/tenant/leases/${leaseData.id}`,
    })

    // Notification au propriétaire
    await this.createNotification(ownerData.id, {
      title: "Bail créé",
      content: `Le bail pour ${propertyData.title} a été généré`,
      type: "lease_created",
      action_url: `/owner/leases/${leaseData.id}`,
    })
  },

  async notifyLeaseSigned(
    leaseData: any,
    signerData: any,
    otherPartyData: any,
    propertyData: any,
    signerType: "tenant" | "owner",
  ) {
    console.log("🔔 Notification bail signé", signerType)

    const signerName = `${signerData.first_name} ${signerData.last_name}`
    const signerTypeText = signerType === "tenant" ? "locataire" : "propriétaire"

    // Notification à l'autre partie
    await this.createNotification(otherPartyData.id, {
      title: "Bail signé",
      content: `${signerName} (${signerTypeText}) a signé le bail pour ${propertyData.title}`,
      type: "lease_signed",
      action_url: signerType === "tenant" ? `/owner/leases/${leaseData.id}` : `/tenant/leases/${leaseData.id}`,
    })
  },

  async notifyLeaseFullySigned(leaseData: any, tenantData: any, ownerData: any, propertyData: any) {
    console.log("🔔 Notification bail entièrement signé")

    // Notification au locataire
    await this.createNotification(tenantData.id, {
      title: "Bail finalisé",
      content: `Le bail pour ${propertyData.title} est maintenant entièrement signé`,
      type: "lease_completed",
      action_url: `/tenant/leases/${leaseData.id}`,
    })

    // Notification au propriétaire
    await this.createNotification(ownerData.id, {
      title: "Bail finalisé",
      content: `Le bail pour ${propertyData.title} est maintenant entièrement signé`,
      type: "lease_completed",
      action_url: `/owner/leases/${leaseData.id}`,
    })
  },

  // Notifications pour les paiements et rappels
  async notifyPaymentReceived(paymentData: any, tenantData: any, ownerData: any, propertyData: any) {
    console.log("🔔 Notification paiement reçu")

    // Notification au propriétaire
    await this.createNotification(ownerData.id, {
      title: "Paiement reçu",
      content: `Paiement de ${paymentData.amount}€ reçu pour ${propertyData.title}`,
      type: "payment_received",
      action_url: `/owner/payments`,
    })

    // Notification au locataire (confirmation)
    await this.createNotification(tenantData.id, {
      title: "Paiement confirmé",
      content: `Votre paiement de ${paymentData.amount}€ a été confirmé`,
      type: "payment_confirmed",
      action_url: `/tenant/payments`,
    })
  },

  async notifyPaymentDue(paymentData: any, tenantData: any, propertyData: any) {
    console.log("🔔 Notification échéance de paiement")

    const dueDate = new Date(paymentData.due_date).toLocaleDateString("fr-FR")

    await this.createNotification(tenantData.id, {
      title: "Échéance de loyer",
      content: `Votre loyer de ${paymentData.amount}€ est dû le ${dueDate}`,
      type: "payment_due",
      action_url: `/tenant/payments`,
    })
  },

  async notifyPaymentOverdue(paymentData: any, tenantData: any, ownerData: any, propertyData: any) {
    console.log("🔔 Notification paiement en retard")

    // Notification au locataire
    await this.createNotification(tenantData.id, {
      title: "Loyer en retard",
      content: `Votre loyer de ${paymentData.amount}€ est en retard`,
      type: "payment_overdue",
      action_url: `/tenant/payments`,
    })

    // Notification au propriétaire
    await this.createNotification(ownerData.id, {
      title: "Loyer en retard",
      content: `Le loyer de ${tenantData.first_name} ${tenantData.last_name} est en retard`,
      type: "payment_overdue",
      action_url: `/owner/payments`,
    })
  },

  // Notifications pour les visites
  async notifyVisitScheduled(visitData: any, propertyData: any, tenantData: any, ownerData: any) {
    console.log("🔔 Notification visite programmée")

    const visitDate = new Date(visitData.visit_date).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    // Notification au locataire
    await this.createNotificationWithEmail(
      tenantData.id,
      tenantData.email,
      {
        title: "Visite confirmée",
        content: `Votre visite pour ${propertyData.title} est confirmée le ${visitDate}`,
        type: "visit_scheduled",
        action_url: `/tenant/visits`,
      },
      "visit_scheduled",
      {
        tenantName: `${tenantData.first_name || ""} ${tenantData.last_name || ""}`.trim(),
        propertyTitle: propertyData.title,
        propertyAddress: `${propertyData.address}, ${propertyData.city}`,
        visitDate,
        visitUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/tenant/visits`,
      },
    )

    // Notification au propriétaire
    await this.createNotificationWithEmail(
      propertyData.owner_id,
      ownerData.email,
      {
        title: "Visite programmée",
        content: `Une visite est programmée pour ${propertyData.title} le ${visitDate}`,
        type: "visit_scheduled",
        action_url: `/owner/visits`,
      },
      "visit_scheduled_owner",
      {
        ownerName: `${ownerData.first_name || ""} ${ownerData.last_name || ""}`.trim(),
        tenantName: `${tenantData.first_name || ""} ${tenantData.last_name || ""}`.trim(),
        propertyTitle: propertyData.title,
        propertyAddress: `${propertyData.address}, ${propertyData.city}`,
        visitDate,
        visitUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/owner/visits`,
      },
    )
  },

  async notifyVisitCancelled(
    visitData: any,
    tenantData: any,
    ownerData: any,
    propertyData: any,
    cancelledBy: "tenant" | "owner",
  ) {
    console.log("🔔 Notification visite annulée")

    const visitDate = new Date(visitData.visit_date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    })

    if (cancelledBy === "tenant") {
      // Notification au propriétaire
      await this.createNotification(ownerData.id, {
        title: "Visite annulée",
        content: `${tenantData.first_name} ${tenantData.last_name} a annulé la visite du ${visitDate}`,
        type: "visit_cancelled",
        action_url: `/owner/visits`,
      })
    } else {
      // Notification au locataire
      await this.createNotification(tenantData.id, {
        title: "Visite annulée",
        content: `La visite du ${visitDate} pour ${propertyData.title} a été annulée`,
        type: "visit_cancelled",
        action_url: `/tenant/visits`,
      })
    }
  },

  async notifyVisitCompleted(visitData: any, tenantData: any, ownerData: any, propertyData: any) {
    console.log("🔔 Notification visite terminée")

    // Notification au propriétaire
    await this.createNotification(ownerData.id, {
      title: "Visite terminée",
      content: `La visite avec ${tenantData.first_name} ${tenantData.last_name} s'est terminée`,
      type: "visit_completed",
      action_url: `/owner/applications`,
    })

    // Notification au locataire
    await this.createNotification(tenantData.id, {
      title: "Merci pour votre visite",
      content: `Merci d'avoir visité ${propertyData.title}. Vous pouvez maintenant postuler.`,
      type: "visit_completed",
      action_url: `/properties/${propertyData.id}`,
    })
  },

  // Notifications pour les propriétés
  async notifyPropertyStatusChange(propertyData: any, newStatus: string, ownerData: any) {
    console.log("🔔 Notification changement statut propriété")

    const statusMessages = {
      available: "Votre bien est maintenant disponible à la location",
      rented: "Votre bien a été loué",
      maintenance: "Votre bien est en maintenance",
      unavailable: "Votre bien n'est plus disponible",
    }

    const message = statusMessages[newStatus as keyof typeof statusMessages] || "Le statut de votre bien a changé"

    await this.createNotification(ownerData.id, {
      title: "Statut de propriété",
      content: `${message}: ${propertyData.title}`,
      type: "property_status_change",
      action_url: `/owner/properties/${propertyData.id}`,
    })
  },

  // Notifications pour les incidents et maintenance
  async notifyIncidentReported(incidentData: any, tenantData: any, ownerData: any, propertyData: any) {
    console.log("🔔 Notification incident signalé")

    // Notification au propriétaire
    await this.createNotification(ownerData.id, {
      title: "Incident signalé",
      content: `${tenantData.first_name} ${tenantData.last_name} a signalé un incident: ${incidentData.title}`,
      type: "incident_reported",
      action_url: `/owner/incidents/${incidentData.id}`,
    })

    // Confirmation au locataire
    await this.createNotification(tenantData.id, {
      title: "Incident enregistré",
      content: `Votre signalement "${incidentData.title}" a été transmis au propriétaire`,
      type: "incident_confirmed",
      action_url: `/tenant/incidents/${incidentData.id}`,
    })
  },

  async notifyIncidentResolved(incidentData: any, tenantData: any, ownerData: any) {
    console.log("🔔 Notification incident résolu")

    // Notification au locataire
    await this.createNotification(tenantData.id, {
      title: "Incident résolu",
      content: `L'incident "${incidentData.title}" a été résolu`,
      type: "incident_resolved",
      action_url: `/tenant/incidents/${incidentData.id}`,
    })
  },

  // Notifications pour les agences
  async notifyAgencyEvent(agencyId: string, eventType: string, eventData: any) {
    console.log("🔔 Notification événement agence", { agencyId, eventType })

    try {
      // Récupérer les utilisateurs de l'agence
      const { data: agencyUsers } = await supabase
        .from("user_agency_roles")
        .select(`
          user_id,
          role,
          users(id, first_name, last_name, email)
        `)
        .eq("agency_id", agencyId)

      if (!agencyUsers) return

      // Envoyer les notifications selon le type d'événement et le rôle
      for (const agencyUser of agencyUsers) {
        const user = agencyUser.users
        if (!user) continue

        let shouldNotify = false
        let notificationData: any = {}

        switch (eventType) {
          case "new_property":
            shouldNotify = ["director", "manager"].includes(agencyUser.role)
            notificationData = {
              title: "Nouveau bien ajouté",
              content: `Un nouveau bien a été ajouté : ${eventData.propertyTitle}`,
              type: "agency_property",
              action_url: `/agency/properties/${eventData.propertyId}`,
            }
            break

          case "new_application":
            shouldNotify = true // Tous les rôles
            notificationData = {
              title: "Nouvelle candidature",
              content: `Nouvelle candidature reçue pour ${eventData.propertyTitle}`,
              type: "agency_application",
              action_url: `/agency/applications/${eventData.applicationId}`,
            }
            break

          case "visit_scheduled":
            shouldNotify = true // Tous les rôles
            notificationData = {
              title: "Visite programmée",
              content: `Visite programmée pour ${eventData.propertyTitle}`,
              type: "agency_visit",
              action_url: `/agency/visits`,
            }
            break
        }

        if (shouldNotify) {
          await this.createNotificationWithEmail(user.id, user.email, notificationData, `agency_${eventType}`, {
            userName: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
            ...eventData,
          })
        }
      }
    } catch (error) {
      console.error("❌ Erreur notification agence:", error)
    }
  },

  async notifyAgencyNewProperty(agencyId: string, propertyData: any, ownerData: any) {
    await this.notifyAgencyEvent(agencyId, "new_property", {
      propertyId: propertyData.id,
      propertyTitle: propertyData.title,
      propertyAddress: `${propertyData.address}, ${propertyData.city}`,
      ownerName: `${ownerData.first_name} ${ownerData.last_name}`,
    })
  },

  async notifyAgencyNewApplication(agencyId: string, applicationData: any, propertyData: any, tenantData: any) {
    await this.notifyAgencyEvent(agencyId, "new_application", {
      applicationId: applicationData.id,
      propertyId: propertyData.id,
      propertyTitle: propertyData.title,
      tenantName: `${tenantData.first_name} ${tenantData.last_name}`,
      income: applicationData.income,
    })
  },

  async notifyAgencyVisitScheduled(agencyId: string, visitData: any, propertyData: any, tenantData: any) {
    await this.notifyAgencyEvent(agencyId, "visit_scheduled", {
      visitId: visitData.id,
      propertyId: propertyData.id,
      propertyTitle: propertyData.title,
      tenantName: `${tenantData.first_name} ${tenantData.last_name}`,
      visitDate: new Date(visitData.visit_date).toLocaleDateString("fr-FR"),
    })
  },

  // Notifications système
  async notifySystemMaintenance(userId: string, maintenanceData: any) {
    console.log("🔔 Notification maintenance système")

    await this.createNotification(userId, {
      title: "Maintenance programmée",
      content: `Une maintenance est programmée le ${new Date(maintenanceData.scheduled_date).toLocaleDateString("fr-FR")}`,
      type: "system_maintenance",
      action_url: null,
    })
  },

  async notifyAccountUpdate(userId: string, updateType: string) {
    console.log("🔔 Notification mise à jour compte")

    const updateMessages = {
      profile_updated: "Votre profil a été mis à jour",
      password_changed: "Votre mot de passe a été modifié",
      email_verified: "Votre adresse email a été vérifiée",
      account_verified: "Votre compte a été vérifié",
    }

    const message = updateMessages[updateType as keyof typeof updateMessages] || "Votre compte a été mis à jour"

    await this.createNotification(userId, {
      title: "Compte mis à jour",
      content: message,
      type: "account_update",
      action_url: `/settings`,
    })
  },

  // Méthode utilitaire pour envoyer des notifications en masse
  async sendBulkNotifications(
    notifications: Array<{
      userId: string
      notificationData: Partial<Notification>
    }>,
  ) {
    console.log("🔔 Envoi notifications en masse", notifications.length)

    const promises = notifications.map(({ userId, notificationData }) =>
      this.createNotification(userId, notificationData),
    )

    try {
      await Promise.all(promises)
      console.log("✅ Toutes les notifications envoyées")
    } catch (error) {
      console.error("❌ Erreur envoi notifications en masse:", error)
      throw error
    }
  },

  // Notifications pour DocuSign
  async notifyDocuSignSignatureRequest(
    leaseData: any,
    signerData: any,
    propertyData: any,
    signerType: "tenant" | "owner",
    signingUrl: string,
  ) {
    console.log("🔔 Notification demande signature DocuSign", signerType)

    const signerName = `${signerData.first_name} ${signerData.last_name}`

    await this.createNotificationWithEmail(
      signerData.id,
      signerData.email,
      {
        title: "Signature électronique requise",
        content: `Votre bail pour ${propertyData.title} est prêt à être signé`,
        type: "docusign_signature_request",
        action_url: signingUrl,
      },
      "docusign_signature_request",
      {
        signerName,
        propertyTitle: propertyData.title,
        propertyAddress: `${propertyData.address}, ${propertyData.city}`,
        signingUrl,
        signerType: signerType === "tenant" ? "locataire" : "propriétaire",
      },
    )
  },

  async notifyDocuSignSignatureCompleted(leaseData: any, allPartiesData: any, propertyData: any) {
    console.log("🔔 Notification signature DocuSign complétée")

    // Notify all parties that the lease is fully signed
    for (const party of allPartiesData) {
      await this.createNotificationWithEmail(
        party.id,
        party.email,
        {
          title: "Bail entièrement signé",
          content: `Le bail pour ${propertyData.title} a été signé par toutes les parties`,
          type: "docusign_completed",
          action_url: `/leases/${leaseData.id}`,
        },
        "docusign_completed",
        {
          partyName: `${party.first_name} ${party.last_name}`,
          propertyTitle: propertyData.title,
          propertyAddress: `${propertyData.address}, ${propertyData.city}`,
          leaseUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/leases/${leaseData.id}`,
        },
      )
    }
  },
}

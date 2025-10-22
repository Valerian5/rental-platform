// /lib/email-service.ts

import { Resend } from "resend"
import React from "react"

// Importation de tous les templates d'email
import WelcomeEmail from "@/components/emails/welcome-email"
import PasswordResetEmail from "@/components/emails/password-reset-email"
import ApplicationReceivedEmail from "@/components/emails/application-received-email"
import ApplicationStatusUpdateEmail from "@/components/emails/application-status-update-email"
import ApplicationWithdrawnEmail from "@/components/emails/application-withdrawn-email"
import VisitProposalEmail from "@/components/emails/visit-proposal-email"
import VisitReminderEmail from "@/components/emails/visit-reminder-email"
import VisitScheduledEmail from "@/components/emails/VisitScheduledEmail"
import NewLeaseEmail from "@/components/emails/new-lease-email"
import RentReminderEmail from "@/components/emails/rent-reminder-email"
import PaymentConfirmationEmail from "@/components/emails/payment-confirmation-email"
import NewMessageNotificationEmail from "@/components/emails/new-message-notification-email"
import IncidentConfirmationEmail from "@/components/emails/incident-confirmation-email"
import IncidentResponseEmail from "@/components/emails/incident-response-email"
import IncidentInterventionScheduledEmail from "@/components/emails/incident-intervention-scheduled-email"
import IncidentCreatedNotificationEmail from "@/components/emails/incident-created-notification-email"
import SavedSearchAlertEmail from "@/components/emails/saved-search-alert-email"
import NewApplicationNotificationToOwnerEmail from "@/components/emails/new-application-notification-to-owner-email"
import InviteUserEmail from "@/components/emails/invite-user-email"
import DocumentReminderEmail from "@/components/emails/document-reminder-email"
import TenantConfirmedApplicationEmail from "@/components/emails/tenant-confirmed-application-email"
import TenantRefusedApplicationEmail from "@/components/emails/tenant-refused-application-email"
import WaitingTenantConfirmationEmail from "@/components/emails/waiting-tenant-confirmation-email"
import TenantConfirmedApplicationToOwnerEmail from "@/components/emails/tenant-confirmed-application-to-owner-email"
import TenantRefusedApplicationToOwnerEmail from "@/components/emails/tenant-refused-application-to-owner-email"
import SignatureRequiredEmail from "@/components/emails/signature-required-email"
import SignatureCompletedEmail from "@/components/emails/signature-completed-email"
import LeaseFullySignedEmail from "@/components/emails/lease-fully-signed-email"
import ChargeRegularizationEmail from "@/components/emails/charge-regularization-email"
import RentRevisionEmail from "@/components/emails/rent-revision-email"
import LeaseTenantReadyToSignEmail from "@/components/emails/lease-tenant-ready-to-sign"
import LeaseOwnerReadyToSignEmail from "@/components/emails/lease-owner-ready-to-sign"
import LeaseTenantOwnerSignedEmail from "@/components/emails/lease-tenant-owner-signed"
import LeaseOwnerTenantSignedEmail from "@/components/emails/lease-owner-tenant-signed"
import LeaseTenantFinalizedEmail from "@/components/emails/lease-tenant-finalized"
import LeaseOwnerFinalizedEmail from "@/components/emails/lease-owner-finalized"
import EdlTenantFinalizedEmail from "@/components/emails/edl-tenant-finalized"
import EdlExitSlotsProposalEmailSimple from "@/components/emails/edl-exit-slots-proposal-email-simple"
import EdlExitSlotConfirmedEmailSimple from "@/components/emails/edl-exit-slot-confirmed-email-simple"
import TenantDocumentUploadedEmail from "@/components/emails/tenant-document-uploaded-email"


// --- CONFIG EXPÉDITEUR ---
const DEFAULT_FROM = "Louer Ici <notifications@louerici.fr>"
const fromEmail = DEFAULT_FROM

// --- LAZY RESEND CLIENT (runtime guard) ---
let resendClient: Resend | null = null

function getResend(): Resend {
	if (typeof window !== "undefined") {
		throw new Error("Email service must be used on the server only.")
	}
	if (!process.env.RESEND_API_KEY) {
		throw new Error("RESEND_API_KEY non défini")
	}
	if (!resendClient) {
		resendClient = new Resend(process.env.RESEND_API_KEY)
	}
	return resendClient
}

// --- TYPES ET ENUMS ---

export enum NotificationType {
  NEW_MESSAGE = "newMessage",
  APPLICATION_STATUS_UPDATE = "applicationStatusUpdate",
  VISIT_REMINDER = "visitReminder",
  RENT_REMINDER = "rentReminder",
  SAVED_SEARCH_ALERT = "savedSearchAlert",
  NEW_APPLICATION = "newApplication",
  INCIDENT_REPORTED = "incidentReported",
  INCIDENT_RESPONSE = "incidentResponse",
  DOCUSIGN_SIGNATURE_REQUEST = "docuSignSignatureRequest",
  DOCUSIGN_COMPLETED = "docuSignCompleted",
  LEASE_DOCUMENT_SHARED = "leaseDocumentShared",
  ADMIN_INVITATION = "adminInvitation",
  DOCUMENT_REMINDER = "documentReminder",
  CHARGE_REGULARIZATION = "chargeRegularization",
  RENT_REVISION = "rentRevision",
  TENANT_DOCUMENT_UPLOADED = "tenantDocumentUploaded",
}

export type NotificationSettings = {
  [key in NotificationType]?: boolean
}

export type User = {
  id: string
  name: string | null
  email: string
  notificationSettings?: NotificationSettings
}

export type Property = {
  id: string
  title: string
  address: string
}

export type Visit = {
  date: Date
  property: Property
}

// --- SERVICE PRINCIPAL ---

async function sendEmail(
  user: { email: string; notificationSettings?: NotificationSettings },
  notificationType: NotificationType | null,
  subject: string,
  reactElement: React.ReactElement,
) {
  if (typeof window !== "undefined") {
    throw new Error("sendEmail must be called on the server only.")
  }

  if (!fromEmail) {
    console.error("EMAIL_FROM n'est pas défini.")
    throw new Error("Configuration email incomplète.")
  }

  if (notificationType && user.notificationSettings?.[notificationType] === false) {
    console.log(`Notification ${notificationType} bloquée par les préférences de l'utilisateur ${user.email}.`)
    return
  }

  try {
    const resend = getResend()

    const payload = {
      from: fromEmail,
      to: user.email,
      subject,
      react: reactElement,
    }

    const { data, error } = await resend.emails.send(payload)

    if (error) throw error

    console.log(`✅ Email '${subject}' envoyé à ${user.email}. ID: ${data?.id}`)
    return data
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi de l'email à ${user.email}:`, error)
    throw error
  }
}

// --- NOTIFICATIONS POUR TOUS LES UTILISATEURS ---

export async function sendWelcomeEmail(user: User, logoUrl?: string) {
  await sendEmail(user, null, "Bienvenue sur Louer-Ici !", WelcomeEmail({ userName: user.name, logoUrl }))
}

export async function sendPasswordResetEmail(user: User, resetLink: string, logoUrl?: string) {
  await sendEmail(user, null, "Réinitialisation de votre mot de passe", PasswordResetEmail({ resetLink, logoUrl }))
}

// --- NOTIFICATIONS POUR LES LOCATAIRES (TENANT) ---

export async function sendApplicationReceivedEmail(user: User, property: Property, logoUrl?: string) {
  await sendEmail(
    user,
    null,
    "Votre candidature a bien été reçue !",
    ApplicationReceivedEmail({ userName: user.name, propertyTitle: property.title, logoUrl }),
  )
}

export async function sendApplicationStatusUpdateEmail(
  user: User,
  property: Property,
  status: string,
  logoUrl?: string,
) {
  const statusMessages = {
    pending: "en attente",
    under_review: "en cours d'analyse",
    accepted: "acceptée",
    rejected: "refusée",
    withdrawn: "retirée",
    "en analyse": "en cours d'analyse",
    "acceptée": "acceptée",
    "refusée": "refusée",
  }

  const statusText = statusMessages[status as keyof typeof statusMessages] || status

  await sendEmail(
    user,
    NotificationType.APPLICATION_STATUS_UPDATE,
    `Votre candidature pour "${property.title}" est ${statusText}`,
    ApplicationStatusUpdateEmail({ userName: user.name, propertyTitle: property.title, status: statusText, logoUrl }),
  )
}

export async function sendApplicationWithdrawnEmail(user: User, property: Property, logoUrl?: string) {
  await sendEmail(
    user,
    null,
    `Votre candidature pour ${property.title} a été retirée`,
    ApplicationWithdrawnEmail({
      userName: user.name,
      propertyTitle: property.title,
      logoUrl,
    }),
  )
}

export async function sendVisitProposalEmail(user: User, property: Property, visitSlots: Date[], logoUrl?: string) {
  await sendEmail(
    user,
    null,
    `Proposition de visite pour ${property.title}`,
    VisitProposalEmail({ userName: user.name, propertyTitle: property.title, visitSlots, logoUrl }),
  )
}

export async function sendVisitReminderEmail(user: User, visit: Visit, logoUrl?: string) {
  const formattedDate = visit.date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  await sendEmail(
    user,
    NotificationType.VISIT_REMINDER,
    `Rappel de votre visite pour "${visit.property.title}"`,
    VisitReminderEmail({ userName: user.name, visitDate: formattedDate, property: visit.property, logoUrl }),
  )
}

export async function sendNewLeaseEmail(user: User, property: Property, leaseUrl: string, logoUrl?: string) {
  await sendEmail(
    user,
    null,
    `Votre bail pour "${property.title}" est prêt`,
    NewLeaseEmail({ userName: user.name, propertyTitle: property.title, leaseUrl, logoUrl }),
  )
}

export async function sendRentReminderEmail(user: User, amount: number, dueDate: string, logoUrl?: string) {
  await sendEmail(
    user,
    NotificationType.RENT_REMINDER,
    "Rappel de paiement de votre loyer",
    RentReminderEmail({ userName: user.name, amount, dueDate, logoUrl }),
  )
}

export async function sendPaymentConfirmationEmail(user: User, amount: number, receiptUrl: string, logoUrl?: string) {
  await sendEmail(
    user,
    null,
    "Confirmation de votre paiement de loyer",
    PaymentConfirmationEmail({ userName: user.name, amount, receiptUrl, logoUrl }),
  )
}

export async function sendNewMessageNotificationEmail(user: User, senderName: string, logoUrl?: string) {
  await sendEmail(
    user,
    NotificationType.NEW_MESSAGE,
    `Nouveau message de ${senderName}`,
    NewMessageNotificationEmail({ userName: user.name, senderName, logoUrl }),
  )
}



export async function sendSavedSearchAlertEmail(user: User, newProperties: Property[], logoUrl?: string) {
  await sendEmail(
    user,
    NotificationType.SAVED_SEARCH_ALERT,
    "De nouveaux biens correspondent à votre recherche !",
    SavedSearchAlertEmail({ userName: user.name, properties: newProperties, logoUrl }),
  )
}

export async function sendDocumentReminderEmail(
  user: User,
  propertyTitle: string,
  missingDocuments: string[],
  logoUrl?: string
) {
  await sendEmail(
    user,
    NotificationType.DOCUMENT_REMINDER,
    "Rappel : Documents obligatoires à fournir",
    DocumentReminderEmail({
      userName: user.name,
      propertyTitle,
      missingDocuments,
      logoUrl
    }),
  )
}

// --- NOTIFICATIONS POUR LES PROPRIÉTAIRES / AGENCES (OWNER / AGENCY) ---

export async function sendNewApplicationNotificationToOwner(
  owner: User,
  tenant: User,
  property: Property,
  logoUrl?: string,
) {
  await sendEmail(
    owner,
    NotificationType.NEW_APPLICATION,
    `Nouvelle candidature pour : ${property.title}`,
    NewApplicationNotificationToOwnerEmail({
      ownerName: owner.name,
      tenantName: tenant.name,
      propertyTitle: property.title,
      logoUrl,
    }),
  )
}

export async function sendNewIncidentAlertToOwner(
  owner: User,
  tenant: User,
  property: Property,
  incidentTitle: string,
  logoUrl?: string,
) {
  await sendEmail(
    owner,
    NotificationType.INCIDENT_REPORTED,
    `Nouvel incident signalé pour ${property.title}`,
    React.createElement("div", {}, [
      React.createElement("h2", { key: "title" }, "Nouvel incident signalé"),
      React.createElement("p", { key: "greeting" }, `Bonjour ${owner.name},`),
      React.createElement(
        "p",
        { key: "content" },
        `${tenant.name} a signalé un incident: "${incidentTitle}" pour le bien ${property.title}.`,
      ),
    ]),
  )
}

// --- Préavis de départ (email propriétaire) ---
export async function sendTenantNoticeToOwnerEmail(
  owner: User,
  tenant: User,
  property: Property,
  moveOutDate: string,
  previewHtml?: string,
  logoUrl?: string,
) {
  const ReactEmail = (await import("@/components/emails/TenantNoticeToOwnerEmail")).default
  await sendEmail(
    owner,
    NotificationType.INCIDENT_REPORTED, // TODO: créer un type spécifique si nécessaire
    `Préavis de départ reçu - ${property.title}`,
    React.createElement(ReactEmail, {
      ownerName: owner.name,
      tenantName: tenant.name,
      propertyTitle: property.title,
      propertyAddress: property.address,
      moveOutDate: new Date(moveOutDate).toLocaleDateString('fr-FR'),
      previewSnippet: previewHtml,
    }),
  )
}

export async function sendInviteUserEmail(email: string, agencyName: string, inviteLink: string, logoUrl?: string) {
  await sendEmail(
    { email },
    null,
    `Invitation à rejoindre ${agencyName} sur Louer-Ici`,
    InviteUserEmail({ agencyName, inviteLink, logoUrl }),
  )
}

// --- NOTIFICATIONS SPECIFIQUES ---

export async function sendDocuSignSignatureRequestEmail(
  user: User,
  property: Property,
  signingUrl: string,
  logoUrl?: string,
) {
  await sendEmail(
    user,
    NotificationType.DOCUSIGN_SIGNATURE_REQUEST,
    `Signature électronique requise pour "${property.title}"`,
    React.createElement("div", {}, [
      React.createElement("h2", { key: "title" }, "Signature électronique requise"),
      React.createElement("p", { key: "greeting" }, `Bonjour ${user.name},`),
      React.createElement(
        "p",
        { key: "content" },
        `Votre bail pour "${property.title}" est prêt à être signé électroniquement.`,
      ),
      React.createElement(
        "a",
        {
          key: "button",
          href: signingUrl,
          style: {
            backgroundColor: "#007bff",
            color: "white",
            padding: "12px 24px",
            textDecoration: "none",
            borderRadius: "5px",
            display: "inline-block",
            marginTop: "20px",
          },
        },
        "Signer le document",
      ),
      React.createElement("p", { key: "footer" }, "Ce lien de signature est sécurisé et personnel."),
    ]),
  )
}

export async function sendDocuSignCompletedEmail(user: User, property: Property, logoUrl?: string) {
  await sendEmail(
    user,
    NotificationType.DOCUSIGN_COMPLETED,
    `Signature complétée pour "${property.title}"`,
    React.createElement("div", {}, [
      React.createElement("h2", { key: "title" }, "Signature complétée avec succès"),
      React.createElement("p", { key: "greeting" }, `Bonjour ${user.name},`),
      React.createElement(
        "p",
        { key: "content" },
        `Le bail pour "${property.title}" a été signé par toutes les parties.`,
      ),
      React.createElement(
        "p",
        { key: "next" },
        "Votre bail est maintenant actif. Vous recevrez une copie signée par email.",
      ),
    ]),
  )
}

export async function sendLeaseDocumentEmail(user: User, property: Property, documentUrl: string, logoUrl?: string) {
  await sendEmail(
    user,
    NotificationType.LEASE_DOCUMENT_SHARED,
    `Document de bail - "${property.title}"`,
    React.createElement("div", {}, [
      React.createElement("h2", { key: "title" }, "Votre document de bail"),
      React.createElement("p", { key: "greeting" }, `Bonjour ${user.name},`),
      React.createElement(
        "p",
        { key: "content" },
        `Veuillez trouver ci-joint votre document de bail pour "${property.title}".`,
      ),
      React.createElement(
        "a",
        {
          key: "button",
          href: documentUrl,
          style: {
            backgroundColor: "#28a745",
            color: "white",
            padding: "12px 24px",
            textDecoration: "none",
            borderRadius: "5px",
            display: "inline-block",
            marginTop: "20px",
          },
        },
        "Télécharger le document",
      ),
    ]),
  )
}

export async function sendAdminInvitationEmail(
  email: string,
  invitationLink: string,
  inviterName: string,
  logoUrl?: string,
) {
  await sendEmail(
    { email },
    NotificationType.ADMIN_INVITATION,
    "Invitation administrateur - Louer Ici",
    React.createElement("div", {}, [
      React.createElement("h2", { key: "title" }, "Invitation administrateur"),
      React.createElement("p", { key: "greeting" }, "Bonjour,"),
      React.createElement(
        "p",
        { key: "content" },
        `${inviterName} vous invite à rejoindre l'équipe d'administration de Louer Ici.`,
      ),
      React.createElement(
        "a",
        {
          key: "button",
          href: invitationLink,
          style: {
            backgroundColor: "#007bff",
            color: "white",
            padding: "12px 24px",
            textDecoration: "none",
            borderRadius: "5px",
            display: "inline-block",
            marginTop: "20px",
          },
        },
        "Accepter l'invitation",
      ),
      React.createElement(
        "p",
        { key: "footer", style: { fontSize: "12px", color: "#666", marginTop: "20px" } },
        "Ce lien expire dans 7 jours.",
      ),
    ]),
  )
}

export async function sendWaitingTenantConfirmationEmailToTenant(
  tenant: User,
  property: Property,
  confirmUrl: string,
  ownerName?: string,
  logoUrl?: string,
) {
  await sendEmail(
    tenant,
    NotificationType.APPLICATION_STATUS_UPDATE,
    `Votre candidature pour "${property.title}" a été acceptée !`,
    WaitingTenantConfirmationEmail({
      tenantName: tenant.name,
      propertyTitle: property.title,
      confirmUrl,
      ownerName,
      logoUrl,
    }),
  )
}

export async function sendTenantConfirmedApplicationEmailToOwner(
  owner: User,
  tenantName: string,
  property: Property,
  manageUrl: string,
  logoUrl?: string,
) {
  await sendEmail(
    owner,
    NotificationType.APPLICATION_STATUS_UPDATE,
    `Le locataire a confirmé pour "${property.title}"`,
    TenantConfirmedApplicationToOwnerEmail({
      ownerName: owner.name,
      tenantName,
      propertyTitle: property.title,
      manageUrl,
      logoUrl,
    }),
  )
}

export async function sendTenantRefusedApplicationEmailToOwner(
  owner: User,
  tenantName: string,
  property: Property,
  reason: string | undefined,
  manageUrl: string,
  logoUrl?: string,
) {
  await sendEmail(
    owner,
    NotificationType.APPLICATION_STATUS_UPDATE,
    `Le locataire a refusé pour "${property.title}"`,
    TenantRefusedApplicationToOwnerEmail({
      ownerName: owner.name,
      tenantName,
      propertyTitle: property.title,
      reason,
      manageUrl,
      logoUrl,
    }),
  )
}

export async function sendVisitScheduledEmailToTenant(
  user: User,
  property: Property,
  visitDate: Date,
  logoUrl?: string,
) {
  await sendEmail(
    user,
    null,
    `Votre visite pour "${property.title}" est confirmée`,
    VisitScheduledEmail({
      userName: user.name,
      visitDate: visitDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      property,
      logoUrl,
    }),
  )
}

export async function sendVisitScheduledEmailToOwner(
  owner: User,
  property: Property,
  payload: { tenantName: string; visitDate: Date },
  logoUrl?: string,
) {
  await sendEmail(
    owner,
    null,
    `Visite programmée pour "${property.title}"`,
    React.createElement("div", {}, [
      React.createElement("h2", { key: "t" }, "Nouvelle visite programmée"),
      React.createElement("p", { key: "p1" }, `Bonjour ${owner.name},`),
      React.createElement(
        "p",
        { key: "p2" },
        `Une visite a été confirmée pour "${property.title}" avec ${payload.tenantName} le ${payload.visitDate.toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}.`,
      ),
    ]),
  )
}

export async function sendTenantConfirmedApplicationEmailToTenant(
  tenant: User,
  property: Property,
  logoUrl?: string,
) {
  await sendEmail(
    tenant,
    NotificationType.APPLICATION_STATUS_UPDATE,
    `Vous avez confirmé vouloir louer "${property.title}"`,
    TenantConfirmedApplicationEmail({ tenantName: tenant.name, propertyTitle: property.title })
  )
}

export async function sendTenantRefusedApplicationEmailToTenant(
  tenant: User,
  property: Property,
  reason: string | undefined,
  logoUrl?: string,
) {
  await sendEmail(
    tenant,
    NotificationType.APPLICATION_STATUS_UPDATE,
    `Vous avez refusé la location pour "${property.title}"`,
    TenantRefusedApplicationEmail({ tenantName: tenant.name, propertyTitle: property.title, reason })
  )
}

// Emails pour le workflow de signatures
export async function sendSignatureRequiredEmail(
  user: User,
  property: Property,
  signatureMethod: "electronic" | "manual_physical" | "manual_remote",
  leaseUrl: string,
  logoUrl?: string,
) {
  await sendEmail(
    user,
    NotificationType.LEASE_STATUS_UPDATE,
    `Signature de bail requise pour "${property.title}"`,
    SignatureRequiredEmail({
      userName: user.name,
      propertyTitle: property.title,
      propertyAddress: property.address,
      signatureMethod,
      leaseUrl,
      logoUrl,
    })
  )
}

export async function sendSignatureCompletedEmail(
  user: User,
  property: Property,
  signerType: "owner" | "tenant",
  leaseUrl: string,
  logoUrl?: string,
) {
  await sendEmail(
    user,
    NotificationType.LEASE_STATUS_UPDATE,
    `Signature reçue pour "${property.title}"`,
    SignatureCompletedEmail({
      userName: user.name,
      propertyTitle: property.title,
      propertyAddress: property.address,
      signerType,
      leaseUrl,
      logoUrl,
    })
  )
}

export async function sendLeaseFullySignedEmail(
  user: User,
  property: Property,
  leaseUrl: string,
  logoUrl?: string,
) {
  await sendEmail(
    user,
    NotificationType.LEASE_STATUS_UPDATE,
    `Bail entièrement signé pour "${property.title}"`,
    LeaseFullySignedEmail({
      userName: user.name,
      propertyTitle: property.title,
      propertyAddress: property.address,
      leaseUrl,
      logoUrl,
    })
  )
}

// --- EMAILS BAIL / SIGNATURES DÉDIÉS ---

export async function sendLeaseTenantReadyToSignEmail(tenant: User, property: Property, leaseId: string) {
  await sendEmail(
    tenant,
    NotificationType.DOCUSIGN_SIGNATURE_REQUEST,
    "Votre bail est prêt à être signé",
    LeaseTenantReadyToSignEmail({ tenantName: tenant.name || "", propertyTitle: property.title, leaseId }),
  )
}

export async function sendLeaseOwnerReadyToSignEmail(owner: User, property: Property, leaseId: string) {
  await sendEmail(
    owner,
    NotificationType.DOCUSIGN_SIGNATURE_REQUEST,
    "Votre bail est prêt à être signé",
    LeaseOwnerReadyToSignEmail({ ownerName: owner.name || "", propertyTitle: property.title, leaseId }),
  )
}

export async function sendLeaseTenantOwnerSignedEmail(tenant: User, property: Property, leaseId: string) {
  await sendEmail(
    tenant,
    NotificationType.DOCUSIGN_SIGNATURE_REQUEST,
    "Le propriétaire a signé le bail",
    LeaseTenantOwnerSignedEmail({ tenantName: tenant.name || "", propertyTitle: property.title, leaseId }),
  )
}

export async function sendLeaseOwnerTenantSignedEmail(owner: User, property: Property, leaseId: string) {
  await sendEmail(
    owner,
    NotificationType.DOCUSIGN_SIGNATURE_REQUEST,
    "Le locataire a signé le bail",
    LeaseOwnerTenantSignedEmail({ ownerName: owner.name || "", propertyTitle: property.title, leaseId }),
  )
}

export async function sendLeaseTenantFinalizedEmail(tenant: User, property: Property, leaseId: string) {
  await sendEmail(
    tenant,
    NotificationType.DOCUSIGN_COMPLETED,
    "Votre bail signé est disponible",
    LeaseTenantFinalizedEmail({ tenantName: tenant.name || "", propertyTitle: property.title, leaseId }),
  )
}

export async function sendLeaseOwnerFinalizedEmail(owner: User, property: Property, leaseId: string) {
  await sendEmail(
    owner,
    NotificationType.DOCUSIGN_COMPLETED,
    "Votre bail signé est disponible",
    LeaseOwnerFinalizedEmail({ ownerName: owner.name || "", propertyTitle: property.title, leaseId }),
  )
}

// --- EMAIL EDL SIGNÉ ---
export async function sendEdlTenantFinalizedEmail(
  tenant: User,
  property: Property,
  documentUrl: string,
  leaseId: string,
  logoUrl?: string,
) {
  await sendEmail(
    tenant,
    NotificationType.DOCUSIGN_COMPLETED,
    "Votre état des lieux signé est disponible",
    EdlTenantFinalizedEmail({ tenantName: tenant.name || "", propertyTitle: property.title, leaseId, documentUrl }),
  )
}

// --- NOTIFICATIONS POUR RÉGULARISATIONS ---

export async function sendChargeRegularizationEmail(
  user: User,
  property: Property,
  year: number,
  balance: number,
  balanceType: 'refund' | 'additional_payment',
  pdfUrl: string,
  logoUrl?: string,
) {
  await sendEmail(
    user,
    NotificationType.CHARGE_REGULARIZATION,
    `Régularisation des charges ${year} - ${property.title}`,
    ChargeRegularizationEmail({
      tenantName: user.name,
      propertyTitle: property.title,
      year,
      balance,
      balanceType,
      pdfUrl,
      logoUrl,
    })
  )
}

export async function sendRentRevisionEmail(
  user: User,
  property: Property,
  year: number,
  oldRent: number,
  newRent: number,
  increase: number,
  increasePercentage: number,
  pdfUrl: string,
  logoUrl?: string,
) {
  await sendEmail(
    user,
    NotificationType.RENT_REVISION,
    `Révision de loyer ${year} - ${property.title}`,
    RentRevisionEmail({
      tenantName: user.name,
      propertyTitle: property.title,
      year,
      oldRent,
      newRent,
      increase,
      increasePercentage,
      pdfUrl,
      logoUrl,
    })
  )
}

// ====================================
// EDL DE SORTIE - PROPOSITION DE CRÉNEAUX
// ====================================
export async function sendEdlExitSlotsProposalEmail(
  user: { id: string; name: string; email: string },
  property: { id: string; title: string; address: string },
  slots: Array<{ date: string; start_time: string; end_time: string }>,
  leaseId: string,
  logoUrl?: string,
) {
  return await sendEmail(
    user,
    "edl_exit_slots_proposal",
    "🏠 Créneaux proposés pour l'état des lieux de sortie",
    React.createElement(EdlExitSlotsProposalEmailSimple, {
      tenantName: user.name,
      propertyTitle: property.title,
      propertyAddress: property.address,
      slots: slots,
      leaseId: leaseId,
    }),
    logoUrl,
  )
}

// ====================================
// EDL DE SORTIE - CRÉNEAU CONFIRMÉ
// ====================================
export async function sendEdlExitSlotConfirmedEmail(
  user: { id: string; name: string; email: string },
  tenantName: string,
  property: { id: string; title: string; address: string },
  selectedSlot: { date: string; start_time: string; end_time: string },
  leaseId: string,
  logoUrl?: string,
) {
  return await sendEmail(
    user,
    "edl_exit_slot_confirmed",
    "✅ Créneau EDL de sortie confirmé",
    React.createElement(EdlExitSlotConfirmedEmailSimple, {
      ownerName: user.name,
      tenantName: tenantName,
      propertyTitle: property.title,
      propertyAddress: property.address,
      selectedSlot: selectedSlot,
      leaseId: leaseId,
    }),
    logoUrl,
  )
}

// ====================================
// INCIDENTS - NOTIFICATIONS
// ====================================

// Export du service email
export const emailService = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendApplicationReceivedEmail,
  sendApplicationStatusUpdateEmail,
  sendApplicationWithdrawnEmail,
  sendVisitProposalEmail,
  sendVisitReminderEmail,
  sendNewLeaseEmail,
  sendRentReminderEmail,
  sendPaymentConfirmationEmail,
  sendNewMessageNotificationEmail,
  sendSavedSearchAlertEmail,
  sendDocumentReminderEmail,
  sendNewApplicationNotificationToOwner,
  sendNewIncidentAlertToOwner,
  sendTenantNoticeToOwnerEmail,
  sendInviteUserEmail,
  sendDocuSignSignatureRequestEmail,
  sendDocuSignCompletedEmail,
  sendLeaseDocumentEmail,
  sendAdminInvitationEmail,
  sendWaitingTenantConfirmationEmailToTenant,
  sendTenantConfirmedApplicationEmailToOwner,
  sendTenantRefusedApplicationEmailToOwner,
  sendVisitScheduledEmailToTenant,
  sendVisitScheduledEmailToOwner,
  sendTenantConfirmedApplicationEmailToTenant,
  sendTenantRefusedApplicationEmailToTenant,
  sendSignatureRequiredEmail,
  sendSignatureCompletedEmail,
  sendLeaseFullySignedEmail,
  sendLeaseTenantReadyToSignEmail,
  sendLeaseOwnerReadyToSignEmail,
  sendLeaseTenantOwnerSignedEmail,
  sendLeaseOwnerTenantSignedEmail,
  sendLeaseTenantFinalizedEmail,
  sendLeaseOwnerFinalizedEmail,
  sendEdlTenantFinalizedEmail,
  sendChargeRegularizationEmail,
  sendRentRevisionEmail,
  sendEdlExitSlotsProposalEmail,
  sendEdlExitSlotConfirmedEmail,
  sendIncidentConfirmationEmail,
  sendIncidentCreatedNotificationEmail,
  sendIncidentResponseEmail,
  sendIncidentInterventionScheduledEmail,
  sendTenantDocumentUploadedEmail,
}

export async function sendIncidentConfirmationEmail(
  user: { id: string; name: string; email: string },
  property: { id: string; title: string },
  logoUrl?: string,
) {
  return await sendEmail(
    user,
    null,
    "✅ Incident signalé avec succès",
    React.createElement(IncidentConfirmationEmail, {
      userName: user.name,
      propertyTitle: property.title,
      logoUrl,
    }),
  )
}

export async function sendIncidentCreatedNotificationEmail(
  user: { id: string; name: string; email: string },
  tenant: { id: string; name: string },
  incident: { id: string; title: string; description: string; category: string },
  property: { id: string; title: string },
  incidentUrl: string,
  logoUrl?: string,
) {
  return await sendEmail(
    user,
    null,
    "🚨 Nouvel incident signalé",
    React.createElement(IncidentCreatedNotificationEmail, {
      ownerName: user.name,
      tenantName: tenant.name,
      incidentTitle: incident.title,
      propertyTitle: property.title,
      description: incident.description,
      category: incident.category,
      incidentUrl,
      logoUrl,
    }),
  )
}

export async function sendIncidentResponseEmail(
  user: { id: string; name: string; email: string },
  responder: { id: string; name: string },
  incident: { id: string; title: string },
  property: { id: string; title: string },
  message: string,
  incidentUrl: string,
  logoUrl?: string,
) {
  return await sendEmail(
    user,
    null,
    "💬 Réponse à votre incident",
    React.createElement(IncidentResponseEmail, {
      userName: user.name,
      responderName: responder.name,
      incidentTitle: incident.title,
      propertyTitle: property.title,
      message,
      logoUrl,
    }),
  )
}

export async function sendIncidentInterventionScheduledEmail(
  user: { id: string; name: string; email: string },
  incident: { id: string; title: string },
  property: { id: string; title: string },
  intervention: {
    scheduledDate: string;
    description: string;
    providerName?: string;
    providerContact?: string;
  },
  incidentUrl: string,
  logoUrl?: string,
) {
  return await sendEmail(
    user,
    null,
    "📅 Intervention programmée",
    React.createElement(IncidentInterventionScheduledEmail, {
      tenantName: user.name,
      incidentTitle: incident.title,
      propertyTitle: property.title,
      scheduledDate: intervention.scheduledDate,
      description: intervention.description,
      providerName: intervention.providerName,
      providerContact: intervention.providerContact,
      incidentUrl,
      logoUrl,
    }),
  )
}

// ====================================
// DOCUMENTS LOCATAIRES - NOTIFICATIONS
// ====================================

export async function sendTenantDocumentUploadedEmail(
  owner: { id: string; name: string; email: string },
  tenant: { id: string; name: string },
  document: { id: string; title: string; type: string; url: string },
  property: { id: string; title: string; address: string },
  logoUrl?: string,
) {
  await sendEmail(
    { email: owner.email, notificationSettings: { [NotificationType.TENANT_DOCUMENT_UPLOADED]: true } },
    NotificationType.TENANT_DOCUMENT_UPLOADED,
    `Nouveau document transmis par votre locataire - ${property.title}`,
    TenantDocumentUploadedEmail({
      ownerName: owner.name,
      tenantName: tenant.name,
      documentTitle: document.title,
      documentType: document.type,
      propertyTitle: property.title,
      propertyAddress: property.address,
      logoUrl,
    })
  )
}
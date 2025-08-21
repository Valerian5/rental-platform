// /lib/email-service.ts

import { Resend } from 'resend';
import React from 'react';

// Importation de tous les templates d'email
import WelcomeEmail from '@/components/emails/welcome-email';
import PasswordResetEmail from '@/components/emails/password-reset-email';
import ApplicationReceivedEmail from '@/components/emails/application-received-email';
import ApplicationStatusUpdateEmail from '@/components/emails/application-status-update-email';
import VisitProposalEmail from '@/components/emails/visit-proposal-email';
import VisitReminderEmail from '@/components/emails/visit-reminder-email';
import NewLeaseEmail from '@/components/emails/new-lease-email';
import RentReminderEmail from '@/components/emails/rent-reminder-email';
import PaymentConfirmationEmail from '@/components/emails/payment-confirmation-email';
import NewMessageNotificationEmail from '@/components/emails/new-message-notification-email';
import IncidentConfirmationEmail from '@/components/emails/incident-confirmation-email';
import SavedSearchAlertEmail from '@/components/emails/saved-search-alert-email';
import NewApplicationNotificationToOwnerEmail from '@/components/emails/new-application-notification-to-owner-email';
import InviteUserEmail from '@/components/emails/invite-user-email';


// Initialisation du client Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.EMAIL_FROM;

// --- TYPES ET ENUMS ---

export enum NotificationType {
  NEW_MESSAGE = 'newMessage',
  APPLICATION_STATUS_UPDATE = 'applicationStatusUpdate',
  VISIT_REMINDER = 'visitReminder',
  RENT_REMINDER = 'rentReminder',
  SAVED_SEARCH_ALERT = 'savedSearchAlert',
  NEW_APPLICATION = 'newApplication',
  INCIDENT_REPORTED = 'incidentReported',
}

export type NotificationSettings = {
  [key in NotificationType]?: boolean;
};

export type User = {
  id: string;
  name: string | null;
  email: string;
  notificationSettings?: NotificationSettings;
};

export type Property = {
  id: string;
  title: string;
  address: string;
};

export type Visit = {
  date: Date;
  property: Property;
};

// --- SERVICE PRINCIPAL ---

async function sendEmail(
  user: { email: string; notificationSettings?: NotificationSettings },
  notificationType: NotificationType | null,
  subject: string,
  reactElement: React.ReactElement
) {
  if (!fromEmail) {
    console.error("EMAIL_FROM n'est pas défini.");
    throw new Error("Configuration email incomplète.");
  }

  if (notificationType && user.notificationSettings?.[notificationType] === false) {
    console.log(`Notification ${notificationType} bloquée par les préférences de l'utilisateur ${user.email}.`);
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: user.email,
      subject,
      react: reactElement,
    });

    if (error) throw error;

    console.log(`Email '${subject}' envoyé à ${user.email}. ID: ${data?.id}`);
    return data;
  } catch (error) {
    console.error(`Erreur lors de l'envoi de l'email à ${user.email}:`, error);
    throw error;
  }
}

// --- NOTIFICATIONS POUR TOUS LES UTILISATEURS ---

export async function sendWelcomeEmail(user: User, logoUrl?: string) {
  await sendEmail(user, null, 'Bienvenue sur Louer-Ici !', WelcomeEmail({ userName: user.name, logoUrl }));
}

export async function sendPasswordResetEmail(user: User, resetLink: string, logoUrl?: string) {
  await sendEmail(user, null, 'Réinitialisation de votre mot de passe', PasswordResetEmail({ resetLink, logoUrl }));
}

// --- NOTIFICATIONS POUR LES LOCATAIRES (TENANT) ---

export async function sendApplicationReceivedEmail(user: User, property: Property, logoUrl?: string) {
  await sendEmail(user, null, 'Votre candidature a bien été reçue !', ApplicationReceivedEmail({ userName: user.name, propertyTitle: property.title, logoUrl }));
}

export async function sendApplicationStatusUpdateEmail(user: User, property: Property, status: 'Acceptée' | 'Refusée', logoUrl?: string) {
  await sendEmail(user, NotificationType.APPLICATION_STATUS_UPDATE, `Votre candidature pour "${property.title}" a été ${status.toLowerCase()}`, ApplicationStatusUpdateEmail({ userName: user.name, propertyTitle: property.title, status, logoUrl }));
}

export async function sendVisitProposalEmail(user: User, property: Property, visitSlots: Date[], logoUrl?: string) {
    await sendEmail(user, null, `Proposition de visite pour ${property.title}`, VisitProposalEmail({ userName: user.name, propertyTitle: property.title, visitSlots, logoUrl }));
}

export async function sendVisitReminderEmail(user: User, visit: Visit, logoUrl?: string) {
  const formattedDate = visit.date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  await sendEmail(user, NotificationType.VISIT_REMINDER, `Rappel de votre visite pour "${visit.property.title}"`, VisitReminderEmail({ userName: user.name, visitDate: formattedDate, property: visit.property, logoUrl }));
}

export async function sendNewLeaseEmail(user: User, property: Property, leaseUrl: string, logoUrl?: string) {
  await sendEmail(user, null, `Votre bail pour "${property.title}" est prêt`, NewLeaseEmail({ userName: user.name, propertyTitle: property.title, leaseUrl, logoUrl }));
}

export async function sendRentReminderEmail(user: User, amount: number, dueDate: string, logoUrl?: string) {
  await sendEmail(user, NotificationType.RENT_REMINDER, 'Rappel de paiement de votre loyer', RentReminderEmail({ userName: user.name, amount, dueDate, logoUrl }));
}

export async function sendPaymentConfirmationEmail(user: User, amount: number, receiptUrl: string, logoUrl?: string) {
  await sendEmail(user, null, 'Confirmation de votre paiement de loyer', PaymentConfirmationEmail({ userName: user.name, amount, receiptUrl, logoUrl }));
}

export async function sendNewMessageNotificationEmail(user: User, senderName: string, logoUrl?: string) {
  await sendEmail(user, NotificationType.NEW_MESSAGE, `Nouveau message de ${senderName}`, NewMessageNotificationEmail({ userName: user.name, senderName, logoUrl }));
}

export async function sendIncidentConfirmationEmail(user: User, property: Property, logoUrl?: string) {
  await sendEmail(user, null, `Votre incident pour "${property.title}" a été signalé`, IncidentConfirmationEmail({ userName: user.name, propertyTitle: property.title, logoUrl }));
}

export async function sendSavedSearchAlertEmail(user: User, newProperties: Property[], logoUrl?: string) {
  await sendEmail(user, NotificationType.SAVED_SEARCH_ALERT, 'De nouveaux biens correspondent à votre recherche !', SavedSearchAlertEmail({ userName: user.name, properties: newProperties, logoUrl }));
}

// --- NOTIFICATIONS POUR LES PROPRIÉTAIRES / AGENCES (OWNER / AGENCY) ---

export async function sendNewApplicationNotificationToOwner(owner: User, tenant: User, property: Property, logoUrl?: string) {
  await sendEmail(owner, NotificationType.NEW_APPLICATION, `Nouvelle candidature pour : ${property.title}`, NewApplicationNotificationToOwnerEmail({ ownerName: owner.name, tenantName: tenant.name, propertyTitle: property.title, logoUrl }));
}

export async function sendNewIncidentAlertToOwner(owner: User, tenant: User, property: Property, incidentTitle: string, logoUrl?: string) {
  await sendEmail(owner, NotificationType.INCIDENT_REPORTED, `Nouvel incident signalé pour ${property.title}`, WelcomeEmail({ userName: `${tenant.name} a signalé un incident: "${incidentTitle}" pour le bien ${property.title}`, logoUrl })); // Placeholder
}

export async function sendInviteUserEmail(email: string, agencyName: string, inviteLink: string, logoUrl?: string) {
    await sendEmail({email}, null, `Invitation à rejoindre ${agencyName} sur Louer-Ici`, InviteUserEmail({ agencyName, inviteLink, logoUrl }));
}

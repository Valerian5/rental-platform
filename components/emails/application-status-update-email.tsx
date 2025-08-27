// /components/emails/application-status-update-email.tsx

import { Heading, Preview, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface ApplicationStatusUpdateEmailProps {
  userName: string | null;
  propertyTitle: string;
  status: string;
  logoUrl?: string;
}

export default function ApplicationStatusUpdateEmail({ userName, propertyTitle, status, logoUrl }: ApplicationStatusUpdateEmailProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'acceptée':
      case 'accepted':
        return {
          title: 'Votre candidature a été acceptée !',
          message: `Félicitations ! Votre candidature pour le bien "${propertyTitle}" a été acceptée. Le propriétaire ou l'agence vous contactera prochainement pour les prochaines étapes.`,
          color: '#28a745'
        };
      case 'refusée':
      case 'rejected':
        return {
          title: 'Votre candidature a été refusée',
          message: `Nous sommes au regret de vous informer que votre candidature pour le bien "${propertyTitle}" n'a pas été retenue. Nous vous encourageons à poursuivre vos recherches sur notre plateforme.`,
          color: '#dc3545'
        };
      case 'en attente':
      case 'pending':
        return {
          title: 'Votre candidature est en attente',
          message: `Votre candidature pour le bien "${propertyTitle}" est en attente de traitement. Nous vous tiendrons informé de l'évolution sous 48h.`,
          color: '#ffc107'
        };
      case 'en cours d\'analyse':
      case 'under_review':
        return {
          title: 'Votre candidature est en cours d\'analyse',
          message: `Votre candidature pour le bien "${propertyTitle}" est actuellement en cours d'analyse. Nous vous contacterons dès qu'une décision sera prise.`,
          color: '#17a2b8'
        };
      default:
        return {
          title: `Votre candidature est ${status}`,
          message: `Le statut de votre candidature pour le bien "${propertyTitle}" a été mis à jour : ${status}.`,
          color: '#6c757d'
        };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Mise à jour de votre candidature</Preview>
      <Heading style={{...h1, color: config.color}}>{config.title}</Heading>
      <Text style={text}>Bonjour {userName || ''},</Text>
      <Text style={text}>
        {config.message}
      </Text>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };

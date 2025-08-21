// /components/emails/application-status-update-email.tsx

import { Heading, Preview, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface ApplicationStatusUpdateEmailProps {
  userName: string | null;
  propertyTitle: string;
  status: 'Acceptée' | 'Refusée';
  logoUrl?: string;
}

export default function ApplicationStatusUpdateEmail({ userName, propertyTitle, status, logoUrl }: ApplicationStatusUpdateEmailProps) {
  const isAccepted = status === 'Acceptée';
  
  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Mise à jour de votre candidature</Preview>
      <Heading style={h1}>Votre candidature a été {isAccepted ? 'acceptée' : 'refusée'}</Heading>
      <Text style={text}>Bonjour {userName || ''},</Text>
      <Text style={text}>
        {isAccepted
          ? `Félicitations ! Votre candidature pour le bien "${propertyTitle}" a été acceptée. Le propriétaire ou l'agence vous contactera prochainement pour les prochaines étapes.`
          : `Nous sommes au regret de vous informer que votre candidature pour le bien "${propertyTitle}" n'a pas été retenue. Nous vous encourageons à poursuivre vos recherches sur notre plateforme.`}
      </Text>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };

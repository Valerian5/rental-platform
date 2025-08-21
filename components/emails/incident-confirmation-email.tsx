// /components/emails/incident-confirmation-email.tsx

import { Heading, Preview, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface IncidentConfirmationEmailProps {
  userName: string | null;
  propertyTitle: string;
  logoUrl?: string;
}

export default function IncidentConfirmationEmail({ userName, propertyTitle, logoUrl }: IncidentConfirmationEmailProps) {
  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Votre incident a bien été signalé</Preview>
      <Heading style={h1}>Incident signalé avec succès</Heading>
      <Text style={text}>Bonjour {userName || ''},</Text>
      <Text style={text}>
        Nous vous confirmons que votre incident concernant le bien <strong>"{propertyTitle}"</strong> a bien été transmis au propriétaire/gérant.
      </Text>
      <Text style={text}>
        Vous serez notifié(e) dès qu'une réponse sera apportée.
      </Text>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };

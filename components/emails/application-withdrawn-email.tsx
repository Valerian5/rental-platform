// /components/emails/application-withdrawn-email.tsx

import { Heading, Preview, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface ApplicationWithdrawnEmailProps {
  userName: string | null;
  propertyTitle: string;
  logoUrl?: string;
}

export default function ApplicationWithdrawnEmail({ userName, propertyTitle, logoUrl }: ApplicationWithdrawnEmailProps) {
  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Candidature retirée</Preview>
      <Heading style={h1}>Votre candidature a été retirée</Heading>
      <Text style={text}>Bonjour {userName || ''},</Text>
      <Text style={text}>
        Votre candidature pour le bien "{propertyTitle}" a été retirée avec succès.
      </Text>
      <Text style={text}>
        Vous pouvez toujours postuler à d'autres biens disponibles sur notre plateforme.
      </Text>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };
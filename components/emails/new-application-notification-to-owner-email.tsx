// /components/emails/new-application-notification-to-owner-email.tsx

import { Button, Heading, Preview, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface NewApplicationNotificationToOwnerEmailProps {
  ownerName: string | null;
  tenantName: string | null;
  propertyTitle: string;
  logoUrl?: string;
}

export default function NewApplicationNotificationToOwnerEmail({ ownerName, tenantName, propertyTitle, logoUrl }: NewApplicationNotificationToOwnerEmailProps) {
  const siteUrl = "https://rental-platform-h5sj.vercel.app";

  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Nouvelle candidature pour votre bien</Preview>
      <Heading style={h1}>Nouvelle candidature reçue !</Heading>
      <Text style={text}>Bonjour {ownerName || ''},</Text>
      <Text style={text}>
        Vous avez reçu une nouvelle candidature de <strong>{tenantName || 'un candidat'}</strong> pour votre bien : <strong>"{propertyTitle}"</strong>.
      </Text>
      <Button style={button} href={`${siteUrl}/owner/applications`}>
        Voir la candidature
      </Button>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };
const button = { backgroundColor: '#007bff', borderRadius: '5px', color: '#fff', fontSize: '16px', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '180px', padding: '12px', marginTop: '20px' };

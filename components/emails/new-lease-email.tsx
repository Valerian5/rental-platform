// /components/emails/new-lease-email.tsx

import { Button, Heading, Preview, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface NewLeaseEmailProps {
  userName: string | null;
  propertyTitle: string;
  leaseUrl: string;
  logoUrl?: string;
}

export default function NewLeaseEmail({ userName, propertyTitle, leaseUrl, logoUrl }: NewLeaseEmailProps) {
  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Votre bail pour "{propertyTitle}" est prêt</Preview>
      <Heading style={h1}>Votre bail est prêt à être signé</Heading>
      <Text style={text}>Bonjour {userName || ''},</Text>
      <Text style={text}>
        Votre bail pour le bien <strong>"{propertyTitle}"</strong> a été généré. Vous pouvez le consulter et le signer électroniquement en cliquant sur le bouton ci-dessous.
      </Text>
      <Button style={button} href={leaseUrl}>
        Consulter et signer mon bail
      </Button>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };
const button = { backgroundColor: '#007bff', borderRadius: '5px', color: '#fff', fontSize: '16px', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '250px', padding: '12px', marginTop: '20px' };

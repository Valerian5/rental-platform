// /components/emails/new-message-notification-email.tsx

import { Button, Heading, Preview, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface NewMessageNotificationEmailProps {
  userName: string | null;
  senderName: string;
  logoUrl?: string;
}

export default function NewMessageNotificationEmail({ userName, senderName, logoUrl }: NewMessageNotificationEmailProps) {
  const siteUrl = "https://rental-platform-h5sj.vercel.app";
  
  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Vous avez un nouveau message</Preview>
      <Heading style={h1}>Nouveau message de {senderName}</Heading>
      <Text style={text}>Bonjour {userName || ''},</Text>
      <Text style={text}>
        Vous avez reçu un nouveau message de <strong>{senderName}</strong> dans votre messagerie sécurisée sur Louer-Ici.
      </Text>
      <Button style={button} href={`${siteUrl}/messages`}>
        Lire le message
      </Button>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };
const button = { backgroundColor: '#007bff', borderRadius: '5px', color: '#fff', fontSize: '16px', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '160px', padding: '12px', marginTop: '20px' };

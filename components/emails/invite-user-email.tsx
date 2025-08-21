// /components/emails/invite-user-email.tsx

import { Button, Heading, Preview, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface InviteUserEmailProps {
  agencyName: string;
  inviteLink: string;
  logoUrl?: string;
}

export default function InviteUserEmail({ agencyName, inviteLink, logoUrl }: InviteUserEmailProps) {
  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Invitation à rejoindre {agencyName}</Preview>
      <Heading style={h1}>Vous êtes invité(e) !</Heading>
      <Text style={text}>
        Vous avez été invité(e) à rejoindre l'agence <strong>{agencyName}</strong> sur la plateforme Louer-Ici.
      </Text>
      <Text style={text}>
        Cliquez sur le bouton ci-dessous pour accepter l'invitation et créer votre compte.
      </Text>
      <Button style={button} href={inviteLink}>
        Accepter l'invitation
      </Button>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };
const button = { backgroundColor: '#28a745', borderRadius: '5px', color: '#fff', fontSize: '16px', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '200px', padding: '12px', marginTop: '20px' };

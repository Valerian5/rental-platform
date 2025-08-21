// /components/emails/rent-reminder-email.tsx

import { Button, Heading, Preview, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface RentReminderEmailProps {
  userName: string | null;
  amount: number;
  dueDate: string;
  logoUrl?: string;
}

export default function RentReminderEmail({ userName, amount, dueDate, logoUrl }: RentReminderEmailProps) {
  const siteUrl = "https://rental-platform-h5sj.vercel.app";

  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Rappel de paiement de votre loyer</Preview>
      <Heading style={h1}>Rappel de paiement</Heading>
      <Text style={text}>Bonjour {userName || ''},</Text>
      <Text style={text}>
        Ceci est un simple rappel pour le paiement de votre loyer d'un montant de <strong>{amount} €</strong>, attendu pour le <strong>{dueDate}</strong>.
      </Text>
      <Button style={button} href={`${siteUrl}/tenant/payments`}>
        Payer maintenant
      </Button>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };
const button = { backgroundColor: '#28a745', borderRadius: '5px', color: '#fff', fontSize: '16px', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '150px', padding: '12px', marginTop: '20px' };

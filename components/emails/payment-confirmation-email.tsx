// /components/emails/payment-confirmation-email.tsx

import { Button, Heading, Preview, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface PaymentConfirmationEmailProps {
  userName: string | null;
  amount: number;
  receiptUrl: string;
  logoUrl?: string;
}

export default function PaymentConfirmationEmail({ userName, amount, receiptUrl, logoUrl }: PaymentConfirmationEmailProps) {
  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Confirmation de votre paiement de {amount} €</Preview>
      <Heading style={h1}>Paiement reçu !</Heading>
      <Text style={text}>Bonjour {userName || ''},</Text>
      <Text style={text}>
        Nous vous confirmons la bonne réception de votre paiement de <strong>{amount} €</strong>.
      </Text>
      <Text style={text}>
        Vous pouvez télécharger votre quittance de loyer en cliquant sur le bouton ci-dessous.
      </Text>
      <Button style={button} href={receiptUrl}>
        Télécharger ma quittance
      </Button>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };
const button = { backgroundColor: '#007bff', borderRadius: '5px', color: '#fff', fontSize: '16px', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '200px', padding: '12px', marginTop: '20px' };

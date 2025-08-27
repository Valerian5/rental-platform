// /components/emails/incident-response-email.tsx

import { Heading, Preview, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface IncidentResponseEmailProps {
  userName: string | null;
  responderName: string;
  incidentTitle: string;
  propertyTitle: string;
  message: string;
  logoUrl?: string;
}

export default function IncidentResponseEmail({ 
  userName, 
  responderName, 
  incidentTitle, 
  propertyTitle,
  message,
  logoUrl 
}: IncidentResponseEmailProps) {
  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Réponse à votre incident</Preview>
      <Heading style={h1}>Réponse à votre incident</Heading>
      <Text style={text}>Bonjour {userName || ''},</Text>
      <Text style={text}>
        {responderName} a répondu à votre incident "{incidentTitle}" concernant le bien "{propertyTitle}".
      </Text>
      <Text style={responseText}>
        "{message}"
      </Text>
      <Text style={text}>
        Vous pouvez consulter et répondre à cet incident directement sur votre tableau de bord.
      </Text>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };
const responseText = { 
  color: '#333', 
  fontSize: '16px', 
  lineHeight: '24px',
  backgroundColor: '#f8f9fa',
  padding: '15px',
  borderRadius: '5px',
  margin: '20px 0',
  borderLeft: '4px solid #007bff'
};
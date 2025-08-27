// /components/emails/document-reminder-email.tsx

import { Heading, Preview, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface DocumentReminderEmailProps {
  userName: string | null;
  propertyTitle: string;
  missingDocuments: string[];
  logoUrl?: string;
}

export default function DocumentReminderEmail({ 
  userName, 
  propertyTitle, 
  missingDocuments, 
  logoUrl 
}: DocumentReminderEmailProps) {
  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Documents obligatoires à fournir</Preview>
      <Heading style={h1}>Rappel : Documents obligatoires</Heading>
      <Text style={text}>Bonjour {userName || ''},</Text>
      <Text style={text}>
        Pour compléter votre dossier de candidature pour le bien "{propertyTitle}", 
        nous avons besoin des documents suivants :
      </Text>
      
      <ul style={list}>
        {missingDocuments.map((doc, index) => (
          <li key={index} style={listItem}>{doc}</li>
        ))}
      </ul>
      
      <Text style={text}>
        Veuillez télécharger ces documents dans votre tableau de bord le plus rapidement possible 
        pour que nous puissions traiter votre candidature.
      </Text>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };
const list = { 
  color: '#555', 
  fontSize: '16px', 
  lineHeight: '24px',
  margin: '20px 0'
};
const listItem = {
  marginBottom: '8px'
};
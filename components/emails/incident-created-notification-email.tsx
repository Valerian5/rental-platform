// /components/emails/incident-created-notification-email.tsx

import { Heading, Preview, Text, Button } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface IncidentCreatedNotificationEmailProps {
  ownerName: string;
  tenantName: string;
  incidentTitle: string;
  propertyTitle: string;
  description: string;
  category: string;
  incidentUrl: string;
  logoUrl?: string;
}

export default function IncidentCreatedNotificationEmail({ 
  ownerName, 
  tenantName, 
  incidentTitle, 
  propertyTitle,
  description,
  category,
  incidentUrl,
  logoUrl 
}: IncidentCreatedNotificationEmailProps) {
  const getCategoryLabel = (cat: string) => {
    const categories = {
      plumbing: "Plomberie",
      electrical: "Électricité", 
      heating: "Chauffage",
      security: "Sécurité",
      other: "Autre"
    };
    return categories[cat as keyof typeof categories] || cat;
  };

  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Nouvel incident signalé par {tenantName}</Preview>
      <Heading style={h1}>Nouvel incident signalé</Heading>
      <Text style={text}>Bonjour {ownerName},</Text>
      <Text style={text}>
        <strong>{tenantName}</strong> a signalé un nouvel incident concernant le bien <strong>"{propertyTitle}"</strong>.
      </Text>
      
      <div style={incidentBox}>
        <Text style={incidentTitle}>"{incidentTitle}"</Text>
        <Text style={incidentCategory}>Catégorie : {getCategoryLabel(category)}</Text>
        <Text style={incidentDescription}>{description}</Text>
      </div>

      <Text style={text}>
        L'incident a été marqué comme <strong>ouvert</strong> et nécessite votre attention. 
        Vous pouvez y répondre et définir sa priorité depuis votre tableau de bord.
      </Text>

      <div style={buttonContainer}>
        <Button href={incidentUrl} style={button}>
          Gérer l'incident
        </Button>
      </div>

      <Text style={footerText}>
        Vous recevrez des notifications pour toute nouvelle activité sur cet incident.
      </Text>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };
const incidentBox = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeaa7',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0'
};
const incidentTitle = { 
  color: '#856404', 
  fontSize: '18px', 
  fontWeight: 'bold',
  marginBottom: '8px'
};
const incidentCategory = { 
  color: '#856404', 
  fontSize: '14px', 
  fontWeight: 'bold',
  marginBottom: '10px'
};
const incidentDescription = { 
  color: '#856404', 
  fontSize: '16px', 
  lineHeight: '24px'
};
const buttonContainer = { textAlign: 'center' as const, margin: '30px 0' };
const button = {
  backgroundColor: '#dc3545',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: 'bold'
};
const footerText = { 
  color: '#6c757d', 
  fontSize: '14px', 
  lineHeight: '20px',
  textAlign: 'center' as const,
  marginTop: '20px'
};

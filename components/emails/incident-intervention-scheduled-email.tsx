// /components/emails/incident-intervention-scheduled-email.tsx

import { Heading, Preview, Text, Button } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface IncidentInterventionScheduledEmailProps {
  tenantName: string;
  incidentTitle: string;
  propertyTitle: string;
  scheduledDate: string;
  description: string;
  providerName?: string;
  providerContact?: string;
  incidentUrl: string;
  logoUrl?: string;
}

export default function IncidentInterventionScheduledEmail({ 
  tenantName, 
  incidentTitle, 
  propertyTitle,
  scheduledDate,
  description,
  providerName,
  providerContact,
  incidentUrl,
  logoUrl 
}: IncidentInterventionScheduledEmailProps) {
  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Intervention programmée pour votre incident</Preview>
      <Heading style={h1}>Intervention programmée</Heading>
      <Text style={text}>Bonjour {tenantName},</Text>
      <Text style={text}>
        Une intervention a été programmée pour résoudre votre incident <strong>"{incidentTitle}"</strong> concernant le bien <strong>"{propertyTitle}"</strong>.
      </Text>
      
      <div style={infoBox}>
        <Text style={infoTitle}>Détails de l'intervention :</Text>
        <Text style={infoText}><strong>Date prévue :</strong> {new Date(scheduledDate).toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</Text>
        <Text style={infoText}><strong>Description :</strong> {description}</Text>
        {providerName && (
          <Text style={infoText}><strong>Prestataire :</strong> {providerName}</Text>
        )}
        {providerContact && (
          <Text style={infoText}><strong>Contact :</strong> {providerContact}</Text>
        )}
      </div>

      <Text style={text}>
        {providerName ? 
          'Le prestataire vous contactera directement pour confirmer le créneau et organiser l\'intervention.' :
          'Le propriétaire interviendra directement selon le planning prévu.'
        }
      </Text>

      <div style={buttonContainer}>
        <Button href={incidentUrl} style={button}>
          Voir l'incident
        </Button>
      </div>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };
const infoBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0'
};
const infoTitle = { 
  color: '#333', 
  fontSize: '18px', 
  fontWeight: 'bold',
  marginBottom: '10px'
};
const infoText = { 
  color: '#555', 
  fontSize: '16px', 
  lineHeight: '24px',
  margin: '5px 0'
};
const buttonContainer = { textAlign: 'center' as const, margin: '30px 0' };
const button = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: 'bold'
};

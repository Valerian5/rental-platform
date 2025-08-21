// /components/emails/visit-proposal-email.tsx

import { Button, Heading, Preview, Text, Hr } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './email-layout';

interface VisitProposalEmailProps {
  userName: string | null;
  propertyTitle: string;
  visitSlots: Date[];
  logoUrl?: string;
}

export default function VisitProposalEmail({ userName, propertyTitle, visitSlots, logoUrl }: VisitProposalEmailProps) {
  const siteUrl = "https://rental-platform-h5sj.vercel.app";

  return (
    <EmailLayout logoUrl={logoUrl}>
      <Preview>Proposition de visite pour {propertyTitle}</Preview>
      <Heading style={h1}>Proposition de créneaux de visite</Heading>
      <Text style={text}>Bonjour {userName || ''},</Text>
      <Text style={text}>
        Suite à votre intérêt pour le bien <strong>"{propertyTitle}"</strong>, voici plusieurs créneaux de visite proposés :
      </Text>
      
      {visitSlots.map((slot, index) => (
        <React.Fragment key={index}>
          <Text style={slotText}>
            - {slot.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </React.Fragment>
      ))}

      <Hr style={{ margin: '20px 0' }} />

      <Text style={text}>
        Veuillez cliquer sur le bouton ci-dessous pour confirmer l'un de ces créneaux ou en proposer d'autres.
      </Text>
      <Button style={button} href={`${siteUrl}/tenant/applications`}>
        Choisir un créneau
      </Button>
    </EmailLayout>
  );
}

// --- Styles ---
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };
const slotText = { ...text, margin: '5px 0' };
const button = { backgroundColor: '#007bff', borderRadius: '5px', color: '#fff', fontSize: '16px', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '180px', padding: '12px', marginTop: '20px' };

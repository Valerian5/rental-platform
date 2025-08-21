// /components/emails/visit-reminder-email.tsx

import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';

interface VisitReminderEmailProps {
  userName: string | null;
  visitDate: string;
  property: {
    title: string;
    address: string;
  };
}

export default function VisitReminderEmail({ userName, visitDate, property }: VisitReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Rappel de votre visite</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Rappel de votre visite</Heading>
          <Text style={text}>Bonjour {userName || ''},</Text>
          <Text style={text}>
            Ceci est un rappel pour votre visite programmée le :
          </Text>
          <Text style={{ ...text, fontWeight: 'bold', fontSize: '18px' }}>{visitDate}</Text>
          <Text style={text}>Pour le bien :</Text>
          <Section style={propertyBox}>
            <Text style={propertyTitleStyle}>{property.title}</Text>
            <Text style={text}>{property.address}</Text>
          </Section>
          <Text style={text}>
            N'oubliez pas d'apporter les documents nécessaires si demandé.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// --- Styles ---
const main = { backgroundColor: '#f6f9fc', padding: '20px', fontFamily: 'sans-serif' };
const container = { backgroundColor: '#ffffff', border: '1px solid #f0f0f0', borderRadius: '5px', padding: '20px' };
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };
const propertyBox = { border: '1px solid #e0e0e0', borderRadius: '5px', padding: '15px', margin: '20px 0' };
const propertyTitleStyle = { ...text, fontWeight: 'bold', color: '#333' };

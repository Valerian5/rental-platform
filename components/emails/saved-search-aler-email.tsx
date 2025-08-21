// /components/emails/saved-search-alert-email.tsx

import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';

interface SavedSearchAlertEmailProps {
  userName: string | null;
  properties: { id: string; title: string; address: string }[];
}

export default function SavedSearchAlertEmail({ userName, properties }: SavedSearchAlertEmailProps) {
  const siteUrl = "https://votre-site.com"; // À remplacer par votre URL

  return (
    <Html>
      <Head />
      <Preview>Nouveaux biens correspondant à votre recherche</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>De nouvelles opportunités !</Heading>
          <Text style={text}>Bonjour {userName || ''},</Text>
          <Text style={text}>
            De nouveaux biens correspondant à vos critères de recherche sont maintenant disponibles :
          </Text>
          
          {properties.map((prop) => (
            <Section key={prop.id} style={propertyBox}>
              <Text style={propertyTitleStyle}>{prop.title}</Text>
              <Text style={text}>{prop.address}</Text>
              <Button style={button} href={`${siteUrl}/properties/${prop.id}`}>
                Voir le bien
              </Button>
            </Section>
          ))}

          <Text style={text}>
            Ne tardez pas, ces biens pourraient partir vite !
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
const button = { backgroundColor: '#007bff', borderRadius: '5px', color: '#fff', fontSize: '14px', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '10px 15px', marginTop: '10px' };

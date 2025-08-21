// /components/emails/application-received-email.tsx

import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
  } from '@react-email/components';
  import * as React from 'react';
  
  interface ApplicationReceivedEmailProps {
    userName: string | null;
    propertyTitle: string;
    propertyAddress: string;
  }
  
  export default function ApplicationReceivedEmail({
    userName,
    propertyTitle,
    propertyAddress,
  }: ApplicationReceivedEmailProps) {
    return (
      <Html>
        <Head />
        <Preview>Confirmation de votre candidature</Preview>
        <Body style={main}>
          <Container style={container}>
            <Heading style={h1}>Confirmation de votre candidature</Heading>
            <Text style={text}>
              Bonjour {userName || ''},
            </Text>
            <Text style={text}>
              Nous avons bien reçu votre dossier de candidature pour le bien suivant :
            </Text>
            <Section style={propertyBox}>
              <Text style={propertyTitleStyle}>{propertyTitle}</Text>
              <Text style={text}>{propertyAddress}</Text>
            </Section>
            <Text style={text}>
              Le propriétaire ou l'agence va étudier votre dossier et reviendra vers vous très prochainement.
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }
  
  // --- Styles ---
  const main = {
    backgroundColor: '#f6f9fc',
    padding: '20px',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  };
  
  const container = {
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    borderRadius: '5px',
    padding: '20px',
  };
  
  const h1 = {
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold',
  };
  
  const text = {
    color: '#555',
    fontSize: '16px',
    lineHeight: '24px',
  };
  
  const propertyBox = {
    border: '1px solid #e0e0e0',
    borderRadius: '5px',
    padding: '15px',
    margin: '20px 0',
  };
  
  const propertyTitleStyle = {
    ...text,
    fontWeight: 'bold',
    color: '#333',
  };
  
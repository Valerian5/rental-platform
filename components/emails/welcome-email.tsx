// /components/emails/welcome-email.tsx

import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
  } from '@react-email/components';
  import * as React from 'react';
  
  interface WelcomeEmailProps {
    userName: string;
  }
  
  export default function WelcomeEmail({ userName }: WelcomeEmailProps) {
    return (
      <Html>
        <Head />
        <Preview>Bienvenue sur Louer-Ici !</Preview>
        <Body style={main}>
          <Container style={container}>
            <Heading style={h1}>Bienvenue sur Louer-Ici, {userName} !</Heading>
            <Text style={text}>
              Nous sommes ravis de vous compter parmi nous. Vous pouvez désormais explorer des biens, soumettre
              vos candidatures et gérer vos locations en toute simplicité.
            </Text>
            <Button
              style={button}
              href="https://votre-site.com/login" // Mettez ici le lien vers votre site
            >
              Commencer
            </Button>
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
  
  const button = {
    backgroundColor: '#007bff',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    width: '120px',
    padding: '12px',
  };
  
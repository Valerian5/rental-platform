// /components/emails/password-reset-email.tsx

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
  
  interface PasswordResetEmailProps {
    resetLink: string;
  }
  
  export default function PasswordResetEmail({ resetLink }: PasswordResetEmailProps) {
    return (
      <Html>
        <Head />
        <Preview>Réinitialisez votre mot de passe</Preview>
        <Body style={main}>
          <Container style={container}>
            <Heading style={h1}>Réinitialisation de mot de passe</Heading>
            <Text style={text}>
              Quelqu'un a demandé une réinitialisation de mot de passe pour votre compte.
              Si ce n'est pas vous, vous pouvez ignorer cet email.
            </Text>
            <Text style={text}>
              Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous :
            </Text>
            <Button style={button} href={resetLink}>
              Réinitialiser
            </Button>
          </Container>
        </Body>
      </Html>
    );
  }
  
  // --- Styles (similaires aux autres templates) ---
  const main = { backgroundColor: '#f6f9fc', padding: '20px', fontFamily: 'sans-serif' };
  const container = { backgroundColor: '#ffffff', border: '1px solid #f0f0f0', borderRadius: '5px', padding: '20px' };
  const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold' };
  const text = { color: '#555', fontSize: '16px', lineHeight: '24px' };
  const button = { backgroundColor: '#007bff', borderRadius: '5px', color: '#fff', fontSize: '16px', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '150px', padding: '12px' };
  
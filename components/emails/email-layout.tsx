// /components/emails/email-layout.tsx

import {
    Body,
    Container,
    Head,
    Html,
    Img,
    Text,
  } from '@react-email/components';
  import * as React from 'react';
  
  interface EmailLayoutProps {
    children: React.ReactNode;
    logoUrl?: string;
  }
  
  const siteUrl = "https://rental-platform-h5sj.vercel.app";
  
  export default function EmailLayout({ children, logoUrl }: EmailLayoutProps) {
    return (
      <Html>
        <Head />
        <Body style={main}>
          <Container style={container}>
            {/* En-tête avec le logo */}
            <Container style={header}>
              {logoUrl ? (
                <Img src={logoUrl} width="150" alt="Louer-Ici Logo" />
              ) : (
                <Text style={logoPlaceholder}>Louer-Ici</Text>
              )}
            </Container>
  
            {/* Contenu principal de l'email */}
            {children}
  
            {/* Pied de page */}
            <Text style={footer}>
              © {new Date().getFullYear()} Louer-Ici. Tous droits réservés.
            </Text>
            <Text style={footer}>
              Vous recevez cet email car vous êtes inscrit sur notre plateforme.
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
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
  };
  
  const header = {
    paddingBottom: '20px',
    borderBottom: '1px solid #f0f0f0',
    textAlign: 'center' as const,
  };
  
  const logoPlaceholder = {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333',
  };
  
  const footer = {
    color: '#999',
    fontSize: '12px',
    textAlign: 'center' as const,
    marginTop: '20px',
  };
  
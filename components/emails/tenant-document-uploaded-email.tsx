import React from "react"
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface TenantDocumentUploadedEmailProps {
  ownerName: string
  tenantName: string
  documentTitle: string
  documentType: string
  propertyTitle: string
  propertyAddress: string
  logoUrl?: string
}

export default function TenantDocumentUploadedEmail({
  ownerName = "Propriétaire",
  tenantName = "Locataire",
  documentTitle = "Document",
  documentType = "statement",
  propertyTitle = "Logement",
  propertyAddress = "Adresse",
  logoUrl = "https://louerici.fr/logo.png",
}: TenantDocumentUploadedEmailProps) {
  const getDocumentTypeLabel = (type: string) => {
    const types = {
      insurance: "Attestation d'assurance habitation",
      boiler_service: "Certificat d'entretien de la chaudière",
      chimney_sweep: "Certificat de ramonage",
      statement: "Document obligatoire"
    }
    return types[type as keyof typeof types] || "Document"
  }

  return (
    <Html>
      <Head />
      <Preview>
        {tenantName} a transmis un nouveau document obligatoire pour {propertyTitle}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={logoUrl}
              width="120"
              height="40"
              alt="Louer Ici"
              style={logo}
            />
          </Section>

          <Heading style={h1}>
            Nouveau document transmis par votre locataire
          </Heading>

          <Text style={text}>
            Bonjour {ownerName},
          </Text>

          <Text style={text}>
            Votre locataire <strong>{tenantName}</strong> a transmis un nouveau document obligatoire pour le logement <strong>{propertyTitle}</strong>.
          </Text>

          <Section style={documentInfo}>
            <Text style={documentTitle}>
              📄 {getDocumentTypeLabel(documentType)}
            </Text>
            <Text style={documentDetails}>
              <strong>Titre :</strong> {documentTitle}
            </Text>
            <Text style={documentDetails}>
              <strong>Logement :</strong> {propertyTitle} - {propertyAddress}
            </Text>
          </Section>

          <Text style={text}>
            Vous pouvez consulter et télécharger ce document depuis votre espace propriétaire.
          </Text>

          <Section style={buttonContainer}>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/owner/rental-management/documents`}
              style={button}
            >
              Consulter les documents
            </Link>
          </Section>

          <Text style={text}>
            Cordialement,<br />
            L'équipe Louer Ici
          </Text>

          <Section style={footer}>
            <Text style={footerText}>
              Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
}

const logoContainer = {
  textAlign: "center" as const,
  marginBottom: "32px",
}

const logo = {
  margin: "0 auto",
}

const h1 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 24px",
  textAlign: "center" as const,
}

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
}

const documentInfo = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
}

const documentTitle = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 12px",
}

const documentDetails = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 8px",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
}

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
}

const footer = {
  borderTop: "1px solid #e5e7eb",
  marginTop: "32px",
  paddingTop: "20px",
}

const footerText = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "0",
  textAlign: "center" as const,
}

import * as React from "react"
import { Html, Head, Preview, Body, Container, Text, Heading, Section, Hr } from "@react-email/components"

interface VisitScheduledEmailProps {
  ownerName: string
  propertyTitle: string
  tenantName: string
  tenantEmail: string
  visitDate: string
  logoUrl?: string
}

export default function VisitScheduledEmail({
  ownerName,
  propertyTitle,
  tenantName,
  tenantEmail,
  visitDate,
  logoUrl,
}: VisitScheduledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nouvelle visite programmée pour {propertyTitle}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9", padding: "20px" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: "8px", padding: "20px" }}>
          {logoUrl && (
            <img src={logoUrl} alt="Logo" style={{ maxWidth: "150px", marginBottom: "20px" }} />
          )}
          <Heading as="h2">Bonjour {ownerName},</Heading>
          <Text>
            Un locataire a choisi un créneau de visite pour votre bien <strong>{propertyTitle}</strong>.
          </Text>
          <Section>
            <Text>
              <strong>Date de la visite :</strong> {visitDate}
            </Text>
            <Text>
              <strong>Locataire :</strong> {tenantName} ({tenantEmail})
            </Text>
          </Section>
          <Hr style={{ margin: "20px 0" }} />
          <Text style={{ fontSize: "12px", color: "#666" }}>
            Vous recevrez un rappel automatique avant la visite.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

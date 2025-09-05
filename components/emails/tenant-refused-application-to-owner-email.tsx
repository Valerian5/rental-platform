import {
  Button,
  Heading,
  Text,
} from "@react-email/components"
import * as React from "react"
import { EmailLayout } from "./email-layout"

interface TenantRefusedApplicationToOwnerEmailProps {
  ownerName?: string
  tenantName?: string
  propertyTitle?: string
  reason?: string
  manageUrl?: string
  logoUrl?: string
}

export const TenantRefusedApplicationToOwnerEmail = ({
  ownerName,
  tenantName,
  propertyTitle,
  reason,
  manageUrl,
  logoUrl,
}: TenantRefusedApplicationToOwnerEmailProps) => (
  <EmailLayout
    previewText="Un locataire a refusé votre proposition"
    logoUrl={logoUrl}
  >
    <Heading className="text-2xl font-bold">Refus du locataire</Heading>
    <Text>Bonjour {ownerName},</Text>
    <Text>
      {tenantName} a refusé la location pour "{propertyTitle}".
    </Text>
    {reason && <Text>Motif : {reason}</Text>}
    <Button
      href={manageUrl}
      className="rounded-md bg-gray-500 px-4 py-2 text-white"
    >
      Voir la candidature
    </Button>
  </EmailLayout>
)

export default TenantRefusedApplicationToOwnerEmail
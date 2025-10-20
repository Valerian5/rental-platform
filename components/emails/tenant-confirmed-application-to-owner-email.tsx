import {
  Button,
  Heading,
  Text,
} from "@react-email/components"
import * as React from "react"
import EmailLayout from "./email-layout"

interface TenantConfirmedApplicationToOwnerEmailProps {
  ownerName?: string
  tenantName?: string
  propertyTitle?: string
  manageUrl?: string
  logoUrl?: string
}

export const TenantConfirmedApplicationToOwnerEmail = ({
  ownerName,
  tenantName,
  propertyTitle,
  manageUrl,
  logoUrl,
}: TenantConfirmedApplicationToOwnerEmailProps) => (
  <EmailLayout
    previewText="Un locataire a confirmé sa candidature"
    logoUrl={logoUrl}
  >
    <Heading className="text-2xl font-bold">
      Confirmation du locataire
    </Heading>
    <Text>Bonjour {ownerName},</Text>
    <Text>
      {tenantName} a confirmé vouloir louer "{propertyTitle}".
    </Text>
    <Button
      href={manageUrl}
      className="rounded-md bg-green-600 px-4 py-2 text-white"
    >
      Générer le bail
    </Button>
  </EmailLayout>
)

export default TenantConfirmedApplicationToOwnerEmail
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from "@react-email/components"
import * as React from "react"
import EmailLayout from "./email-layout"

interface WaitingTenantConfirmationEmailProps {
  tenantName?: string
  ownerName?: string
  propertyTitle?: string
  confirmUrl?: string
  logoUrl?: string
}

export const WaitingTenantConfirmationEmail = ({
  tenantName,
  ownerName,
  propertyTitle,
  confirmUrl,
  logoUrl,
}: WaitingTenantConfirmationEmailProps) => (
  <EmailLayout previewText="Votre dossier a été retenu !" logoUrl={logoUrl}>
    <Heading className="text-2xl font-bold">Votre dossier a été retenu</Heading>
    <Text>Bonjour {tenantName},</Text>
    <Text>
      Félicitations, votre dossier a été retenu
      {ownerName ? ` par ${ownerName}` : ""} pour "{propertyTitle}".
    </Text>
    <Text>
      Veuillez confirmer votre choix afin que le propriétaire puisse générer le
      bail.
    </Text>
    <Button
      href={confirmUrl}
      className="rounded-md bg-blue-600 px-4 py-2 text-white"
    >
      Confirmer maintenant
    </Button>
  </EmailLayout>
)

export default WaitingTenantConfirmationEmail
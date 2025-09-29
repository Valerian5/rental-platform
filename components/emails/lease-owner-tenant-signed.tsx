import * as React from "react"
import EmailLayout from "./email-layout"

export default function LeaseOwnerTenantSignedEmail({ ownerName, propertyTitle, leaseId }: { ownerName: string; propertyTitle?: string; leaseId: string }) {
  return (
    <EmailLayout>
      <h2 style={{ color: "#16a34a" }}>Le locataire a signé</h2>
      <p>Bonjour {ownerName},</p>
      <p>Le locataire a signé le bail {propertyTitle ? `« ${propertyTitle} »` : ""}. Votre bail est en cours de finalisation.</p>
      <p>
        Lien direct: <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/owner/leases/${leaseId}`}>Consulter le bail</a>
      </p>
      <p style={{ color: "#555" }}>Merci,</p>
      <p style={{ color: "#555" }}>Louer Ici</p>
    </EmailLayout>
  )
}



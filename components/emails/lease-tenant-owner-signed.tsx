import * as React from "react"
import EmailLayout from "./email-layout"

export default function LeaseTenantOwnerSignedEmail({ tenantName, propertyTitle, leaseId }: { tenantName: string; propertyTitle?: string; leaseId: string }) {
  return (
    <EmailLayout>
      <h2 style={{ color: "#16a34a" }}>Le propriétaire a signé</h2>
      <p>Bonjour {tenantName},</p>
      <p>Le propriétaire a signé le bail {propertyTitle ? `« ${propertyTitle} »` : ""}. Votre signature est requise.</p>
      <p>
        Lien direct: <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/tenant/leases/${leaseId}`}>Signer le bail</a>
      </p>
      <p style={{ color: "#555" }}>Merci,</p>
      <p style={{ color: "#555" }}>Louer Ici</p>
    </EmailLayout>
  )
}



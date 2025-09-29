import * as React from "react"

export default function LeaseTenantOwnerSignedEmail({ tenantName, propertyTitle, leaseId }: { tenantName: string; propertyTitle?: string; leaseId: string }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111", lineHeight: 1.5 }}>
      <h2 style={{ color: "#16a34a" }}>Le propriétaire a signé</h2>
      <p>Bonjour {tenantName},</p>
      <p>Le propriétaire a signé le bail {propertyTitle ? `« ${propertyTitle} »` : ""}. Votre signature est requise.</p>
      <p>
        Lien direct: <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/tenant/leases/${leaseId}`}>Signer le bail</a>
      </p>
      <p style={{ color: "#555" }}>Merci,</p>
      <p style={{ color: "#555" }}>Louer Ici</p>
    </div>
  )
}



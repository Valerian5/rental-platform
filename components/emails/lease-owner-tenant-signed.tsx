import * as React from "react"

export default function LeaseOwnerTenantSignedEmail({ ownerName, propertyTitle, leaseId }: { ownerName: string; propertyTitle?: string; leaseId: string }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111", lineHeight: 1.5 }}>
      <h2 style={{ color: "#16a34a" }}>Le locataire a signé</h2>
      <p>Bonjour {ownerName},</p>
      <p>Le locataire a signé le bail {propertyTitle ? `« ${propertyTitle} »` : ""}. Votre bail est en cours de finalisation.</p>
      <p>
        Lien direct: <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/owner/leases/${leaseId}`}>Consulter le bail</a>
      </p>
      <p style={{ color: "#555" }}>Merci,</p>
      <p style={{ color: "#555" }}>Louer Ici</p>
    </div>
  )
}



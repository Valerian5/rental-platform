import * as React from "react"

export default function LeaseTenantFinalizedEmail({ tenantName, propertyTitle, leaseId }: { tenantName: string; propertyTitle?: string; leaseId: string }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111", lineHeight: 1.5 }}>
      <h2 style={{ color: "#2563eb" }}>Votre bail signé est disponible</h2>
      <p>Bonjour {tenantName},</p>
      <p>
        Le bail {propertyTitle ? `« ${propertyTitle} »` : ""} est maintenant signé par les deux parties et disponible dans votre espace.
      </p>
      <p>
        Télécharger: <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/api/leases/${leaseId}/download-signed-document`}>Télécharger le bail signé</a>
      </p>
      <p style={{ color: "#555" }}>Merci,</p>
      <p style={{ color: "#555" }}>Louer Ici</p>
    </div>
  )
}



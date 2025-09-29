import * as React from "react"

export default function LeaseTenantReadyToSignEmail({ tenantName, propertyTitle, leaseId }: { tenantName: string; propertyTitle?: string; leaseId: string }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111", lineHeight: 1.5 }}>
      <h2 style={{ color: "#2563eb" }}>Votre bail est prêt à être signé</h2>
      <p>Bonjour {tenantName},</p>
      <p>
        Le bail {propertyTitle ? `pour « ${propertyTitle} » ` : ""}est prêt à être signé. Cliquez sur le lien dans votre espace pour procéder à la signature.
      </p>
      <p>
        Lien direct: <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/tenant/leases/${leaseId}`}>Consulter le bail</a>
      </p>
      <p style={{ color: "#555" }}>Merci,</p>
      <p style={{ color: "#555" }}>Louer Ici</p>
    </div>
  )
}



import * as React from "react"
import EmailLayout from "./email-layout"

export default function EdlTenantFinalizedEmail({
  tenantName,
  propertyTitle,
  leaseId,
  documentUrl,
}: {
  tenantName: string
  propertyTitle?: string
  leaseId: string
  documentUrl: string
}) {
  return (
    <EmailLayout>
      <h2 style={{ color: "#2563eb", marginTop: 0 }}>Votre état des lieux signé est disponible</h2>
      <p>Bonjour {tenantName || ""},</p>
      <p>
        L'état des lieux {propertyTitle ? `pour « ${propertyTitle} » ` : ""}
        a été validé et signé. Vous pouvez le télécharger depuis votre espace locataire.
      </p>
      <p style={{ marginTop: 20 }}>
        <a
          href={documentUrl}
          style={{
            backgroundColor: "#16a34a",
            color: "#ffffff",
            padding: "12px 20px",
            textDecoration: "none",
            borderRadius: 6,
            display: "inline-block",
          }}
        >
          Télécharger l'état des lieux
        </a>
      </p>
      <p style={{ color: "#6b7280", marginTop: 24 }}>Merci,</p>
      <p style={{ color: "#6b7280" }}>Louer Ici</p>
    </EmailLayout>
  )
}



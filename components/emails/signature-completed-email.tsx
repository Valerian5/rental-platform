import React from "react"

interface SignatureCompletedEmailProps {
  userName: string
  propertyTitle: string
  propertyAddress: string
  signerType: "owner" | "tenant"
  leaseUrl: string
  logoUrl?: string
}

export default function SignatureCompletedEmail({
  userName,
  propertyTitle,
  propertyAddress,
  signerType,
  leaseUrl,
  logoUrl = "https://louerici.fr/logo.png",
}: SignatureCompletedEmailProps) {
  const getSignerText = () => {
    return signerType === "owner" ? "propriétaire" : "locataire"
  }

  const getOtherPartyText = () => {
    return signerType === "owner" ? "locataire" : "propriétaire"
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <img src={logoUrl} alt="Louer Ici" style={{ height: "50px", marginBottom: "20px" }} />
        <h1 style={{ color: "#059669", margin: "0", fontSize: "24px" }}>
          Signature reçue
        </h1>
      </div>

      {/* Content */}
      <div style={{ backgroundColor: "#f0fdf4", padding: "30px", borderRadius: "8px", marginBottom: "30px" }}>
        <p style={{ fontSize: "16px", lineHeight: "1.6", margin: "0 0 20px 0", color: "#374151" }}>
          Bonjour <strong>{userName}</strong>,
        </p>

        <p style={{ fontSize: "16px", lineHeight: "1.6", margin: "0 0 20px 0", color: "#374151" }}>
          Le {getSignerText()} a signé le bail pour <strong>{propertyTitle}</strong> situé au <strong>{propertyAddress}</strong>.
        </p>

        <div style={{ backgroundColor: "#dcfce7", padding: "20px", borderRadius: "6px", marginBottom: "20px" }}>
          <h3 style={{ color: "#166534", margin: "0 0 10px 0", fontSize: "18px" }}>
            Prochaines étapes
          </h3>
          <p style={{ color: "#166534", margin: "0", fontSize: "14px" }}>
            {signerType === "owner" 
              ? "Le locataire doit maintenant signer le bail pour finaliser le processus."
              : "Le propriétaire doit maintenant signer le bail pour finaliser le processus."
            }
          </p>
        </div>

        <div style={{ textAlign: "center", margin: "30px 0" }}>
          <a
            href={leaseUrl}
            style={{
              backgroundColor: "#059669",
              color: "white",
              padding: "12px 30px",
              textDecoration: "none",
              borderRadius: "6px",
              display: "inline-block",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            Voir le bail
          </a>
        </div>

        <p style={{ fontSize: "14px", lineHeight: "1.6", margin: "0", color: "#6b7280" }}>
          Vous serez notifié dès que le {getOtherPartyText()} aura également signé.
        </p>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", color: "#6b7280", fontSize: "12px" }}>
        <p>Cet email a été envoyé par Louer Ici</p>
        <p>© 2024 Louer Ici. Tous droits réservés.</p>
      </div>
    </div>
  )
}

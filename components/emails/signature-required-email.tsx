import React from "react"

interface SignatureRequiredEmailProps {
  userName: string
  propertyTitle: string
  propertyAddress: string
  signatureMethod: "electronic" | "manual_physical" | "manual_remote"
  leaseUrl: string
  logoUrl?: string
}

export default function SignatureRequiredEmail({
  userName,
  propertyTitle,
  propertyAddress,
  signatureMethod,
  leaseUrl,
  logoUrl = "https://louerici.fr/logo.png",
}: SignatureRequiredEmailProps) {
  const getMethodText = () => {
    switch (signatureMethod) {
      case "electronic":
        return "signature électronique"
      case "manual_physical":
        return "signature manuelle (lors de la remise des clés)"
      case "manual_remote":
        return "signature manuelle à distance"
      default:
        return "signature"
    }
  }

  const getInstructions = () => {
    switch (signatureMethod) {
      case "electronic":
        return "Vous pouvez signer le document directement en ligne en cliquant sur le bouton ci-dessous."
      case "manual_physical":
        return "Téléchargez le document, signez-le physiquement lors de la remise des clés, puis uploadez-le."
      case "manual_remote":
        return "Téléchargez le document, signez-le, puis uploadez-le sur la plateforme."
      default:
        return "Veuillez procéder à la signature du document."
    }
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <img src={logoUrl} alt="Louer Ici" style={{ height: "50px", marginBottom: "20px" }} />
        <h1 style={{ color: "#2563eb", margin: "0", fontSize: "24px" }}>
          Signature de bail requise
        </h1>
      </div>

      {/* Content */}
      <div style={{ backgroundColor: "#f8fafc", padding: "30px", borderRadius: "8px", marginBottom: "30px" }}>
        <p style={{ fontSize: "16px", lineHeight: "1.6", margin: "0 0 20px 0", color: "#374151" }}>
          Bonjour <strong>{userName}</strong>,
        </p>

        <p style={{ fontSize: "16px", lineHeight: "1.6", margin: "0 0 20px 0", color: "#374151" }}>
          Votre bail pour <strong>{propertyTitle}</strong> situé au <strong>{propertyAddress}</strong> est prêt à être signé.
        </p>

        <div style={{ backgroundColor: "#dbeafe", padding: "20px", borderRadius: "6px", marginBottom: "20px" }}>
          <h3 style={{ color: "#1e40af", margin: "0 0 10px 0", fontSize: "18px" }}>
            Méthode de signature : {getMethodText()}
          </h3>
          <p style={{ color: "#1e40af", margin: "0", fontSize: "14px" }}>
            {getInstructions()}
          </p>
        </div>

        <div style={{ textAlign: "center", margin: "30px 0" }}>
          <a
            href={leaseUrl}
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "12px 30px",
              textDecoration: "none",
              borderRadius: "6px",
              display: "inline-block",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            Accéder au bail
          </a>
        </div>

        <p style={{ fontSize: "14px", lineHeight: "1.6", margin: "0", color: "#6b7280" }}>
          Si vous avez des questions, n'hésitez pas à nous contacter.
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

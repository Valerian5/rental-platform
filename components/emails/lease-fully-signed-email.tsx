import React from "react"

interface LeaseFullySignedEmailProps {
  userName: string
  propertyTitle: string
  propertyAddress: string
  leaseUrl: string
  logoUrl?: string
}

export default function LeaseFullySignedEmail({
  userName,
  propertyTitle,
  propertyAddress,
  leaseUrl,
  logoUrl = "https://louerici.fr/logo.png",
}: LeaseFullySignedEmailProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <img src={logoUrl} alt="Louer Ici" style={{ height: "50px", marginBottom: "20px" }} />
        <h1 style={{ color: "#059669", margin: "0", fontSize: "24px" }}>
          🎉 Bail entièrement signé !
        </h1>
      </div>

      {/* Content */}
      <div style={{ backgroundColor: "#f0fdf4", padding: "30px", borderRadius: "8px", marginBottom: "30px" }}>
        <p style={{ fontSize: "16px", lineHeight: "1.6", margin: "0 0 20px 0", color: "#374151" }}>
          Bonjour <strong>{userName}</strong>,
        </p>

        <p style={{ fontSize: "16px", lineHeight: "1.6", margin: "0 0 20px 0", color: "#374151" }}>
          Félicitations ! Votre bail pour <strong>{propertyTitle}</strong> situé au <strong>{propertyAddress}</strong> a été signé par toutes les parties.
        </p>

        <div style={{ backgroundColor: "#dcfce7", padding: "20px", borderRadius: "6px", marginBottom: "20px" }}>
          <h3 style={{ color: "#166534", margin: "0 0 10px 0", fontSize: "18px" }}>
            Votre bail est maintenant actif
          </h3>
          <p style={{ color: "#166534", margin: "0", fontSize: "14px" }}>
            Le document signé est disponible dans votre espace personnel. Vous pouvez le télécharger à tout moment.
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
            Accéder au bail signé
          </a>
        </div>

        <div style={{ backgroundColor: "#fef3c7", padding: "15px", borderRadius: "6px", marginTop: "20px" }}>
          <p style={{ color: "#92400e", margin: "0", fontSize: "14px", fontWeight: "600" }}>
            💡 Prochaines étapes
          </p>
          <ul style={{ color: "#92400e", margin: "10px 0 0 0", paddingLeft: "20px", fontSize: "14px" }}>
            <li>Conservez une copie du bail signé</li>
            <li>Planifiez l'état des lieux d'entrée si nécessaire</li>
            <li>Organisez la remise des clés</li>
          </ul>
        </div>

        <p style={{ fontSize: "14px", lineHeight: "1.6", margin: "20px 0 0 0", color: "#6b7280" }}>
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

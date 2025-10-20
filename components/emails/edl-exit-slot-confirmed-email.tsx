import React from "react"
import EmailLayout from "@/components/emails/email-layout"

interface EdlExitSlotConfirmedEmailProps {
  ownerName: string
  tenantName: string
  propertyTitle: string
  propertyAddress: string
  selectedSlot: {
    date: string
    start_time: string
    end_time: string
  }
  leaseId: string
}

export default function EdlExitSlotConfirmedEmail({
  ownerName,
  tenantName,
  propertyTitle,
  propertyAddress,
  selectedSlot,
  leaseId,
}: EdlExitSlotConfirmedEmailProps) {
  const formatDate = (dateStr: string, timeStr: string) => {
    const date = new Date(`${dateStr}T${timeStr}`)
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <EmailLayout>
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#1f2937", fontSize: "24px", margin: "0 0 10px 0" }}>
          ✅ Créneau EDL confirmé
        </h1>
        <p style={{ color: "#6b7280", fontSize: "16px", margin: "0" }}>
          Votre locataire a sélectionné un créneau
        </p>
      </div>

      <div style={{ backgroundColor: "#f0fdf4", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <h2 style={{ color: "#1f2937", fontSize: "18px", margin: "0 0 10px 0" }}>
          Bonjour {ownerName},
        </h2>
        <p style={{ color: "#374151", fontSize: "14px", lineHeight: "1.6", margin: "0 0 15px 0" }}>
          Votre locataire <strong>{tenantName}</strong> a confirmé sa disponibilité pour l'état des lieux de sortie.
        </p>
        
        <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "6px", marginBottom: "15px" }}>
          <h3 style={{ color: "#1f2937", fontSize: "16px", margin: "0 0 10px 0" }}>
            📍 {propertyTitle}
          </h3>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "0" }}>
            {propertyAddress}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: "25px" }}>
        <h3 style={{ color: "#1f2937", fontSize: "16px", margin: "0 0 15px 0" }}>
          📅 Créneau confirmé
        </h3>
        <div
          style={{
            backgroundColor: "#dcfce7",
            border: "2px solid #16a34a",
            borderRadius: "8px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#15803d", fontSize: "18px", fontWeight: "600", marginBottom: "5px" }}>
            {formatDate(selectedSlot.date, selectedSlot.start_time)}
          </div>
          <div style={{ color: "#166534", fontSize: "16px" }}>
            {selectedSlot.start_time} - {selectedSlot.end_time}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: "#fef3c7", border: "1px solid #f59e0b", borderRadius: "6px", padding: "15px", marginBottom: "25px" }}>
        <p style={{ color: "#92400e", fontSize: "14px", margin: "0", fontWeight: "500" }}>
          📋 <strong>Prochaines étapes :</strong> Vous pouvez maintenant préparer l'état des lieux de sortie 
          et le finaliser après la visite convenue.
        </p>
      </div>

      <div style={{ textAlign: "center" }}>
        <a
          href={`${process.env.NEXT_PUBLIC_APP_URL}/owner/leases/${leaseId}`}
          style={{
            display: "inline-block",
            backgroundColor: "#3b82f6",
            color: "white",
            padding: "12px 24px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "16px",
            fontWeight: "600",
          }}
        >
          Gérer l'EDL de sortie
        </a>
      </div>

      <div style={{ marginTop: "25px", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
        <p style={{ color: "#6b7280", fontSize: "12px", margin: "0", textAlign: "center" }}>
          Vous recevrez un rappel avant la date de l'état des lieux.
        </p>
      </div>
    </EmailLayout>
  )
}

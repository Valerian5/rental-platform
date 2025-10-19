import React from "react"
import { EmailLayout } from "@/components/emails/email-layout"

interface EdlExitSlotsProposalEmailProps {
  tenantName: string
  propertyTitle: string
  propertyAddress: string
  slots: Array<{
    date: string
    start_time: string
    end_time: string
  }>
  leaseId: string
}

export default function EdlExitSlotsProposalEmail({
  tenantName,
  propertyTitle,
  propertyAddress,
  slots,
  leaseId,
}: EdlExitSlotsProposalEmailProps) {
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
          🏠 État des lieux de sortie
        </h1>
        <p style={{ color: "#6b7280", fontSize: "16px", margin: "0" }}>
          Votre propriétaire vous propose des créneaux
        </p>
      </div>

      <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <h2 style={{ color: "#1f2937", fontSize: "18px", margin: "0 0 10px 0" }}>
          Bonjour {tenantName},
        </h2>
        <p style={{ color: "#374151", fontSize: "14px", lineHeight: "1.6", margin: "0 0 15px 0" }}>
          Votre propriétaire a initié l'état des lieux de sortie pour votre logement et vous propose 
          {slots.length > 1 ? " plusieurs créneaux" : " un créneau"} pour effectuer cette visite.
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
          📅 Créneaux proposés
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {slots.map((slot, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "#f0f9ff",
                border: "1px solid #0ea5e9",
                borderRadius: "6px",
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ color: "#0369a1", fontSize: "16px", fontWeight: "600" }}>
                {formatDate(slot.date, slot.start_time)}
              </div>
              <div style={{ color: "#0c4a6e", fontSize: "14px" }}>
                {slot.start_time} - {slot.end_time}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: "#fef3c7", border: "1px solid #f59e0b", borderRadius: "6px", padding: "15px", marginBottom: "25px" }}>
        <p style={{ color: "#92400e", fontSize: "14px", margin: "0", fontWeight: "500" }}>
          ⚠️ <strong>Action requise :</strong> Veuillez sélectionner un créneau dans les plus brefs délais pour confirmer votre disponibilité.
        </p>
      </div>

      <div style={{ textAlign: "center" }}>
        <a
          href={`${process.env.NEXT_PUBLIC_APP_URL}/tenant/leases/${leaseId}`}
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
          Choisir un créneau
        </a>
      </div>

      <div style={{ marginTop: "25px", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
        <p style={{ color: "#6b7280", fontSize: "12px", margin: "0", textAlign: "center" }}>
          Si vous ne pouvez pas vous rendre disponible sur ces créneaux, 
          contactez directement votre propriétaire pour convenir d'un autre horaire.
        </p>
      </div>
    </EmailLayout>
  )
}

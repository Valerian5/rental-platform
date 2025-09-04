import React from "react"

export default function TenantRefusedApplicationEmail({ tenantName, propertyTitle, reason }: { tenantName: string, propertyTitle: string, reason?: string }) {
  return (
    <div>
      <h2>Refus enregistré</h2>
      <p>Bonjour {tenantName},</p>
      <p>Votre refus pour <b>{propertyTitle}</b> a bien été pris en compte.</p>
      {reason && <p>Motif : {reason}</p>}
    </div>
  )
}
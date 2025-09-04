import React from "react"

export default function TenantConfirmedApplicationEmail({ tenantName, propertyTitle }: { tenantName: string, propertyTitle: string }) {
  return (
    <div>
      <h2>Confirmation enregistrée</h2>
      <p>Bonjour {tenantName},</p>
      <p>Votre confirmation pour <b>{propertyTitle}</b> a bien été prise en compte. Le propriétaire va pouvoir générer le bail.</p>
    </div>
  )
}
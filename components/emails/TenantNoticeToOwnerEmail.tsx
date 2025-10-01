import * as React from "react"

interface Props {
  ownerName: string
  tenantName: string
  propertyTitle: string
  propertyAddress?: string
  moveOutDate: string
  previewSnippet?: string
}

export default function TenantNoticeToOwnerEmail({ ownerName, tenantName, propertyTitle, propertyAddress, moveOutDate, previewSnippet }: Props) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#111', lineHeight: 1.6 }}>
      <h2 style={{ margin: 0, marginBottom: 12 }}>Préavis de départ reçu</h2>
      <p>Bonjour {ownerName},</p>
      <p>
        {tenantName} vous a notifié son départ pour le bien « {propertyTitle} »{propertyAddress ? ` (${propertyAddress})` : ''}.
        La date de fin effective est estimée au <strong>{moveOutDate}</strong>.
      </p>
      {previewSnippet && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, marginTop: 12 }}>
          <div style={{ fontSize: 12, color: '#374151' }} dangerouslySetInnerHTML={{ __html: previewSnippet }} />
        </div>
      )}
      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 16 }}>Cet email a été envoyé automatiquement par Louer Ici.</p>
    </div>
  )
}



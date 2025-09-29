import React from "react"
import EmailLayout from "./email-layout"

interface RentRevisionEmailProps {
  tenantName: string | null
  propertyTitle: string
  year: number
  oldRent: number
  newRent: number
  increase: number
  increasePercentage: number
  pdfUrl: string
  logoUrl?: string
}

export default function RentRevisionEmail({
  tenantName,
  propertyTitle,
  year,
  oldRent,
  newRent,
  increase,
  increasePercentage,
  pdfUrl,
  logoUrl
}: RentRevisionEmailProps) {
  const isIncrease = increase > 0

  return (
    <EmailLayout logoUrl={logoUrl}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ 
          color: isIncrease ? '#dc2626' : '#059669', 
          fontSize: '24px', 
          marginBottom: '10px' 
        }}>
          {isIncrease ? '📈 Révision de loyer' : '📉 Ajustement de loyer'}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Année {year} - {propertyTitle}
        </p>
      </div>

      <div style={{ 
        backgroundColor: isIncrease ? '#fef2f2' : '#f0f9ff', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        border: `1px solid ${isIncrease ? '#fca5a5' : '#0ea5e9'}`
      }}>
        <h2 style={{ 
          color: isIncrease ? '#991b1b' : '#0c4a6e', 
          marginTop: '0', 
          marginBottom: '15px' 
        }}>
          {isIncrease ? 'Augmentation de loyer' : 'Diminution de loyer'}
        </h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <div>
            <p style={{ color: '#6b7280', margin: '0 0 5px 0', fontSize: '14px' }}>Ancien loyer</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', color: '#374151' }}>
              {oldRent.toFixed(2)} €
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#6b7280', margin: '0 0 5px 0', fontSize: '14px' }}>Évolution</p>
            <p style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              margin: '0',
              color: isIncrease ? '#dc2626' : '#059669'
            }}>
              {isIncrease ? '+' : ''}{increase.toFixed(2)} €
            </p>
            <p style={{ 
              fontSize: '14px', 
              margin: '5px 0 0 0',
              color: isIncrease ? '#dc2626' : '#059669'
            }}>
              ({isIncrease ? '+' : ''}{increasePercentage.toFixed(2)}%)
            </p>
          </div>
          <div>
            <p style={{ color: '#6b7280', margin: '0 0 5px 0', fontSize: '14px' }}>Nouveau loyer</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', color: '#374151' }}>
              {newRent.toFixed(2)} €
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#374151', marginBottom: '15px' }}>Détails de la révision</h3>
        <ul style={{ color: '#6b7280', lineHeight: '1.6' }}>
          <li>Période concernée : Année {year}</li>
          <li>Logement : {propertyTitle}</li>
          <li>Type de révision : Index INSEE IRL</li>
          <li>Ancien loyer : {oldRent.toFixed(2)} €</li>
          <li>Nouveau loyer : {newRent.toFixed(2)} €</li>
          <li>Différence : {isIncrease ? '+' : ''}{increase.toFixed(2)} € ({isIncrease ? '+' : ''}{increasePercentage.toFixed(2)}%)</li>
        </ul>
      </div>

      <div style={{ 
        backgroundColor: '#f9fafb', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ color: '#374151', marginTop: '0', marginBottom: '15px' }}>
          Document détaillé
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '15px' }}>
          Le document PDF complet avec le détail des calculs et les justificatifs est disponible ci-dessous.
        </p>
        <a 
          href={pdfUrl}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '6px',
            display: 'inline-block',
            fontWeight: '500'
          }}
        >
          📄 Télécharger la révision
        </a>
      </div>

      <div style={{ 
        backgroundColor: isIncrease ? '#fef3c7' : '#ecfdf5', 
        padding: '15px', 
        borderRadius: '6px',
        border: `1px solid ${isIncrease ? '#fde68a' : '#a7f3d0'}`
      }}>
        <p style={{ 
          color: isIncrease ? '#92400e' : '#065f46', 
          margin: '0',
          fontSize: '14px'
        }}>
          <strong>Prochaines étapes :</strong> {
            isIncrease 
              ? `Le nouveau loyer de ${newRent.toFixed(2)} € sera applicable selon les modalités convenues.`
              : `Le nouveau loyer de ${newRent.toFixed(2)} € sera applicable selon les modalités convenues.`
          }
        </p>
      </div>
    </EmailLayout>
  )
}

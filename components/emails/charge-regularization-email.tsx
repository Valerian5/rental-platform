import React from "react"
import EmailLayout from "./email-layout"

interface ChargeRegularizationEmailProps {
  tenantName: string | null
  propertyTitle: string
  year: number
  balance: number
  balanceType: 'refund' | 'additional_payment'
  pdfUrl: string
  logoUrl?: string
}

export default function ChargeRegularizationEmail({
  tenantName,
  propertyTitle,
  year,
  balance,
  balanceType,
  pdfUrl,
  logoUrl
}: ChargeRegularizationEmailProps) {
  const isRefund = balanceType === 'refund'
  const amount = Math.abs(balance)

  return (
    <EmailLayout logoUrl={logoUrl}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ 
          color: isRefund ? '#059669' : '#dc2626', 
          fontSize: '24px', 
          marginBottom: '10px' 
        }}>
          {isRefund ? '💰 Remboursement de charges' : '📋 Régularisation des charges'}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Année {year} - {propertyTitle}
        </p>
      </div>

      <div style={{ 
        backgroundColor: isRefund ? '#f0f9ff' : '#fef2f2', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        border: `1px solid ${isRefund ? '#0ea5e9' : '#fca5a5'}`
      }}>
        <h2 style={{ 
          color: isRefund ? '#0c4a6e' : '#991b1b', 
          marginTop: '0', 
          marginBottom: '15px' 
        }}>
          {isRefund ? 'Vous avez payé trop de charges' : 'Complément de charges à payer'}
        </h2>
        
        <div style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: isRefund ? '#059669' : '#dc2626',
          marginBottom: '10px'
        }}>
          {amount.toFixed(2)} €
        </div>
        
        <p style={{ 
          color: isRefund ? '#0c4a6e' : '#991b1b', 
          margin: '0',
          fontSize: '16px'
        }}>
          {isRefund 
            ? `Vous avez payé ${amount.toFixed(2)} € de trop en charges pour l'année ${year}.`
            : `Il vous reste ${amount.toFixed(2)} € à payer pour les charges de l'année ${year}.`
          }
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#374151', marginBottom: '15px' }}>Détails de la régularisation</h3>
        <ul style={{ color: '#6b7280', lineHeight: '1.6' }}>
          <li>Période concernée : Année {year}</li>
          <li>Logement : {propertyTitle}</li>
          <li>Type de calcul : Prorata jour exact</li>
          <li>Statut : {isRefund ? 'Remboursement dû' : 'Paiement complémentaire requis'}</li>
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
          📄 Télécharger la régularisation
        </a>
      </div>

      <div style={{ 
        backgroundColor: isRefund ? '#ecfdf5' : '#fef3c7', 
        padding: '15px', 
        borderRadius: '6px',
        border: `1px solid ${isRefund ? '#a7f3d0' : '#fde68a'}`
      }}>
        <p style={{ 
          color: isRefund ? '#065f46' : '#92400e', 
          margin: '0',
          fontSize: '14px'
        }}>
          <strong>Prochaines étapes :</strong> {
            isRefund 
              ? 'Votre propriétaire vous remboursera ce montant selon les modalités convenues.'
              : 'Merci de régulariser ce montant dans les plus brefs délais selon les modalités convenues avec votre propriétaire.'
          }
        </p>
      </div>
    </EmailLayout>
  )
}

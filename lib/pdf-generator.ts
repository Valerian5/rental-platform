import jsPDF from 'jspdf'
import 'jspdf-autotable'

export interface ReceiptData {
  id: string
  reference: string
  month: string
  year: number
  rent_amount: number
  charges_amount: number
  total_amount: number
  generated_at: string
  payment: {
    id: string
    month_name: string
    due_date: string
    payment_date: string
    payment_method: string
    lease: {
      id: string
      monthly_rent: number
      charges: number
      property: {
        title: string
        address: string
      }
      tenant: {
        first_name: string
        last_name: string
        email: string
      }
    }
  }
}

export class PDFGenerator {
  static generateReceiptPDF(receiptData: ReceiptData): jsPDF {
    const doc = new jsPDF()
    
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let yPosition = margin

    // En-tête
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('QUITTANCE DE LOYER', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 20

    // Numéro de quittance
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`N° ${receiptData.reference}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Date de génération
    const generationDate = new Date(receiptData.generated_at).toLocaleDateString('fr-FR')
    doc.text(`Émise le ${generationDate}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 20

    // Informations du locataire
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('LOCATAIRE', margin, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nom: ${receiptData.payment.lease.tenant.first_name} ${receiptData.payment.lease.tenant.last_name}`, margin, yPosition)
    yPosition += 5
    doc.text(`Email: ${receiptData.payment.lease.tenant.email}`, margin, yPosition)
    yPosition += 15

    // Informations du bien
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('BIEN LOUÉ', margin, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Adresse: ${receiptData.payment.lease.property.address}`, margin, yPosition)
    yPosition += 5
    doc.text(`Référence: ${receiptData.payment.lease.property.title}`, margin, yPosition)
    yPosition += 15

    // Détails du paiement
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('DÉTAILS DU PAIEMENT', margin, yPosition)
    yPosition += 10

    // Tableau des montants
    const tableData = [
      ['Période', receiptData.payment.month_name],
      ['Loyer hors charges', `${receiptData.rent_amount.toFixed(2)} €`],
      ['Charges', `${receiptData.charges_amount.toFixed(2)} €`],
      ['Total payé', `${receiptData.total_amount.toFixed(2)} €`],
      ['Date d\'échéance', new Date(receiptData.payment.due_date).toLocaleDateString('fr-FR')],
      ['Date de paiement', new Date(receiptData.payment.payment_date).toLocaleDateString('fr-FR')],
      ['Mode de paiement', receiptData.payment.payment_method]
    ]

    doc.autoTable({
      startY: yPosition,
      head: [['Détail', 'Valeur']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 60 }
      }
    })

    // Mention légale
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text('Cette quittance fait foi de paiement du loyer et des charges pour la période indiquée.', margin, pageHeight - 30)
    doc.text('En cas de litige, seules les mentions portées sur cette quittance font foi.', margin, pageHeight - 20)
    doc.text('Générée automatiquement par Louer-Ici', pageWidth / 2, pageHeight - 10, { align: 'center' })

    return doc
  }

  static downloadReceipt(receiptData: ReceiptData, filename?: string): void {
    const doc = this.generateReceiptPDF(receiptData)
    const defaultFilename = `quittance_${receiptData.reference}_${receiptData.payment.month_name.replace(' ', '_')}.pdf`
    doc.save(filename || defaultFilename)
  }

  static generateReceiptFilename(receipt: ReceiptData): string {
    return `quittance_${receipt.reference}_${receipt.payment.month_name.replace(' ', '_')}.pdf`
  }
}

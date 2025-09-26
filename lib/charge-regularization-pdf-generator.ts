import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Lease {
  id: string
  start_date: string
  end_date: string
  monthly_rent: number
  charges: number
  property: {
    title: string
    address: string
    city: string
  }
  tenant: {
    first_name: string
    last_name: string
    email: string
  }
  owner: {
    first_name: string
    last_name: string
    email: string
  }
}

interface ChargeRegularization {
  id: string
  year: number
  days_occupied: number
  total_provisions: number
  total_quote_part: number
  balance: number
  calculation_method: string
  notes: string
  status: 'draft' | 'sent' | 'paid'
  expenses: ChargeExpense[]
}

interface ChargeExpense {
  id: string
  category: string
  amount: number
  is_recoverable: boolean
  notes?: string
  supporting_documents: SupportingDocument[]
}

interface SupportingDocument {
  id: string
  file_name: string
  file_url: string
  file_size?: number
  file_type?: string
}

export function generateChargeRegularizationPDF(
  lease: Lease,
  regularization: ChargeRegularization
): jsPDF {
  const doc = new jsPDF()
  
  // Configuration
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  
  let yPosition = margin
  
  // Fonction pour ajouter du texte avec gestion de la pagination
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: string = '#000000') => {
    if (yPosition > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage()
      yPosition = margin
    }
    
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.setTextColor(color)
    doc.text(text, margin, yPosition)
    yPosition += fontSize + 2
  }
  
  // Fonction pour ajouter une ligne
  const addLine = () => {
    if (yPosition > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage()
      yPosition = margin
    }
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10
  }
  
  // En-tête
  addText('DÉCOMPTE DE RÉGULARISATION DES CHARGES', 16, true)
  addText(`Année ${regularization.year}`, 12, true, '#666666')
  addLine()
  
  // Informations du bail
  addText('INFORMATIONS DU BAIL', 14, true)
  addText(`Logement : ${lease.property.title}`, 10)
  addText(`Adresse : ${lease.property.address}, ${lease.property.city}`, 10)
  addText(`Locataire : ${lease.tenant.first_name} ${lease.tenant.last_name}`, 10)
  addText(`Email : ${lease.tenant.email}`, 10)
  addText(`Propriétaire : ${lease.owner.first_name} ${lease.owner.last_name}`, 10)
  addText(`Email : ${lease.owner.email}`, 10)
  addLine()
  
  // Période d'occupation
  addText('PÉRIODE D\'OCCUPATION', 14, true)
  const startDate = new Date(lease.start_date)
  const endDate = new Date(lease.end_date)
  const yearStart = new Date(regularization.year, 0, 1)
  const yearEnd = new Date(regularization.year, 11, 31)
  
  const effectiveStart = startDate > yearStart ? startDate : yearStart
  const effectiveEnd = endDate < yearEnd ? endDate : yearEnd
  
  addText(`Période : ${effectiveStart.toLocaleDateString('fr-FR')} → ${effectiveEnd.toLocaleDateString('fr-FR')}`, 10)
  addText(`Jours d'occupation : ${regularization.days_occupied} jours`, 10)
  addText(`Prorata : ${((regularization.days_occupied / 365) * 100).toFixed(1)}% de l'année`, 10)
  addLine()
  
  // Provisions versées
  addText('PROVISIONS VERSÉES', 14, true)
  addText(`Montant total des provisions : ${regularization.total_provisions.toFixed(2)} €`, 10)
  addText(`Calcul : Prorata jour exact sur ${regularization.days_occupied} jours`, 10)
  addLine()
  
  // Détail des dépenses
  if (regularization.expenses.length > 0) {
    addText('DÉTAIL DES DÉPENSES', 14, true)
    
    // Préparer les données du tableau
    const tableData = regularization.expenses.map(expense => {
      const quotePart = expense.is_recoverable 
        ? (expense.amount * (regularization.days_occupied / 365)).toFixed(2)
        : '-'
      
      return [
        expense.category,
        `${expense.amount.toFixed(2)} €`,
        expense.is_recoverable ? 'Oui' : 'Non',
        `${quotePart} €`
      ]
    })
    
    // Ajouter le tableau
    doc.autoTable({
      startY: yPosition,
      head: [['Poste', 'Montant payé', 'Récupérable', 'Quote-part locataire']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 9 },
      columnStyles: {
        1: { halign: 'right' },
        3: { halign: 'right' }
      }
    })
    
    yPosition = (doc as any).lastAutoTable.finalY + 10
    addLine()
  }
  
  // Résumé financier
  addText('RÉSUMÉ FINANCIER', 14, true)
  addText(`Total provisions versées : ${regularization.total_provisions.toFixed(2)} €`, 10)
  addText(`Total quote-part locataire : ${regularization.total_quote_part.toFixed(2)} €`, 10)
  
  const balanceColor = regularization.balance >= 0 ? '#28a745' : '#dc3545'
  const balanceLabel = regularization.balance >= 0 ? 'Trop-perçu (remboursement)' : 'Complément à réclamer'
  
  addText(`Balance : ${Math.abs(regularization.balance).toFixed(2)} €`, 12, true, balanceColor)
  addText(`Statut : ${balanceLabel}`, 10, false, balanceColor)
  addLine()
  
  // Méthode de calcul
  if (regularization.notes) {
    addText('MÉTHODE DE CALCUL', 14, true)
    addText(regularization.notes, 10)
    addLine()
  }
  
  // Justificatifs
  const allDocuments = regularization.expenses.flatMap(expense => 
    expense.supporting_documents.map(doc => ({
      ...doc,
      category: expense.category
    }))
  )
  
  if (allDocuments.length > 0) {
    addText('JUSTIFICATIFS', 14, true)
    allDocuments.forEach(doc => {
      addText(`• ${doc.category} : ${doc.file_name}`, 10)
    })
    addLine()
  }
  
  // Pied de page
  addText(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 8, false, '#666666')
  addText('Ce document est généré automatiquement par la plateforme Louer-Ici', 8, false, '#666666')
  
  return doc
}

export async function generateChargeRegularizationPDFBlob(
  lease: Lease,
  regularization: ChargeRegularization
): Promise<Blob> {
  const pdf = generateChargeRegularizationPDF(lease, regularization)
  return pdf.output('blob')
}

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
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: string = '#000000', align: 'left' | 'center' | 'right' = 'left') => {
    if (yPosition > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage()
      yPosition = margin
    }
    
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.setTextColor(color)
    
    let xPosition = margin
    if (align === 'center') {
      xPosition = pageWidth / 2
    } else if (align === 'right') {
      xPosition = pageWidth - margin
    }
    
    doc.text(text, xPosition, yPosition, { align })
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
  
  // Fonction pour ajouter un paragraphe
  const addParagraph = (text: string, fontSize: number = 10) => {
    const lines = doc.splitTextToSize(text, contentWidth)
    lines.forEach((line: string) => {
      addText(line, fontSize)
    })
    yPosition += 5
  }
  
  // En-tête du courrier
  addText('DÉCOMPTE DE RÉGULARISATION DES CHARGES', 18, true, '#2c3e50', 'center')
  addText(`Année ${regularization.year}`, 14, true, '#7f8c8d', 'center')
  yPosition += 15
  
  // Informations du propriétaire
  addText('De :', 10, true)
  addText(`${lease.owner.first_name} ${lease.owner.last_name}`, 10)
  addText(lease.owner.email, 10, false, '#666666')
  yPosition += 10
  
  // Informations du locataire
  addText('À :', 10, true)
  addText(`${lease.tenant.first_name} ${lease.tenant.last_name}`, 10)
  addText(lease.tenant.email, 10, false, '#666666')
  yPosition += 15
  
  // Date et objet
  addText(`Le ${new Date().toLocaleDateString('fr-FR')}`, 10, false, '#666666', 'right')
  yPosition += 5
  addText('Objet : Régularisation des charges locatives', 10, true)
  addLine()
  
  // Paragraphe informatif
  addText('Madame, Monsieur,', 10)
  yPosition += 10
  
  addParagraph(
    `Conformément aux dispositions de l'article 23-1 de la loi du 6 juillet 1989, je vous adresse le décompte de régularisation des charges locatives pour l'année ${regularization.year}.`,
    10
  )
  
  addParagraph(
    `Ce décompte concerne le logement situé ${lease.property.address}, ${lease.property.city} et couvre la période du ${new Date(regularization.year, 0, 1).toLocaleDateString('fr-FR')} au ${new Date(regularization.year, 11, 31).toLocaleDateString('fr-FR')}.`,
    10
  )
  
  addParagraph(
    `La régularisation est calculée au prorata des jours d'occupation effective, soit ${regularization.days_occupied} jour${regularization.days_occupied > 1 ? 's' : ''} sur ${regularization.year} (${((regularization.days_occupied / 365) * 100).toFixed(1)}% de l'année).`,
    10
  )
  
  yPosition += 10
  
  // Provisions versées
  addText('PROVISIONS VERSÉES', 14, true)
  addText(`Montant des provisions mensuelles : ${lease.charges.toFixed(2)} €`, 10)
  addText(`Montant total des provisions versées : ${regularization.total_provisions.toFixed(2)} €`, 10, true)
  addText(`Période d'occupation : ${regularization.days_occupied} jour${regularization.days_occupied > 1 ? 's' : ''} (${((regularization.days_occupied / 365) * 100).toFixed(1)}% de l'année)`, 10)
  addLine()
  
  // Détail des dépenses
  if (regularization.expenses.length > 0) {
    addText('DÉTAIL DES DÉPENSES', 14, true)
    
    // Préparer les données du tableau
    const tableData = regularization.expenses.map(expense => {
      const prorata = regularization.days_occupied / 365
      const quotePart = expense.is_recoverable 
        ? (expense.amount * prorata).toFixed(2)
        : '-'
      
      return [
        expense.category,
        `${expense.amount.toFixed(2)} €`,
        `${(prorata * 100).toFixed(1)}%`,
        expense.is_recoverable ? `${quotePart} €` : '-'
      ]
    })
    
    // Ajouter le tableau
    doc.autoTable({
      startY: yPosition,
      head: [['Poste de charge', 'Montant annuel', 'Prorata', 'Montant proratisé']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontSize: 10
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'center' },
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
  
  const balanceColor = regularization.balance >= 0 ? '#27ae60' : '#e74c3c'
  const balanceLabel = regularization.balance >= 0 ? 'Trop-perçu (remboursement)' : 'Complément à réclamer'
  
  addText(`Balance : ${Math.abs(regularization.balance).toFixed(2)} €`, 12, true, balanceColor)
  addText(`Statut : ${balanceLabel}`, 10, false, balanceColor)
  addLine()
  
  // Conclusion du courrier
  addParagraph(
    `En conséquence, ${regularization.balance >= 0 ? 'je vous dois' : 'vous me devez'} un montant de ${Math.abs(regularization.balance).toFixed(2)} € ${regularization.balance >= 0 ? 'qui vous sera remboursé' : 'à régler'} dans les plus brefs délais.`,
    10
  )
  
  addParagraph(
    'Les justificatifs des dépenses sont joints à ce courrier. Vous disposez d\'un délai de 30 jours pour contester ce décompte.',
    10
  )
  
  yPosition += 20
  
  // Signature
  addText('Cordialement,', 10)
  yPosition += 15
  addText(`${lease.owner.first_name} ${lease.owner.last_name}`, 10, true)
  addText('Propriétaire', 10, false, '#666666')
  
  yPosition += 20
  
  // Méthode de calcul
  if (regularization.notes) {
    addText('MÉTHODE DE CALCUL', 12, true, '#7f8c8d')
    addParagraph(regularization.notes, 9)
    yPosition += 10
  }
  
  // Justificatifs
  const allDocuments = regularization.expenses.flatMap(expense => 
    expense.supporting_documents.map(doc => ({
      ...doc,
      category: expense.category
    }))
  )
  
  if (allDocuments.length > 0) {
    addText('JUSTIFICATIFS ANNEXÉS', 12, true, '#7f8c8d')
    allDocuments.forEach(doc => {
      addText(`• ${doc.category} : ${doc.file_name}`, 9)
    })
    yPosition += 10
  }
  
  // Pied de page
  addLine()
  addText(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 8, false, '#95a5a6', 'center')
  addText('Plateforme Louer-Ici - Gestion locative intelligente', 8, false, '#95a5a6', 'center')
  
  return doc
}


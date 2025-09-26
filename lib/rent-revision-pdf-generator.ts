import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface Lease {
  id: string
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
  monthly_rent: number
  charges: number
  start_date: string
  end_date: string
}

interface RentRevision {
  id: string
  revision_year: number
  revision_date: string
  reference_irl_value: number
  new_irl_value: number
  irl_quarter: string
  old_rent_amount: number
  new_rent_amount: number
  rent_increase_amount: number
  rent_increase_percentage: number
  status: string
  calculation_method?: string
  compliance_notes?: string
}

export function generateRentRevisionPDF(
  lease: Lease,
  revision: RentRevision
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
  addText('AVENANT DE BAIL - RÉVISION DE LOYER', 18, true, '#2c3e50', 'center')
  addText(`Année ${revision.revision_year}`, 14, true, '#7f8c8d', 'center')
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
  addText(`Le ${new Date(revision.revision_date).toLocaleDateString('fr-FR')}`, 10, false, '#666666', 'right')
  yPosition += 5
  addText('Objet : Révision de loyer selon indice IRL', 10, true)
  addLine()
  
  // Paragraphe informatif
  addText('Madame, Monsieur,', 10)
  yPosition += 10
  
  addParagraph(
    `Conformément aux dispositions de l'article 17-1 de la loi du 6 juillet 1989, je vous informe de la révision de votre loyer pour l'année ${revision.revision_year}.`,
    10
  )
  
  addParagraph(
    `Cette révision est basée sur l'évolution de l'Indice de Référence des Loyers (IRL) publié par l'INSEE.`,
    10
  )
  
  yPosition += 10
  
  // Informations du bail
  addText('INFORMATIONS DU BAIL', 14, true)
  addText(`Logement : ${lease.property.title}`, 10)
  addText(`Adresse : ${lease.property.address}, ${lease.property.city}`, 10)
  addText(`Période : ${new Date(lease.start_date).toLocaleDateString('fr-FR')} → ${new Date(lease.end_date).toLocaleDateString('fr-FR')}`, 10)
  addLine()
  
  // Détail de la révision
  addText('DÉTAIL DE LA RÉVISION', 14, true)
  
  // Tableau de révision
  const tableData = [
    ['Loyer actuel', `${revision.old_rent_amount.toFixed(2)} €`],
    ['Indice IRL de référence', `${revision.reference_irl_value} (${revision.irl_quarter})`],
    ['Nouvel indice IRL', `${revision.new_irl_value}`],
    ['Nouveau loyer', `${revision.new_rent_amount.toFixed(2)} €`],
    ['Augmentation', `+${revision.rent_increase_amount.toFixed(2)} € (+${revision.rent_increase_percentage.toFixed(2)}%)`]
  ]
  
  doc.autoTable({
    startY: yPosition,
    head: [['Élément', 'Valeur']],
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
      1: { halign: 'right' }
    }
  })
  
  yPosition = (doc as any).lastAutoTable.finalY + 10
  addLine()
  
  // Calcul détaillé
  addText('CALCUL DÉTAILLÉ', 12, true)
  addParagraph(
    `Nouveau loyer = Ancien loyer × (Nouvel indice IRL ÷ Indice IRL de référence)`,
    10
  )
  
  addParagraph(
    `Nouveau loyer = ${revision.old_rent_amount}€ × (${revision.new_irl_value} ÷ ${revision.reference_irl_value}) = ${revision.new_rent_amount.toFixed(2)}€`,
    10
  )
  
  yPosition += 10
  
  // Informations sur les charges
  addText('CHARGES LOCATIVES', 12, true)
  addText(`Charges mensuelles : ${lease.charges.toFixed(2)} €`, 10)
  addText(`Total mensuel (loyer + charges) : ${(revision.new_rent_amount + lease.charges).toFixed(2)} €`, 10, true)
  
  yPosition += 15
  
  // Conclusion
  addParagraph(
    `Le nouveau loyer de ${revision.new_rent_amount.toFixed(2)}€ sera applicable à compter du ${new Date(revision.revision_date).toLocaleDateString('fr-FR')}.`,
    10
  )
  
  addParagraph(
    'Vous disposez d\'un délai de 30 jours pour contester cette révision si vous estimez qu\'elle n\'est pas conforme à la réglementation.',
    10
  )
  
  yPosition += 20
  
  // Signature
  addText('Cordialement,', 10)
  yPosition += 15
  addText(`${lease.owner.first_name} ${lease.owner.last_name}`, 10, true)
  addText('Propriétaire', 10, false, '#666666')
  
  yPosition += 20
  
  // Informations légales
  if (revision.compliance_notes) {
    addText('INFORMATIONS LÉGALES', 12, true, '#7f8c8d')
    addParagraph(revision.compliance_notes, 9)
    yPosition += 10
  }
  
  // Pied de page
  addLine()
  addText(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 8, false, '#95a5a6', 'center')
  addText('Plateforme Louer-Ici - Gestion locative intelligente', 8, false, '#95a5a6', 'center')
  
  return doc
}

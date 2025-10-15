import jsPDF from 'jspdf'
import 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface Lease {
  id: string
  property: { title: string; address: string; city: string }
  tenant: { first_name: string; last_name: string; email: string }
  owner: { first_name: string; last_name: string; email: string }
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
  compliance_notes?: string
}

export function generateRentRevisionPDF(lease: Lease, revision: RentRevision): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 36 // léger margin
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // utilitaires
  const setFont = (size = 10, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
  }

  // Fonction pour texte multi-lignes avec positionnement x fixe
  const addMultiline = (text: string, x: number, maxWidth: number, size = 9, bold = false, align: 'left' | 'right' | 'center' = 'left') => {
    setFont(size, bold)
    const lines = doc.splitTextToSize(text, maxWidth)
    const lineHeight = size + 2
    lines.forEach((line: string, i: number) => {
      const lineY = y + i * lineHeight
      doc.text(line, x, lineY, { align })
    })
    y += lines.length * lineHeight
  }

  // ===== En-tête : expéditeur (gauche) / destinataire (droite) sur la même ligne =====
  const leftX = margin
  const rightX = pageWidth - margin
  setFont(10, true)
  doc.text(`${lease.owner.first_name} ${lease.owner.last_name}`, leftX, y, { align: 'left' })
  setFont(9, false)
  doc.text(lease.owner.email || '', leftX, y + 12, { align: 'left' })

  // destinataire à droite, aligné top avec expéditeur
  setFont(10, true)
  doc.text(`${lease.tenant.first_name} ${lease.tenant.last_name}`, rightX, y, { align: 'right' })
  setFont(9, false)
  doc.text(lease.tenant.email || '', rightX, y + 12, { align: 'right' })

  // avancer y (plus petit espacement)
  y += 28

  // adresse et date (adresse sous expéditeur, date à droite)
  setFont(9, false)
  doc.text(`${lease.property.address}, ${lease.property.city}`, leftX, y, { align: 'left' })
  doc.text(`Le ${new Date(revision.revision_date).toLocaleDateString('fr-FR')}`, rightX, y, { align: 'right' })
  y += 18

  // Objet et ligne séparatrice
  setFont(11, true)
  doc.text('Objet : Révision annuelle de loyer (indice IRL)', leftX, y, { align: 'left' })
  y += 10
  doc.setDrawColor(200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 12

  // Salutation + paragraphe (espacements compressés)
  setFont(10, false)
  doc.text('Madame, Monsieur,', leftX, y)
  y += 12

  const paragraph1 =
    `Conformément à l’article 17-1 de la loi du 6 juillet 1989, je vous informe de la révision annuelle du loyer du logement situé au ${lease.property.address}, ${lease.property.city}, pour l'année ${revision.revision_year}.`
  addMultiline(paragraph1, leftX, contentWidth, 9, false, 'left')

  const paragraph2 =
    `La révision est calculée sur la base de l'évolution de l'Indice de Référence des Loyers (IRL) — période : ${revision.irl_quarter}.`
  addMultiline(paragraph2, leftX, contentWidth, 9, false, 'left')

  y += 4

  // ===== Tableau récapitulatif compact =====
  (doc as any).autoTable({
    startY: y,
    theme: 'grid',
    head: [['Élément', 'Valeur']],
    body: [
      ['Loyer actuel', `${revision.old_rent_amount.toFixed(2)} €`],
      ['Indice IRL (réf.)', `${revision.reference_irl_value}`],
      ['Nouvel indice IRL', `${revision.new_irl_value}`],
      ['Nouveau loyer', `${revision.new_rent_amount.toFixed(2)} €`],
      ['Augmentation', `+${revision.rent_increase_amount.toFixed(2)} € (${revision.rent_increase_percentage.toFixed(2)}%)`],
      ['Charges mensuelles', `${lease.charges.toFixed(2)} €`],
      ['Total mensuel (nouveau)', `${(revision.new_rent_amount + lease.charges).toFixed(2)} €`],
    ],
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [70, 130, 180],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.6 },
      1: { halign: 'right', cellWidth: contentWidth * 0.4 }
    }
  })

  // update y to after table
  y = (doc as any).lastAutoTable.finalY + 8

  // Calcul bref (une ligne) et mise en application
  setFont(9, false)
  const calcLine = `Nouveau loyer = ${revision.old_rent_amount.toFixed(2)} € × (${revision.new_irl_value} ÷ ${revision.reference_irl_value}) = ${revision.new_rent_amount.toFixed(2)} €`
  addMultiline(calcLine, leftX, contentWidth, 9, false, 'left')

  addMultiline(`Le nouveau loyer sera applicable à compter du ${new Date(revision.revision_date).toLocaleDateString('fr-FR')}.`, leftX, contentWidth, 9, false, 'left')

  addMultiline(`Vous disposez d'un délai de 30 jours pour contester cette révision, conformément à la réglementation.`, leftX, contentWidth, 9, false, 'left')

  y += 8

  // formule de politesse + signature (serré)
  setFont(10, false)
  doc.text('Je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.', leftX, y)
  y += 22
  setFont(10, true)
  doc.text(`${lease.owner.first_name} ${lease.owner.last_name}`, leftX, y)
  setFont(9, false)
  doc.text('Propriétaire', leftX, y + 12)

  // si notes de conformité -> compacte
  if (revision.compliance_notes) {
    y += 28
    setFont(9, true)
    doc.text('Informations légales :', leftX, y)
    y += 12
    addMultiline(revision.compliance_notes, leftX, contentWidth, 8, false, 'left')
  }

  // Pied de page compact (position fixe bas de page)
  doc.setDrawColor(220)
  const footerY = pageHeight - 40
  doc.line(margin, footerY, pageWidth - margin, footerY)
  setFont(8, false)
  doc.setTextColor('#777')
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, footerY + 14, { align: 'center' })
  doc.text('Louer-Ici – Gestion locative intelligente', pageWidth / 2, footerY + 26, { align: 'center' })

  return doc
}

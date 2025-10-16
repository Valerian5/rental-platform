// generateRentRevisionPDF.ts
import type { jsPDF } from 'jspdf'

export interface Lease {
  id: string
  property: { title: string; address: string; city: string }
  tenant: { first_name: string; last_name: string; email: string }
  owner: { first_name: string; last_name: string; email: string }
  monthly_rent: number
  charges: number
  start_date: string
  end_date: string
}

export interface RentRevision {
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

export async function generateRentRevisionPDF(lease: Lease, revision: RentRevision): Promise<jsPDF> {
  // Import dynamique pour éviter l’exécution côté serveur prématurée
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 36
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const setFont = (size = 10, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
  }

  const addMultiline = (
    text: string,
    x: number,
    maxWidth: number,
    size = 9,
    bold = false,
    align: 'left' | 'right' | 'center' = 'left'
  ) => {
    setFont(size, bold)
    const lines = doc.splitTextToSize(text, maxWidth)
    const lineHeight = size + 2
    lines.forEach((line: string, i: number) => {
      doc.text(line, x, y + i * lineHeight, { align })
    })
    y += lines.length * lineHeight
  }

  // --- En-tête expéditeur / destinataire ---
  const leftX = margin
  const rightX = pageWidth - margin

  setFont(10, true)
  doc.text(`${lease.owner.first_name} ${lease.owner.last_name}`, leftX, y)
  setFont(9)
  doc.text(lease.owner.email || '', leftX, y + 12)

  setFont(10, true)
  doc.text(`${lease.tenant.first_name} ${lease.tenant.last_name}`, rightX, y, { align: 'right' })
  setFont(9)
  doc.text(lease.tenant.email || '', rightX, y + 12, { align: 'right' })

  y += 28

  setFont(9)
  doc.text(`${lease.property.address}, ${lease.property.city}`, leftX, y)
  doc.text(`Le ${new Date(revision.revision_date).toLocaleDateString('fr-FR')}`, rightX, y, { align: 'right' })
  y += 18

  setFont(11, true)
  doc.text('Objet : Révision annuelle de loyer (indice IRL)', leftX, y)
  y += 8
  doc.setDrawColor(200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 12

  setFont(10)
  doc.text('Madame, Monsieur,', leftX, y)
  y += 12

  const p1 = `Conformément à l’article 17-1 de la loi du 6 juillet 1989, je vous informe de la révision annuelle du loyer du logement situé au ${lease.property.address}, ${lease.property.city}, pour l'année ${revision.revision_year}.`
  addMultiline(p1, leftX, contentWidth, 9)

  const p2 = `Cette révision est calculée sur la base de l'évolution de l'Indice de Référence des Loyers (IRL) publié par l’INSEE pour le ${revision.irl_quarter}.`
  addMultiline(p2, leftX, contentWidth, 9)

  y += 4

  // --- Tableau de révision ---
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Élément', 'Valeur']],
    body: [
      ['Loyer actuel', `${revision.old_rent_amount.toFixed(2)} €`],
      ['Indice IRL (référence)', `${revision.reference_irl_value}`],
      ['Nouvel indice IRL', `${revision.new_irl_value}`],
      ['Nouveau loyer', `${revision.new_rent_amount.toFixed(2)} €`],
      ['Augmentation', `+${revision.rent_increase_amount.toFixed(2)} € (${revision.rent_increase_percentage.toFixed(2)}%)`],
      ['Charges mensuelles', `${lease.charges.toFixed(2)} €`],
      ['Total mensuel (loyer + charges)', `${(revision.new_rent_amount + lease.charges).toFixed(2)} €`],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [70, 130, 180], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.55 },
      1: { halign: 'right', cellWidth: contentWidth * 0.45 },
    },
  })

  y = (doc as any).lastAutoTable.finalY + 10

  // --- Texte final ---
  const calcLine = `Nouveau loyer = ${revision.old_rent_amount.toFixed(2)} € × (${revision.new_irl_value} ÷ ${revision.reference_irl_value}) = ${revision.new_rent_amount.toFixed(2)} €`
  addMultiline(calcLine, leftX, contentWidth, 9)

  addMultiline(
    `Le nouveau loyer sera applicable à compter du ${new Date(revision.revision_date).toLocaleDateString('fr-FR')}.`,
    leftX,
    contentWidth,
    9
  )

  addMultiline(
    `Vous disposez d’un délai de 30 jours pour contester cette révision si vous estimez qu’elle n’est pas conforme à la réglementation.`,
    leftX,
    contentWidth,
    9
  )

  y += 8
  doc.text('Je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.', leftX, y)
  y += 20
  setFont(10, true)
  doc.text(`${lease.owner.first_name} ${lease.owner.last_name}`, leftX, y)
  setFont(9)
  doc.text('Propriétaire', leftX, y + 10)

  if (revision.compliance_notes) {
    y += 26
    setFont(9, true)
    doc.text('Informations légales :', leftX, y)
    y += 10
    addMultiline(revision.compliance_notes, leftX, contentWidth, 8)
  }

  const footerY = pageHeight - 36
  doc.setDrawColor(220)
  doc.line(margin, footerY, pageWidth - margin, footerY)
  setFont(8)
  doc.setTextColor('#777')
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, footerY + 12, { align: 'center' })
  doc.text('Louer-Ici – Gestion locative intelligente', pageWidth / 2, footerY + 24, { align: 'center' })

  return doc
}

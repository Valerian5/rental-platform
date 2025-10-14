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
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const addText = (text: string, size = 10, bold = false, align: 'left' | 'center' | 'right' = 'left', color = '#000') => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(color)
    const x = align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - margin : margin
    doc.text(text, x, y, { align })
    y += size + 2
  }

  const addParagraph = (text: string, size = 10, spacing = 5) => {
    const lines = doc.splitTextToSize(text, contentWidth)
    doc.text(lines, margin, y)
    y += lines.length * (size + 1) + spacing
  }

  // ======= En-tête du courrier =======
  addText(`${lease.owner.first_name} ${lease.owner.last_name}`, 10, true)
  addText(lease.owner.email, 9)
  y += 8
  addText(`${lease.tenant.first_name} ${lease.tenant.last_name}`, 10, true)
  addText(lease.tenant.email, 9)
  y += 10

  addText(`${lease.property.address}, ${lease.property.city}`, 9)
  addText(`Le ${new Date(revision.revision_date).toLocaleDateString('fr-FR')}`, 9, false, 'right')
  y += 8

  addText('Objet : Révision annuelle de loyer selon l’indice IRL', 11, true)
  doc.setDrawColor(180)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // ======= Corps du courrier =======
  addText('Madame, Monsieur,', 10)
  y += 4
  addParagraph(
    `Conformément à l’article 17-1 de la loi du 6 juillet 1989, le loyer du logement que vous occupez situé au ${lease.property.address}, ${lease.property.city}, fait l’objet d’une révision annuelle pour l’année ${revision.revision_year}.`
  )
  addParagraph(
    `Cette révision est calculée à partir de l’évolution de l’Indice de Référence des Loyers (IRL) publié par l’INSEE pour le ${revision.irl_quarter}.`
  )

  // ======= Détails du calcul =======
  doc.autoTable({
    startY: y,
    theme: 'plain',
    body: [
      ['Loyer actuel', `${revision.old_rent_amount.toFixed(2)} €`],
      ['Indice IRL de référence', `${revision.reference_irl_value}`],
      ['Nouvel indice IRL', `${revision.new_irl_value}`],
      ['Nouveau loyer', `${revision.new_rent_amount.toFixed(2)} €`],
      ['Augmentation', `+${revision.rent_increase_amount.toFixed(2)} € (${revision.rent_increase_percentage.toFixed(2)}%)`],
      ['Charges mensuelles', `${lease.charges.toFixed(2)} €`],
      ['Total mensuel (loyer + charges)', `${(revision.new_rent_amount + lease.charges).toFixed(2)} €`],
    ],
    styles: { fontSize: 9, cellPadding: 2, lineWidth: 0.1 },
    columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'right' } },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  addParagraph(
    `Le nouveau loyer de ${revision.new_rent_amount.toFixed(2)} € sera applicable à compter du ${new Date(
      revision.revision_date
    ).toLocaleDateString('fr-FR')}.`
  )

  addParagraph(
    `Vous disposez d’un délai de 30 jours pour formuler toute observation concernant cette révision, conformément aux dispositions légales en vigueur.`
  )

  y += 5
  addText('Je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.', 10)

  y += 15
  addText(`${lease.owner.first_name} ${lease.owner.last_name}`, 10, true)
  addText('Propriétaire', 9, false, undefined, '#666')

  // ======= Pied de page =======
  doc.setDrawColor(200)
  doc.line(margin, 275, pageWidth - margin, 275)
  doc.setFontSize(8)
  doc.setTextColor('#999')
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 282, { align: 'center' })
  doc.text('Louer-Ici – Gestion locative intelligente', pageWidth / 2, 287, { align: 'center' })

  return doc
}

import { jsPDF } from "jspdf"

export interface NoticePdfData {
  tenantName: string
  ownerName: string
  propertyAddress: string
  noticeDate: string
  moveOutDate: string
  noticeMonths: number
  signatureDataUrl?: string | null
}

export function generateNoticeTemplatePdfBuffer(data: NoticePdfData): Buffer {
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2

  let y = margin

  const addText = (
    text: string,
    fontSize = 11,
    bold = false,
    align: 'left' | 'center' | 'right' = 'left',
    color: [number, number, number] = [0, 0, 0]
  ) => {
    if (y > pageHeight - 30) {
      doc.addPage()
      y = margin
    }
    doc.setTextColor(...color)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
    const x = align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - margin : margin
    doc.text(text, x, y, { align })
    y += fontSize + 3
  }

  const addParagraph = (text: string, fontSize = 11) => {
    const lines = doc.splitTextToSize(text, contentWidth)
    lines.forEach((line) => {
      if (y > pageHeight - 80) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += 6
    })
    y += 4
  }

  // En-tête coordonnées (locataire gauche / propriétaire droite)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(data.tenantName, margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.propertyAddress, margin, y + 6)

  doc.setFont('helvetica', 'bold')
  doc.text("À l'attention de", pageWidth - margin, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.text(data.ownerName, pageWidth - margin, y + 6, { align: 'right' })

  y += 24

  // Date (droite)
  addText(new Date(data.noticeDate).toLocaleDateString('fr-FR'), 11, false, 'right')

  // Objet
  y += 8
  addText(`Objet : Notification de congé – ${data.propertyAddress}`, 12, true)

  // Corps
  addParagraph('Madame, Monsieur,')
  addParagraph(
    `Je, soussigné(e) ${data.tenantName}, vous informe par la présente de mon souhait de mettre fin au bail relatif au logement situé au ${data.propertyAddress}.`
  )
  addParagraph(
    `Conformément aux dispositions légales, le présent congé prend effet après un délai de préavis de ${data.noticeMonths} mois, soit jusqu’au ${new Date(data.moveOutDate).toLocaleDateString('fr-FR')} (inclus).`
  )
  addParagraph(
    `Je vous remercie de bien vouloir me confirmer la bonne réception de ce courrier. Nous pourrons convenir ensemble d'une date pour l’état des lieux de sortie et la remise des clés.`
  )
  addParagraph('Veuillez agréer, Madame, Monsieur, l’expression de mes salutations distinguées.')

  // Signature bas de page
  const bottomY = pageHeight - 60
  if (y < bottomY) y = bottomY

  // Nom du locataire
  doc.setFont('helvetica', 'bold')
  doc.text(data.tenantName, margin, y)

  // Image de signature (si fournie)
  if (data.signatureDataUrl) {
    try {
      doc.addImage(data.signatureDataUrl, undefined as any, margin, y + 4, 60, 20)
    } catch {}
  }

  // Ligne et libellé
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.line(margin, y + 30, margin + 80, y + 30)
  doc.text('Signature', margin, y + 36)

  return Buffer.from(doc.output('arraybuffer'))
}



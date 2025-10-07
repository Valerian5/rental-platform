import { jsPDF } from "jspdf"

interface NoticePdfData {
  tenantName: string
  ownerName: string
  propertyAddress: string
  noticeDate: string | Date
  moveOutDate: string | Date
  noticeMonths: number
  signatureDataUrl?: string | null
}

export function generateNoticePdfFromData(data: NoticePdfData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 18
  const contentWidth = pageWidth - margin * 2

  let y = margin

  const addText = (
    text: string,
    fontSize = 11,
    bold = false,
    align: 'left' | 'center' | 'right' = 'left',
    color: [number, number, number] = [0, 0, 0],
  ) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
    doc.setTextColor(color[0], color[1], color[2])
    const x = align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - margin : margin
    doc.text(text, x, y, { align })
    y += fontSize + 3
  }

  const addParagraph = (text: string, fontSize = 11) => {
    const lines = doc.splitTextToSize(text, contentWidth)
    lines.forEach((line) => {
      if (y > pageHeight - 70) {
        // Contraint à une seule page: réduire la taille si nécessaire
        doc.setFontSize(Math.max(9, fontSize - 1))
      }
      doc.text(line, margin, y)
      y += 6
    })
    y += 2
  }

  const formatFr = (d: string | Date) => {
    const date = typeof d === 'string' ? new Date(d) : d
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // En-tête: coordonnées
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(data.tenantName, margin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const addrLines = doc.splitTextToSize(data.propertyAddress, contentWidth / 2)
  addrLines.forEach((line) => { doc.text(line, margin, y); y += 5 })

  // Bloc destinataire à droite
  const rightX = pageWidth - margin
  let rightY = margin
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text("À l'attention de", rightX, rightY, { align: 'right' })
  rightY += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(data.ownerName, rightX, rightY, { align: 'right' })

  y += 8

  // Date alignée à droite
  addText(formatFr(data.noticeDate), 11, false, 'right')

  // Objet
  y += 4
  addText(`Objet : Notification de congé – ${data.propertyAddress}`, 12, true)

  // Corps
  addParagraph('Madame, Monsieur,')
  addParagraph(`Je, soussigné(e) ${data.tenantName}, vous informe par la présente de mon souhait de mettre fin au bail relatif au logement situé au ${data.propertyAddress}.`)
  addParagraph(`Conformément aux dispositions légales, le présent congé prend effet après un délai de préavis de ${data.noticeMonths} mois, soit jusqu’au ${formatFr(data.moveOutDate)} (inclus).`)
  addParagraph(`Je vous remercie de bien vouloir me confirmer la bonne réception de ce courrier. Nous pourrons convenir ensemble d'une date pour l’état des lieux de sortie et la remise des clés.`)
  addParagraph('Veuillez agréer, Madame, Monsieur, l’expression de mes salutations distinguées.')

  // Signature en bas de page (nom, image, ligne, libellé)
  y = Math.max(y + 8, pageHeight - 60)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(data.tenantName, margin, y)
  y += 4

  if (data.signatureDataUrl) {
    try {
      // Largeur 60, hauteur 20 environ
      doc.addImage(data.signatureDataUrl, undefined as any, margin, y, 60, 20)
    } catch {}
  }

  // ligne et libellé "Signature"
  const lineY = y + 24
  doc.setDrawColor(0,0,0)
  doc.line(margin, lineY, margin + 80, lineY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Signature', margin, lineY + 10)

  return doc
}



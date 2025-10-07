import { jsPDF } from "jspdf"

export interface NoticeAckData {
  tenantName: string
  ownerName: string
  propertyAddress: string
  noticeDate: string
  moveOutDate: string
}

export function generateNoticeAckPdfBuffer(data: NoticeAckData): Buffer {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = margin

  const addText = (text: string, fontSize = 11, bold = false, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
    const x = align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - margin : margin
    doc.text(text, x, y, { align })
    y += fontSize + 4
  }

  addText('Accusé de réception de préavis', 16, true, 'center')
  y += 4

  addText('Propriétaire (bailleur):', 12, true)
  addText(data.ownerName)
  addText('Locataire:', 12, true)
  addText(data.tenantName)
  addText('Logement:', 12, true)
  addText(data.propertyAddress)
  y += 4

  addText(`Préavis reçu le ${new Date(data.noticeDate).toLocaleDateString('fr-FR')}`)
  addText(`Fin de bail prévue le ${new Date(data.moveOutDate).toLocaleDateString('fr-FR')}`)

  y += 8
  addText('Ce document atteste la réception du préavis de départ par le bailleur.', 11)
  addText('Il ne vaut pas quitus de l’état des lieux ni du solde de tout compte.', 11)

  y += 20
  addText('Fait pour servir et valoir ce que de droit.', 11)

  y += 20
  addText('Signature du bailleur', 10)
  doc.line(margin, y + 4, margin + 80, y + 4)

  return Buffer.from(doc.output('arraybuffer'))
}



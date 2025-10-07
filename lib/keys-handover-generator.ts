import { jsPDF } from "jspdf"

export interface KeysHandoverData {
  tenantName: string
  ownerName: string
  propertyAddress: string
  date: string
  keysCount?: number
  badgesCount?: number
  notes?: string
}

export function generateKeysHandoverPdfBuffer(data: KeysHandoverData): Buffer {
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

  addText('Attestation de remise des clés', 16, true, 'center')
  y += 6
  addText(`Bailleur: ${data.ownerName}`, 11)
  addText(`Locataire: ${data.tenantName}`, 11)
  addText(`Logement: ${data.propertyAddress}`, 11)
  addText(`Date: ${new Date(data.date).toLocaleDateString('fr-FR')}`, 11)

  y += 6
  addText(`Clés remises: ${data.keysCount ?? 0}`, 12, true)
  addText(`Badges/Transpondeurs remis: ${data.badgesCount ?? 0}`, 12, true)

  if (data.notes) {
    y += 6
    addText('Observations:', 12, true)
    const lines = doc.splitTextToSize(data.notes, pageWidth - margin * 2)
    lines.forEach((l) => addText(l, 10))
  }

  y += 16
  addText('Signatures', 12, true)
  y += 10
  addText('Bailleur', 10)
  doc.line(margin, y + 4, margin + 80, y + 4)
  addText('Locataire', 10, false, 'right')
  doc.line(pageWidth - margin - 80, y + 4, pageWidth - margin, y + 4)

  return Buffer.from(doc.output('arraybuffer'))
}



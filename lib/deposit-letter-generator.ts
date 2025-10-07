import { jsPDF } from "jspdf"

export interface DepositLetterData {
  tenantName: string
  ownerName: string
  propertyAddress: string
  depositAmount: number
  retainedAmount: number
  retainedReasons?: string[]
  calculationDetails?: string
  bankIban?: string
  bankBic?: string
  restitutionDeadlineDays?: number // 30 ou 60 selon écarts
}

export function generateDepositLetterPdfBuffer(data: DepositLetterData): Buffer {
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

  const fmt = (n: number) => `${(n || 0).toFixed(2)} €`

  addText('Lettre de restitution du dépôt de garantie', 16, true, 'center')
  y += 6
  addText(`Bailleur: ${data.ownerName}`, 11)
  addText(`Locataire: ${data.tenantName}`, 11)
  addText(`Logement: ${data.propertyAddress}`, 11)

  y += 6
  addText(`Montant du dépôt: ${fmt(data.depositAmount)}`, 12, true)
  addText(`Montant retenu: ${fmt(data.retainedAmount)}`, 12, true)
  addText(`Montant restitué: ${fmt(Math.max(0, (data.depositAmount || 0) - (data.retainedAmount || 0)))}`, 12, true)

  if (data.retainedReasons && data.retainedReasons.length) {
    y += 4
    addText('Motifs de retenue:', 12, true)
    data.retainedReasons.forEach((r) => addText(`- ${r}`, 11))
  }

  if (data.calculationDetails) {
    y += 4
    addText('Détails de calcul:', 12, true)
    const lines = doc.splitTextToSize(data.calculationDetails, pageWidth - margin * 2)
    lines.forEach((l) => addText(l, 10))
  }

  y += 8
  const days = data.restitutionDeadlineDays || 30
  addText(`Délai légal de restitution: ${days} jours à compter de la remise des clés.`, 10)

  if (data.bankIban) {
    y += 4
    addText('Coordonnées bancaires (restitution):', 12, true)
    addText(`IBAN: ${data.bankIban}`, 10)
    if (data.bankBic) addText(`BIC: ${data.bankBic}`, 10)
  }

  y += 16
  addText('Fait pour servir et valoir ce que de droit.', 11)
  y += 16
  addText('Signature du bailleur', 10)
  doc.line(margin, y + 4, margin + 80, y + 4)

  return Buffer.from(doc.output('arraybuffer'))
}



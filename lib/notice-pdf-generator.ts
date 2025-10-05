import { jsPDF } from "jspdf"

export function generateNoticePDF(letterHtml: string): jsPDF {
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2

  let y = margin

  const addText = (text: string, fontSize = 11, bold = false, align: 'left' | 'center' | 'right' = 'left') => {
    if (y > pageHeight - 30) {
      doc.addPage()
      y = margin
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
    const x = align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - margin : margin
    doc.text(text, x, y, { align })
    y += fontSize + 3
  }

  // Transformer le HTML en texte basique avec sauts de ligne
  const normalized = (letterHtml || '')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{2,}/g, '\n\n')
    .trim()

  // Entête simple
  addText('Notification de congé', 16, true, 'center')
  y += 4

  // Paragraphe avec gestion des retours à la ligne
  const paragraphs = normalized.split(/\n\n/)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  paragraphs.forEach((para) => {
    const lines = doc.splitTextToSize(para.trim(), contentWidth)
    lines.forEach((line) => {
      if (y > pageHeight - 80) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += 6
    })
    y += 4
  })

  // Espace pour la signature en bas de page
  if (y < pageHeight - 60) {
    y = pageHeight - 60
  }

  // Extraire une éventuelle image de signature (data URL) depuis le HTML
  let signatureDataUrl: string | null = null
  try {
    const match = (letterHtml || '').match(/<img[^>]+src=\"(data:image\/(png|jpeg)[^\"]+)\"/i)
    if (match && match[1]) signatureDataUrl = match[1]
  } catch {}

  if (signatureDataUrl) {
    try {
      // jsPDF accepte les data URLs directement
      doc.addImage(signatureDataUrl, undefined as any, margin, y - 20, 60, 20)
    } catch {}
  }

  // Libellé + ligne de signature
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Signature du locataire', margin, y)
  doc.line(margin, y + 4, margin + 80, y + 4)

  return doc
}



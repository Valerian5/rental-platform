import { jsPDF } from "jspdf"

export interface NoticeAckData {
  tenantName: string
  ownerName: string
  propertyAddress: string
  noticeDate: string
  moveOutDate: string
  ownerAddress?: string
  city?: string
}

/**
 * Génère un PDF d'accusé de réception de préavis conforme aux mentions légales.
 */
export function generateNoticeAckPdfBuffer(data: NoticeAckData): Buffer {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = margin

  const addText = (
    text: string,
    fontSize = 11,
    bold = false,
    align: "left" | "center" | "right" = "left"
  ) => {
    doc.setFont("helvetica", bold ? "bold" : "normal")
    doc.setFontSize(fontSize)
    const x =
      align === "center"
        ? pageWidth / 2
        : align === "right"
        ? pageWidth - margin
        : margin
    doc.text(text, x, y, { align })
    y += fontSize + 4
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

  // --- En-tête ---
  addText(data.ownerName, 11, true)
  if (data.ownerAddress) addText(data.ownerAddress, 11)
  if (data.city) addText(data.city, 11)
  y += 10

  addText(`À ${data.city || "..."}, le ${formatDate(new Date().toISOString())}`, 11, false, "right")
  y += 10

  addText("À l’attention de :", 11, false)
  addText(data.tenantName, 11)
  addText(data.propertyAddress, 11)
  y += 10

  // --- Objet ---
  addText("Objet : Accusé de réception du préavis de départ", 12, true)
  y += 10

  // --- Corps du courrier ---
  const body = [
    `Je soussigné(e), ${data.ownerName}, propriétaire (bailleur) du logement situé au ${data.propertyAddress}, atteste avoir reçu le préavis de départ de ${data.tenantName}.`,
    `Le préavis m’a été notifié le ${formatDate(data.noticeDate)} et prendra fin le ${formatDate(data.moveOutDate)} conformément aux dispositions de l’article 15-I de la loi du 6 juillet 1989 tendant à améliorer les rapports locatifs.`,
    `Cet accusé de réception atteste uniquement de la réception du congé par le bailleur. Il ne vaut ni acceptation d’un départ anticipé, ni renonciation aux droits et obligations prévus par le bail, notamment en matière d’état des lieux de sortie, de restitution des clés et de dépôt de garantie.`,
    `Je reste à votre disposition pour convenir d’une date pour la réalisation de l’état des lieux de sortie et la remise des clés.`,
  ]

  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  const lineHeight = 7
  body.forEach((paragraph) => {
    const lines = doc.splitTextToSize(paragraph, pageWidth - 2 * margin)
    doc.text(lines, margin, y)
    y += lines.length * lineHeight + 5
  })

  // --- Formule de politesse ---
  addText("Je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.", 11)
  y += 15

  // --- Signature ---
  addText("Signature du bailleur", 11, true)
  doc.line(margin, y + 4, margin + 80, y + 4)

  return Buffer.from(doc.output("arraybuffer"))
}

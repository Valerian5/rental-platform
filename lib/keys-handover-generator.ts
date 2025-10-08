import { jsPDF } from "jspdf"

export interface KeysHandoverData {
  tenantName: string
  ownerName: string
  propertyAddress: string
  date: string
  keysCount?: number
  badgesCount?: number
  notes?: string
  ownerAddress?: string
  city?: string
}

/**
 * Génère un PDF d'attestation de remise des clés conforme à la loi du 6 juillet 1989.
 */
export function generateKeysHandoverPdfBuffer(data: KeysHandoverData): Buffer {
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

  // --- En-tête du courrier ---
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
  addText("Objet : Attestation de remise des clés", 12, true)
  y += 10

  // --- Corps du courrier ---
  const body = [
    `Je soussigné(e) ${data.ownerName}, bailleur du logement situé au ${data.propertyAddress}, atteste avoir reçu ce jour, le ${formatDate(data.date)}, de la part de ${data.tenantName}, l’ensemble des clés et dispositifs d’accès relatifs audit logement.`,
    `Le nombre de clés remises s’élève à ${data.keysCount ?? 0} et le nombre de badges ou transpondeurs à ${data.badgesCount ?? 0}.`,
    `Cette remise des clés marque la fin effective de la jouissance des lieux par le locataire, conformément aux dispositions de l’article 3-2 et de l’article 22 de la loi du 6 juillet 1989 tendant à améliorer les rapports locatifs.`,
    `Le délai légal de restitution du dépôt de garantie débute à compter de cette date, sous réserve de la comparaison de l’état des lieux de sortie et de celui d’entrée.`,
  ]

  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  const lineHeight = 7

  body.forEach((paragraph) => {
    const lines = doc.splitTextToSize(paragraph, pageWidth - 2 * margin)
    doc.text(lines, margin, y)
    y += lines.length * lineHeight + 5
  })

  if (data.notes) {
    y += 4
    addText("Observations :", 11, true)
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 2 * margin)
    doc.text(notesLines, margin, y)
    y += notesLines.length * lineHeight + 5
  }

  // --- Formule de politesse ---
  y += 8
  addText("Fait pour servir et valoir ce que de droit.", 11)
  addText("Je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.", 11)
  y += 15

  // --- Signatures ---
  addText("Signatures :", 12, true)
  y += 10
  addText("Bailleur :", 11)
  doc.line(margin, y + 4, margin + 80, y + 4)
  addText("Locataire :", 11, false, "right")
  doc.line(pageWidth - margin - 80, y + 4, pageWidth - margin, y + 4)

  return Buffer.from(doc.output("arraybuffer"))
}

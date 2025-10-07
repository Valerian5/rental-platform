import { jsPDF } from "jspdf"
import { JSDOM } from "jsdom"

/**
 * Génère un PDF propre et fidèle à la lettre HTML
 * - Style proche du rendu preview
 * - Signature au-dessus de la ligne
 * - Pas de contenu dupliqué
 */
export async function generateNoticePDFServer(letterHtml: string): Promise<Buffer> {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 50
  let y = margin

  // Parse le HTML
  const dom = new JSDOM(letterHtml)
  const body = dom.window.document.body

  const addText = (text: string, fontSize = 12, bold = false, align: "left" | "center" | "right" = "left", extraY = 16) => {
    if (!text.trim()) return
    if (y > pageHeight - 80) {
      doc.addPage()
      y = margin
    }
    doc.setFont("times", bold ? "bold" : "normal")
    doc.setFontSize(fontSize)
    const x =
      align === "center" ? pageWidth / 2 : align === "right" ? pageWidth - margin : margin
    doc.text(text.trim(), x, y, { align })
    y += extraY
  }

  // ---- 1️⃣ En-têtes (coordonnées)
  const paragraphs = Array.from(body.querySelectorAll("div, p"))
    .map((el) => el.textContent?.trim() || "")
    .filter((txt) => !!txt)

  // On sépare en blocs logiques : coordonnées locataire / proprio / corps / signature
  const tenantBlock = paragraphs.slice(0, 2) // nom + adresse
  const ownerBlock = paragraphs.slice(2, 4) // à l'attention de + nom
  const rest = paragraphs.slice(4)

  // Locataire à gauche
  tenantBlock.forEach((p) => addText(p, 12, true, "left"))
  y -= 10

  // Propriétaire à droite
  ownerBlock.forEach((p) => addText(p, 12, false, "right"))
  y += 10

  // ---- 2️⃣ Corps principal
  let currentBold = false
  rest.forEach((line) => {
    // Gestion des titres et objets
    if (line.toLowerCase().includes("objet :")) {
      y += 10
      addText(line, 13, true)
      y += 4
    } else if (line.match(/madame|monsieur/i)) {
      addText(line, 12, false)
    } else if (line.match(/salutations/i)) {
      y += 8
      addText(line, 12, false)
    } else {
      // Paragraphes classiques
      const lines = doc.splitTextToSize(line, pageWidth - margin * 2)
      lines.forEach((ln) => {
        if (y > pageHeight - 80) {
          doc.addPage()
          y = margin
        }
        doc.text(ln, margin, y)
        y += 16
      })
      y += 8
    }
  })

  // ---- 3️⃣ Signature
  y += 20

  const img = body.querySelector("img[src^='data:image']")
  if (img && img.getAttribute("src")) {
    const imgData = img.getAttribute("src")!
    try {
      doc.addImage(imgData, "PNG", margin, y, 100, 40)
      y += 60
    } catch (err) {
      console.warn("⚠️ Impossible d’ajouter la signature:", err)
      y += 40
    }
  }

  // Ligne + libellé
  doc.line(margin, y, margin + 150, y)
  y += 16
  doc.setFont("times", "normal")
  doc.setFontSize(11)
  doc.text("Signature du locataire", margin, y)

  return Buffer.from(doc.output("arraybuffer"))
}

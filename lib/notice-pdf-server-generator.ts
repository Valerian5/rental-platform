import { jsPDF } from "jspdf"
import { JSDOM } from "jsdom"

/**
 * Générateur PDF côté serveur (Node.js)
 * - recrée la structure et mise en page du HTML sans dépendre du DOM réel
 */
export async function generateNoticePDFServer(letterHtml: string): Promise<Buffer> {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40

  // Extraire le contenu texte de base depuis le HTML
  const dom = new JSDOM(letterHtml)
  const body = dom.window.document.body

  doc.setFont("times", "normal")
  doc.setFontSize(12)

  // Récupérer les paragraphes et textes
  let y = margin
  body.querySelectorAll("p, div").forEach((el) => {
    const text = el.textContent?.trim()
    if (!text) return
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2)
    lines.forEach((line) => {
      if (y > 780) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += 16
    })
    y += 4
  })

  // Signature image (si présente)
  const img = body.querySelector("img[src^='data:image']")
  if (img && img.getAttribute("src")) {
    const imgData = img.getAttribute("src")!
    y += 20
    try {
      doc.addImage(imgData, "PNG", margin, y, 100, 40)
      y += 60
    } catch {}
  }

  // Ligne et libellé
  doc.setFontSize(10)
  doc.line(margin, y + 5, margin + 150, y + 5)
  doc.text("Signature du locataire", margin, y + 20)

  return Buffer.from(doc.output("arraybuffer"))
}

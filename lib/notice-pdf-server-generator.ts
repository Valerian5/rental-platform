import { jsPDF } from "jspdf"
import { JSDOM } from "jsdom"

/**
 * Génération fidèle du PDF à partir du HTML stocké.
 * - Pas de texte dupliqué ni superposé
 * - Respect du format du courrier
 * - Signature au-dessus de la ligne
 */
export async function generateNoticePDFServer(letterHtml: string): Promise<Buffer> {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 50
  let y = margin

  // Parse du HTML propre
  const dom = new JSDOM(letterHtml)
  const body = dom.window.document.body

  doc.setFont("times", "normal")
  doc.setFontSize(12)

  const contentWidth = pageWidth - margin * 2

  // Fonction helper pour ajouter du texte
  const addParagraph = (text: string, opts?: { bold?: boolean; align?: "left" | "right" | "center"; spacing?: number }) => {
    if (!text.trim()) return
    const { bold = false, align = "left", spacing = 14 } = opts || {}
    doc.setFont("times", bold ? "bold" : "normal")
    const lines = doc.splitTextToSize(text.trim(), contentWidth)
    lines.forEach((line) => {
      if (y > pageHeight - 80) {
        doc.addPage()
        y = margin
      }
      const x =
        align === "center"
          ? pageWidth / 2
          : align === "right"
          ? pageWidth - margin
          : margin
      doc.text(line, x, y, { align })
      y += spacing
    })
  }

  // 🔹 Extraire proprement le contenu visible (sans doublons)
  const paragraphs: { text: string; align?: "left" | "right" | "center"; bold?: boolean }[] = []

  const divs = Array.from(body.children) as HTMLElement[]
  for (const el of divs) {
    // Coordonnées hautes (gauche/droite)
    if (el.tagName === "DIV" && el.style.display?.includes("flex")) {
      const subDivs = el.querySelectorAll("div")
      if (subDivs.length >= 2) {
        const left = subDivs[0].textContent?.trim()
        const right = subDivs[1].textContent?.trim()
        if (left) paragraphs.push({ text: left, align: "left" })
        if (right) paragraphs.push({ text: right, align: "right" })
      }
    } else {
      const text = el.textContent?.trim()
      if (text) paragraphs.push({ text })
    }
  }

  // 🔹 Supprimer doublons exacts éventuels
  const uniqueParagraphs = paragraphs.filter(
    (p, i, arr) => i === arr.findIndex((x) => x.text === p.text)
  )

  // 🔹 Impression du contenu
  for (const p of uniqueParagraphs) {
    const t = p.text
    if (t.startsWith("Objet")) {
      y += 10
      addParagraph(t, { bold: true })
      y += 4
    } else if (t.match(/^Signature$/i)) {
      // Ignore le mot "Signature" (on gère plus bas)
      continue
    } else {
      addParagraph(t, { align: p.align || "left" })
      y += 4
    }
  }

  // 🔹 Signature image
  const img = body.querySelector("img[src^='data:image']")
  if (img && img.getAttribute("src")) {
    y += 10
    try {
      doc.addImage(img.getAttribute("src")!, "PNG", margin, y, 100, 40)
      y += 60
    } catch (err) {
      console.warn("⚠️ Erreur image signature:", err)
      y += 40
    }
  }

  // 🔹 Ligne et label signature
  doc.line(margin, y, margin + 150, y)
  y += 16
  doc.setFont("times", "normal")
  doc.setFontSize(11)
  doc.text("Signature du locataire", margin, y)

  return Buffer.from(doc.output("arraybuffer"))
}

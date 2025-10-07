import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

/**
 * Génère un PDF fidèle à l’aperçu HTML
 * - même mise en page (structure et marges)
 * - signature placée au-dessus de la ligne
 * - tout sur une seule page A4
 */
export async function generateNoticePDF(letterHtml: string): Promise<jsPDF> {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  })

  // Créer un élément temporaire pour rendre le HTML fidèlement
  const container = document.createElement("div")
  container.innerHTML = letterHtml
  Object.assign(container.style, {
    width: "595pt", // largeur A4
    padding: "40pt",
    fontFamily: "'Times New Roman', serif",
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#111",
    backgroundColor: "#fff",
  })
  document.body.appendChild(container)

  // Capturer le rendu HTML avec html2canvas (haute qualité)
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#fff",
  })

  // Supprimer l’élément temporaire du DOM
  document.body.removeChild(container)

  // Calcul pour centrer et tenir sur une page A4
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  const yOffset = imgHeight > pageHeight ? 0 : (pageHeight - imgHeight) / 2

  const imgData = canvas.toDataURL("image/png")
  doc.addImage(imgData, "PNG", 0, yOffset, imgWidth, imgHeight)

  return doc
}

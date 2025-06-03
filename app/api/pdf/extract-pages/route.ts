import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl } = await request.json()

    if (!pdfUrl) {
      return NextResponse.json({ error: "URL PDF requise" }, { status: 400 })
    }

    console.log("🔄 Extraction des pages PDF:", pdfUrl)

    // Vérifier que l'URL est accessible
    const testResponse = await fetch(pdfUrl, { method: "HEAD" })
    if (!testResponse.ok) {
      throw new Error(`PDF non accessible: ${testResponse.status}`)
    }

    // Import dynamique avec gestion d'erreur
    let PDFDocument, createCanvas, pdfjsLib

    try {
      const pdfLibModule = await import("pdf-lib")
      PDFDocument = pdfLibModule.PDFDocument
      console.log("✅ pdf-lib importé")
    } catch (error) {
      console.error("❌ Erreur import pdf-lib:", error)
      throw new Error("pdf-lib non disponible")
    }

    try {
      const canvasModule = await import("canvas")
      createCanvas = canvasModule.createCanvas
      console.log("✅ canvas importé")
    } catch (error) {
      console.error("❌ Erreur import canvas:", error)
      throw new Error("canvas non disponible")
    }

    try {
      pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js")
      console.log("✅ pdfjs-dist importé")
    } catch (error) {
      console.error("❌ Erreur import pdfjs-dist:", error)
      throw new Error("pdfjs-dist non disponible")
    }

    // Récupérer le PDF
    console.log("📥 Téléchargement du PDF...")
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const pdfArrayBuffer = await response.arrayBuffer()
    console.log(`📦 PDF téléchargé: ${pdfArrayBuffer.byteLength} bytes`)

    // Charger le PDF avec pdf-lib
    console.log("📖 Chargement du PDF...")
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer)
    const pageCount = pdfDoc.getPageCount()

    console.log(`📋 PDF chargé: ${pageCount} page(s)`)

    const pageImages = []

    // Traiter chaque page
    for (let i = 0; i < pageCount; i++) {
      try {
        console.log(`📄 Traitement page ${i + 1}/${pageCount}`)

        // Créer un nouveau PDF avec juste cette page
        const singlePagePdf = await PDFDocument.create()
        const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i])
        singlePagePdf.addPage(copiedPage)

        // Convertir en ArrayBuffer
        const singlePagePdfBytes = await singlePagePdf.save()
        console.log(`📄 Page ${i + 1} extraite: ${singlePagePdfBytes.byteLength} bytes`)

        // Utiliser PDF.js pour rendre la page
        const loadingTask = pdfjsLib.getDocument({ data: singlePagePdfBytes })
        const pdf = await loadingTask.promise
        const page = await pdf.getPage(1)

        // Calculer la taille optimale
        const viewport = page.getViewport({ scale: 2.0 })
        console.log(`📄 Page ${i + 1} viewport: ${viewport.width}x${viewport.height}`)

        // Créer un canvas côté serveur
        const canvas = createCanvas(viewport.width, viewport.height)
        const context = canvas.getContext("2d")

        // Rendre la page
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise

        console.log(`📄 Page ${i + 1} rendue`)

        // Convertir en base64
        const imageData = canvas.toDataURL("image/jpeg", 0.8)

        pageImages.push({
          pageNumber: i + 1,
          imageData: imageData,
          width: viewport.width,
          height: viewport.height,
        })

        console.log(`✅ Page ${i + 1} convertie`)
      } catch (pageError) {
        console.error(`❌ Erreur page ${i + 1}:`, pageError)

        // Ajouter une page d'erreur
        pageImages.push({
          pageNumber: i + 1,
          imageData: null,
          width: 595,
          height: 842,
          error: `Erreur lors du traitement de la page ${i + 1}: ${pageError.message}`,
        })
      }
    }

    console.log(`✅ Extraction terminée: ${pageImages.length} pages`)

    return NextResponse.json({
      success: true,
      pageCount: pageCount,
      pages: pageImages,
    })
  } catch (error) {
    console.error("❌ Erreur extraction PDF:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'extraction du PDF",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

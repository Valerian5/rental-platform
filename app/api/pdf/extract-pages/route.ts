import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl } = await request.json()

    if (!pdfUrl) {
      return NextResponse.json({ error: "URL PDF requise" }, { status: 400 })
    }

    console.log("🔄 Extraction des pages PDF:", pdfUrl)

    // Import dynamique des dépendances côté serveur
    const { PDFDocument } = await import("pdf-lib")
    const { createCanvas } = await import("canvas")
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js")

    // Récupérer le PDF
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const pdfArrayBuffer = await response.arrayBuffer()
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

        // Utiliser PDF.js pour rendre la page
        const loadingTask = pdfjsLib.getDocument({ data: singlePagePdfBytes })
        const pdf = await loadingTask.promise
        const page = await pdf.getPage(1)

        // Calculer la taille optimale
        const viewport = page.getViewport({ scale: 2.0 })

        // Créer un canvas côté serveur
        const canvas = createCanvas(viewport.width, viewport.height)
        const context = canvas.getContext("2d")

        // Rendre la page
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise

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
          error: `Erreur lors du traitement de la page ${i + 1}`,
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
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl } = await request.json()

    if (!pdfUrl) {
      return NextResponse.json({ error: "URL PDF requise" }, { status: 400 })
    }

    console.log("🔄 Récupération du PDF pour merge:", pdfUrl)

    // Import de pdf-lib seulement (pas besoin de canvas)
    const { PDFDocument } = await import("pdf-lib")

    // Récupérer le PDF
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const pdfArrayBuffer = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer)
    const pageCount = pdfDoc.getPageCount()

    console.log(`📋 PDF chargé: ${pageCount} page(s)`)

    // Retourner les données du PDF pour le merge
    return NextResponse.json({
      success: true,
      pageCount: pageCount,
      pdfData: Array.from(new Uint8Array(pdfArrayBuffer)),
    })
  } catch (error) {
    console.error("❌ Erreur récupération PDF:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération du PDF",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

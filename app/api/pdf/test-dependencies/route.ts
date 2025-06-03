import { NextResponse } from "next/server"

export async function GET() {
  const results = {
    pdfLib: false,
    canvas: false,
    pdfjsDist: false,
    errors: [],
  }

  // Test pdf-lib
  try {
    const pdfLibModule = await import("pdf-lib")
    results.pdfLib = !!pdfLibModule.PDFDocument
    console.log("✅ pdf-lib disponible")
  } catch (error) {
    results.errors.push(`pdf-lib: ${error.message}`)
    console.error("❌ pdf-lib non disponible:", error)
  }

  // Test canvas
  try {
    const canvasModule = await import("canvas")
    results.canvas = !!canvasModule.createCanvas
    console.log("✅ canvas disponible")
  } catch (error) {
    results.errors.push(`canvas: ${error.message}`)
    console.error("❌ canvas non disponible:", error)
  }

  // Test pdfjs-dist
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js")
    results.pdfjsDist = !!pdfjsLib.getDocument
    console.log("✅ pdfjs-dist disponible")
  } catch (error) {
    results.errors.push(`pdfjs-dist: ${error.message}`)
    console.error("❌ pdfjs-dist non disponible:", error)
  }

  return NextResponse.json({
    dependencies: results,
    allAvailable: results.pdfLib && results.canvas && results.pdfjsDist,
    environment: process.env.NODE_ENV,
    platform: process.platform,
  })
}

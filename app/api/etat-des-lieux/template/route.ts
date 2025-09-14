import { NextRequest, NextResponse } from "next/server"
import { etatDesLieuxPDFGenerator } from "@/lib/etat-des-lieux-pdf-generator"

export async function POST(request: NextRequest) {
  try {
    const { type, room_count, property_data, lease_data } = await request.json()

    // Générer le PDF avec le générateur
    const pdfBuffer = await etatDesLieuxPDFGenerator.generatePDF({
      type,
      room_count,
      property_data,
      lease_data,
    })

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="etat-des-lieux-${type}-${room_count}pieces.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erreur génération template:", error)
    return NextResponse.json({ error: "Erreur lors de la génération du template" }, { status: 500 })
  }
}

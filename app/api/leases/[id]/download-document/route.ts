import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leaseId = params.id
    const server = createServerClient()

    // Récupérer le bail
    const { data: lease, error: leaseError } = await server
      .from("leases")
      .select("*")
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    if (!lease.generated_document) {
      return NextResponse.json({ error: "Document non généré" }, { status: 404 })
    }

    // Récupérer le document depuis Supabase Storage
    const { data: fileData, error: fileError } = await server.storage
      .from("lease-documents")
      .download(lease.generated_document)

    if (fileError || !fileData) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 })
    }

    // Convertir en buffer
    const buffer = await fileData.arrayBuffer()

    // Retourner le PDF
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bail-${leaseId}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erreur téléchargement document:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

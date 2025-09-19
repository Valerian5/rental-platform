import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔍 Download signed document request for lease:", params.id)
    
    const leaseId = params.id
    const server = createServerClient()

    // Récupérer le bail avec le document signé
    console.log("📄 Fetching lease with signed document...")
    const { data: lease, error: leaseError } = await server
      .from("leases")
      .select("id, signed_document")
      .eq("id", leaseId)
      .single()

    if (leaseError) {
      console.error("❌ Lease error:", leaseError)
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    if (!lease) {
      console.error("❌ No lease found")
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    if (!lease.signed_document) {
      console.error("❌ No signed document")
      return NextResponse.json({ error: "Document signé introuvable" }, { status: 404 })
    }

    console.log("📁 Signed document path:", lease.signed_document)

    // Récupérer le document signé depuis Supabase Storage
    console.log("⬇️ Downloading signed document from storage...")
    const { data: fileData, error: fileError } = await server.storage
      .from("documents")
      .download(lease.signed_document)

    if (fileError) {
      console.error("❌ Storage error:", fileError)
      return NextResponse.json({ error: "Document signé introuvable dans le stockage" }, { status: 404 })
    }

    if (!fileData) {
      console.error("❌ No file data")
      return NextResponse.json({ error: "Document signé introuvable" }, { status: 404 })
    }

    // Convertir en buffer
    console.log("🔄 Converting to buffer...")
    const buffer = await fileData.arrayBuffer()

    console.log("✅ Successfully prepared signed document for download")

    // Retourner le PDF
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bail-signe-${leaseId}.pdf"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("❌ Erreur téléchargement document signé:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { docuSignService } from "@/lib/docusign-service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    console.log("📥 [DOWNLOAD-SIGNED] Request for lease:", leaseId)
    const db = createServerClient()

    // Lire les infos nécessaires (bypass RLS)
    const { data: lease, error } = await db
      .from("leases")
      .select("id, docusign_envelope_id, docusign_status, signed_document")
      .eq("id", leaseId)
      .single()

    if (error || !lease) {
      console.error("❌ [DOWNLOAD-SIGNED] Lease not found:", error)
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    // Si un chemin de fichier est stocké dans signed_document (Storage path), servir le fichier
    if (lease.signed_document) {
      const { data: fileData, error: fileError } = await db.storage.from("documents").download(lease.signed_document)
      if (fileError || !fileData) {
        console.error("❌ [DOWNLOAD-SIGNED] Storage download error:", fileError)
        return NextResponse.json({ error: "Document signé introuvable dans le stockage" }, { status: 404 })
      }
      const buffer = await fileData.arrayBuffer()
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="bail-signe-${leaseId}.pdf"`,
          "Cache-Control": "no-cache",
        },
      })
    }

    // Si DocuSign est complété, télécharger et stocker
    if (lease.docusign_envelope_id && (lease.docusign_status || "").toLowerCase() === "completed") {
      const pdfBlob = await docuSignService.downloadCompletedDocument(lease.docusign_envelope_id)
      const arrayBuffer = await pdfBlob.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const filePath = `signed-leases/${leaseId}.pdf`
      const { data: upload, error: uploadError } = await db.storage.from("documents").upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      })
      if (uploadError) {
        console.error("❌ Erreur upload document signé:", uploadError)
        return NextResponse.json({ error: "Erreur stockage document signé" }, { status: 500 })
      }

      // Mémoriser le chemin de fichier
      await db
        .from("leases")
        .update({ signed_document: filePath, updated_at: new Date().toISOString() })
        .eq("id", leaseId)

      // Retourner le PDF directement
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="bail-signe-${leaseId}.pdf"`,
          "Cache-Control": "no-cache",
        },
      })
    }

    return NextResponse.json({ error: "Document signé indisponible" }, { status: 400 })
  } catch (e) {
    console.error("❌ Erreur téléchargement document signé:", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


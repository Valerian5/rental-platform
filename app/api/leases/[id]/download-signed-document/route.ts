import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { docuSignService } from "@/lib/docusign-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const db = createServerClient()

    // Lire les infos nécessaires (bypass RLS)
    const { data: lease, error } = await db
      .from("leases")
      .select("id, docusign_envelope_id, docusign_status, signed_document_url")
      .eq("id", leaseId)
      .single()

    if (error || !lease) {
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    // Si déjà stocké (URL storage), on redirige vers le fichier
    if (lease.signed_document_url) {
      return NextResponse.redirect(lease.signed_document_url)
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

      const { data: publicUrl } = db.storage.from("documents").getPublicUrl(filePath)

      // Mémoriser l'URL
      await db
        .from("leases")
        .update({ signed_document_url: publicUrl.publicUrl, updated_at: new Date().toISOString() })
        .eq("id", leaseId)

      return NextResponse.redirect(publicUrl.publicUrl)
    }

    return NextResponse.json({ error: "Document signé indisponible" }, { status: 400 })
  } catch (e) {
    console.error("❌ Erreur téléchargement document signé:", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


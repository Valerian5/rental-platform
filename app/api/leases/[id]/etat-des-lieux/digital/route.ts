import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET /api/leases/[id]/etat-des-lieux/digital
// Récupère un état des lieux numérique
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'entree'
    const server = createServerClient()

    // Récupérer l'état des lieux numérique
    const { data: document, error } = await server
      .from("etat_des_lieux_documents")
      .select("*")
      .eq("lease_id", leaseId)
      .eq("type", type)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error("Erreur récupération numérique:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 })
    }

    if (!document) {
      return NextResponse.json({ general_info: null, rooms: [] })
    }

    return NextResponse.json(document.digital_data || { general_info: null, rooms: [] })
  } catch (error) {
    console.error("Erreur GET digital etat-des-lieux:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/leases/[id]/etat-des-lieux/digital
// Sauvegarde un état des lieux numérique
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const { general_info, rooms, property_data, lease_data, owner_signature, tenant_signature, validated } = await request.json()
    const server = createServerClient()

    // Vérifier que le bail existe
    const { data: lease, error: leaseError } = await server
      .from("leases")
      .select("id, property_id")
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    // Préparer les données numériques
    const digitalData = {
      general_info,
      rooms,
      property_data,
      lease_data,
      signatures: {
        owner: owner_signature || null,
        tenant: tenant_signature || null,
      },
      created_at: new Date().toISOString(),
    }

    const docType = (general_info?.type || "entree") as string

    // Chercher un document existant (évite besoin d'unique index pour onConflict)
    const { data: existing, error: findError } = await server
      .from("etat_des_lieux_documents")
      .select("id")
      .eq("lease_id", leaseId)
      .eq("type", docType)
      .maybeSingle()

    if (findError) {
      console.error("Erreur recherche document existant:", findError)
    }

    let document: any = null
    let error: any = null

    if (existing?.id) {
      const { data, error: updateError } = await server
        .from("etat_des_lieux_documents")
        .update({
          property_id: lease.property_id,
          status: validated ? (owner_signature && tenant_signature ? "signed" : "completed") : "draft",
          digital_data: digitalData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()
      document = data
      error = updateError
    } else {
      const { data, error: insertError } = await server
        .from("etat_des_lieux_documents")
        .insert({
          lease_id: leaseId,
          property_id: lease.property_id,
          type: docType,
          status: validated ? (owner_signature && tenant_signature ? "signed" : "completed") : "draft",
          digital_data: digitalData,
        })
        .select()
        .single()
      document = data
      error = insertError
    }

    if (error) {
      console.error("Erreur sauvegarde numérique:", error)
      return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 })
    }

    // Si validé et signatures présentes, générer un PDF minimal et le stocker
    if (validated && owner_signature && tenant_signature) {
      try {
        const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib")

        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage([595.28, 841.89]) // A4
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

        const drawText = (text: string, x: number, y: number, size = 12) => {
          page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) })
        }

        let y = 800
        drawText(`État des lieux ${docType === "entree" ? "d'entrée" : "de sortie"}`, 40, y, 18)
        y -= 24
        drawText(`Bail: ${leaseId}`, 40, y)
        y -= 16
        drawText(`Adresse: ${lease_data?.adresse_logement || ""}`.slice(0, 90), 40, y)
        y -= 24
        drawText(`Date: ${general_info?.date || new Date().toISOString().slice(0,10)}`, 40, y)
        y -= 24
        drawText(`Propriétaire: ${general_info?.owner?.first_name || ""} ${general_info?.owner?.last_name || ""}`.trim(), 40, y)
        y -= 16
        drawText(`Locataire: ${general_info?.tenant?.first_name || ""} ${general_info?.tenant?.last_name || ""}`.trim(), 40, y)
        y -= 32

        // Intégrer les signatures (PNG base64)
        const toBytes = (dataUrl: string) => {
          const base64 = dataUrl.split(",")[1] || ""
          return Buffer.from(base64, "base64")
        }

        try {
          const ownerPng = await pdfDoc.embedPng(toBytes(owner_signature))
          const tenantPng = await pdfDoc.embedPng(toBytes(tenant_signature))
          const sigWidth = 180
          const sigHeight = 60
          page.drawText("Signature propriétaire:", { x: 40, y: y })
          page.drawImage(ownerPng, { x: 40, y: y - sigHeight - 6, width: sigWidth, height: sigHeight })
          page.drawText("Signature locataire:", { x: 320, y: y })
          page.drawImage(tenantPng, { x: 320, y: y - sigHeight - 6, width: sigWidth, height: sigHeight })
        } catch (e) {
          console.warn("Signature embedding failed:", e)
        }

        const pdfBytes = await pdfDoc.save()

        // Upload vers Supabase Storage
        const filePath = `etat-des-lieux/${leaseId}-${docType}.pdf`
        const { error: uploadError } = await server.storage
          .from("documents")
          .upload(filePath, Buffer.from(pdfBytes), { contentType: "application/pdf", upsert: true })

        if (!uploadError) {
          const { data: publicData } = server.storage.from("documents").getPublicUrl(filePath)

          // Mettre à jour le document avec l'URL
          await server
            .from("etat_des_lieux_documents")
            .update({
              file_url: publicData.publicUrl,
              file_name: `${leaseId}-${docType}.pdf`,
              mime_type: "application/pdf",
              status: "signed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", document.id)
        }
      } catch (e) {
        console.error("Erreur génération/enregistrement PDF état des lieux:", e)
      }
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Erreur digital etat-des-lieux:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

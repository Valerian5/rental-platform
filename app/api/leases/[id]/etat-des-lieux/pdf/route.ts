import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const body = await request.json().catch(() => ({}))
    const type = body?.type || "entree"
    const db = createServerClient()

    // Charger document + bail
    const { data: document, error: docErr } = await db
      .from("etat_des_lieux_documents")
      .select("*")
      .eq("lease_id", leaseId)
      .eq("type", type)
      .single()

    if (docErr || !document) {
      return NextResponse.json({ error: "Document d'état des lieux non trouvé" }, { status: 404 })
    }

    const { data: lease, error: leaseErr } = await db
      .from("leases")
      .select("id, property_id")
      .eq("id", leaseId)
      .single()

    if (leaseErr || !lease) {
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    // Génération avec pdf-lib
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib")
    const pdfDoc = await PDFDocument.create()
    const pageWidth = 595.28
    const pageHeight = 841.89
    let page = pdfDoc.addPage([pageWidth, pageHeight])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Palette
    const colorPrimary = rgb(59 / 255, 130 / 255, 246 / 255) // #3B82F6
    const colorMuted = rgb(107 / 255, 114 / 255, 128 / 255)  // slate-500
    const colorHeader = rgb(30 / 255, 41 / 255, 59 / 255)    // slate-800

    const drawText = (p: any, text: string, x: number, y: number, size = 12, isBold = false, color = rgb(0,0,0)) => {
      p.drawText(text, { x, y, size, font: isBold ? bold : font, color })
    }

    const addLine = (p: any, yPos: number) => {
      p.drawLine({ start: { x: 40, y: yPos }, end: { x: pageWidth - 40, y: yPos }, thickness: 0.5 })
    }

    // --- Fonction générique pour les grilles d'images ---
    async function drawImagesGrid(
      pdfDoc: any,
      page: any,
      startX: number,
      startY: number,
      photos: string[],
      options?: {
        cellW?: number
        cellH?: number
        gap?: number
        maxPerRow?: number
        pageWidth?: number
        pageHeight?: number
      }
    ): Promise<{ page: any, y: number }> {
      const {
        cellW = 150,
        cellH = 100,
        gap = 16,
        maxPerRow = 3,
        pageWidth = 595.28,
        pageHeight = 841.89,
      } = options || {}

      let px = startX
      let py = startY
      let rowMaxHeight = 0

      for (let i = 0; i < photos.length; i++) {
        try {
          const url = photos[i]
          const resp = await fetch(url)
          if (resp.ok) {
            const arr = await resp.arrayBuffer()
            const contentType = resp.headers.get("content-type") || ""
            const bytes = new Uint8Array(arr)
            const img = contentType.includes("png")
              ? await pdfDoc.embedPng(bytes)
              : await pdfDoc.embedJpg(bytes)

            const scale = Math.min(cellW / img.width, cellH / img.height)
            const w = img.width * scale
            const h = img.height * scale

            page.drawImage(img, { x: px, y: py - h, width: w, height: h })
            rowMaxHeight = Math.max(rowMaxHeight, h)
          }
        } catch {}

        px += cellW + gap

        // fin de ligne ou dernière image
        if ((i + 1) % maxPerRow === 0 || i === photos.length - 1) {
          py -= rowMaxHeight + gap
          px = startX
          rowMaxHeight = 0

          // saut de page si plus de place
          if (py < 100 && i < photos.length - 1) {
            page = pdfDoc.addPage([pageWidth, pageHeight])
            py = pageHeight - 80
          }
        }
      }

      return { page, y: py - 20 }
    }

    // --- Données ---
    const data = document.digital_data || {}
    const general = data.general_info || {}
    const rooms = Array.isArray(data.rooms) ? data.rooms : []

    let y = pageHeight - 40
    drawText(page, "État des lieux", 40, y, 18, true, colorHeader)
    y -= 22
    drawText(page, general.type === "sortie" ? "DE SORTIE" : "D'ENTRÉE", 40, y, 14, true, colorPrimary)
    y -= 18

    // Informations générales
    drawText(page, "Informations générales", 40, y, 12, true, colorHeader)
    y -= 10
    addLine(page, y)
    y -= 12
    const infoPairs: string[] = [
      `Date: ${general.date || new Date().toISOString().slice(0,10)}`,
      `Adresse: ${general.address || ""}`,
      `Propriétaire: ${(general.owner?.first_name || "")} ${(general.owner?.last_name || "").trim()}`,
      `Locataire: ${(general.tenant?.first_name || "")} ${(general.tenant?.last_name || "").trim()}`,
    ]
    for (const line of infoPairs) {
      if (y < 80) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - 60 }
      drawText(page, line, 40, y, 10)
      y -= 14
    }

    // Tableau par pièce + photos
    const headerHeight = 20
    const rowHeight = 16
    const isExit = (general.type || "entree") === "sortie"

    const drawTableHeader = (p: any, yStart: number) => {
      const columns = isExit
        ? [ { label: "Élément", w: 230 }, { label: "Entrée", w: 100 }, { label: "Sortie", w: 100 }, { label: "Commentaire", w: 165 } ]
        : [ { label: "Élément", w: 260 }, { label: "État", w: 120 }, { label: "Commentaire", w: 155 } ]
      let x = 40
      for (const col of columns) {
        drawText(p, col.label, x, yStart - 14, 10, true)
        x += col.w
      }
      addLine(p, yStart - headerHeight)
      return columns
    }

    const drawRow = (p: any, yRow: number, columns: any[], values: string[]) => {
      let x = 40
      for (let i = 0; i < columns.length; i++) {
        const val = (values[i] || "").toString().slice(0, 80)
        drawText(p, val, x + 2, yRow - 12, 9)
        x += columns[i].w
      }
      addLine(p, yRow - rowHeight)
    }

    for (const room of rooms) {
      if (y < 140) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - 60 }
      drawText(page, `Pièce: ${room.name || room.id || ""}`.slice(0, 60), 40, y, 12, true, colorHeader)
      y -= 8
      addLine(page, y)
      y -= 8
      const columns = drawTableHeader(page, y)
      y -= headerHeight

      const elements = room?.elements ? Object.keys(room.elements) : []
      for (const key of elements) {
        if (y < 80) {
          page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - 60
          drawText(page, `Pièce: ${room.name || room.id || ""}`.slice(0, 60), 40, y, 12, true, colorHeader)
          y -= 8; addLine(page, y); y -= 8
          drawTableHeader(page, y); y -= headerHeight
        }
        const el = room.elements[key] || {}
        const label = key.charAt(0).toUpperCase() + key.slice(1)
        if (isExit) {
          drawRow(page, y, columns, [label, el.state_entree || el.state || "", el.state_sortie || "", el.comment || ""]) 
        } else {
          drawRow(page, y, columns, [label, el.state || "", el.comment || ""]) 
        }
        y -= rowHeight
      }

      // Marge avant la section photos
      y -= 20

      // Photos
      const photos: string[] = Array.isArray(room.photos) ? room.photos : []
      if (photos.length > 0) {
        if (y < 220) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - 60 }
        drawText(page, "Photos", 40, y, 11, true, colorHeader)
        y -= 6; addLine(page, y); y -= 10

        const result = await drawImagesGrid(pdfDoc, page, 40, y, photos, {
          cellW: 150,
          cellH: 100,
          maxPerRow: 3,
          gap: 16,
          pageWidth,
          pageHeight,
        })
        page = result.page
        y = result.y
      }

      y -= 12
    }

    // Signatures
    if (data?.signatures?.owner && data?.signatures?.tenant) {
      if (y < 140) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - 60 }
      drawText(page, "Signatures", 40, y, 12, true, colorHeader)
      y -= 8; addLine(page, y); y -= 8
      const toBytesFromDataUrl = (dataUrl: string) => Buffer.from((dataUrl.split(",")[1] || ""), "base64")
      try {
        const ownerPng = await pdfDoc.embedPng(toBytesFromDataUrl(data.signatures.owner))
        const tenantPng = await pdfDoc.embedPng(toBytesFromDataUrl(data.signatures.tenant))
        const sigWidth = 180, sigHeight = 60
        drawText(page, "Propriétaire:", 40, y, 10, true)
        page.drawImage(ownerPng, { x: 40, y: y - sigHeight - 6, width: sigWidth, height: sigHeight })
        drawText(page, "Locataire:", 320, y, 10, true)
        page.drawImage(tenantPng, { x: 320, y: y - sigHeight - 6, width: sigWidth, height: sigHeight })
      } catch {}
    }

    // Pagination
    const pages = pdfDoc.getPages()
    const total = pages.length
    for (let i = 0; i < total; i++) {
      const p = pages[i]
      const footer = `Page ${i + 1} / ${total}`
      p.drawText(footer, { x: pageWidth / 2 - (footer.length * 2), y: 24, size: 9, font, color: colorMuted })
    }

    const pdfBytes = await pdfDoc.save()
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="etat-des-lieux-${type}-${leaseId}.pdf"`,
      },
    })
  } catch (e) {
    console.error("Erreur génération PDF état des lieux:", e)
    return NextResponse.json({ error: "Erreur lors de la génération du PDF" }, { status: 500 })
  }
}

import { createServerClient } from "@/lib/supabase"

export async function generateAndStoreEdlPdf(leaseId: string, type: "entree" | "sortie") {
  const db = createServerClient()

  const { data: document, error: docErr } = await db
    .from("etat_des_lieux_documents")
    .select("*")
    .eq("lease_id", leaseId)
    .eq("type", type)
    .single()
  if (docErr || !document) throw new Error("EDL non trouvé")

  const { data: lease, error: leaseErr } = await db
    .from("leases")
    .select("id, property_id")
    .eq("id", leaseId)
    .single()
  if (leaseErr || !lease) throw new Error("Bail non trouvé")

  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib")
  const pdfDoc = await PDFDocument.create()
  const pageWidth = 595.28
  const pageHeight = 841.89
  const colorPrimary = rgb(59 / 255, 130 / 255, 246 / 255)
  const colorMuted = rgb(107 / 255, 114 / 255, 128 / 255)
  const colorHeader = rgb(30 / 255, 41 / 255, 59 / 255)
  const colorAltRow = rgb(0.95, 0.95, 0.95)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const drawText = (p: any, text: string, x: number, y: number, size = 12, isBold = false, color = rgb(0, 0, 0)) => {
    p.drawText(text, { x, y, size, font: isBold ? bold : font, color })
  }
  const addLine = (p: any, yPos: number, color = rgb(0, 0, 0), thickness = 0.5) => {
    p.drawLine({ start: { x: 40, y: yPos }, end: { x: pageWidth - 40, y: yPos }, thickness, color })
  }

  const data = document.digital_data || {}
  const general = data.general_info || {}
  const rooms = Array.isArray(data.rooms) ? data.rooms : []

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - 60
  const title = "ÉTAT DES LIEUX"
  const subtitle = general.type === "sortie" ? "DE SORTIE" : "D'ENTRÉE"
  const titleWidth = font.widthOfTextAtSize(title, 20)
  drawText(page, title, (pageWidth - titleWidth) / 2, y, 20, true, colorPrimary)
  y -= 30
  const subtitleWidth = font.widthOfTextAtSize(subtitle, 16)
  drawText(page, subtitle, (pageWidth - subtitleWidth) / 2, y, 16, true, colorHeader)
  y -= 40

  function drawSection(titleStr: string) {
    if (y < 120) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      y = pageHeight - 60
    }
    drawText(page, titleStr, 40, y, 13, true, colorHeader)
    addLine(page, y - 4, colorPrimary, 1)
    y -= 22
  }

  drawSection("Informations générales")
  const generalInfo = [
    `Date: ${general.date || new Date().toISOString().slice(0, 10)}`,
    `Adresse: ${general.address || ""}`,
    `Propriétaire: ${(general.owner?.first_name || "")} ${(general.owner?.last_name || "").trim()}`,
    `Locataire: ${(general.tenant?.first_name || "")} ${(general.tenant?.last_name || "").trim()}`,
  ]
  generalInfo.forEach((line) => {
    drawText(page, line, 40, y, 10)
    y -= 14
  })
  y -= 10

  drawSection("Compteurs")
  const meters = general?.meters || {}
  function drawMeter(label: string, meter: any) {
    drawText(page, label, 40, y, 11, true)
    y -= 14
    drawText(page, `N° du compteur : ${meter?.number || "Non renseigné"}`, 40, y, 10)
    y -= 12
    if (label.includes("électrique")) {
      drawText(page, `Relevé HP : ${meter?.full_hour || "Non renseigné"}`, 40, y, 10)
      y -= 12
      drawText(page, `Relevé HC : ${meter?.off_peak || "Non renseigné"}`, 40, y, 10)
      y -= 16
    } else {
      drawText(page, `Relevé : ${meter?.reading || "Non renseigné"}`, 40, y, 10)
      y -= 16
    }
  }
  drawMeter("Compteur électrique", meters?.electricity)
  drawMeter("Compteur gaz", meters?.gas)
  drawMeter("Compteur eau", meters?.water)
  y -= 10

  const headerHeight = 20,
    rowHeight = 16
  const isExit = (general.type || "entree") === "sortie"
  const drawTableHeader = (p: any, yStart: number) => {
    const columns = isExit
      ? [
          { label: "Élément", w: 230 },
          { label: "Entrée", w: 100 },
          { label: "Sortie", w: 100 },
          { label: "Commentaire", w: 165 },
        ]
      : [
          { label: "Élément", w: 260 },
          { label: "État", w: 120 },
          { label: "Commentaire", w: 155 },
        ]
    let x = 40
    for (const col of columns) {
      drawText(p, col.label, x, yStart - 14, 10, true, colorPrimary)
      x += col.w
    }
    addLine(p, yStart - headerHeight)
    return columns
  }
  const drawRow = (p: any, yRow: number, columns: any[], values: string[], rowIndex: number) => {
    if (rowIndex % 2 === 0) p.drawRectangle({ x: 40, y: yRow - rowHeight, width: pageWidth - 80, height: rowHeight, color: colorAltRow })
    let x = 40
    for (let i = 0; i < columns.length; i++) {
      drawText(p, (values[i] || "").toString().slice(0, 80), x + 2, yRow - 12, 9)
      x += columns[i].w
    }
    addLine(p, yRow - rowHeight)
  }

  for (const room of rooms) {
    page = pdfDoc.addPage([pageWidth, pageHeight])
    y = pageHeight - 60
    drawText(page, `Pièce: ${room.name || room.id || ""}`, 40, y, 12, true, colorHeader)
    y -= 18
    const columns = drawTableHeader(page, y)
    y -= headerHeight
    const elements = room?.elements ? Object.keys(room.elements) : []
    for (let i = 0; i < elements.length; i++) {
      const key = elements[i]
      const el = room.elements[key] || {}
      const label = key.charAt(0).toUpperCase() + key.slice(1)
      const values = isExit
        ? [label, el.state_entree || el.state || "", el.state_sortie || "", el.comment || ""]
        : [label, el.state || "", el.comment || ""]
      drawRow(page, y, columns, values, i)
      y -= rowHeight
    }
  }

  if (data?.signatures?.owner && data?.signatures?.tenant) {
    page = pdfDoc.addPage([pageWidth, pageHeight])
    y = pageHeight - 100
    drawText(page, "Signatures", 40, y, 12, true, colorHeader)
    y -= 8
    addLine(page, y)
    y -= 8
    const toBytesFromDataUrl = (dataUrl: string) => Buffer.from((dataUrl.split(",")[1] || ""), "base64")
    try {
      const ownerPng = await pdfDoc.embedPng(toBytesFromDataUrl(data.signatures.owner))
      const tenantPng = await pdfDoc.embedPng(toBytesFromDataUrl(data.signatures.tenant))
      const sigWidth = 180,
        sigHeight = 60
      drawText(page, "Propriétaire:", 40, y, 10, true)
      page.drawImage(ownerPng, { x: 40, y: y - sigHeight - 6, width: sigWidth, height: sigHeight })
      drawText(page, "Locataire:", 320, y, 10, true)
      page.drawImage(tenantPng, { x: 320, y: y - sigHeight - 6, width: sigWidth, height: sigHeight })
    } catch {}
  }

  const pdfBytes = await pdfDoc.save()
  const filePath = `etat-des-lieux/${leaseId}-${type}.pdf`
  const { error: upErr } = await db.storage
    .from("documents")
    .upload(filePath, Buffer.from(pdfBytes), { upsert: true, contentType: "application/pdf" })
  if (upErr) throw upErr
  const { data: pub } = db.storage.from("documents").getPublicUrl(filePath)
  await db
    .from("etat_des_lieux_documents")
    .update({ file_url: pub.publicUrl, file_name: `${leaseId}-${type}.pdf`, mime_type: "application/pdf", updated_at: new Date().toISOString() })
    .eq("id", document.id)

  return pub.publicUrl
}



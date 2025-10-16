import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    const body = await request.json().catch(() => ({}))
    const type = body?.type || "entree"
    const force = !!body?.force
    const db = createServerClient()

    // Charger document + bail
    const { data: document, error: docErr } = await db
      .from("etat_des_lieux_documents")
      .select("*")
      .eq("lease_id", leaseId)
      .eq("type", type)
      .single()
    if (docErr || !document) return NextResponse.json({ error: "Document d'état des lieux non trouvé" }, { status: 404 })

    const { data: lease, error: leaseErr } = await db
      .from("leases")
      .select("id, property_id")
      .eq("id", leaseId)
      .single()
    if (leaseErr || !lease) return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })

    // Si un fichier final existe déjà, le servir directement
    if (!force && document.file_url) {
      try {
        const existing = await fetch(document.file_url)
        if (existing.ok) {
          const buf = await existing.arrayBuffer()
          return new NextResponse(Buffer.from(buf), {
            headers: {
              "Content-Type": document.mime_type || "application/pdf",
              "Content-Disposition": `attachment; filename="${document.file_name || `etat-des-lieux-${type}-${leaseId}.pdf`}"`,
            },
          })
        }
      } catch {}
    }

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib")
    const pdfDoc = await PDFDocument.create()
    const pageWidth = 595.28
    const pageHeight = 841.89

    // Couleurs
    const colorPrimary = rgb(59 / 255, 130 / 255, 246 / 255)
    const colorMuted = rgb(107 / 255, 114 / 255, 128 / 255)
    const colorHeader = rgb(30 / 255, 41 / 255, 59 / 255)
    const colorAltRow = rgb(0.95, 0.95, 0.95)

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const drawText = (p: any, text: string, x: number, y: number, size = 12, isBold = false, color = rgb(0,0,0)) => {
      p.drawText(text, { x, y, size, font: isBold ? bold : font, color })
    }

    const addLine = (p: any, yPos: number, color = rgb(0,0,0), thickness = 0.5) => {
      p.drawLine({ start: { x: 40, y: yPos }, end: { x: pageWidth - 40, y: yPos }, thickness, color })
    }

    const stateToLabel = (code?: string) => {
      switch ((code || '').toUpperCase()) {
        case 'ABSENT': case 'A': return "Élément absent"
        case 'M': return "Mauvais état"
        case 'P': return "État passable"
        case 'B': return "Bon état"
        case 'TB': return "Très bon état"
        default: return code || ''
      }
    }

    async function drawImagesGrid(pdfDoc: any, page: any, startX: number, startY: number, photos: string[], options?: { cellW?: number, cellH?: number, gap?: number, maxPerRow?: number, pageWidth?: number, pageHeight?: number }): Promise<{ page: any, y: number }> {
      const { cellW = 150, cellH = 100, gap = 16, maxPerRow = 3, pageWidth = 595.28, pageHeight = 841.89 } = options || {}
      let px = startX, py = startY, rowMaxHeight = 0
      for (let i = 0; i < photos.length; i++) {
        try {
          const url = photos[i]
          const resp = await fetch(url)
          if (!resp.ok) continue
          const arr = await resp.arrayBuffer()
          const contentType = resp.headers.get("content-type") || ""
          const bytes = new Uint8Array(arr)
          const img = contentType.includes("png") ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes)
          const scale = Math.min(cellW / img.width, cellH / img.height)
          const w = img.width * scale, h = img.height * scale
          page.drawRectangle({ x: px - 2, y: py - h - 2, width: w + 4, height: h + 4, borderColor: colorMuted, borderWidth: 0.5 })
          page.drawImage(img, { x: px, y: py - h, width: w, height: h })
          rowMaxHeight = Math.max(rowMaxHeight, h)
        } catch {}
        px += cellW + gap
        if ((i + 1) % maxPerRow === 0 || i === photos.length - 1) {
          py -= rowMaxHeight + gap
          px = startX
          rowMaxHeight = 0
          if (py < 100 && i < photos.length - 1) { page = pdfDoc.addPage([pageWidth, pageHeight]); py = pageHeight - 80 }
        }
      }
      return { page, y: py - 20 }
    }

    const data = document.digital_data || {}
    const general = data.general_info || {}
    const rooms = Array.isArray(data.rooms) ? data.rooms : []

    // --- Page 1 ---
    let page = pdfDoc.addPage([pageWidth, pageHeight])
    let y = pageHeight - 60

    // Titre centré
    const title = "ÉTAT DES LIEUX"
    const subtitle = general.type === "sortie" ? "DE SORTIE" : "D'ENTRÉE"
    const titleWidth = font.widthOfTextAtSize(title, 20)
    drawText(page, title, (pageWidth - titleWidth)/2, y, 20, true, colorPrimary)
    y -= 30
    const subtitleWidth = font.widthOfTextAtSize(subtitle, 16)
    drawText(page, subtitle, (pageWidth - subtitleWidth)/2, y, 16, true, colorHeader)
    y -= 40

    function drawSection(titleStr: string) {
      if(y<120){ page=pdfDoc.addPage([pageWidth,pageHeight]); y=pageHeight-60 }
      drawText(page,titleStr,40,y,13,true,colorHeader)
      addLine(page,y-4,colorPrimary,1)
      y-=22
    }

    // Informations générales
    drawSection("Informations générales")
    const generalInfo = [
      `Date: ${general.date || new Date().toISOString().slice(0,10)}`,
      `Adresse: ${general.address || ""}`,
      `Propriétaire: ${(general.owner?.first_name || "")} ${(general.owner?.last_name || "").trim()}`,
      `Locataire: ${(general.tenant?.first_name || "")} ${(general.tenant?.last_name || "").trim()}`
    ]
    generalInfo.forEach(line=>{ drawText(page,line,40,y,10); y-=14 })
    y-=10

    // Autres informations
    drawSection("Autres informations")
    const heatingType = general?.heating?.type || "Non renseigné"
    const heatingFuel = general?.heating?.fuel_type || "Non renseigné"
    const hotType = general?.hot_water?.type || "Non renseigné"
    const hotFuel = general?.hot_water?.fuel_type || "Non renseigné"
    [ `Type de chauffage : ${heatingType}`, `Type de combustible : ${heatingFuel}`, `Type d'eau chaude : ${hotType}`, `Type de combustible : ${hotFuel}` ]
      .forEach(l=>{ drawText(page,l,40,y,10); y-=14 })
    y-=10

    // Compteurs
    drawSection("Compteurs")
    const meters = general?.meters || {}
    function drawMeter(label:string, meter:any){
      drawText(page,label,40,y,11,true); y-=14
      drawText(page,`N° du compteur : ${meter?.number||"Non renseigné"}`,40,y,10); y-=12
      if(label.includes("électrique")){ drawText(page,`Relevé HP : ${meter?.full_hour||"Non renseigné"}`,40,y,10); y-=12; drawText(page,`Relevé HC : ${meter?.off_peak||"Non renseigné"}`,40,y,10); y-=16 }
      else { drawText(page,`Relevé : ${meter?.reading||"Non renseigné"}`,40,y,10); y-=16 }
    }
    drawMeter("Compteur électrique",meters?.electricity)
    drawMeter("Compteur gaz",meters?.gas)
    drawMeter("Compteur eau",meters?.water)
    y-=10

    // Clés
    drawSection("Clés")
    const keys = general?.keys || {}
    [ `Clés d'entrée : ${keys?.entrance??0}`, `Clés immeuble/portail : ${keys?.building??0}`, `Clés parking : ${keys?.parking??0}`,
      `Clés boîte aux lettres : ${keys?.mailbox??0}`, `Clés cave : ${keys?.cellar??0}`, `Autre type de clés : ${keys?.other??0}`, `Type d'autre clé : ${keys?.other_type||"Non renseigné"}` ]
      .forEach(l=>{ drawText(page,l,40,y,10); y-=14 })
    y-=10

    // Commentaire général
    if(general?.general_comment){
      drawSection("Commentaire général")
      const wrapped = general.general_comment.match(/.{1,110}(\s|$)/g) || [general.general_comment]
      wrapped.forEach(line=>{ if(y<80){ page=pdfDoc.addPage([pageWidth,pageHeight]); y=pageHeight-60 } drawText(page,line.trim(),40,y,10,false,colorMuted); y-=14 })
      y-=10
    }

    // --- Page 2+ : Pièces ---
    const headerHeight = 20, rowHeight=16
    const isExit = (general.type || "entree")==="sortie"

    const drawTableHeader = (p:any,yStart:number)=>{
      const columns = isExit
        ? [ {label:"Élément",w:230}, {label:"Entrée",w:100}, {label:"Sortie",w:100}, {label:"Commentaire",w:165} ]
        : [ {label:"Élément",w:260}, {label:"État",w:120}, {label:"Commentaire",w:155} ]
      let x=40
      for(const col of columns){ drawText(p,col.label,x,yStart-14,10,true,colorPrimary); x+=col.w }
      addLine(p,yStart-headerHeight)
      return columns
    }

    const drawRow = (p:any,yRow:number,columns:any[],values:string[],rowIndex:number)=>{
      const wrapByWidth = (text:string, maxWidth:number, size=9)=>{
        const result:string[] = []
        const content = (text||"").toString()
        if(!content){ return [""] }
        const words = content.split(/\s+/)
        let line = ""
        for(const word of words){
          const tentative = line ? `${line} ${word}` : word
          if (font.widthOfTextAtSize(tentative, size) <= maxWidth){
            line = tentative
          } else {
            if(line) result.push(line)
            // si un mot seul dépasse, couper caractère par caractère
            if (font.widthOfTextAtSize(word, size) > maxWidth){
              let chunk = ""
              for (const ch of word){
                const t2 = chunk + ch
                if (font.widthOfTextAtSize(t2, size) <= maxWidth){
                  chunk = t2
                } else {
                  if (chunk) result.push(chunk)
                  chunk = ch
                }
              }
              line = chunk
            } else {
              line = word
            }
          }
        }
        if(line) result.push(line)
        return result
      }
      const paddingX = 4
      const wrappedPerCol: string[][] = columns.map((c, idx)=> wrapByWidth(values[idx]||"", c.w - paddingX*2, 9))
      const maxLines = Math.max(...wrappedPerCol.map(l=>l.length))
      const computedRowHeight = 12 + (maxLines * 12)
      if(rowIndex%2===0) p.drawRectangle({ x:40, y:yRow-computedRowHeight, width:pageWidth-80, height:computedRowHeight, color:colorAltRow })
      let x=40
      for(let i=0;i<columns.length;i++){
        const colLines = wrappedPerCol[i]
        for(let li=0; li<colLines.length; li++){
          drawText(p, colLines[li], x+2, yRow - 12 - (li*12), 9)
        }
        x += columns[i].w
      }
      addLine(p, yRow - computedRowHeight)
      return computedRowHeight
    }

    for(const room of rooms){
      page = pdfDoc.addPage([pageWidth,pageHeight]); y=pageHeight-60
      drawText(page,`Pièce: ${room.name||room.id||""}`,40,y,12,true,colorHeader); y-=18
      const columns = drawTableHeader(page,y); y-=headerHeight
      const elements = room?.elements ? Object.keys(room.elements) : []
      for(let i=0;i<elements.length;i++){
        const key = elements[i], el=room.elements[key]||{}
        const label = key.charAt(0).toUpperCase()+key.slice(1)
        const values = isExit ? [label,stateToLabel(el.state_entree||el.state),stateToLabel(el.state_sortie),el.comment||""] : [label,stateToLabel(el.state),el.comment||""]
        // Dessiner en mesurant la hauteur; si ça déborde, repaginer et redessiner
        const tempHeight = drawRow(page,y,columns,values,i)
        if (y - tempHeight < 80){
          page=pdfDoc.addPage([pageWidth,pageHeight]); y=pageHeight-60; drawText(page,`Pièce: ${room.name||room.id||""}`,40,y,12,true,colorHeader); y-=18; drawTableHeader(page,y); y-=headerHeight
          const used2 = drawRow(page,y,columns,values,i) || rowHeight
          y -= used2
          continue
        }
        const used = tempHeight || rowHeight
        y -= used
        if(y<120){ page=pdfDoc.addPage([pageWidth,pageHeight]); y=pageHeight-60; drawText(page,`Pièce: ${room.name||room.id||""}`,40,y,12,true,colorHeader); y-=18; drawTableHeader(page,y); y-=headerHeight }
      }

      // Marge avant commentaire ou photos (augmentée)
      y-=18

      // Commentaire de la pièce
      if(room.comment){
        if (y<120){ page=pdfDoc.addPage([pageWidth,pageHeight]); y=pageHeight-60 }
        drawText(page,"Commentaire de la pièce",40,y,11,true,colorHeader); y-=8; addLine(page,y); y-=14
        const lines=(room.comment as string).match(/.{1,110}(\s|$)/g)||[room.comment]
        lines.forEach(line=>{ if(y<80){ page=pdfDoc.addPage([pageWidth,pageHeight]); y=pageHeight-60 } drawText(page,line.trim(),40,y,10,false,colorMuted); y-=14 })
        y-=14
      }

      // Photos
      const photos:Array<string> = Array.isArray(room.photos)?room.photos:[]
      if(photos.length>0){
        if(y<240){ page=pdfDoc.addPage([pageWidth,pageHeight]); y=pageHeight-60 }
        drawText(page,"Photos",40,y,11,true,colorHeader); y-=6; addLine(page,y); y-=14
        const result = await drawImagesGrid(pdfDoc,page,40,y,photos)
        page = result.page; y = result.y
      }
    }

    // Signatures
    if(data?.signatures?.owner && data?.signatures?.tenant){
      page = pdfDoc.addPage([pageWidth,pageHeight]); y=pageHeight-100
      drawText(page,"Signatures",40,y,12,true,colorHeader); y-=8; addLine(page,y); y-=8
      const toBytesFromDataUrl=(dataUrl:string)=>Buffer.from((dataUrl.split(",")[1]||""),"base64")
      try{
        const ownerPng = await pdfDoc.embedPng(toBytesFromDataUrl(data.signatures.owner))
        const tenantPng = await pdfDoc.embedPng(toBytesFromDataUrl(data.signatures.tenant))
        const sigWidth=180,sigHeight=60
        drawText(page,"Propriétaire:",40,y,10,true)
        page.drawImage(ownerPng,{x:40,y:y-sigHeight-6,width:sigWidth,height:sigHeight})
        drawText(page,"Locataire:",320,y,10,true)
        page.drawImage(tenantPng,{x:320,y:y-sigHeight-6,width:sigWidth,height:sigHeight})
      }catch{}
    }

    // Pagination
    const pages = pdfDoc.getPages(); const total = pages.length
    for(let i=0;i<total;i++){ const p=pages[i]; const footer=`Page ${i+1} / ${total}`; p.drawText(footer,{x: pageWidth/2-(footer.length*2), y:24, size:9, font, color: colorMuted}) }

    const pdfBytes = await pdfDoc.save()

    // Upload et memorisation si non present
    try{
      const filePath = `etat-des-lieux/${leaseId}-${type}.pdf`
      const { error: upErr } = await db.storage.from("documents").upload(filePath, Buffer.from(pdfBytes), { upsert:true, contentType:"application/pdf" })
      if(!upErr){
        const { data: pub } = db.storage.from("documents").getPublicUrl(filePath)
        await db.from("etat_des_lieux_documents").update({ file_url: pub.publicUrl, file_name: `${leaseId}-${type}.pdf`, mime_type: "application/pdf", updated_at: new Date().toISOString() }).eq("id", document.id)
      }
    }catch{}

    return new NextResponse(Buffer.from(pdfBytes), { headers: { "Content-Type":"application/pdf", "Content-Disposition":`attachment; filename=\"etat-des-lieux-${type}-${leaseId}.pdf\"` }})
  }catch(e){
    console.error("Erreur génération PDF état des lieux:",e)
    return NextResponse.json({ error:"Erreur lors de la génération du PDF" },{status:500})
  }
}

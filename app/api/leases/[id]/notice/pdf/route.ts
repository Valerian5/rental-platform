import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const leaseId = params.id
  const authHeader = request.headers.get("authorization") || ""
  const hasBearer = authHeader.toLowerCase().startsWith("bearer ")
  const token = hasBearer ? authHeader.slice(7) : null
  const supabase = hasBearer
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
    : createServerClient(request)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const { data: lease } = await supabase
      .from('leases')
      .select('id, owner_id, tenant_id')
      .eq('id', leaseId)
      .single()
    if (!lease) return NextResponse.json({ error: 'Bail introuvable' }, { status: 404 })
    if (user.id !== lease.owner_id && user.id !== lease.tenant_id) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })

    const { data: notice } = await supabase
      .from('lease_notices')
      .select('notice_date, move_out_date, letter_html')
      .eq('lease_id', leaseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!notice) return NextResponse.json({ error: 'Aucun préavis' }, { status: 404 })

    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4 en points
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let y = 800
    const marginX = 50
    const drawText = (text: string, opts?: { size?: number; bold?: boolean; color?: any }) => {
      const size = opts?.size ?? 12
      const usedFont = opts?.bold ? bold : font
      page.drawText(text, { x: marginX, y, size, font: usedFont, color: opts?.color || rgb(0,0,0) })
      y -= size + 6
    }

    drawText('Notification de congé', { size: 16, bold: true })
    drawText(`Date: ${new Date(notice.notice_date).toLocaleDateString('fr-FR')}`)
    drawText(`Départ prévu: ${new Date(notice.move_out_date).toLocaleDateString('fr-FR')}`)
    y -= 8
    drawText('Contenu du courrier:', { bold: true })

    // Extraire un texte simplifié du HTML (sans balises) pour PDF
    const plain = (notice.letter_html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const wrap = (text: string, max = 90) => {
      const words = text.split(' ')
      let line = ''
      const lines: string[] = []
      words.forEach((w) => {
        if ((line + ' ' + w).trim().length > max) { lines.push(line.trim()); line = w } else { line += ' ' + w }
      })
      if (line.trim()) lines.push(line.trim())
      return lines
    }
    wrap(plain, 90).forEach((ln) => { if (y < 80) { page.drawText('... (suite)', { x: marginX, y, size: 10, font }); y = 780 } page.drawText(ln, { x: marginX, y, size: 11, font }); y -= 14 })

    // Préparer la signature locataire en bas de page
    let signatureImg: any | null = null
    try {
      const match = (notice.letter_html || '').match(/<img[^>]+src=\"(data:image\/(png|jpeg)[^\"]+)\"/i)
      if (match && match[1]) {
        const dataUrl = match[1]
        const bytes = Buffer.from(dataUrl.split(',')[1], 'base64')
        signatureImg = dataUrl.includes('png') ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes)
      }
    } catch {}

    // Espace signature en bas: image (si présente) au-dessus du libellé puis ligne
    const bottomMargin = 60
    const lineWidth = 250
    const lineY = bottomMargin + 20
    if (signatureImg) {
      const targetHeight = 60
      const scale = targetHeight / signatureImg.height
      const targetWidth = signatureImg.width * scale
      page.drawImage(signatureImg, {
        x: marginX,
        y: lineY + 24,
        width: targetWidth,
        height: targetHeight,
      })
    }
    // Libellé "Signature du locataire" juste au-dessus de la ligne
    page.drawText('Signature du locataire', { x: marginX, y: lineY + 12, size: 10, font })
    // Ligne de signature
    page.drawRectangle({ x: marginX, y: lineY, width: lineWidth, height: 1, color: rgb(0,0,0) })

    const pdfBytes = await pdfDoc.save()
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="preavis-${leaseId}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('❌ notice/pdf:', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}
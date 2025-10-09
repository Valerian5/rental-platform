import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@/lib/supabase"

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  // Ajustement si le mois cible n'a pas autant de jours
  if (d.getDate() < day) {
    d.setDate(0)
  }
  return d
}

function formatFr(date: Date): string {
  return date.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
}

function buildNoticeLetterHtml(args: {
  tenantName: string
  ownerName: string
  propertyAddress: string
  noticeDate: Date
  moveOutDate: Date
  noticeMonths: number
}): string {
  const { tenantName, ownerName, propertyAddress, noticeDate, moveOutDate, noticeMonths } = args

  return `
  <div style="font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6; color: #111; padding: 40px; max-width: 700px; margin: auto;">
    
    <!-- Coordonnées en haut -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 50px;">
      <div>
        <p><strong>${tenantName}</strong></p>
        <p>${propertyAddress}</p>
      </div>
      <div style="text-align: right;">
        <p><strong>À l'attention de</strong></p>
        <p>${ownerName}</p>
      </div>
    </div>

    <!-- Date -->
    <p style="text-align: right;">${formatFr(noticeDate)}</p>

    <!-- Objet -->
    <p style="margin-top: 40px;"><strong>Objet : Notification de congé – ${propertyAddress}</strong></p>

    <!-- Corps du courrier -->
    <p>Madame, Monsieur,</p>
    <p>
      Je, soussigné(e) <strong>${tenantName}</strong>, vous informe par la présente de mon souhait de mettre fin au bail
      relatif au logement situé au <strong>${propertyAddress}</strong>.
    </p>
    <p>
      Conformément aux dispositions légales, le présent congé prend effet après un délai de préavis de
      <strong>${noticeMonths} mois</strong>, soit jusqu’au <strong>${formatFr(moveOutDate)}</strong> (inclus).
    </p>
    <p>
      Je vous remercie de bien vouloir me confirmer la bonne réception de ce courrier. Nous pourrons
      convenir ensemble d'une date pour l’état des lieux de sortie et la remise des clés.
    </p>
    <p>Veuillez agréer, Madame, Monsieur, l’expression de mes salutations distinguées.</p>

    <!-- Signature -->
    <div style="margin-top: 60px;">
      <p><strong>${tenantName}</strong></p>
      <div style="height: 60px; border-bottom: 1px solid #000; width: 250px; margin-top: 10px;"></div>
      <p style="font-size: 12px; color: #555;">Signature</p>
    </div>

  </div>
  `
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    console.log("[NOTICE][POST] start", { leaseId, mode: hasBearer ? "bearer" : "cookies" })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const {
      noticeDate: noticeDateStr,
      isTenseZone = true,
      noticePeriodMonths,
      confirm,
      previewOnly,
      signatureDataUrl,
      desiredMoveOut: desiredMoveOutStr,
    } = body || {}

    if (!previewOnly && !confirm) {
      return NextResponse.json({ error: "Confirmation requise" }, { status: 400 })
    }

    // Charger le bail
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select(`
        id, tenant_id, owner_id, property_id, status,
        monthly_rent, charges, start_date, end_date,
        properties:properties(id, address, city, postal_code, availability_date, available, owner_id, rent_control_zone),
        tenant:users!leases_tenant_id_fkey(id, first_name, last_name, email),
        owner:users!leases_owner_id_fkey(id, first_name, last_name, email)
      `)
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    if (lease.tenant_id !== user.id) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const tenseFlag = typeof isTenseZone === "boolean" ? isTenseZone : !!lease.properties?.rent_control_zone
    const months =
      typeof noticePeriodMonths === "number" && [1, 2, 3].includes(noticePeriodMonths)
        ? noticePeriodMonths
        : tenseFlag
        ? 1
        : 3

    const noticeDate = noticeDateStr ? new Date(noticeDateStr) : new Date()
    const legalEnd = addMonths(noticeDate, months)
    // Si le locataire a saisi une date souhaitée, on la prend en compte
    // mais on s'assure qu'elle n'est pas avant la date légale minimale
    let moveOutDate = legalEnd
    if (desiredMoveOutStr) {
      const desired = new Date(desiredMoveOutStr)
      if (!isNaN(desired.getTime())) {
        moveOutDate = desired < legalEnd ? legalEnd : desired
      }
    }

    const tenantName = `${lease.tenant?.first_name || ""} ${lease.tenant?.last_name || ""}`.trim() || "Locataire"
    const ownerName = `${lease.owner?.first_name || ""} ${lease.owner?.last_name || ""}`.trim() || "Propriétaire"
    const address = lease.properties?.address || "Votre logement"

    const letterHtml = buildNoticeLetterHtml({
      tenantName,
      ownerName,
      propertyAddress: address,
      noticeDate,
      moveOutDate,
      noticeMonths: months,
    })

    // 🖋️ Signature au-dessus de la ligne
    let signedLetterHtml = letterHtml
    if (signatureDataUrl) {
      const signatureBlock = `
        <div style="margin-top: 60px;">
          <p><strong>${tenantName}</strong></p>
          <img alt="signature" src="${signatureDataUrl}" style="height:80px; margin: 10px 0;" />
          <div style="height: 60px; border-bottom: 1px solid #000; width: 250px; margin-top: 10px;"></div>
          <p style="font-size: 12px; color: #555;">Signature</p>
        </div>
      `

      signedLetterHtml = signedLetterHtml.replace(
        /<div style="margin-top: 60px;">[\s\S]*?<p style="font-size: 12px; color: #555;">Signature<\/p>\s*<\/div>/,
        signatureBlock
      )
    }

    if (previewOnly) {
      return NextResponse.json({
        success: true,
        letterHtml: signedLetterHtml,
        moveOutDate: moveOutDate.toISOString(),
      })
    }

    // Enregistrement du préavis
    const { data: notice, error: noticeError } = await supabase
      .from("lease_notices")
      .insert({
        lease_id: lease.id,
        tenant_id: lease.tenant_id,
        owner_id: lease.owner_id,
        property_id: lease.property_id,
        notice_date: noticeDate.toISOString().slice(0, 10),
        notice_period_months: months,
        is_tense_zone: tenseFlag,
        move_out_date: moveOutDate.toISOString().slice(0, 10),
        letter_html: signedLetterHtml,
        status: "sent",
        metadata: { signatureDataUrl: signatureDataUrl || null },
      })
      .select("*")
      .single()

    if (noticeError) {
      return NextResponse.json({ error: "Erreur enregistrement préavis" }, { status: 500 })
    }

    // Mettre à jour la disponibilité de la propriété
    const { error: updatePropError } = await supabase
      .from("properties")
      .update({ availability_date: moveOutDate.toISOString().slice(0, 10) })
      .eq("id", lease.property_id)
    if (updatePropError) console.warn("[NOTICE][POST] property update error", updatePropError)

    // Mettre à jour la date de fin effective du bail pour les calculs (provisions, etc.)
    try {
      const { error: leaseUpdateErr } = await supabase
        .from("leases")
        .update({ end_date: moveOutDate.toISOString().slice(0, 10) })
        .eq("id", lease.id)
      if (leaseUpdateErr) {
        console.warn("[NOTICE][POST] lease end_date update error", leaseUpdateErr)
      }
    } catch (e) {
      console.warn("[NOTICE][POST] lease end_date update exception", e)
    }

    // Notification in-app
    try {
      const { notificationsService } = await import("@/lib/notifications-service")
      await notificationsService.createNotification(lease.owner_id, {
        type: "tenant_notice",
        title: "Préavis de départ reçu",
        content: `${tenantName} a envoyé un préavis pour le logement au ${address}. Départ prévu le ${formatFr(moveOutDate)}.`,
        action_url: `/owner/leases/${leaseId}`,
        metadata: { lease_id: leaseId, notice_id: notice.id },
      })
    } catch (e) {
      console.warn("Notification in-app owner (préavis) échouée:", e)
    }

    // Génération PDF et upload
    let pdfUrl: string | null = null
    try {
      const site = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || ''
      const { createServiceSupabaseClient } = await import('@/lib/supabase-server-client')
      const admin = createServiceSupabaseClient()
      const pdfRes = await fetch(`${site}/api/leases/${leaseId}/notice/pdf`, {
        headers: { Authorization: `Bearer ${token || ''}` } as any,
      })
      if (pdfRes.ok) {
        const buf = Buffer.from(await pdfRes.arrayBuffer())
        const path = `tenant-notices/${leaseId}/preavis-${Date.now()}.pdf`
        const { error: upErr } = await admin.storage.from('documents').upload(path, buf, { contentType: 'application/pdf', upsert: true })
        if (!upErr) {
          const { data: { publicUrl } } = admin.storage.from('documents').getPublicUrl(path)
          pdfUrl = publicUrl
          await supabase.from('lease_notices').update({ document_url: pdfUrl }).eq('id', notice.id)
        }
      }
    } catch (e) {
      console.warn('[NOTICE] PDF upload error', e)
    }

    // Email au propriétaire
    try {
      if (lease.owner?.email) {
        const { sendTenantNoticeToOwnerEmail } = await import("@/lib/email-service")
        await sendTenantNoticeToOwnerEmail(
          { id: lease.owner_id, name: ownerName, email: lease.owner.email } as any,
          { id: lease.tenant_id, name: tenantName, email: lease.tenant?.email || "" } as any,
          { id: lease.property_id, title: address, address } as any,
          moveOutDate.toISOString(),
          pdfUrl ? undefined : signedLetterHtml,
        )
      }
    } catch (e) {
      console.warn("Email owner (préavis) échoué:", e)
    }

    return NextResponse.json({ success: true, notice, moveOutDate: moveOutDate.toISOString(), letterHtml })
  } catch (error: any) {
    console.error("❌ Erreur création préavis:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

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
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const { data: lease } = await supabase.from("leases").select("tenant_id, owner_id").eq("id", leaseId).single()
    if (!lease) return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })

    if (user.id !== lease.tenant_id && user.id !== lease.owner_id) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const { data: notices } = await supabase
      .from("lease_notices")
      .select("*")
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false })
      .limit(1)

    return NextResponse.json({ success: true, notice: notices?.[0] || null })
  } catch (error: any) {
    console.error("❌ Erreur récupération préavis:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

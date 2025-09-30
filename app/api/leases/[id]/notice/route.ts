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
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <p>${formatFr(noticeDate)}</p>
      <p><strong>À l'attention de ${ownerName}</strong></p>
      <p><strong>Objet: Notification de congé - ${propertyAddress}</strong></p>
      <p>Madame, Monsieur,</p>
      <p>
        Je, soussigné(e) ${tenantName}, vous informe par la présente de mon souhait de mettre fin au bail
        relatif au logement situé au ${propertyAddress}.
      </p>
      <p>
        Conformément aux dispositions légales, le présent congé prend effet après un délai de préavis de
        ${noticeMonths} mois, soit jusqu'au ${formatFr(moveOutDate)} (inclus).
      </p>
      <p>
        Je vous remercie de bien vouloir me confirmer la bonne réception de ce courrier et nous pourrons
        convenir d'une date pour l'état des lieux de sortie.
      </p>
      <p>Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
      <p>${tenantName}</p>
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
    console.log("[NOTICE][POST] cookies", {
      hasAuthToken: !!request.cookies.get("sb-access-token"),
      cookieNames: request.cookies.getAll().map((c) => c.name),
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
    })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log("[NOTICE][POST] auth.getUser", { userId: user?.id, userError })
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
    } = body || {}

    if (!previewOnly && !confirm) {
      return NextResponse.json({ error: "Confirmation requise" }, { status: 400 })
    }

    // Charger le bail + propriété + users
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

    console.log("[NOTICE][POST] lease", { leaseError, found: !!lease })
    if (leaseError || !lease) {
      return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    }

    if (lease.tenant_id !== user.id) {
      console.log("[NOTICE][POST] forbidden", { tenantId: lease.tenant_id, userId: user.id })
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    // Déterminer le nombre de mois de préavis
    const tenseFlag = typeof isTenseZone === "boolean" ? isTenseZone : !!lease.properties?.rent_control_zone
    const months = typeof noticePeriodMonths === "number" && [1,2,3].includes(noticePeriodMonths)
      ? noticePeriodMonths
      : (tenseFlag ? 1 : 3)

    const noticeDate = noticeDateStr ? new Date(noticeDateStr) : new Date()
    const moveOutDate = addMonths(noticeDate, months)

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

    // Mode aperçu uniquement: aucune écriture/notification
    if (previewOnly) {
      console.log("[NOTICE][POST] previewOnly response")
      return NextResponse.json({ success: true, letterHtml, moveOutDate: moveOutDate.toISOString() })
    }

    // Enregistrer le préavis
    const { data: notice, error: noticeError } = await supabase
      .from("lease_notices")
      .insert({
        lease_id: lease.id,
        tenant_id: lease.tenant_id,
        owner_id: lease.owner_id,
        property_id: lease.property_id,
        notice_date: noticeDate.toISOString().slice(0,10),
        notice_period_months: months,
        is_tense_zone: tenseFlag,
        move_out_date: moveOutDate.toISOString().slice(0,10),
        letter_html: letterHtml,
        status: "sent",
        metadata: {},
      })
      .select("*")
      .single()

    console.log("[NOTICE][POST] notice insert", { noticeId: notice?.id, noticeError })
    if (noticeError) {
      return NextResponse.json({ error: "Erreur enregistrement préavis" }, { status: 500 })
    }

    // Mettre à jour la propriété: date de dispo = moveOutDate, disponible = true (post-départ)
    const { error: updatePropError } = await supabase
      .from("properties")
      .update({ availability_date: moveOutDate.toISOString().slice(0,10) })
      .eq("id", lease.property_id)
    if (updatePropError) {
      console.warn("[NOTICE][POST] property update error", updatePropError)
    }

    // Notifications in-app
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

    // Email au propriétaire
    try {
      if (lease.owner?.email) {
        const { sendNewIncidentAlertToOwner } = await import("@/lib/email-service")
        // Réutilisation rapide d'un sender; idéalement créer un template dédié
        await sendNewIncidentAlertToOwner(
          { id: lease.owner_id, name: ownerName, email: lease.owner.email },
          { id: lease.tenant_id, name: tenantName, email: lease.tenant?.email || "" },
          { id: lease.property_id, title: address, address },
          "Préavis de départ du locataire",
        )
      }
    } catch (e) {
      console.warn("Email owner (préavis) échoué:", e)
    }

    console.log("[NOTICE][POST] success", { noticeId: notice.id })
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
    console.log("[NOTICE][GET] start", { leaseId, mode: hasBearer ? "bearer" : "cookies" })
    console.log("[NOTICE][GET] cookies", {
      hasAuthToken: !!request.cookies.get("sb-access-token"),
      cookieNames: request.cookies.getAll().map((c) => c.name),
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
    })
    const { data: { user }, error } = await supabase.auth.getUser()
    console.log("[NOTICE][GET] auth.getUser", { userId: user?.id, error })
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const { data: lease } = await supabase.from("leases").select("tenant_id, owner_id").eq("id", leaseId).single()
    console.log("[NOTICE][GET] lease fetched", { found: !!lease })
    if (!lease) return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })

    if (user.id !== lease.tenant_id && user.id !== lease.owner_id) {
      console.log("[NOTICE][GET] forbidden", { userId: user.id })
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const { data: notices } = await supabase
      .from("lease_notices")
      .select("*")
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false })
      .limit(1)

    console.log("[NOTICE][GET] success", { hasNotice: !!(notices && notices[0]) })
    return NextResponse.json({ success: true, notice: notices?.[0] || null })
  } catch (error: any) {
    console.error("❌ Erreur récupération préavis:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}



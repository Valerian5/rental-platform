import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@/lib/supabase"

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    // Charger le bail et vérifier que l'utilisateur est le propriétaire
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("id, owner_id, property_id, tenant_id")
      .eq("id", leaseId)
      .single()

    if (leaseError || !lease) return NextResponse.json({ error: "Bail introuvable" }, { status: 404 })
    if (lease.owner_id !== user.id) return NextResponse.json({ error: "Accès interdit" }, { status: 403 })

    // Créer un document EDL de sortie en brouillon s'il n'existe pas
    const { data: existing } = await supabase
      .from("etat_des_lieux_documents")
      .select("id, status")
      .eq("lease_id", leaseId)
      .eq("type", "sortie")
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ success: true, document: existing[0] })
    }

    const { data: doc, error: docError } = await supabase
      .from("etat_des_lieux_documents")
      .insert({
        lease_id: leaseId,
        property_id: lease.property_id,
        type: "sortie",
        status: "draft",
      })
      .select("*")
      .single()

    if (docError) return NextResponse.json({ error: "Erreur création EDL sortie" }, { status: 500 })

    // Notifier le locataire
    try {
      const { notificationsService } = await import("@/lib/notifications-service")
      await notificationsService.createNotification(lease.tenant_id, {
        type: "etat_des_lieux_out_created",
        title: "État des lieux de sortie à planifier",
        content: "Votre propriétaire a initié l'état des lieux de sortie.",
        action_url: `/tenant/leases/${leaseId}`,
      })
    } catch (e) {
      console.warn("Notification tenant EDL sortie échouée:", e)
    }

    return NextResponse.json({ success: true, document: doc })
  } catch (error: any) {
    console.error("❌ prepare-exit EDL:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}



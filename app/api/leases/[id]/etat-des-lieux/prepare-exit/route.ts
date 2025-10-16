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

    // Si un EDL de sortie existe déjà, le retourner
    const { data: existing } = await supabase
      .from("etat_des_lieux_documents")
      .select("id, status")
      .eq("lease_id", leaseId)
      .eq("type", "sortie")
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ success: true, document: existing[0] })
    }

    // Précharger l'EDL d'entrée (signé de préférence)
    const { data: entryDoc } = await supabase
      .from("etat_des_lieux_documents")
      .select("*")
      .eq("lease_id", leaseId)
      .eq("type", "entree")
      .order("status", { ascending: true })
      .limit(1)

    // Construire les données de sortie préremplies
    const digitalDataOut = (() => {
      const src = (entryDoc && entryDoc.length > 0 ? entryDoc[0]?.digital_data : null) || {}
      const gi = src.general_info || {}
      const meters = gi.meters || {}
      const rooms = Array.isArray(src.rooms) ? src.rooms : []
      const outRooms = rooms.map((room: any) => {
        const elements = room?.elements || {}
        const outElements: Record<string, any> = {}
        Object.keys(elements).forEach((k) => {
          const el = elements[k] || {}
          outElements[k] = {
            state_entree: el.state || undefined,
            comment_entree: el.comment || "",
            state: el.state || "absent", // préremplir sortie avec l'état d'entrée, modifiable ensuite
            comment: el.comment || "", // préremplir sortie avec le commentaire d'entrée
          }
        })
        return {
          id: room.id,
          name: room.name,
          type: room.type,
          elements: outElements,
          comment: room.comment || "",
          photos: Array.isArray(room.photos) ? room.photos : [],
        }
      })
      return {
        general_info: {
          ...(gi || {}),
          type: "sortie",
          // Conserver chauffage/eau chaude (type + fuel_type)
          heating: gi.heating || {},
          hot_water: gi.hot_water || {},
          // Conserver uniquement les numéros de compteurs (pas les relevés)
          meters: {
            electricity: { number: meters?.electricity?.number || "" },
            gas: { number: meters?.gas?.number || "" },
            water: { number: meters?.water?.number || "" },
          },
          // Conserver les clés
          keys: gi.keys || {},
          // Conserver le commentaire général (unique champ d'affichage)
          general_comment: gi.general_comment || "",
        },
        rooms: outRooms,
        property_data: src.property_data || null,
        lease_data: src.lease_data || null,
        created_at: new Date().toISOString(),
      }
    })()

    // Créer un document EDL de sortie en brouillon prérempli
    const { data: doc, error: docError } = await supabase
      .from("etat_des_lieux_documents")
      .insert({
        lease_id: leaseId,
        property_id: lease.property_id,
        type: "sortie",
        status: "draft",
        digital_data: digitalDataOut,
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



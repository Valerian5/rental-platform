import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// POST /api/incidents - Création d'un incident par le locataire (sans priorité côté tenant)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { title, description, category, property_id, lease_id, reported_by, photos } = body || {}

    if (!title || !description || !category || !property_id || !lease_id || !reported_by) {
      return NextResponse.json({ success: false, error: "Champs manquants" }, { status: 400 })
    }

    // Créer un client Supabase avec service role pour contourner RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Vérifier que l'utilisateur existe et est un locataire
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, user_type")
      .eq("id", reported_by)
      .single()

    if (userError || !user || user.user_type !== "tenant") {
      console.error("Erreur utilisateur:", userError)
      return NextResponse.json({ success: false, error: "Utilisateur non autorisé" }, { status: 403 })
    }

    // Vérifier que l'utilisateur est bien le locataire du bail
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("id, tenant_id, owner_id, property:properties(id,title,address)")
      .eq("id", lease_id)
      .single()

    if (leaseError || !lease) {
      return NextResponse.json({ success: false, error: "Bail introuvable" }, { status: 404 })
    }

    if (lease.tenant_id !== user.id) {
      return NextResponse.json({ success: false, error: "Accès refusé" }, { status: 403 })
    }

    // Créer l'incident (priorité définie plus tard par le propriétaire)
    const insertPayload: any = {
      title,
      description,
      category,
      status: "reported",
      property_id,
      lease_id,
      reported_by,
    }
    if (Array.isArray(photos) && photos.length > 0) insertPayload.photos = photos

    const { data: incident, error } = await supabase
      .from("incidents")
      .insert(insertPayload)
      .select("*, property:properties(id,title,address), lease:leases(id, tenant:users!leases_tenant_id_fkey(id,first_name,last_name,email), owner:users!leases_owner_id_fkey(id,first_name,last_name,email))")
      .single()

    if (error) {
      console.error("Erreur création incident:", error)
      return NextResponse.json({ success: false, error: "Erreur base de données" }, { status: 500 })
    }

    // Notifications email
    try {
      const tenant = incident?.lease?.tenant
      const owner = incident?.lease?.owner

      // Confirmer au locataire
      if (tenant?.email) {
        await emailService.sendIncidentConfirmationEmail(
          { id: tenant.id, name: `${tenant.first_name} ${tenant.last_name}`, email: tenant.email },
          { id: incident.property_id, title: incident.property?.title || '' }
        )
      }
      // Notifier le propriétaire
      if (owner?.email) {
        await emailService.sendIncidentCreatedNotificationEmail(
          { id: owner.id, name: `${owner.first_name} ${owner.last_name}`, email: owner.email },
          { id: tenant.id, name: `${tenant.first_name} ${tenant.last_name}` },
          { id: incident.id, title: incident.title, description: incident.description, category: incident.category },
          { id: incident.property_id, title: incident.property?.title || '' },
          `${process.env.NEXT_PUBLIC_SITE_URL}/owner/rental-management/incidents/${incident.id}`
        )
      }
    } catch (emailError) {
      console.warn("Alerte: échec envoi emails création incident:", emailError)
      // On n'échoue pas la requête pour un souci d'email
    }

    return NextResponse.json({ success: true, incident })
  } catch (error) {
    console.error("Erreur POST /api/incidents:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}



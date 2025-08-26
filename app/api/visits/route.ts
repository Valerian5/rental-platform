import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { emailService } from "@/lib/email-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("owner_id")
    const tenantId = searchParams.get("tenant_id")

    console.log("📅 API Visits GET", { ownerId, tenantId })

    if (ownerId) {
      // Récupérer les visites pour un propriétaire
      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          property:properties!inner (
            id,
            title,
            address,
            property_type,
            owner_id
          )
        `)
        .eq("property.owner_id", ownerId)
        .order("visit_date", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération visites propriétaire:", error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ visits: data })
    }

    if (tenantId) {
      // Récupérer les visites pour un locataire
      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          property:properties (
            id,
            title,
            address,
            property_type
          )
        `)
        .eq("tenant_id", tenantId)
        .order("visit_date", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération visites locataire:", error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ visits: data })
    }

    return NextResponse.json({ error: "owner_id ou tenant_id requis" }, { status: 400 })
  } catch (error) {
    console.error("❌ Erreur API visits:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📅 API Visits POST", body)

    // Valider et formater les données selon la structure de la table
    const visitData = {
      property_id: body.property_id,
      tenant_id: body.tenant_id,
      application_id: body.application_id,
      visit_slot_id: body.visit_slot_id, // AJOUT: Référence vers le créneau
      visit_date: body.visit_date, // timestamp with time zone
      start_time: body.start_time, // time without time zone
      end_time: body.end_time, // time without time zone
      status: body.status || "scheduled",
      visitor_name: body.visitor_name,
      tenant_email: body.tenant_email,
      visitor_phone: body.visitor_phone,
      notes: body.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("visits").insert(visitData).select().single()

    if (error) {
      console.error("❌ Erreur création visite:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data && data.status === "scheduled") {
      try {
        // Get tenant and property details for email
        const { data: tenant } = await supabase.from("users").select("*").eq("id", data.tenant_id).single()

        const { data: property } = await supabase
          .from("properties")
          .select("*, owner:users(*)")
          .eq("id", data.property_id)
          .single()

        if (tenant && property && property.owner) {
          // Send confirmation email to tenant
          await emailService.sendEmail({
            to: tenant.email,
            template: "visit_scheduled",
            data: {
              tenantName: `${tenant.first_name} ${tenant.last_name}`,
              propertyTitle: property.title,
              propertyAddress: `${property.address}, ${property.city}`,
              visitDate: new Date(data.visit_date).toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              visitUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/tenant/visits`,
            },
          })

          // Send notification email to owner
          await emailService.sendEmail({
            to: property.owner.email,
            template: "visit_scheduled_owner",
            data: {
              ownerName: `${property.owner.first_name} ${property.owner.last_name}`,
              tenantName: `${tenant.first_name} ${tenant.last_name}`,
              propertyTitle: property.title,
              propertyAddress: `${property.address}, ${property.city}`,
              visitDate: new Date(data.visit_date).toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              visitUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/owner/visits`,
            },
          })
        }
      } catch (emailError) {
        console.error("❌ Erreur envoi email visite:", emailError)
        // Don't fail the API call if email fails
      }
    }

    return NextResponse.json({ visit: data })
  } catch (error) {
    console.error("❌ Erreur API visits POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    console.log("📅 API Visits PATCH", { id, updateData })

    // Ajouter updated_at
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("visits").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("❌ Erreur mise à jour visite:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data && updateData.status && ["cancelled", "completed"].includes(updateData.status)) {
      try {
        // Get visit details with tenant and property info
        const { data: visitDetails } = await supabase
          .from("visits")
          .select(`
            *,
            tenant:users!visits_tenant_id_fkey(*),
            property:properties(*, owner:users(*))
          `)
          .eq("id", id)
          .single()

        if (visitDetails && visitDetails.tenant && visitDetails.property && visitDetails.property.owner) {
          const template = updateData.status === "cancelled" ? "visit_cancelled" : "visit_completed"

          // Notify tenant
          await emailService.sendEmail({
            to: visitDetails.tenant.email,
            template,
            data: {
              tenantName: `${visitDetails.tenant.first_name} ${visitDetails.tenant.last_name}`,
              propertyTitle: visitDetails.property.title,
              propertyAddress: `${visitDetails.property.address}, ${visitDetails.property.city}`,
              visitDate: new Date(visitDetails.visit_date).toLocaleDateString("fr-FR"),
              status: updateData.status,
            },
          })

          // Notify owner
          await emailService.sendEmail({
            to: visitDetails.property.owner.email,
            template: `${template}_owner`,
            data: {
              ownerName: `${visitDetails.property.owner.first_name} ${visitDetails.property.owner.last_name}`,
              tenantName: `${visitDetails.tenant.first_name} ${visitDetails.tenant.last_name}`,
              propertyTitle: visitDetails.property.title,
              visitDate: new Date(visitDetails.visit_date).toLocaleDateString("fr-FR"),
              status: updateData.status,
            },
          })
        }
      } catch (emailError) {
        console.error("❌ Erreur envoi email mise à jour visite:", emailError)
      }
    }

    return NextResponse.json({ visit: data })
  } catch (error) {
    console.error("❌ Erreur API visits PATCH:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

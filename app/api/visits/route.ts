import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

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

    return NextResponse.json({ visit: data })
  } catch (error) {
    console.error("❌ Erreur API visits PATCH:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

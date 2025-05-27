import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🔍 GET visit-slots pour propriété:", params.id)

    const { data: slots, error } = await supabase
      .from("visit_availabilities")
      .select("*")
      .eq("property_id", params.id)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) {
      console.error("❌ Erreur récupération créneaux:", error)
      throw error
    }

    console.log("✅ Créneaux récupérés:", slots?.length || 0)
    return NextResponse.json({ slots: slots || [] })
  } catch (error) {
    console.error("❌ Erreur API créneaux visite:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("💾 POST visit-slots pour propriété:", params.id)

    const body = await request.json()
    const { slots } = body

    if (!slots || !Array.isArray(slots)) {
      return NextResponse.json({ error: "Créneaux manquants ou invalides" }, { status: 400 })
    }

    console.log("📝 Créneaux à sauvegarder:", slots.length)

    // Supprimer les anciens créneaux pour cette propriété
    const { error: deleteError } = await supabase.from("visit_availabilities").delete().eq("property_id", params.id)

    if (deleteError) {
      console.error("❌ Erreur suppression anciens créneaux:", deleteError)
      throw deleteError
    }

    // Insérer les nouveaux créneaux
    if (slots.length > 0) {
      const slotsToInsert = slots.map((slot: any) => ({
        property_id: params.id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_capacity: slot.max_capacity || 1,
        is_group_visit: slot.is_group_visit || false,
        current_bookings: slot.current_bookings || 0,
        is_available: slot.is_available !== false,
      }))

      const { data, error: insertError } = await supabase.from("visit_availabilities").insert(slotsToInsert).select()

      if (insertError) {
        console.error("❌ Erreur insertion créneaux:", insertError)
        throw insertError
      }

      console.log("✅ Créneaux sauvegardés:", data?.length || 0)
      return NextResponse.json({
        success: true,
        slots: data,
        message: `${data?.length || 0} créneaux sauvegardés`,
      })
    } else {
      console.log("✅ Tous les créneaux supprimés")
      return NextResponse.json({
        success: true,
        slots: [],
        message: "Tous les créneaux ont été supprimés",
      })
    }
  } catch (error) {
    console.error("❌ Erreur API sauvegarde créneaux:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🔄 PUT visit-slots pour propriété:", params.id)

    const body = await request.json()
    const { slotId, updates } = body

    if (!slotId) {
      return NextResponse.json({ error: "ID du créneau manquant" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("visit_availabilities")
      .update(updates)
      .eq("id", slotId)
      .eq("property_id", params.id)
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur mise à jour créneau:", error)
      throw error
    }

    console.log("✅ Créneau mis à jour:", data)
    return NextResponse.json({ success: true, slot: data })
  } catch (error) {
    console.error("❌ Erreur API mise à jour créneau:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🗑️ DELETE visit-slots pour propriété:", params.id)

    const { searchParams } = new URL(request.url)
    const slotId = searchParams.get("slotId")

    if (slotId) {
      // Supprimer un créneau spécifique
      const { error } = await supabase
        .from("visit_availabilities")
        .delete()
        .eq("id", slotId)
        .eq("property_id", params.id)

      if (error) {
        console.error("❌ Erreur suppression créneau:", error)
        throw error
      }

      console.log("✅ Créneau supprimé:", slotId)
      return NextResponse.json({ success: true, message: "Créneau supprimé" })
    } else {
      // Supprimer tous les créneaux de la propriété
      const { error } = await supabase.from("visit_availabilities").delete().eq("property_id", params.id)

      if (error) {
        console.error("❌ Erreur suppression tous créneaux:", error)
        throw error
      }

      console.log("✅ Tous les créneaux supprimés pour la propriété:", params.id)
      return NextResponse.json({ success: true, message: "Tous les créneaux supprimés" })
    }
  } catch (error) {
    console.error("❌ Erreur API suppression créneaux:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 })
  }
}

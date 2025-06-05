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
      console.error("❌ Créneaux manquants ou invalides:", slots)
      return NextResponse.json({ error: "Créneaux manquants ou invalides" }, { status: 400 })
    }

    console.log("📝 Créneaux à sauvegarder:", slots.length)

    // Vérifier que la propriété existe
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id")
      .eq("id", params.id)
      .single()

    if (propertyError || !property) {
      console.error("❌ Propriété non trouvée:", propertyError)
      return NextResponse.json({ error: "Propriété non trouvée" }, { status: 404 })
    }

    // Supprimer les anciens créneaux pour cette propriété
    const { error: deleteError } = await supabase.from("visit_availabilities").delete().eq("property_id", params.id)

    if (deleteError) {
      console.error("❌ Erreur suppression anciens créneaux:", deleteError)
      return NextResponse.json({ error: "Erreur lors de la suppression des anciens créneaux" }, { status: 500 })
    }

    // Insérer les nouveaux créneaux
    if (slots.length > 0) {
      const slotsToInsert = slots.map((slot: any) => ({
        property_id: params.id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_capacity: Number(slot.max_capacity) || 1,
        is_group_visit: Boolean(slot.is_group_visit),
        current_bookings: Number(slot.current_bookings) || 0,
        is_available: slot.is_available !== false,
      }))

      const { data, error: insertError } = await supabase.from("visit_availabilities").insert(slotsToInsert).select()

      if (insertError) {
        console.error("❌ Erreur insertion créneaux:", insertError)
        return NextResponse.json({ error: "Erreur lors de l'insertion des créneaux" }, { status: 500 })
      }

      console.log("✅ Créneaux sauvegardés:", data?.length || 0)
      return NextResponse.json({
        success: true,
        slots: data,
        message: `${data?.length || 0} créneaux sauvegardés`,
      })
    } else {
      return NextResponse.json({
        success: true,
        slots: [],
        message: "Tous les créneaux ont été supprimés",
      })
    }
  } catch (error) {
    console.error("❌ Erreur API sauvegarde créneaux:", error)
    return NextResponse.json({ error: "Erreur lors de la sauvegarde des créneaux" }, { status: 500 })
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

      return NextResponse.json({ success: true, message: "Créneau supprimé" })
    } else {
      // Supprimer tous les créneaux de la propriété
      const { error } = await supabase.from("visit_availabilities").delete().eq("property_id", params.id)

      if (error) {
        console.error("❌ Erreur suppression tous créneaux:", error)
        throw error
      }

      return NextResponse.json({ success: true, message: "Tous les créneaux supprimés" })
    }
  } catch (error) {
    console.error("❌ Erreur API suppression créneaux:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression des créneaux" }, { status: 500 })
  }
}

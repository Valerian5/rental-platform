import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const propertyId = params.id

    console.log("🔍 Récupération des créneaux pour la propriété:", propertyId)

    const { data: slots, error } = await supabase
      .from("visit_slots")
      .select("*")
      .eq("property_id", propertyId)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) {
      console.error("❌ Erreur Supabase:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Nettoyer et formater les créneaux
    const cleanedSlots = (slots || []).map((slot) => ({
      id: slot.id,
      date: slot.date,
      start_time: slot.start_time?.substring(0, 5) || "00:00", // Assurer le format HH:MM
      end_time: slot.end_time?.substring(0, 5) || "00:00",
      max_capacity: slot.max_capacity || 1,
      is_group_visit: slot.is_group_visit || false,
      current_bookings: slot.current_bookings || 0,
      is_available: slot.is_available !== false,
    }))

    console.log("✅ Créneaux récupérés:", cleanedSlots.length)

    return NextResponse.json({
      slots: cleanedSlots,
      message: `${cleanedSlots.length} créneaux récupérés`,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des créneaux" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const propertyId = params.id
    const { slots } = await request.json()

    console.log("💾 Sauvegarde des créneaux pour la propriété:", propertyId)
    console.log("📝 Nombre de créneaux à sauvegarder:", slots?.length || 0)

    if (!slots || !Array.isArray(slots)) {
      return NextResponse.json({ error: "Format de données invalide" }, { status: 400 })
    }

    // Supprimer tous les créneaux existants pour cette propriété
    const { error: deleteError } = await supabase.from("visit_slots").delete().eq("property_id", propertyId)

    if (deleteError) {
      console.error("❌ Erreur suppression:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Insérer les nouveaux créneaux si il y en a
    if (slots.length > 0) {
      const slotsToInsert = slots.map((slot) => ({
        property_id: propertyId,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_capacity: slot.max_capacity || 1,
        is_group_visit: slot.is_group_visit || false,
        current_bookings: slot.current_bookings || 0,
        is_available: slot.is_available !== false,
      }))

      const { error: insertError } = await supabase.from("visit_slots").insert(slotsToInsert)

      if (insertError) {
        console.error("❌ Erreur insertion:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    console.log("✅ Créneaux sauvegardés avec succès")

    return NextResponse.json({
      message: `${slots.length} créneaux sauvegardés avec succès`,
      count: slots.length,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur lors de la sauvegarde des créneaux" }, { status: 500 })
  }
}

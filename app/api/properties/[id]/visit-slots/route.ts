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
    console.log("📋 Premier créneau exemple:", slots[0])

    // Vérifier que la propriété existe
    console.log("🏠 Vérification de la propriété...")
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id")
      .eq("id", params.id)
      .single()

    if (propertyError) {
      console.error("❌ Erreur propriété:", propertyError)
      return NextResponse.json(
        {
          error: "Propriété non trouvée",
          details: propertyError.message,
          propertyId: params.id,
        },
        { status: 404 },
      )
    }

    if (!property) {
      console.error("❌ Propriété non trouvée")
      return NextResponse.json({ error: "Propriété non trouvée", propertyId: params.id }, { status: 404 })
    }

    console.log("✅ Propriété trouvée:", property.id)

    // Supprimer les anciens créneaux pour cette propriété
    console.log("🗑️ Suppression des anciens créneaux...")
    const { error: deleteError } = await supabase.from("visit_availabilities").delete().eq("property_id", params.id)

    if (deleteError) {
      console.error("❌ Erreur suppression anciens créneaux:", deleteError)
      return NextResponse.json(
        {
          error: "Erreur lors de la suppression des anciens créneaux",
          details: deleteError.message,
          code: deleteError.code,
        },
        { status: 500 },
      )
    }

    console.log("✅ Anciens créneaux supprimés")

    // Insérer les nouveaux créneaux
    if (slots.length > 0) {
      // Valider et nettoyer les données
      console.log("📝 Validation des créneaux...")
      const slotsToInsert = slots.map((slot: any, index: number) => {
        console.log(`📝 Traitement créneau ${index + 1}:`, slot)

        // Validation des champs requis
        if (!slot.date || !slot.start_time || !slot.end_time) {
          throw new Error(`Créneau ${index + 1}: date, start_time et end_time sont requis`)
        }

        // Validation du format de date
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(slot.date)) {
          throw new Error(`Créneau ${index + 1}: format de date invalide (attendu: YYYY-MM-DD)`)
        }

        // Validation du format d'heure
        const timeRegex = /^\d{2}:\d{2}$/
        if (!timeRegex.test(slot.start_time) || !timeRegex.test(slot.end_time)) {
          throw new Error(`Créneau ${index + 1}: format d'heure invalide (attendu: HH:MM)`)
        }

        const cleanSlot = {
          property_id: params.id,
          date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          max_capacity: Number(slot.max_capacity) || 1,
          is_group_visit: Boolean(slot.is_group_visit),
          current_bookings: Number(slot.current_bookings) || 0,
          is_available: slot.is_available !== false,
        }

        console.log(`✅ Créneau ${index + 1} validé:`, cleanSlot)
        return cleanSlot
      })

      console.log("📋 Données préparées pour insertion:", slotsToInsert.length, "créneaux")
      console.log("📋 Premier créneau à insérer:", slotsToInsert[0])

      // Test d'insertion d'un seul créneau d'abord
      console.log("🧪 Test d'insertion du premier créneau...")
      const { data: testData, error: testError } = await supabase
        .from("visit_availabilities")
        .insert(slotsToInsert[0])
        .select()

      if (testError) {
        console.error("❌ Erreur test insertion:", testError)
        return NextResponse.json(
          {
            error: "Erreur lors du test d'insertion",
            details: testError.message,
            hint: testError.hint,
            code: testError.code,
            testSlot: slotsToInsert[0],
          },
          { status: 500 },
        )
      }

      console.log("✅ Test d'insertion réussi:", testData)

      // Si le test réussit, supprimer le test et insérer tous les créneaux
      if (testData && testData[0]?.id) {
        await supabase.from("visit_availabilities").delete().eq("id", testData[0].id)
        console.log("🧹 Données de test nettoyées")
      }

      // Insérer tous les créneaux
      console.log("💾 Insertion de tous les créneaux...")
      const { data, error: insertError } = await supabase.from("visit_availabilities").insert(slotsToInsert).select()

      if (insertError) {
        console.error("❌ Erreur insertion créneaux:", insertError)
        return NextResponse.json(
          {
            error: "Erreur lors de l'insertion des créneaux",
            details: insertError.message,
            hint: insertError.hint,
            code: insertError.code,
            slotsCount: slotsToInsert.length,
          },
          { status: 500 },
        )
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
    const errorMessage = error instanceof Error ? error.message : "Erreur interne"
    return NextResponse.json(
      {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
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

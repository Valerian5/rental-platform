import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const applicationId = params.id

  try {
    const body = await request.json()
    console.log("📝 Body reçu:", body)

    // Récupérer les slots depuis le body - peut être slots (nouveaux) ou slot_ids (existants)
    const { slots, slot_ids } = body

    // Si on a des slot_ids, on associe des créneaux existants
    if (slot_ids && Array.isArray(slot_ids) && slot_ids.length > 0) {
      console.log("🎯 Association de créneaux existants:", {
        applicationId,
        slotIdsCount: slot_ids.length,
      })

      // Vérifier que l'application existe
      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("id, property_id, tenant_id")
        .eq("id", applicationId)
        .single()

      if (appError || !application) {
        console.error("❌ Application non trouvée:", appError)
        return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
      }

      // Vérifier que les créneaux existent et appartiennent à la propriété
      const { data: existingSlots, error: slotsError } = await supabase
        .from("property_visit_slots")
        .select("*")
        .in("id", slot_ids)
        .eq("property_id", application.property_id)

      if (slotsError || !existingSlots || existingSlots.length === 0) {
        console.error("❌ Créneaux non trouvés:", slotsError)
        return NextResponse.json({ error: "Créneaux non trouvés" }, { status: 404 })
      }

      if (existingSlots.length !== slot_ids.length) {
        console.error("❌ Certains créneaux n'existent pas")
        return NextResponse.json({ error: "Certains créneaux n'existent pas" }, { status: 400 })
      }

      // Créer les associations dans la table visits ou une table de liaison
      // Pour l'instant, on met juste à jour le statut de la candidature
      const { error: updateError } = await supabase
        .from("applications")
        .update({
          status: "visit_proposed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)

      if (updateError) {
        console.error("❌ Erreur mise à jour statut:", updateError)
        return NextResponse.json({ error: "Erreur lors de la mise à jour du statut" }, { status: 500 })
      }

      console.log("✅ Créneaux associés avec succès:", {
        applicationId,
        slotsCount: existingSlots.length,
        newStatus: "visit_proposed",
      })

      return NextResponse.json({
        success: true,
        message: `${existingSlots.length} créneau(x) de visite proposé(s) avec succès`,
        slotsCount: existingSlots.length,
      })
    }

    // Si on a des slots, on crée de nouveaux créneaux
    if (slots && Array.isArray(slots) && slots.length > 0) {
      console.log("🎯 Création de nouveaux créneaux:", {
        applicationId,
        slotsCount: slots.length,
      })

      // Vérifier que l'application existe
      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("id, property_id, tenant_id")
        .eq("id", applicationId)
        .single()

      if (appError || !application) {
        console.error("❌ Application non trouvée:", appError)
        return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
      }

      // Créer les créneaux de visite dans la table property_visit_slots
      const visitSlotsToCreate = slots.map((slot: any) => ({
        property_id: application.property_id,
        date: slot.start_time.split("T")[0], // Extraire la date
        start_time: slot.start_time.split("T")[1], // Extraire l'heure de début
        end_time: slot.end_time.split("T")[1], // Extraire l'heure de fin
        max_capacity: 1,
        is_group_visit: false,
        current_bookings: 0,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      console.log("📅 Créneaux à créer:", visitSlotsToCreate)

      const { data: createdSlots, error: slotsError } = await supabase
        .from("property_visit_slots")
        .insert(visitSlotsToCreate)
        .select()

      if (slotsError) {
        console.error("❌ Erreur création créneaux:", slotsError)
        return NextResponse.json({ error: "Erreur lors de la création des créneaux" }, { status: 500 })
      }

      console.log("✅ Créneaux créés:", createdSlots?.length || 0)

      // Mettre à jour le statut de la candidature
      const { error: updateError } = await supabase
        .from("applications")
        .update({
          status: "visit_proposed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)

      if (updateError) {
        console.error("❌ Erreur mise à jour statut:", updateError)
        return NextResponse.json({ error: "Erreur lors de la mise à jour du statut" }, { status: 500 })
      }

      console.log("✅ Créneaux proposés avec succès:", {
        applicationId,
        slotsCount: slots.length,
        newStatus: "visit_proposed",
      })

      return NextResponse.json({
        success: true,
        message: `${slots.length} créneau(x) de visite proposé(s) avec succès`,
        slotsCount: slots.length,
      })
    }

    // Aucun créneau fourni
    console.error("❌ Aucun créneau fourni:", { slots, slot_ids, body })
    return NextResponse.json(
      {
        error: "Aucun créneau fourni",
        details: "Le paramètre slots ou slot_ids est requis et doit être un tableau non vide",
      },
      { status: 400 },
    )
  } catch (e) {
    console.error("❌ Erreur inattendue:", e)
    return NextResponse.json(
      {
        error: "Erreur inattendue",
        details: e instanceof Error ? e.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

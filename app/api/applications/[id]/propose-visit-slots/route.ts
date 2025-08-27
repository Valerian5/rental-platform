import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendVisitProposalEmail } from "@/lib/email-service"

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

    // Vérifier que l'application existe
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, property_id, status, user_id")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Application non trouvée:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Cas 1: Réception de slot_ids (IDs de créneaux existants)
    if (body.slot_ids && Array.isArray(body.slot_ids)) {
      console.log("🎯 Association de créneaux existants:", { applicationId, slot_ids: body.slot_ids })

      const { data: existingSlots, error: slotsError } = await supabase
        .from("property_visit_slots")
        .select("*")
        .in("id", body.slot_ids)
        .eq("property_id", application.property_id)

      if (slotsError || !existingSlots || existingSlots.length !== body.slot_ids.length) {
        console.error("❌ Créneaux non trouvés:", slotsError)
        return NextResponse.json(
          { error: "Certains créneaux n'existent pas ou n'appartiennent pas à cette propriété" },
          { status: 400 },
        )
      }

      const { error: updateError } = await supabase
        .from("applications")
        .update({
          status: "visit_proposed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)

      if (updateError) {
        console.error("❌ Erreur mise à jour candidature:", updateError)
        return NextResponse.json({ error: "Erreur lors de la mise à jour de la candidature" }, { status: 500 })
      }

      // 🔔 Envoi de l'email
      const { data: user } = await supabase.from("users").select("id, name, email").eq("id", application.user_id).single()
      const { data: property } = await supabase.from("properties").select("id, title").eq("id", application.property_id).single()
      if (user && property) {
        const slotDates = finalSlots.map((s) => new Date(`${s.date}T${s.start_time}`))
        await sendVisitProposalEmail(user, property, slotDates)
      }

      console.log("✅ Créneaux associés avec succès")
      return NextResponse.json({
        success: true,
        message: "Créneaux de visite proposés avec succès",
        slots: existingSlots,
      })
    }

    // Cas 2: Réception d'objets slots complets (avec id)
    if (body.slots && Array.isArray(body.slots) && body.slots.length > 0 && body.slots[0].id) {
      console.log("🎯 Objets créneaux existants reçus:", { applicationId, slotsCount: body.slots.length })

      const slotIds = body.slots.map((slot: any) => slot.id)

      const { data: existingSlots, error: slotsError } = await supabase
        .from("property_visit_slots")
        .select("*")
        .in("id", slotIds)
        .eq("property_id", application.property_id)

      if (slotsError || !existingSlots || existingSlots.length !== slotIds.length) {
        console.error("❌ Créneaux non trouvés:", slotsError)
        return NextResponse.json({ error: "Certains créneaux n'existent pas" }, { status: 400 })
      }

      const { error: updateError } = await supabase
        .from("applications")
        .update({
          status: "visit_proposed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)

      if (updateError) {
        console.error("❌ Erreur mise à jour candidature:", updateError)
        return NextResponse.json({ error: "Erreur lors de la mise à jour de la candidature" }, { status: 500 })
      }

      // 🔔 Envoi de l'email
      const { data: user } = await supabase.from("users").select("id, name, email").eq("id", application.user_id).single()
      const { data: property } = await supabase.from("properties").select("id, title").eq("id", application.property_id).single()
      if (user && property) {
        const slotDates = finalSlots.map((s) => new Date(`${s.date}T${s.start_time}`))
        await sendVisitProposalEmail(user, property, slotDates)
      }

      console.log("✅ Créneaux existants associés avec succès")
      return NextResponse.json({
        success: true,
        message: "Créneaux de visite proposés avec succès",
        slots: existingSlots,
      })
    }

    // Cas 3: Création de nouveaux créneaux
    if (body.slots && Array.isArray(body.slots)) {
      console.log("🎯 Création de nouveaux créneaux:", { applicationId, slotsCount: body.slots.length })

      const slotsToCreate = body.slots.map((slot: any) => {
        let date, start_time, end_time

        if (slot.date && slot.start_time && slot.end_time) {
          date = slot.date
          start_time = slot.start_time
          end_time = slot.end_time
        } else if (slot.start_time && slot.start_time.includes("T")) {
          const startDateTime = new Date(slot.start_time)
          const endDateTime = new Date(slot.end_time)

          date = startDateTime.toISOString().split("T")[0]
          start_time = startDateTime.toTimeString().split(" ")[0].substring(0, 5)
          end_time = endDateTime.toTimeString().split(" ")[0].substring(0, 5)
        } else {
          console.error("❌ Format de créneau invalide:", slot)
          throw new Error("Format de créneau invalide")
        }

        return {
          property_id: application.property_id,
          date,
          start_time,
          end_time,
          max_capacity: slot.max_capacity || 1,
          is_group_visit: slot.is_group_visit || false,
          current_bookings: 0,
          is_available: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      })

      console.log("📅 Créneaux à créer:", slotsToCreate)

      const { data: createdSlots, error: createError } = await supabase
        .from("property_visit_slots")
        .insert(slotsToCreate)
        .select()

      if (createError) {
        console.error("❌ Erreur création créneaux:", createError)
        return NextResponse.json({ error: "Erreur lors de la création des créneaux" }, { status: 500 })
      }

      const { error: updateError } = await supabase
        .from("applications")
        .update({
          status: "visit_proposed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)

      if (updateError) {
        console.error("❌ Erreur mise à jour candidature:", updateError)
        return NextResponse.json({ error: "Erreur lors de la mise à jour de la candidature" }, { status: 500 })
      }

      // 🔔 Envoi de l'email
      const { data: user } = await supabase.from("users").select("id, name, email").eq("id", application.user_id).single()
      const { data: property } = await supabase.from("properties").select("id, title").eq("id", application.property_id).single()
      if (user && property) {
        const slotDates = finalSlots.map((s) => new Date(`${s.date}T${s.start_time}`))
        await sendVisitProposalEmail(user, property, slotDates)
      }

      console.log("✅ Nouveaux créneaux créés avec succès:", createdSlots?.length)
      return NextResponse.json({
        success: true,
        message: "Créneaux de visite créés et proposés avec succès",
        slots: createdSlots,
      })
    }

    console.error("❌ Aucun créneau fourni:", { slots: body.slots, slot_ids: body.slot_ids, body })
    return NextResponse.json({ error: "Aucun créneau fourni" }, { status: 400 })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

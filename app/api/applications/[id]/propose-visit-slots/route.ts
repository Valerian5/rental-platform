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

    // Récupérer les slot_ids depuis le body
    const { slot_ids, message, status } = body

    if (!slot_ids || !Array.isArray(slot_ids) || slot_ids.length === 0) {
      console.error("❌ Aucun slot_ids fourni:", { slot_ids, body })
      return NextResponse.json(
        {
          error: "Aucun créneau fourni",
          details: "Le paramètre slot_ids est requis et doit être un tableau non vide",
        },
        { status: 400 },
      )
    }

    console.log("🎯 Proposition de créneaux:", {
      applicationId,
      slot_ids,
      message: message?.substring(0, 50) + "...",
      status,
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

    // Vérifier que les créneaux existent et les associer à l'application
    const { data: existingSlots, error: slotsCheckError } = await supabase
      .from("visit_slots")
      .select("id, property_id, application_id")
      .in("id", slot_ids)

    if (slotsCheckError) {
      console.error("❌ Erreur vérification créneaux:", slotsCheckError)
      return NextResponse.json({ error: "Erreur lors de la vérification des créneaux" }, { status: 500 })
    }

    if (!existingSlots || existingSlots.length === 0) {
      console.error("❌ Aucun créneau trouvé avec les IDs:", slot_ids)
      return NextResponse.json({ error: "Aucun créneau trouvé avec ces identifiants" }, { status: 404 })
    }

    console.log("✅ Créneaux trouvés:", existingSlots.length)

    // Associer les créneaux à l'application
    const { data: updatedSlots, error: slotsError } = await supabase
      .from("visit_slots")
      .update({
        application_id: applicationId,
        updated_at: new Date().toISOString(),
      })
      .in("id", slot_ids)
      .select()

    if (slotsError) {
      console.error("❌ Erreur association créneaux:", slotsError)
      return NextResponse.json({ error: "Erreur lors de l'association des créneaux" }, { status: 500 })
    }

    console.log("✅ Créneaux associés:", updatedSlots?.length || 0)

    // Mettre à jour le statut de la candidature
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: status || "visit_proposed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (updateError) {
      console.error("❌ Erreur mise à jour statut:", updateError)
      return NextResponse.json({ error: "Erreur lors de la mise à jour du statut" }, { status: 500 })
    }

    console.log("✅ Créneaux proposés avec succès:", {
      applicationId,
      slotsCount: slot_ids.length,
      newStatus: status || "visit_proposed",
    })

    return NextResponse.json({
      success: true,
      message: `${slot_ids.length} créneau(x) de visite proposé(s) avec succès`,
      slotsCount: slot_ids.length,
    })
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

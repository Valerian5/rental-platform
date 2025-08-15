import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const applicationId = params.id

  try {
    console.log("🔍 Récupération candidature:", applicationId)

    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        id,
        tenant_id,
        property_id,
        status,
        created_at,
        updated_at,
        users!applications_tenant_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        properties (
          id,
          title,
          address,
          price,
          property_type,
          bedrooms,
          bathrooms,
          surface_area
        )
      `)
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Candidature non trouvée:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    console.log("✅ Candidature trouvée:", application.id)

    return NextResponse.json({
      success: true,
      application: {
        ...application,
        tenant_name: `${application.users.first_name} ${application.users.last_name}`,
        tenant_email: application.users.email,
        tenant_phone: application.users.phone,
        property: application.properties,
      },
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const applicationId = params.id

  try {
    console.log("🗑️ Retrait candidature:", applicationId)

    // Récupérer la candidature avec ses informations
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, status, tenant_id, property_id")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Candidature non trouvée:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Si la candidature a une visite programmée, la supprimer et libérer le créneau
    if (application.status === "visit_scheduled") {
      console.log("🔄 Suppression de la visite programmée...")

      // Récupérer la visite pour obtenir l'ID du créneau
      const { data: visit, error: visitError } = await supabase
        .from("visits")
        .select("id, notes")
        .eq("application_id", applicationId)
        .single()

      if (!visitError && visit) {
        // Extraire l'ID du créneau depuis les notes
        const slotIdMatch = visit.notes?.match(/Créneau sélectionné: ([a-f0-9-]+)/)
        if (slotIdMatch) {
          const slotId = slotIdMatch[1]
          console.log("🎯 Libération du créneau:", slotId)

          // CORRECTION: Utiliser la fonction SQL pour décrémenter proprement
          const { error: decrementError } = await supabase.rpc("decrement_slot_bookings", {
            slot_id: slotId,
          })

          if (decrementError) {
            console.error("❌ Erreur libération créneau:", decrementError)
          } else {
            console.log("✅ Créneau libéré avec succès")
          }
        }

        // Supprimer la visite
        const { error: deleteVisitError } = await supabase.from("visits").delete().eq("id", visit.id)

        if (deleteVisitError) {
          console.error("❌ Erreur suppression visite:", deleteVisitError)
        } else {
          console.log("✅ Visite supprimée avec succès")
        }
      }
    }

    // CORRECTION: Marquer la candidature comme retirée au lieu de la supprimer
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: "withdrawn",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (updateError) {
      console.error("❌ Erreur mise à jour candidature:", updateError)
      return NextResponse.json({ error: "Erreur lors du retrait de la candidature" }, { status: 500 })
    }

    console.log("✅ Candidature retirée avec succès")

    return NextResponse.json({
      success: true,
      message: "Candidature retirée avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const dynamic = "force-dynamic"

// GET - Récupérer une candidature spécifique
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const applicationId = params.id

  try {
    console.log("🔍 Récupération candidature:", applicationId)

    const { data: application, error } = await supabase
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
          city
        )
      `)
      .eq("id", applicationId)
      .single()

    if (error || !application) {
      console.error("❌ Candidature non trouvée:", error)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    const formattedApplication = {
      id: application.id,
      tenant_id: application.tenant_id,
      property_id: application.property_id,
      status: application.status,
      tenant_name: application.users
        ? `${application.users.first_name} ${application.users.last_name}`
        : "Utilisateur inconnu",
      tenant_email: application.users?.email || "Email inconnu",
      tenant_phone: application.users?.phone || "Téléphone inconnu",
      property_title: application.properties?.title || "Propriété inconnue",
      property_address: application.properties?.address || "Adresse inconnue",
      property_price: application.properties?.price || 0,
      property_city: application.properties?.city || "Ville inconnue",
      created_at: application.created_at,
      updated_at: application.updated_at,
    }

    console.log("✅ Candidature récupérée:", formattedApplication.id)

    return NextResponse.json({
      success: true,
      application: formattedApplication,
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

// DELETE - Supprimer une candidature (retirer la candidature)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const applicationId = params.id

  try {
    console.log("🗑️ Suppression candidature:", applicationId)

    // D'abord, récupérer la candidature pour vérifier qu'elle existe
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("id, status")
      .eq("id", applicationId)
      .single()

    if (fetchError || !application) {
      console.error("❌ Candidature non trouvée:", fetchError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier si la candidature peut être supprimée
    if (application.status === "withdrawn") {
      return NextResponse.json({ error: "Cette candidature a déjà été retirée" }, { status: 400 })
    }

    // Récupérer les visites associées pour libérer les créneaux
    const { data: visits, error: visitsError } = await supabase
      .from("visits")
      .select("id, notes")
      .eq("application_id", applicationId)
      .eq("status", "scheduled")

    if (visitsError) {
      console.error("❌ Erreur récupération visites:", visitsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des visites" }, { status: 500 })
    }

    // Libérer les créneaux de visite si nécessaire
    if (visits && visits.length > 0) {
      console.log("🔄 Libération de", visits.length, "créneaux de visite...")

      for (const visit of visits) {
        // Extraire l'ID du créneau depuis les notes (format: "Créneau sélectionné: {slot_id}")
        const slotIdMatch = visit.notes?.match(/Créneau sélectionné: (.+)/)
        if (slotIdMatch && slotIdMatch[1]) {
          const slotId = slotIdMatch[1]

          // Utiliser la fonction SQL pour décrémenter les réservations
          const { error: decrementError } = await supabase.rpc("decrement_slot_bookings", {
            slot_id: slotId,
          })

          if (decrementError) {
            console.error("❌ Erreur libération créneau:", slotId, decrementError)
          } else {
            console.log("✅ Créneau libéré:", slotId)
          }
        }
      }

      // Supprimer les visites
      const { error: deleteVisitsError } = await supabase.from("visits").delete().eq("application_id", applicationId)

      if (deleteVisitsError) {
        console.error("❌ Erreur suppression visites:", deleteVisitsError)
        return NextResponse.json({ error: "Erreur lors de la suppression des visites" }, { status: 500 })
      }
    }

    // Marquer la candidature comme withdrawn au lieu de la supprimer
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

    console.log("✅ Candidature retirée avec succès:", applicationId)

    return NextResponse.json({
      success: true,
      message: "Candidature retirée avec succès",
      application_id: applicationId,
      visits_removed: visits?.length || 0,
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

// PUT - Mettre à jour une candidature
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const applicationId = params.id

  try {
    const body = await request.json()
    const { status, ...otherUpdates } = body

    console.log("🔄 Mise à jour candidature:", applicationId, "avec:", body)

    // Vérifier que la candidature existe
    const { data: existingApp, error: fetchError } = await supabase
      .from("applications")
      .select("id, status")
      .eq("id", applicationId)
      .single()

    if (fetchError || !existingApp) {
      console.error("❌ Candidature non trouvée:", fetchError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Préparer les données de mise à jour
    const updateData = {
      ...otherUpdates,
      updated_at: new Date().toISOString(),
    }

    // Ajouter le statut si fourni
    if (status) {
      updateData.status = status
    }

    // Effectuer la mise à jour
    const { data: updatedApplication, error: updateError } = await supabase
      .from("applications")
      .update(updateData)
      .eq("id", applicationId)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Erreur mise à jour candidature:", updateError)
      return NextResponse.json({ error: "Erreur lors de la mise à jour de la candidature" }, { status: 500 })
    }

    console.log("✅ Candidature mise à jour:", applicationId)

    return NextResponse.json({
      success: true,
      message: "Candidature mise à jour avec succès",
      application: updatedApplication,
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

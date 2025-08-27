import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { sendNewApplicationNotificationToOwner } from "@/lib/email-service"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes")
}

export const dynamic = "force-dynamic"

// GET - Récupérer une candidature spécifique
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const applicationId = params.id

    console.log("🔍 Chargement détails candidature:", applicationId)

    // 1. Récupère la candidature
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        *,
        property:properties(*),
        tenant:users(*)
      `)
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("❌ Erreur récupération candidature:", appError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // 2. Récupère le dossier rental_file du tenant
    let rentalFile = null
    if (application.tenant_id) {
      const { data: rf, error: rfError } = await supabase
        .from("rental_files")
        .select("id, main_tenant, cotenants")
        .eq("tenant_id", application.tenant_id)
        .single()
      if (!rfError && rf) rentalFile = rf
    }

    // 3. Renvoie tout
    return NextResponse.json({ application: { ...application, rental_file: rentalFile } })
  } catch (error) {
    console.error("❌ Erreur API applications/[id]:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer une nouvelle candidature et notifier le propriétaire
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  try {
    const body = await request.json()
    // On suppose que le body contient tenant_id, property_id, etc.
    const { tenant_id, property_id } = body

    // 1. Créer la candidature
    const { data: application, error } = await supabase
      .from("applications")
      .insert({
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur création candidature:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // 2. Récupérer le propriétaire du bien et le locataire
    const { data: property } = await supabase
      .from("properties")
      .select("id, title, address, owner_id")
      .eq("id", property_id)
      .single()

    const { data: owner } = property?.owner_id
      ? await supabase
          .from("users")
          .select("id, email, first_name, last_name")
          .eq("id", property.owner_id)
          .single()
      : { data: null }

    const { data: tenant } = tenant_id
      ? await supabase
          .from("users")
          .select("id, email, first_name, last_name")
          .eq("id", tenant_id)
          .single()
      : { data: null }

    // 3. Envoyer l'email au propriétaire si tout est OK
    if (owner && tenant && property) {
      try {
        await sendNewApplicationNotificationToOwner(
          {
            id: owner.id,
            name: `${owner.first_name} ${owner.last_name}`,
            email: owner.email,
          },
          {
            id: tenant.id,
            name: `${tenant.first_name} ${tenant.last_name}`,
            email: tenant.email,
          },
          {
            id: property.id,
            title: property.title,
            address: property.address,
          }
        )
      } catch (e) {
        console.error("Erreur envoi email nouvelle candidature au propriétaire:", e)
      }
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error("❌ Erreur POST applications/[id]:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer une candidature (retirer la candidature)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient() // Declare supabase here
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

// PATCH - Mettre à jour une candidature
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const applicationId = params.id
    const body = await request.json()

    console.log("🔄 Mise à jour candidature:", applicationId, body)

    // Mettre à jour la candidature
    const { data, error } = await supabase
      .from("applications")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur mise à jour candidature:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("✅ Candidature mise à jour")
    return NextResponse.json({ application: data })
  } catch (error) {
    console.error("❌ Erreur PATCH applications/[id]:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
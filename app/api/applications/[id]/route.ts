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
  try {
    const applicationId = params.id

    const { data: application, error } = await supabase
      .from("applications")
      .select(`
        *,
        property:properties!inner (
          id,
          title,
          address,
          city,
          postal_code,
          price,
          bedrooms,
          bathrooms,
          surface,
          property_type,
          description,
          property_images (
            id,
            url,
            is_primary
          )
        ),
        tenant:users!applications_tenant_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone,
          user_type
        )
      `)
      .eq("id", applicationId)
      .single()

    if (error || !application) {
      console.error("❌ Application non trouvée:", error)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      application,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const applicationId = params.id
    const body = await request.json()

    console.log("🔄 Mise à jour candidature:", applicationId, body)

    const { data: application, error } = await supabase
      .from("applications")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur mise à jour:", error)
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    console.log("✅ Candidature mise à jour:", application.id)

    return NextResponse.json({
      success: true,
      application,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const applicationId = params.id

    console.log("🗑️ Retrait candidature:", applicationId)

    // Récupérer la candidature pour vérifier qu'elle existe
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("id, status, tenant_id")
      .eq("id", applicationId)
      .single()

    if (fetchError || !application) {
      console.error("❌ Candidature non trouvée:", fetchError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier que la candidature peut être retirée
    const withdrawableStatuses = ["pending", "analyzing", "visit_proposed", "visit_scheduled"]
    if (!withdrawableStatuses.includes(application.status)) {
      return NextResponse.json(
        {
          error: "Cette candidature ne peut plus être retirée",
        },
        { status: 400 },
      )
    }

    // Si il y a une visite programmée, la supprimer et libérer le créneau
    if (application.status === "visit_scheduled") {
      const { data: visit, error: visitError } = await supabase
        .from("visits")
        .select("id, notes")
        .eq("application_id", applicationId)
        .eq("status", "scheduled")
        .single()

      if (visit && !visitError) {
        // Extraire l'ID du créneau depuis les notes
        const slotIdMatch = visit.notes?.match(/créneau ([a-f0-9-]+)/)
        if (slotIdMatch) {
          const slotId = slotIdMatch[1]

          // Décrémenter le nombre de réservations du créneau
          const { error: decrementError } = await supabase.rpc("decrement_slot_bookings", {
            slot_id: slotId,
          })

          if (decrementError) {
            console.error("❌ Erreur décrémentation créneau:", decrementError)
          }
        }

        // Supprimer la visite
        const { error: deleteVisitError } = await supabase.from("visits").delete().eq("id", visit.id)

        if (deleteVisitError) {
          console.error("❌ Erreur suppression visite:", deleteVisitError)
        }
      }
    }

    // Marquer la candidature comme retirée au lieu de la supprimer
    const { data: updatedApplication, error: updateError } = await supabase
      .from("applications")
      .update({
        status: "withdrawn",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Erreur mise à jour candidature:", updateError)
      return NextResponse.json({ error: "Erreur lors du retrait de la candidature" }, { status: 500 })
    }

    console.log("✅ Candidature retirée:", updatedApplication.id)

    return NextResponse.json({
      success: true,
      message: "Candidature retirée avec succès",
      application: updatedApplication,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

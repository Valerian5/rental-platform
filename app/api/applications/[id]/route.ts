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

    // Récupérer la candidature avec les informations de la propriété et du locataire
    const { data: application, error } = await supabase
      .from("applications")
      .select(`
        *,
        property:properties!inner(
          id,
          title,
          address,
          city,
          postal_code,
          price,
          bedrooms,
          bathrooms,
          surface,
          property_images(
            id,
            url,
            is_primary
          )
        ),
        tenant:users!applications_tenant_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq("id", applicationId)
      .single()

    if (error || !application) {
      console.error("❌ Candidature non trouvée:", error)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Récupérer les créneaux de visite pour cette propriété
    const { data: visitSlots } = await supabase
      .from("property_visit_slots")
      .select("*")
      .eq("property_id", application.property.id)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    // Récupérer les visites programmées pour cette candidature
    const { data: visits } = await supabase.from("visits").select("*").eq("application_id", applicationId)

    const enrichedApplication = {
      ...application,
      tenant_name: `${application.tenant.first_name} ${application.tenant.last_name}`,
      visit_slots: visitSlots || [],
      visits: visits || [],
    }

    console.log("✅ Candidature récupérée:", {
      id: application.id,
      status: application.status,
      tenant: enrichedApplication.tenant_name,
      property: application.property.title,
    })

    return NextResponse.json({
      success: true,
      application: enrichedApplication,
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const applicationId = params.id

  try {
    console.log("🗑️ Suppression candidature:", applicationId)

    // Vérifier que la candidature existe
    const { data: application, error: checkError } = await supabase
      .from("applications")
      .select("id, status")
      .eq("id", applicationId)
      .single()

    if (checkError || !application) {
      console.error("❌ Candidature non trouvée:", checkError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier que la candidature peut être supprimée
    const deletableStatuses = ["pending", "analyzing", "visit_proposed", "visit_scheduled"]
    if (!deletableStatuses.includes(application.status)) {
      return NextResponse.json({ error: "Cette candidature ne peut plus être retirée" }, { status: 400 })
    }

    // Supprimer les visites associées et libérer les créneaux
    const { data: visits } = await supabase.from("visits").select("visit_slot_id").eq("application_id", applicationId)

    if (visits && visits.length > 0) {
      // Libérer les créneaux
      for (const visit of visits) {
        if (visit.visit_slot_id) {
          await supabase.rpc("decrement_slot_bookings", {
            slot_id: visit.visit_slot_id,
          })
        }
      }

      // Supprimer les visites
      await supabase.from("visits").delete().eq("application_id", applicationId)
    }

    // Marquer la candidature comme retirée au lieu de la supprimer
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
    })
  } catch (error) {
    console.error("❌ Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

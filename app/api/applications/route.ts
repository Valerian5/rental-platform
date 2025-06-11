import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const ownerId = searchParams.get("owner_id")

    console.log("📋 API Applications GET", { tenantId, ownerId })

    if (tenantId) {
      // Mode locataire - récupérer les candidatures du locataire
      const { data: applications, error } = await supabase
        .from("applications")
        .select(`
          *,
          property:properties(
            id,
            title,
            address,
            city,
            price,
            property_images(id, url, is_primary)
          )
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération candidatures locataire:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log(`📊 ${applications?.length || 0} candidatures trouvées`)

      // Récupérer les visites séparément pour chaque candidature
      const enrichedApplications = await Promise.all(
        (applications || []).map(async (app) => {
          try {
            // Récupérer les visites pour cette candidature
            const { data: visits } = await supabase
              .from("visits")
              .select("*")
              .eq("tenant_id", tenantId)
              .eq("property_id", app.property_id)
              .order("visit_date", { ascending: true })

            // Récupérer les créneaux proposés si ils existent
            let proposedSlots = []
            if (app.proposed_slot_ids && Array.isArray(app.proposed_slot_ids) && app.proposed_slot_ids.length > 0) {
              const { data: slots } = await supabase
                .from("property_visit_slots")
                .select("*")
                .in("id", app.proposed_slot_ids)
                .order("date", { ascending: true })

              proposedSlots = slots || []
            }

            return {
              ...app,
              visits: visits || [],
              proposed_visit_slots: proposedSlots,
            }
          } catch (enrichError) {
            console.error("❌ Erreur enrichissement candidature:", enrichError)
            return {
              ...app,
              visits: [],
              proposed_visit_slots: [],
            }
          }
        }),
      )

      console.log(`✅ ${enrichedApplications.length} candidatures enrichies pour le locataire`)
      return NextResponse.json({ applications: enrichedApplications })
    }

    // Mode propriétaire par défaut - récupérer toutes les candidatures avec enrichissement
    console.log("🏠 Mode propriétaire - récupération de toutes les candidatures")

    const { data: applications, error } = await supabase
      .from("applications")
      .select(`
        *,
        property:properties(
          id,
          title,
          address,
          city,
          price,
          rent,
          property_images(id, url, is_primary)
        ),
        tenant:users(
          id,
          email,
          first_name,
          last_name,
          phone,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération candidatures:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrichir avec les dossiers de location et visites
    const enrichedApplications = await Promise.all(
      (applications || []).map(async (app) => {
        try {
          // Récupérer le dossier de location
          const { data: rentalFile } = await supabase
            .from("rental_files")
            .select("*")
            .eq("user_id", app.tenant_id)
            .single()

          // Récupérer les visites
          const { data: visits } = await supabase
            .from("visits")
            .select("*")
            .eq("tenant_id", app.tenant_id)
            .eq("property_id", app.property_id)
            .order("visit_date", { ascending: true })

          return {
            ...app,
            rental_file: rentalFile || null,
            visits: visits || [],
          }
        } catch (enrichError) {
          console.error("❌ Erreur enrichissement candidature:", enrichError)
          return {
            ...app,
            rental_file: null,
            visits: [],
          }
        }
      }),
    )

    console.log(`✅ ${enrichedApplications.length} candidatures récupérées`)
    return NextResponse.json(enrichedApplications)
  } catch (error) {
    console.error("❌ Erreur API applications:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📋 API Applications POST", body)

    // Vérifier si une candidature existe déjà
    if (body.property_id && body.tenant_id) {
      const { data: existing, error: checkError } = await supabase
        .from("applications")
        .select("id")
        .eq("property_id", body.property_id)
        .eq("tenant_id", body.tenant_id)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 = no rows found
        console.error("❌ Erreur vérification candidature existante:", checkError)
        return NextResponse.json({ error: "Erreur lors de la vérification" }, { status: 500 })
      }

      if (existing) {
        return NextResponse.json({ error: "Vous avez déjà postulé pour ce bien" }, { status: 400 })
      }
    }

    const { data, error } = await supabase.from("applications").insert(body).select().single()

    if (error) {
      console.error("❌ Erreur création candidature:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ application: data })
  } catch (error) {
    console.error("❌ Erreur API applications POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get("id")
    const tenantId = searchParams.get("tenant_id")

    if (!applicationId || !tenantId) {
      return NextResponse.json({ error: "ID candidature et tenant_id requis" }, { status: 400 })
    }

    console.log("🗑️ Suppression candidature:", { applicationId, tenantId })

    // Vérifier que la candidature appartient au locataire
    const { data: application, error: checkError } = await supabase
      .from("applications")
      .select("id, tenant_id, status, property_id")
      .eq("id", applicationId)
      .eq("tenant_id", tenantId)
      .single()

    if (checkError) {
      console.error("❌ Candidature non trouvée:", checkError)
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier que la candidature peut être supprimée
    if (application.status === "accepted") {
      return NextResponse.json({ error: "Impossible de retirer une candidature acceptée" }, { status: 400 })
    }

    // Supprimer les visites associées si elles existent
    const { error: visitError } = await supabase
      .from("visits")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("property_id", application.property_id)
      .in("status", ["scheduled", "proposed"])

    if (visitError) {
      console.error("❌ Erreur suppression visites:", visitError)
      // On continue même si la suppression des visites échoue
    }

    // Supprimer la candidature
    const { error: deleteError } = await supabase
      .from("applications")
      .delete()
      .eq("id", applicationId)
      .eq("tenant_id", tenantId)

    if (deleteError) {
      console.error("❌ Erreur suppression candidature:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log("✅ Candidature supprimée")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erreur API applications DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

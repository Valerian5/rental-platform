import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const ownerId = searchParams.get("owner_id")

    console.log("📋 API Applications GET", { tenantId, ownerId })

    // Récupérer l'utilisateur authentifié
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Utilisateur non authentifié:", authError)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer le profil utilisateur pour connaître son rôle
    const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (profileError) {
      console.error("❌ Erreur récupération profil:", profileError)
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 })
    }

    console.log("👤 Utilisateur authentifié:", profile.user_type, profile.id)

    if (tenantId || profile.user_type === "tenant") {
      // Mode locataire - récupérer les candidatures du locataire
      const targetTenantId = tenantId || user.id

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
          )
        `)
        .eq("tenant_id", targetTenantId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération candidatures locataire:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log(`📊 ${applications?.length || 0} candidatures trouvées pour le locataire`)

      // Enrichir avec les visites
      const enrichedApplications = await Promise.all(
        (applications || []).map(async (app) => {
          try {
            const { data: visits } = await supabase
              .from("visits")
              .select("*")
              .eq("tenant_id", targetTenantId)
              .eq("property_id", app.property_id)
              .order("visit_date", { ascending: true })

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

      return NextResponse.json({ applications: enrichedApplications })
    }

    if (ownerId || profile.user_type === "owner") {
      // Mode propriétaire - récupérer les candidatures pour les propriétés du propriétaire
      const targetOwnerId = ownerId || user.id

      // D'abord récupérer les propriétés du propriétaire
      const { data: properties, error: propError } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_id", targetOwnerId)

      if (propError) {
        console.error("❌ Erreur récupération propriétés:", propError)
        return NextResponse.json({ error: propError.message }, { status: 500 })
      }

      if (!properties || properties.length === 0) {
        console.log("📊 Aucune propriété trouvée pour ce propriétaire")
        return NextResponse.json([])
      }

      const propertyIds = properties.map((p) => p.id)
      console.log(`🏠 ${propertyIds.length} propriétés trouvées`)

      // Récupérer les candidatures pour ces propriétés
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
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur récupération candidatures propriétaire:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log(`📊 ${applications?.length || 0} candidatures trouvées pour le propriétaire`)

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

      return NextResponse.json(enrichedApplications)
    }

    // Si ni locataire ni propriétaire
    return NextResponse.json({ error: "Type d'utilisateur non supporté" }, { status: 400 })
  } catch (error) {
    console.error("❌ Erreur API applications:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📋 API Applications POST", body)

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier si une candidature existe déjà
    if (body.property_id && body.tenant_id) {
      const { data: existing, error: checkError } = await supabase
        .from("applications")
        .select("id")
        .eq("property_id", body.property_id)
        .eq("tenant_id", body.tenant_id)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
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

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
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

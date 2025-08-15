import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d'environnement Supabase manquantes")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    console.log("🔍 Récupération des candidatures locataire...")

    // Pour le debug, on va simuler un tenant_id
    // En production, cela viendrait de l'authentification
    const url = new URL(request.url)
    const debugTenantId = url.searchParams.get("tenant_id")

    let query = supabase
      .from("applications")
      .select(`
        id,
        tenant_id,
        property_id,
        status,
        created_at,
        updated_at,
        presentation,
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
          city,
          postal_code,
          price,
          bedrooms,
          bathrooms,
          surface,
          property_images (
            id,
            url,
            is_primary
          )
        )
      `)
      // CORRECTION: Exclure explicitement les candidatures withdrawn
      .neq("status", "withdrawn")
      .order("created_at", { ascending: false })

    // Si un tenant_id spécifique est fourni pour le debug
    if (debugTenantId) {
      query = query.eq("tenant_id", debugTenantId)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error("❌ Erreur récupération candidatures:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des candidatures" }, { status: 500 })
    }

    console.log("🔍 Applications brutes:", applications?.length || 0)
    console.log("🔍 Première application:", applications?.[0])

    // Charger les créneaux de visite proposés pour chaque candidature
    const applicationsWithSlots = await Promise.all(
      (applications || []).map(async (app) => {
        let proposedVisitSlots = []

        if (app.status === "visit_proposed") {
          try {
            const { data: slots, error: slotsError } = await supabase
              .from("property_visit_slots")
              .select("*")
              .eq("property_id", app.property_id)
              .eq("is_available", true)
              .gte("date", new Date().toISOString().split("T")[0])
              .order("date", { ascending: true })
              .order("start_time", { ascending: true })

            if (!slotsError && slots) {
              proposedVisitSlots = slots
            }
          } catch (error) {
            console.error("❌ Erreur chargement créneaux pour", app.id, error)
          }
        }

        return {
          ...app,
          proposed_visit_slots: proposedVisitSlots,
        }
      }),
    )

    // Formater les données pour correspondre à l'interface attendue
    const formattedApplications = applicationsWithSlots.map((app) => ({
      id: app.id,
      tenant_id: app.tenant_id,
      property_id: app.property_id,
      status: app.status,
      created_at: app.created_at,
      updated_at: app.updated_at,
      presentation: app.presentation,
      // Structure tenant attendue par le composant
      tenant: {
        id: app.users?.id || app.tenant_id,
        first_name: app.users?.first_name || "Prénom",
        last_name: app.users?.last_name || "Nom",
        email: app.users?.email || "Email inconnu",
        phone: app.users?.phone || null,
      },
      // Structure property attendue par le composant
      property: {
        id: app.properties?.id || app.property_id,
        title: app.properties?.title || "Propriété inconnue",
        address: app.properties?.address || "Adresse inconnue",
        city: app.properties?.city || "Ville inconnue",
        postal_code: app.properties?.postal_code || "",
        price: app.properties?.price || 0,
        bedrooms: app.properties?.bedrooms || null,
        bathrooms: app.properties?.bathrooms || null,
        surface: app.properties?.surface || null,
        // S'assurer que property_images est toujours un tableau
        property_images: Array.isArray(app.properties?.property_images) ? app.properties.property_images : [],
      },
      // Créneaux de visite proposés
      proposed_visit_slots: app.proposed_visit_slots || [],
    }))

    // Statistiques pour le debug
    const statusStats = formattedApplications.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    console.log("✅ Candidatures locataire formatées:", formattedApplications.length)
    console.log("📊 Statistiques par statut (sans withdrawn):", statusStats)
    console.log("🔍 Première candidature formatée:", formattedApplications[0])

    return NextResponse.json({
      success: true,
      applications: formattedApplications,
      stats: {
        total: formattedApplications.length,
        byStatus: statusStats,
        excludedWithdrawn: true,
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

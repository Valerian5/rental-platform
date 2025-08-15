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
        users!applications_tenant_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        properties (
          id,
          title,
          address,
          price,
          city
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

    // Formater les données
    const formattedApplications = (applications || []).map((app) => ({
      id: app.id,
      tenant_id: app.tenant_id,
      property_id: app.property_id,
      status: app.status,
      tenant_name: app.users ? `${app.users.first_name} ${app.users.last_name}` : "Utilisateur inconnu",
      tenant_email: app.users?.email || "Email inconnu",
      property_title: app.properties?.title || "Propriété inconnue",
      property_address: app.properties?.address || "Adresse inconnue",
      property_price: app.properties?.price || 0,
      property_city: app.properties?.city || "Ville inconnue",
      created_at: app.created_at,
      updated_at: app.updated_at,
    }))

    // Statistiques pour le debug
    const statusStats = formattedApplications.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    console.log("✅ Candidatures locataire récupérées:", formattedApplications.length)
    console.log("📊 Statistiques par statut (sans withdrawn):", statusStats)

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

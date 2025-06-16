import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [POST] /api/leases - Début")

    // 1. Récupération du token d'authentification
    const authHeader = request.headers.get("Authorization")

    // Utiliser le client Supabase côté serveur si pas de token explicite
    const { createServerSupabaseClient } = await import("@/lib/supabase-server")
    const supabaseServer = createServerSupabaseClient()

    let user

    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Authentification via token explicite
      const token = authHeader.split(" ")[1]
      const { data: userData, error: authError } = await supabase.auth.getUser(token)

      if (authError || !userData.user) {
        console.error("❌ Échec de l'authentification avec token:", authError?.message)
        return NextResponse.json({ error: "Token d'authentification invalide" }, { status: 401 })
      }

      user = userData.user
    } else {
      // Authentification via cookie de session
      const {
        data: { session },
      } = await supabaseServer.auth.getSession()

      if (!session) {
        console.error("❌ Aucune session trouvée")
        return NextResponse.json({ error: "Non autorisé - Veuillez vous connecter" }, { status: 401 })
      }

      user = session.user
    }

    console.log("👤 Utilisateur authentifié:", user.id)

    // Récupérer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabaseServer
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !userProfile) {
      console.log("❌ Profil utilisateur non trouvé:", profileError)
      return NextResponse.json({ error: "Profil utilisateur non trouvé" }, { status: 401 })
    }

    console.log("👤 Profil utilisateur:", userProfile.id, userProfile.user_type)

    // Vérifier que l'utilisateur est un propriétaire
    if (userProfile.user_type !== "owner") {
      console.log("❌ Utilisateur pas propriétaire:", userProfile.user_type)
      return NextResponse.json({ error: "Accès réservé aux propriétaires" }, { status: 403 })
    }

    const data = await request.json()
    console.log("📝 Données reçues:", JSON.stringify(data, null, 2))

    // Validation des données
    if (!data.property_id || !data.tenant_id || !data.start_date || !data.end_date || !data.monthly_rent) {
      console.log("❌ Données incomplètes:", {
        property_id: !!data.property_id,
        tenant_id: !!data.tenant_id,
        start_date: !!data.start_date,
        end_date: !!data.end_date,
        monthly_rent: !!data.monthly_rent,
      })
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 })
    }

    // Préparer les données pour l'insertion
    const leaseData = {
      property_id: data.property_id,
      tenant_id: data.tenant_id,
      owner_id: userProfile.id,
      start_date: data.start_date,
      end_date: data.end_date,
      monthly_rent: data.monthly_rent,
      charges: data.charges || 0,
      deposit_amount: data.deposit || 0,
      lease_type: data.lease_type || "unfurnished",
      status: "draft",
      metadata: data.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("📝 Données formatées pour insertion:", JSON.stringify(leaseData, null, 2))

    // Créer le bail
    const { data: lease, error } = await supabase.from("leases").insert(leaseData).select().single()

    if (error) {
      console.error("❌ Erreur création bail:", error)
      return NextResponse.json({ error: `Erreur lors de la création du bail: ${error.message}` }, { status: 500 })
    }

    console.log("✅ Bail créé avec succès:", lease?.id)

    // Si une application_id est fournie, mettre à jour son statut
    if (data.application_id) {
      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: "lease_created" })
        .eq("id", data.application_id)

      if (updateError) {
        console.error("Erreur mise à jour candidature:", updateError)
      }
    }

    return NextResponse.json({ success: true, lease })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification en utilisant le client Supabase côté serveur
    const { createServerSupabaseClient } = await import("@/lib/supabase-server")
    const supabaseServer = createServerSupabaseClient()

    const {
      data: { user },
    } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabaseServer
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "Profil utilisateur non trouvé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const propertyId = searchParams.get("property_id")
    const tenantId = searchParams.get("tenant_id")
    const ownerId = searchParams.get("owner_id")
    const status = searchParams.get("status")

    // Construire la requête
    let query = supabase.from("leases").select(`
      *,
      property:properties(*),
      tenant:users!tenant_id(*),
      owner:users!owner_id(*)
    `)

    // Filtrer selon les paramètres
    if (id) query = query.eq("id", id)
    if (propertyId) query = query.eq("property_id", propertyId)
    if (tenantId) query = query.eq("tenant_id", tenantId)
    if (ownerId) query = query.eq("owner_id", ownerId)
    if (status) query = query.eq("status", status)

    // Vérifier les permissions
    if (userProfile.user_type === "tenant") {
      query = query.eq("tenant_id", userProfile.id)
    } else if (userProfile.user_type === "owner") {
      query = query.eq("owner_id", userProfile.id)
    }

    const { data: leases, error } = await query

    if (error) {
      console.error("Erreur récupération baux:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des baux" }, { status: 500 })
    }

    return NextResponse.json({ success: true, leases })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

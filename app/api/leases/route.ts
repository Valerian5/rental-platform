import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authService } from "@/lib/auth-service"
import { getAuthHeaders } from "@/lib/auth-utils"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [POST] /api/leases - Début")

    // 1. Authentification via authService
    const user = await authService.getServerUser()
    if (!user) {
      console.error("❌ Aucun utilisateur authentifié")
      return NextResponse.json(
        { error: "Non autorisé - Veuillez vous connecter" },
        { status: 401 }
      )
    }

    // 2. Vérification des permissions
    if (user.user_type !== "owner") {
      console.error("❌ Permission refusée - Rôle:", user.user_type)
      return NextResponse.json(
        { error: "Accès réservé aux propriétaires" },
        { status: 403 }
      )
    }

    console.log("👤 Utilisateur autorisé:", {
      id: user.id,
      email: user.email,
      type: user.user_type
    })

    // 3. Récupération des données
    let requestData
    try {
      requestData = await request.json()
    } catch (error) {
      console.error("❌ Erreur de parsing JSON:", error)
      return NextResponse.json(
        { error: "Format de données invalide" },
        { status: 400 }
      )
    }

    // 4. Validation des données
    const requiredFields = [
      'property_id', 
      'tenant_id',
      'start_date',
      'end_date',
      'monthly_rent'
    ]
    const missingFields = requiredFields.filter(field => !requestData[field])
    
    if (missingFields.length > 0) {
      console.error("❌ Champs manquants:", missingFields)
      return NextResponse.json(
        { error: "Données incomplètes", missingFields },
        { status: 400 }
      )
    }

    // 5. Préparation des données
    const leaseData = {
      property_id: requestData.property_id,
      tenant_id: requestData.tenant_id,
      owner_id: user.id,
      start_date: requestData.start_date,
      end_date: requestData.end_date,
      monthly_rent: Number(requestData.monthly_rent),
      charges: Number(requestData.charges || 0),
      deposit_amount: Number(requestData.deposit || 0),
      security_deposit: Number(requestData.deposit || 0),
      lease_type: requestData.lease_type || "unfurnished",
      status: "draft",
      signed_by_tenant: false,
      signed_by_owner: false,
      metadata: requestData.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log("📦 Données prêtes pour insertion:", leaseData)

    // 6. Insertion dans Supabase
    const { data: lease, error: supabaseError } = await supabaseAdmin
      .from("leases")
      .insert(leaseData)
      .select(`
        id,
        property_id,
        tenant_id,
        start_date,
        end_date,
        monthly_rent,
        status
      `)
      .single()

    if (supabaseError) {
      console.error("❌ Erreur Supabase:", {
        message: supabaseError.message,
        code: supabaseError.code,
        details: supabaseError.details
      })
      return NextResponse.json(
        { error: "Erreur de base de données", details: supabaseError.message },
        { status: 500 }
      )
    }

    console.log("✅ Bail créé avec succès - ID:", lease.id)

    // 7. Mise à jour de l'application si nécessaire
    if (requestData.application_id) {
      console.log("🔄 Mise à jour application:", requestData.application_id)
      const { error: updateError } = await supabaseAdmin
        .from("applications")
        .update({ 
          status: "lease_created",
          updated_at: new Date().toISOString()
        })
        .eq("id", requestData.application_id)

      if (updateError) {
        console.error("⚠️ Erreur mise à jour application:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      lease
    }, { status: 201 })

  } catch (error) {
    console.error("🔥 Erreur serveur:", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : null
    })
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [GET] /api/leases - Début")

    // 1. Authentification via authService
    const user = await authService.getServerUser()
    if (!user) {
      console.error("❌ Aucun utilisateur authentifié")
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    console.log("👤 Utilisateur:", {
      id: user.id,
      email: user.email,
      type: user.user_type
    })

    // 2. Récupération des paramètres
    const { searchParams } = new URL(request.url)
    const params = {
      id: searchParams.get("id"),
      property_id: searchParams.get("property_id"),
      tenant_id: searchParams.get("tenant_id"),
      status: searchParams.get("status"),
      limit: Math.min(parseInt(searchParams.get("limit") || "20"), 100),
      offset: parseInt(searchParams.get("offset") || "0")
    }

    // 3. Construction de la requête
    let query = supabaseAdmin
      .from("leases")
      .select(`
        id,
        property_id,
        tenant_id,
        start_date,
        end_date,
        monthly_rent,
        charges,
        status,
        lease_type,
        created_at,
        property:properties(
          id,
          title,
          address
        ),
        tenant:users(
          id,
          first_name,
          last_name
        )
      `)
      .range(params.offset, params.offset + params.limit - 1)

    // Filtres selon le rôle
    if (user.user_type === "tenant") {
      query = query.eq("tenant_id", user.id)
    } else if (user.user_type === "owner") {
      query = query.eq("owner_id", user.id)
    }

    // Filtres supplémentaires
    if (params.id) query = query.eq("id", params.id)
    if (params.property_id) query = query.eq("property_id", params.property_id)
    if (params.tenant_id) query = query.eq("tenant_id", params.tenant_id)
    if (params.status) query = query.eq("status", params.status)

    // 4. Exécution
    const { data: leases, error } = await query

    if (error) {
      console.error("❌ Erreur Supabase:", error)
      return NextResponse.json(
        { error: "Erreur de base de données" },
        { status: 500 }
      )
    }

    console.log(`✅ ${leases?.length || 0} baux trouvés`)
    return NextResponse.json({
      success: true,
      data: leases,
      count: leases?.length
    })

  } catch (error) {
    console.error("🔥 Erreur serveur:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authService } from "@/lib/auth-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Début création bail")

    // Vérifier l'authentification
    const user = await authService.getCurrentUserFromRequest(request)
    console.log("👤 Utilisateur:", {
      id: user?.id,
      type: user?.user_type,
      email: user?.email
    })

    if (!user) {
      console.log("❌ Utilisateur non authentifié")
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un propriétaire
    if (user.user_type !== "owner") {
      console.log("❌ Utilisateur pas propriétaire:", user.user_type)
      return NextResponse.json({ error: "Accès réservé aux propriétaires" }, { status: 403 })
    }

    const data = await request.json()
    console.log("📝 Données reçues:", JSON.stringify(data, null, 2))

    // Validation des données
    const requiredFields = ['property_id', 'tenant_id', 'start_date', 'end_date', 'monthly_rent']
    const missingFields = requiredFields.filter(field => !data[field])
    
    if (missingFields.length > 0) {
      console.log("❌ Données incomplètes - Champs manquants:", missingFields)
      return NextResponse.json(
        { error: "Données incomplètes", missingFields }, 
        { status: 400 }
      )
    }

    // Validation du type de bail
    const validLeaseTypes = ['unfurnished', 'furnished', 'commercial']
    if (data.lease_type && !validLeaseTypes.includes(data.lease_type)) {
      console.log("❌ Type de bail invalide:", data.lease_type)
      return NextResponse.json(
        { error: "Type de bail invalide", validTypes: validLeaseTypes },
        { status: 400 }
      )
    }

    // Validation du format des UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(data.property_id) || !uuidRegex.test(data.tenant_id)) {
      console.log("❌ Format ID invalide", {
        property_id: data.property_id,
        tenant_id: data.tenant_id
      })
      return NextResponse.json(
        { error: "Format d'ID invalide" },
        { status: 400 }
      )
    }

    // Préparation des données pour l'insertion
    const leaseData = {
      property_id: data.property_id,
      tenant_id: data.tenant_id,
      owner_id: user.id,
      start_date: data.start_date,
      end_date: data.end_date,
      monthly_rent: Number(data.monthly_rent),
      charges: Number(data.charges || 0),
      deposit_amount: Number(data.deposit || 0),
      security_deposit: Number(data.deposit || 0),
      lease_type: data.lease_type || "unfurnished",
      status: "draft",
      signed_by_tenant: false,
      signed_by_owner: false,
      metadata: data.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log("📦 Données prêtes pour insertion:", JSON.stringify(leaseData, null, 2))

    // Créer le bail
    const { data: lease, error, status, statusText } = await supabase
      .from("leases")
      .insert(leaseData)
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur Supabase détaillée:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status,
        statusText
      })
      return NextResponse.json(
        { 
          error: "Erreur lors de la création du bail",
          supabaseError: error 
        }, 
        { status: 500 }
      )
    }

    console.log("✅ Bail créé avec succès:", lease.id)

    // Si une application_id est fournie, mettre à jour son statut
    if (data.application_id) {
      console.log("🔄 Mise à jour de l'application:", data.application_id)
      const { error: updateError } = await supabase
        .from("applications")
        .update({ 
          status: "lease_created",
          updated_at: new Date().toISOString()
        })
        .eq("id", data.application_id)

      if (updateError) {
        console.error("⚠️ Erreur mise à jour candidature:", updateError)
        // Ne pas échouer toute la requête pour cette erreur
      }
    }

    return NextResponse.json({ 
      success: true, 
      lease,
      applicationUpdated: !!data.application_id
    })

  } catch (error) {
    console.error("🔥 Erreur serveur critique:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null,
      rawError: error
    })
    return NextResponse.json(
      { 
        error: "Erreur serveur interne",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await authService.getCurrentUserFromRequest(request)
    console.log("👤 GET - Utilisateur:", user?.id)

    if (!user) {
      console.log("❌ GET - Utilisateur non authentifié")
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = {
      id: searchParams.get("id"),
      property_id: searchParams.get("property_id"),
      tenant_id: searchParams.get("tenant_id"),
      owner_id: searchParams.get("owner_id"),
      status: searchParams.get("status")
    }

    console.log("🔍 Paramètres de requête GET:", params)

    // Construire la requête
    let query = supabase.from("leases").select(`
      *,
      property:properties(*),
      tenant:users!tenant_id(*),
      owner:users!owner_id(*)
    `)

    // Filtrer selon les paramètres
    if (params.id) query = query.eq("id", params.id)
    if (params.property_id) query = query.eq("property_id", params.property_id)
    if (params.tenant_id) query = query.eq("tenant_id", params.tenant_id)
    if (params.owner_id) query = query.eq("owner_id", params.owner_id)
    if (params.status) query = query.eq("status", params.status)

    // Vérifier les permissions
    if (user.user_type === "tenant") {
      query = query.eq("tenant_id", user.id)
    } else if (user.user_type === "owner") {
      query = query.eq("owner_id", user.id)
    }

    const { data: leases, error, status } = await query

    if (error) {
      console.error("❌ Erreur récupération baux:", {
        error: error.message,
        code: error.code,
        status
      })
      return NextResponse.json(
        { 
          error: "Erreur lors de la récupération des baux",
          supabaseError: error 
        }, 
        { status: 500 }
      )
    }

    console.log(`✅ ${leases?.length || 0} baux récupérés`)
    return NextResponse.json({ 
      success: true, 
      count: leases?.length,
      leases 
    })

  } catch (error) {
    console.error("🔥 Erreur serveur GET:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    })
    return NextResponse.json(
      { 
        error: "Erreur serveur interne",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}
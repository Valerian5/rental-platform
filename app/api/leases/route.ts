import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase" // Importez votre client Supabase configuré

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

    // 1. Récupération du token d'authentification
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      console.error("❌ Aucun token d'authentification trouvé")
      return NextResponse.json(
        { error: "Non autorisé - Token manquant" },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // 2. Vérification du token avec Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error("❌ Échec de l'authentification:", authError?.message || "Utilisateur non trouvé")
      return NextResponse.json(
        { error: "Non autorisé - Token invalide" },
        { status: 401 }
      )
    }

    console.log("👤 Utilisateur authentifié:", {
      id: user.id,
      email: user.email
    })

    // 3. Récupération du profil complet
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error("❌ Profil utilisateur non trouvé:", profileError?.message)
      return NextResponse.json(
        { error: "Profil utilisateur introuvable" },
        { status: 404 }
      )
    }

    // 4. Vérification des permissions
    if (profile.user_type !== 'owner') {
      console.error("❌ Permission refusée - Rôle:", profile.user_type)
      return NextResponse.json(
        { error: "Accès réservé aux propriétaires" },
        { status: 403 }
      )
    }

    // 5. Récupération des données de la requête
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

    // 6. Validation des données (identique à votre implémentation)
    const requiredFields = ['property_id', 'tenant_id', 'start_date', 'end_date', 'monthly_rent']
    const missingFields = requiredFields.filter(field => !requestData[field])
    
    if (missingFields.length > 0) {
      console.error("❌ Champs manquants:", missingFields)
      return NextResponse.json(
        { error: "Données incomplètes", missingFields },
        { status: 400 }
      )
    }

    // 7. Création du bail
    const { data: lease, error: supabaseError } = await supabaseAdmin
      .from('leases')
      .insert({
        property_id: requestData.property_id,
        tenant_id: requestData.tenant_id,
        owner_id: user.id,
        start_date: requestData.start_date,
        end_date: requestData.end_date,
        monthly_rent: Number(requestData.monthly_rent),
        charges: Number(requestData.charges || 0),
        deposit_amount: Number(requestData.deposit || 0),
        security_deposit: Number(requestData.deposit || 0),
        lease_type: requestData.lease_type || 'unfurnished',
        status: 'draft',
        signed_by_tenant: false,
        signed_by_owner: false,
        metadata: requestData.metadata || {}
      })
      .select()
      .single()

    if (supabaseError) {
      console.error("❌ Erreur Supabase:", supabaseError)
      return NextResponse.json(
        { error: "Erreur de base de données", details: supabaseError.message },
        { status: 500 }
      )
    }

    console.log("✅ Bail créé avec succès:", lease.id)

    // 8. Mise à jour de l'application si nécessaire
    if (requestData.application_id) {
      const { error: updateError } = await supabaseAdmin
        .from('applications')
        .update({ status: 'lease_created' })
        .eq('id', requestData.application_id)

      if (updateError) {
        console.error("⚠️ Erreur mise à jour application:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      lease
    }, { status: 201 })

  } catch (error) {
    console.error("🔥 Erreur serveur:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}
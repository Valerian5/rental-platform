import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authService } from "@/lib/auth-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Début création bail")

    // Vérifier l'authentification
    const user = await authService.getCurrentUserFromRequest(request)
    console.log("👤 Utilisateur:", user?.id, user?.user_type)

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
    console.log("📝 Données reçues:", data)

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

// Ajoutez ceci avant l'insertion dans route.ts
console.log("Données avant insertion:", {
  property_id: data.property_id,
  tenant_id: data.tenant_id,
  owner_id: user.id,
  start_date: data.start_date,
  end_date: data.end_date,
  monthly_rent: data.monthly_rent,
  charges: data.charges,
  deposit_amount: data.deposit,
  lease_type: data.lease_type,
  metadata: data.metadata
})

    // Créer le bail
const { data: lease, error } = await supabase
  .from("leases")
  .insert({
    property_id: data.property_id,
    tenant_id: data.tenant_id,
    owner_id: user.id,
    start_date: data.start_date,
    end_date: data.end_date,
    monthly_rent: data.monthly_rent,
    charges: data.charges || 0,
    deposit_amount: data.deposit || 0,  // Changé de 'deposit' à 'deposit_amount'
    security_deposit: data.deposit || 0, // Ajouté pour correspondre au schéma
    lease_type: data.lease_type || "unfurnished",
    status: "draft",
    metadata: data.metadata || {},
  })
  .select()
  .single()

    if (error) {
      console.error("Erreur création bail:", error)
      return NextResponse.json({ error: "Erreur lors de la création du bail" }, { status: 500 })
    }

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
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await authService.getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
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
    if (user.user_type === "tenant") {
      query = query.eq("tenant_id", user.id)
    } else if (user.user_type === "owner") {
      query = query.eq("owner_id", user.id)
    }

    const { data: leases, error } = await query

    if (error) {
      console.error("Erreur récupération baux:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des baux" }, { status: 500 })
    }

    return NextResponse.json({ success: true, leases })
} catch (error) {
  console.error("Erreur serveur détaillée:", {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : null,
    requestData: data,
    user: user?.id
  })
  return NextResponse.json(
    { error: "Erreur serveur", details: error instanceof Error ? error.message : String(error) },
    { status: 500 }
  )
}
}
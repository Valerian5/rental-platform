import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authService } from "@/lib/auth-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await authService.getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un propriétaire
    if (user.user_type !== "owner") {
      return NextResponse.json({ error: "Accès réservé aux propriétaires" }, { status: 403 })
    }

    const data = await request.json()

    // Validation des données
    if (!data.property_id || !data.tenant_id || !data.start_date || !data.end_date || !data.monthly_rent) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 })
    }

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
        deposit: data.deposit || 0,
        lease_type: data.lease_type || "unfurnished",
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

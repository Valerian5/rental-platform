import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    console.log("🚀 [SERVER] Création nouveau bail...")

    const body = await request.json()
    console.log("📝 [SERVER] Données reçues:", {
      property_id: body.property_id,
      tenant_id: body.tenant_id,
      start_date: body.start_date,
      end_date: body.end_date,
      monthly_rent: body.monthly_rent,
      hasApplicationId: !!body.application_id,
    })

    const {
      property_id,
      tenant_id,
      start_date,
      end_date,
      monthly_rent,
      charges,
      deposit,
      lease_type,
      application_id,
      metadata,
    } = body

    // Validation des champs obligatoires
    if (!property_id || !tenant_id || !start_date || !end_date || !monthly_rent) {
      console.error("❌ [SERVER] Champs obligatoires manquants")
      return NextResponse.json({ success: false, error: "Champs obligatoires manquants" }, { status: 400 })
    }

    // Récupérer l'owner_id depuis la propriété
    console.log("🔍 [SERVER] Récupération propriétaire...")
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("owner_id")
      .eq("id", property_id)
      .single()

    if (propertyError || !property) {
      console.error("❌ [SERVER] Propriété non trouvée:", propertyError)
      return NextResponse.json({ success: false, error: "Propriété non trouvée" }, { status: 404 })
    }

    console.log("✅ [SERVER] Propriétaire trouvé:", property.owner_id)

    // Préparer les données du bail
    const leaseData = {
      property_id,
      tenant_id,
      owner_id: property.owner_id,
      start_date,
      end_date,
      monthly_rent: Number.parseFloat(monthly_rent),
      charges: charges ? Number.parseFloat(charges) : 0,
      deposit_amount: deposit ? Number.parseFloat(deposit) : 0,
      lease_type: lease_type || "unfurnished",
      status: "draft",
      signed_by_owner: false,
      signed_by_tenant: false,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("💾 [SERVER] Création du bail avec:", {
      ...leaseData,
      metadata: "...",
    })

    // Créer le bail
    const { data: lease, error: leaseError } = await supabase.from("leases").insert(leaseData).select().single()

    if (leaseError) {
      console.error("❌ [SERVER] Erreur création bail:", leaseError)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la création du bail", details: leaseError.message },
        { status: 500 },
      )
    }

    console.log("✅ [SERVER] Bail créé avec succès:", lease.id)

    // Si c'est lié à une candidature, mettre à jour le statut
    if (application_id) {
      console.log("📋 [SERVER] Mise à jour candidature:", application_id)
      const { error: appError } = await supabase
        .from("applications")
        .update({
          status: "lease_created",
          lease_id: lease.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", application_id)

      if (appError) {
        console.error("⚠️ [SERVER] Erreur mise à jour candidature:", appError)
        // Ne pas faire échouer la création du bail pour autant
      } else {
        console.log("✅ [SERVER] Candidature mise à jour")
      }
    }

    return NextResponse.json({
      success: true,
      lease,
      message: "Bail créé avec succès",
      redirect: `/owner/leases/${lease.id}/complete-data`,
    })
  } catch (error) {
    console.error("❌ [SERVER] Erreur création bail:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création du bail",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    console.log("🔍 [SERVER] Récupération liste des baux...")

    const url = new URL(request.url)
    const ownerId = url.searchParams.get("owner_id")
    const tenantId = url.searchParams.get("tenant_id")

    let query = supabase
      .from("leases")
      .select(`
        *,
        property:properties(*),
        tenant:users!leases_tenant_id_fkey(*),
        owner:users!leases_owner_id_fkey(*)
      `)
      .order("created_at", { ascending: false })

    if (ownerId) {
      query = query.eq("owner_id", ownerId)
    }

    if (tenantId) {
      query = query.eq("tenant_id", tenantId)
    }

    const { data: leases, error } = await query

    if (error) {
      console.error("❌ [SERVER] Erreur récupération baux:", error)
      return NextResponse.json({ success: false, error: "Erreur lors de la récupération des baux" }, { status: 500 })
    }

    console.log("✅ [SERVER] Baux récupérés:", leases.length)

    return NextResponse.json({
      success: true,
      leases,
    })
  } catch (error) {
    console.error("❌ [SERVER] Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

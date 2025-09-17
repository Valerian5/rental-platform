import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth-token-service"
import { createServerClient } from "@supabase/ssr"

// Create a Supabase client with service role
const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  cookies: {
    get() {
      return undefined
    },
    set() {},
    remove() {},
  },
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🏢 API Agency Properties GET for agency:", params.id)

    // Check authentication using token
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ Utilisateur non authentifié")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("👤 Utilisateur authentifié:", user.user_type, user.id)

    // Check if user is admin, belongs to the requested agency, or is a property owner
    const isAdmin = user.user_type === "admin"
    const isAgencyMember = user.agency_id === params.id

    if (!isAdmin && !isAgencyMember) {
      console.log("❌ Utilisateur non autorisé pour cette agence")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get agency properties
    const { data: properties, error } = await supabase
      .from("properties")
      .select("*, owner:owner_id(id, first_name, last_name, email)")
      .eq("agency_id", params.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching agency properties:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ ${properties?.length || 0} agency properties retrieved`)
    return NextResponse.json({ success: true, properties: properties || [] })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🏢 API Agency Properties POST for agency:", params.id)

    // Check authentication using token
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ Utilisateur non authentifié")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("👤 Utilisateur authentifié:", user.user_type, user.id)

    // Check if user is admin or belongs to the requested agency
    const isAdmin = user.user_type === "admin"
    const isAgencyMember = user.agency_id === params.id

    if (!isAdmin && !isAgencyMember) {
      console.log("❌ Utilisateur non autorisé pour cette agence")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // If agency member, check if they have permission to manage properties
    if (isAgencyMember && !isAdmin) {
      const { data: userRole, error: userRoleError } = await supabase
        .from("user_agency_roles")
        .select("agency_role_id")
        .eq("user_id", user.id)
        .single()

      if (userRoleError || !userRole) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { data: role, error: roleError } = await supabase
        .from("agency_roles")
        .select("permissions")
        .eq("id", userRole.agency_role_id)
        .single()

      if (roleError || !role || !role.permissions?.manage_properties) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
    }

    const body = await request.json()
    const {
      title,
      description,
      address,
      city,
      postal_code,
      country,
      property_type,
      price,
      area,
      bedrooms,
      bathrooms,
      owner_id,
      agency_reference,
      status = "available",
      // Nouveaux champs
      floor,
      total_floors,
      latitude,
      longitude,
      hot_water_production,
      heating_mode,
      orientation,
      wc_count,
      wc_separate,
      wheelchair_accessible,
      availability_date,
      rent_control_zone,
      reference_rent,
      reference_rent_increased,
      rent_supplement,
      agency_fees_tenant,
      inventory_fees_tenant,
      colocation_possible,
      max_colocation_occupants,
      furnished,
      charges,
      deposit,
      energy_class,
      ges_class,
      heating_type,
      equipment,
    } = body

    // Validate required fields
    if (!title || !property_type || !price || !area || !city) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    // Check if owner exists
    if (owner_id) {
      const { data: owner, error: ownerError } = await supabase
        .from("users")
        .select("id")
        .eq("id", owner_id)
        .eq("user_type", "owner")
        .single()

      if (ownerError || !owner) {
        return NextResponse.json({ error: "Invalid owner ID" }, { status: 400 })
      }
    }

    // Create the property
    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        title,
        description,
        address,
        city,
        postal_code,
        country,
        property_type,
        price,
        surface: area, // area -> surface
        rooms: 1, // Valeur par défaut
        bedrooms: bedrooms || 0,
        bathrooms: bathrooms || 0,
        owner_id,
        agency_id: params.id,
        agency_reference,
        status,
        // Nouveaux champs
        floor: floor || null,
        total_floors: total_floors || null,
        latitude: latitude || null,
        longitude: longitude || null,
        hot_water_production: hot_water_production || null,
        heating_mode: heating_mode || null,
        orientation: orientation || null,
        wc_count: wc_count || 1,
        wc_separate: wc_separate || false,
        wheelchair_accessible: wheelchair_accessible || false,
        availability_date: availability_date || null,
        rent_control_zone: rent_control_zone || false,
        reference_rent: reference_rent || null,
        reference_rent_increased: reference_rent_increased || null,
        rent_supplement: rent_supplement || null,
        agency_fees_tenant: agency_fees_tenant || null,
        inventory_fees_tenant: inventory_fees_tenant || null,
        colocation_possible: colocation_possible || false,
        max_colocation_occupants: max_colocation_occupants || null,
        furnished: furnished || false,
        charges_amount: charges || 0,
        security_deposit: deposit || 0,
        energy_class: energy_class || null,
        ges_class: ges_class || null,
        heating_type: heating_type || null,
        equipment: equipment || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Error creating property:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Property created:", property.title)
    return NextResponse.json({ success: true, property }, { status: 201 })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

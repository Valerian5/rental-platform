import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authService } from "@/lib/auth-service"

// Create a Supabase client with environment variables
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🏢 API Agency Properties GET for agency:", params.id)

    // Check authentication
    const user = await authService.getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin, belongs to the requested agency, or is a property owner
    const isAdmin = user.user_type === "admin"
    const isAgencyMember = user.agency_id === params.id

    if (!isAdmin && !isAgencyMember) {
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

    // Check authentication
    const user = await authService.getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or belongs to the requested agency
    const isAdmin = user.user_type === "admin"
    const isAgencyMember = user.agency_id === params.id

    if (!isAdmin && !isAgencyMember) {
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
        area,
        bedrooms: bedrooms || 0,
        bathrooms: bathrooms || 0,
        owner_id,
        agency_id: params.id,
        agency_reference,
        status,
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

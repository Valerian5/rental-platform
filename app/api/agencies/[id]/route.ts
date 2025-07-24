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
    console.log("🏢 API Agencies GET ID:", params.id)

    // Check authentication using token
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ Utilisateur non authentifié")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("👤 Utilisateur authentifié:", user.user_type, user.id)

    // Check if user is admin or belongs to the requested agency
    if (user.user_type !== "admin" && user.agency_id !== params.id) {
      console.log("❌ Utilisateur non autorisé pour cette agence")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the agency
    const { data: agency, error } = await supabase.from("agencies").select("*").eq("id", params.id).single()

    if (error) {
      console.error("❌ Error fetching agency:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 })
    }

    // Get agency roles
    const { data: roles, error: rolesError } = await supabase
      .from("agency_roles")
      .select("*")
      .eq("agency_id", params.id)

    if (rolesError) {
      console.error("❌ Error fetching agency roles:", rolesError)
      // Don't fail the request if roles fetch fails
    }

    // Get agency users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, user_type, created_at")
      .eq("agency_id", params.id)

    if (usersError) {
      console.error("❌ Error fetching agency users:", usersError)
      // Don't fail the request if users fetch fails
    }

    console.log("✅ Agency retrieved:", agency.name)
    return NextResponse.json({
      success: true,
      agency,
      roles: roles || [],
      users: users || [],
    })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🏢 API Agencies PUT ID:", params.id)

    // Check authentication using token
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ Utilisateur non authentifié")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("👤 Utilisateur authentifié:", user.user_type, user.id)

    // Check if user is admin or agency director
    if (user.user_type !== "admin") {
      // Check if user is agency director
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
        .select("name, permissions")
        .eq("id", userRole.agency_role_id)
        .single()

      if (roleError || !role || role.name !== "Agency Director") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Check if user belongs to the requested agency
      if (user.agency_id !== params.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const body = await request.json()
    const { name, logo_url, primary_color, secondary_color, accent_color } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Agency name is required" }, { status: 400 })
    }

    // Update the agency
    const { data: agency, error } = await supabase
      .from("agencies")
      .update({
        name,
        logo_url,
        primary_color,
        secondary_color,
        accent_color,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("❌ Error updating agency:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Agency updated:", agency.name)
    return NextResponse.json({ success: true, agency })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🏢 API Agencies DELETE ID:", params.id)

    // Check authentication using token
    const user = await getCurrentUserFromRequest(request)
    if (!user || user.user_type !== "admin") {
      console.log("❌ Utilisateur non autorisé pour suppression")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("👤 Admin authentifié:", user.id)

    // Check if agency has users
    const { data: users, error: usersError } = await supabase.from("users").select("id").eq("agency_id", params.id)

    if (usersError) {
      console.error("❌ Error checking agency users:", usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    if (users && users.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete agency with users. Please reassign or delete users first." },
        { status: 400 },
      )
    }

    // Delete agency roles
    const { error: rolesError } = await supabase.from("agency_roles").delete().eq("agency_id", params.id)

    if (rolesError) {
      console.error("❌ Error deleting agency roles:", rolesError)
      return NextResponse.json({ error: rolesError.message }, { status: 500 })
    }

    // Delete the agency
    const { error } = await supabase.from("agencies").delete().eq("id", params.id)

    if (error) {
      console.error("❌ Error deleting agency:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Agency deleted:", params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

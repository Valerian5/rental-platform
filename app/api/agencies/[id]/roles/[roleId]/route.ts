import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authService } from "@/lib/auth-service"

// Create a Supabase client with environment variables
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string; roleId: string } }) {
  try {
    console.log("🏢 API Agency Role GET:", params.roleId)

    // Check authentication
    const user = await authService.getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or belongs to the requested agency
    if (user.user_type !== "admin" && user.agency_id !== params.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the role
    const { data: role, error } = await supabase
      .from("agency_roles")
      .select("*")
      .eq("id", params.roleId)
      .eq("agency_id", params.id)
      .single()

    if (error) {
      console.error("❌ Error fetching agency role:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Get users with this role
    const { data: userRoles, error: userRolesError } = await supabase
      .from("user_agency_roles")
      .select("user_id")
      .eq("agency_role_id", params.roleId)

    if (userRolesError) {
      console.error("❌ Error fetching users with role:", userRolesError)
      // Don't fail the request if users fetch fails
    }

    const userIds = userRoles?.map((ur) => ur.user_id) || []
    let users = []

    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name")
        .in("id", userIds)

      if (usersError) {
        console.error("❌ Error fetching users:", usersError)
        // Don't fail the request if users fetch fails
      } else {
        users = usersData || []
      }
    }

    console.log("✅ Agency role retrieved:", role.name)
    return NextResponse.json({
      success: true,
      role,
      users,
    })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string; roleId: string } }) {
  try {
    console.log("🏢 API Agency Role PUT:", params.roleId)

    // Check authentication
    const user = await authService.getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
    const { name, permissions } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 })
    }

    // Update the role
    const { data: updatedRole, error } = await supabase
      .from("agency_roles")
      .update({
        name,
        permissions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.roleId)
      .eq("agency_id", params.id)
      .select()
      .single()

    if (error) {
      console.error("❌ Error updating agency role:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Agency role updated:", updatedRole.name)
    return NextResponse.json({ success: true, role: updatedRole })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; roleId: string } }) {
  try {
    console.log("🏢 API Agency Role DELETE:", params.roleId)

    // Check authentication
    const user = await authService.getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Check if role is "Agency Director"
    const { data: roleToDelete, error: roleError } = await supabase
      .from("agency_roles")
      .select("name")
      .eq("id", params.roleId)
      .single()

    if (roleError) {
      console.error("❌ Error fetching role to delete:", roleError)
      return NextResponse.json({ error: roleError.message }, { status: 500 })
    }

    if (roleToDelete.name === "Agency Director") {
      return NextResponse.json({ error: "Cannot delete the Agency Director role" }, { status: 400 })
    }

    // Check if role has users
    const { data: userRoles, error: userRolesError } = await supabase
      .from("user_agency_roles")
      .select("user_id")
      .eq("agency_role_id", params.roleId)

    if (userRolesError) {
      console.error("❌ Error checking role users:", userRolesError)
      return NextResponse.json({ error: userRolesError.message }, { status: 500 })
    }

    if (userRoles && userRoles.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete role with assigned users. Please reassign users first." },
        { status: 400 },
      )
    }

    // Delete the role
    const { error } = await supabase.from("agency_roles").delete().eq("id", params.roleId).eq("agency_id", params.id)

    if (error) {
      console.error("❌ Error deleting agency role:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Agency role deleted:", params.roleId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

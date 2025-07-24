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

export async function GET(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    console.log("🏢 API Agency User GET:", params.userId)

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

    // Get the user
    const { data: agencyUser, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, user_type, created_at")
      .eq("id", params.userId)
      .eq("agency_id", params.id)
      .single()

    if (error) {
      console.error("❌ Error fetching agency user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!agencyUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user roles
    const { data: userRoles, error: userRolesError } = await supabase
      .from("user_agency_roles")
      .select("agency_role_id")
      .eq("user_id", params.userId)

    if (userRolesError) {
      console.error("❌ Error fetching user roles:", userRolesError)
      // Don't fail the request if roles fetch fails
    }

    const roleIds = userRoles?.map((ur) => ur.agency_role_id) || []
    let roles = []

    if (roleIds.length > 0) {
      const { data: rolesData, error: rolesError } = await supabase
        .from("agency_roles")
        .select("id, name, permissions")
        .in("id", roleIds)

      if (rolesError) {
        console.error("❌ Error fetching roles:", rolesError)
        // Don't fail the request if roles fetch fails
      } else {
        roles = rolesData || []
      }
    }

    console.log("✅ Agency user retrieved:", agencyUser.email)
    return NextResponse.json({
      success: true,
      user: {
        ...agencyUser,
        roles,
      },
    })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    console.log("🏢 API Agency User PUT:", params.userId)

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
    const { firstName, lastName, roleIds } = body

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Name fields are required" }, { status: 400 })
    }

    // Update the user
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.userId)
      .eq("agency_id", params.id)
      .select()
      .single()

    if (error) {
      console.error("❌ Error updating agency user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update roles if provided
    if (roleIds && Array.isArray(roleIds)) {
      // First, check if all roles belong to the agency
      const { data: validRoles, error: rolesError } = await supabase
        .from("agency_roles")
        .select("id")
        .in("id", roleIds)
        .eq("agency_id", params.id)

      if (rolesError) {
        console.error("❌ Error validating roles:", rolesError)
        return NextResponse.json({ error: rolesError.message }, { status: 500 })
      }

      const validRoleIds = validRoles?.map((r) => r.id) || []

      if (validRoleIds.length !== roleIds.length) {
        return NextResponse.json({ error: "Invalid role IDs provided" }, { status: 400 })
      }

      // Delete existing roles
      const { error: deleteError } = await supabase.from("user_agency_roles").delete().eq("user_id", params.userId)

      if (deleteError) {
        console.error("❌ Error deleting existing roles:", deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      // Add new roles
      const rolesToInsert = validRoleIds.map((roleId) => ({
        user_id: params.userId,
        agency_role_id: roleId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const { error: insertError } = await supabase.from("user_agency_roles").insert(rolesToInsert)

      if (insertError) {
        console.error("❌ Error assigning new roles:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    console.log("✅ Agency user updated:", updatedUser.email)
    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    console.log("🏢 API Agency User DELETE:", params.userId)

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

    // Check if trying to delete self
    if (user.id === params.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Check if user exists and belongs to the agency
    const { data: userToDelete, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", params.userId)
      .eq("agency_id", params.id)
      .single()

    if (userError || !userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete user roles
    const { error: rolesError } = await supabase.from("user_agency_roles").delete().eq("user_id", params.userId)

    if (rolesError) {
      console.error("❌ Error deleting user roles:", rolesError)
      return NextResponse.json({ error: rolesError.message }, { status: 500 })
    }

    // Update user to remove agency association
    const { error: updateError } = await supabase
      .from("users")
      .update({
        agency_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.userId)

    if (updateError) {
      console.error("❌ Error removing agency association:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Optionally, delete the user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(params.userId)

    if (authError) {
      console.error("❌ Error deleting user auth:", authError)
      // Don't fail the request if auth deletion fails
    }

    console.log("✅ Agency user deleted:", params.userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

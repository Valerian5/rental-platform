import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authService } from "@/lib/auth-service"

// Create a Supabase client with environment variables
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🏢 API Agency Users GET for agency:", params.id)

    // Check authentication
    const user = await authService.getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or belongs to the requested agency
    if (user.user_type !== "admin" && user.agency_id !== params.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get agency users
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, user_type, created_at")
      .eq("agency_id", params.id)
      .order("last_name")

    if (error) {
      console.error("❌ Error fetching agency users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user roles
    const userIds = users?.map((u) => u.id) || []
    let userRoles = []

    if (userIds.length > 0) {
      const { data: roles, error: rolesError } = await supabase
        .from("user_agency_roles")
        .select("user_id, agency_role_id")
        .in("user_id", userIds)

      if (rolesError) {
        console.error("❌ Error fetching user roles:", rolesError)
        // Don't fail the request if roles fetch fails
      } else {
        userRoles = roles || []
      }
    }

    // Get role details
    const roleIds = [...new Set(userRoles.map((ur) => ur.agency_role_id))]
    let roleDetails = []

    if (roleIds.length > 0) {
      const { data: roles, error: rolesError } = await supabase
        .from("agency_roles")
        .select("id, name")
        .in("id", roleIds)

      if (rolesError) {
        console.error("❌ Error fetching role details:", rolesError)
        // Don't fail the request if roles fetch fails
      } else {
        roleDetails = roles || []
      }
    }

    // Combine user data with roles
    const usersWithRoles =
      users?.map((user) => {
        const userRoleIds = userRoles.filter((ur) => ur.user_id === user.id).map((ur) => ur.agency_role_id)

        const roles = roleDetails.filter((r) => userRoleIds.includes(r.id)).map((r) => ({ id: r.id, name: r.name }))

        return {
          ...user,
          roles,
        }
      }) || []

    console.log(`✅ ${usersWithRoles.length} agency users retrieved`)
    return NextResponse.json({ success: true, users: usersWithRoles })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🏢 API Agency Users POST for agency:", params.id)

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
    const { email, firstName, lastName, password, roleId } = body

    // Validate required fields
    if (!email || !firstName || !lastName || !password || !roleId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Check if role exists and belongs to the agency
    const { data: role, error: roleError } = await supabase
      .from("agency_roles")
      .select("id")
      .eq("id", roleId)
      .eq("agency_id", params.id)
      .single()

    if (roleError || !role) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Create the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          user_type: "agency",
        },
      },
    })

    if (authError || !authData.user) {
      console.error("❌ Error creating user auth:", authError)
      return NextResponse.json({ error: authError?.message || "Error creating user" }, { status: 500 })
    }

    // Create the user profile
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        user_type: "agency",
        agency_id: params.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError) {
      console.error("❌ Error creating user profile:", userError)
      // Try to clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Assign role to user
    const { error: roleAssignError } = await supabase.from("user_agency_roles").insert({
      user_id: newUser.id,
      agency_role_id: roleId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (roleAssignError) {
      console.error("❌ Error assigning role to user:", roleAssignError)
      // Don't fail the request if role assignment fails
    }

    console.log("✅ Agency user created:", newUser.email)
    return NextResponse.json(
      {
        success: true,
        user: {
          ...newUser,
          roles: [{ id: roleId, name: role.name }],
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

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
    console.log("👥 API Agency Users GET for agency:", params.id)

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

    // Get agency users with their roles
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        id,
        email,
        first_name,
        last_name,
        user_type,
        created_at,
        user_agency_roles(
          agency_role_id,
          agency_roles(
            id,
            name,
            permissions
          )
        )
      `)
      .eq("agency_id", params.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching agency users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to include roles properly
    const transformedUsers = (users || []).map((user: any) => ({
      ...user,
      roles: user.user_agency_roles?.map((uar: any) => uar.agency_roles).filter(Boolean) || [],
    }))

    console.log(`✅ ${transformedUsers.length} agency users retrieved`)
    return NextResponse.json({ success: true, users: transformedUsers })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("👥 API Agency Users POST for agency:", params.id)

    // Check authentication using token
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ Utilisateur non authentifié")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("👤 Utilisateur authentifié:", user.user_type, user.id)

    // Check if user is admin or has permission to manage users
    const isAdmin = user.user_type === "admin"

    if (!isAdmin) {
      // Check if user belongs to the agency and has permission
      if (user.agency_id !== params.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Check user permissions
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

      if (roleError || !role || !role.permissions?.manage_users) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
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

    // Verify the role exists and belongs to the agency
    const { data: role, error: roleError } = await supabase
      .from("agency_roles")
      .select("id, name")
      .eq("id", roleId)
      .eq("agency_id", params.id)
      .single()

    if (roleError || !role) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Create the user with Supabase Auth first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error("❌ Error creating auth user:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Create the user profile
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        user_type: "agency", // Utiliser 'agency' comme type
        agency_id: params.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError) {
      console.error("❌ Error creating user profile:", userError)
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Assign the role to the user
    const { error: roleAssignError } = await supabase.from("user_agency_roles").insert({
      user_id: authData.user.id,
      agency_role_id: roleId,
      created_at: new Date().toISOString(),
    })

    if (roleAssignError) {
      console.error("❌ Error assigning role:", roleAssignError)
      // Clean up user and auth if role assignment fails
      await supabase.from("users").delete().eq("id", authData.user.id)
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: roleAssignError.message }, { status: 500 })
    }

    console.log("✅ Agency user created:", email)
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

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Create a Supabase client with service role
const supabaseAdmin = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    cookies: {
      get() {
        return undefined
      },
      set() {},
      remove() {},
    },
  },
)

// Create a regular Supabase client for auth
const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  cookies: {
    get() {
      return undefined
    },
    set() {},
    remove() {},
  },
})

async function getCurrentUserFromRequest(request: NextRequest) {
  try {
    console.log("🔐 getCurrentUserFromRequest - Début")

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Pas de token d'autorisation")
      return null
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix
    console.log("🎫 Token reçu:", token.substring(0, 20) + "...")

    // Verify the JWT token with Supabase
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.getUser(token)

    if (tokenError || !tokenData.user) {
      console.log("❌ Token invalide:", tokenError?.message)
      return null
    }

    console.log("✅ Token valide pour utilisateur:", tokenData.user.id)

    // Get the user profile from our users table
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", tokenData.user.id)
      .single()

    if (profileError || !userProfile) {
      console.log("❌ Profil utilisateur non trouvé:", profileError?.message)
      return null
    }

    console.log("✅ Profil utilisateur récupéré:", userProfile.user_type, userProfile.email)
    return userProfile
  } catch (error) {
    console.error("❌ Erreur dans getCurrentUserFromRequest:", error)
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🏢 API Agencies GET ID:", params.id)

    // Check authentication using token
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ Utilisateur non authentifié")
      return NextResponse.json({ error: "Unauthorized", details: "No valid authentication token" }, { status: 401 })
    }

    console.log("👤 Utilisateur authentifié:", user.user_type, user.id, "Agency ID:", user.agency_id)

    // Check if user is admin or belongs to the requested agency
    if (user.user_type !== "admin" && user.agency_id !== params.id) {
      console.log("❌ Utilisateur non autorisé pour cette agence")
      console.log("User agency_id:", user.agency_id, "Requested agency_id:", params.id)
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "User does not belong to this agency",
          userAgencyId: user.agency_id,
          requestedAgencyId: params.id,
        },
        { status: 401 },
      )
    }

    // Get the agency
    const { data: agency, error } = await supabaseAdmin.from("agencies").select("*").eq("id", params.id).single()

    if (error) {
      console.error("❌ Error fetching agency:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 })
    }

    // Get agency roles
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("agency_roles")
      .select("*")
      .eq("agency_id", params.id)

    if (rolesError) {
      console.error("❌ Error fetching agency roles:", rolesError)
      // Don't fail the request if roles fetch fails
    }

    // Get agency users
    const { data: users, error: usersError } = await supabaseAdmin
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
    return NextResponse.json({ error: "Server error", details: error.message }, { status: 500 })
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
      const { data: userRole, error: userRoleError } = await supabaseAdmin
        .from("user_agency_roles")
        .select("agency_role_id")
        .eq("user_id", user.id)
        .single()

      if (userRoleError || !userRole) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { data: role, error: roleError } = await supabaseAdmin
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
    const { data: agency, error } = await supabaseAdmin
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
    const { data: users, error: usersError } = await supabaseAdmin.from("users").select("id").eq("agency_id", params.id)

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
    const { error: rolesError } = await supabaseAdmin.from("agency_roles").delete().eq("agency_id", params.id)

    if (rolesError) {
      console.error("❌ Error deleting agency roles:", rolesError)
      return NextResponse.json({ error: rolesError.message }, { status: 500 })
    }

    // Delete the agency
    const { error } = await supabaseAdmin.from("agencies").delete().eq("id", params.id)

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

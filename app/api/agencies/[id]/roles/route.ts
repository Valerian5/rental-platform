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
    console.log("🏢 API Agency Roles GET for agency:", params.id)

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

    // Get agency roles
    const { data: roles, error } = await supabase
      .from("agency_roles")
      .select("*")
      .eq("agency_id", params.id)
      .order("name")

    if (error) {
      console.error("❌ Error fetching agency roles:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ ${roles?.length || 0} agency roles retrieved`)
    return NextResponse.json({ success: true, roles: roles || [] })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🏢 API Agency Roles POST for agency:", params.id)

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
    const { name, permissions } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 })
    }

    // Create the role
    const { data: newRole, error } = await supabase
      .from("agency_roles")
      .insert({
        name,
        permissions: permissions || {},
        agency_id: params.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Error creating agency role:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Agency role created:", newRole.name)
    return NextResponse.json({ success: true, role: newRole }, { status: 201 })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

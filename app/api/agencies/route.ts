import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth-service-fixed"
import { createServiceSupabaseClient } from "@/lib/supabase-server-client"

export async function GET(request: NextRequest) {
  try {
    console.log("🏢 API Agencies GET - Début")

    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ Utilisateur non authentifié")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ Utilisateur authentifié:", user.user_type, user.id)

    // Use service client for database operations
    const supabase = createServiceSupabaseClient()

    // Check if user is admin
    if (user.user_type !== "admin") {
      console.log("❌ Utilisateur non admin:", user.user_type)
      // If not admin, only return the user's agency
      if (user.agency_id) {
        const { data: agency, error } = await supabase.from("agencies").select("*").eq("id", user.agency_id).single()

        if (error) {
          console.error("❌ Error fetching agency:", error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, agencies: [agency] })
      } else {
        return NextResponse.json({ success: true, agencies: [] })
      }
    }

    console.log("✅ Admin confirmé, récupération des agences...")

    // Admin can see all agencies
    const { data: agencies, error } = await supabase.from("agencies").select("*").order("name")

    if (error) {
      console.error("❌ Error fetching agencies:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ ${agencies?.length || 0} agencies retrieved`)
    return NextResponse.json({ success: true, agencies: agencies || [] })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🏢 API Agencies POST - Début")

    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ Utilisateur non authentifié")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.user_type !== "admin") {
      console.log("❌ Utilisateur non admin:", user.user_type)
      return NextResponse.json({ error: "Unauthorized - Admin required" }, { status: 401 })
    }

    console.log("✅ Admin authentifié:", user.id)

    const body = await request.json()
    const { name, logo_url, primary_color, secondary_color, accent_color } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Agency name is required" }, { status: 400 })
    }

    // Use service client for database operations
    const supabase = createServiceSupabaseClient()

    // Create the agency
    const { data: agency, error } = await supabase
      .from("agencies")
      .insert({
        name,
        logo_url,
        primary_color: primary_color || "#0066FF",
        secondary_color: secondary_color || "#FF6B00",
        accent_color: accent_color || "#00C48C",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Error creating agency:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create default roles for the agency
    const defaultRoles = [
      {
        name: "Agency Director",
        permissions: JSON.stringify({
          manage_users: true,
          manage_properties: true,
          manage_applications: true,
          manage_visits: true,
          manage_leases: true,
          manage_settings: true,
        }),
        agency_id: agency.id,
      },
      {
        name: "Property Manager",
        permissions: JSON.stringify({
          manage_properties: true,
          manage_applications: true,
          manage_visits: true,
          manage_leases: true,
        }),
        agency_id: agency.id,
      },
      {
        name: "Visit Manager",
        permissions: JSON.stringify({
          view_properties: true,
          manage_visits: true,
        }),
        agency_id: agency.id,
      },
      {
        name: "Application Manager",
        permissions: JSON.stringify({
          view_properties: true,
          manage_applications: true,
        }),
        agency_id: agency.id,
      },
    ]

    const { error: rolesError } = await supabase.from("agency_roles").insert(defaultRoles)

    if (rolesError) {
      console.error("❌ Error creating default roles:", rolesError)
      // Don't fail the request if roles creation fails
    }

    console.log("✅ Agency created:", agency.name)
    return NextResponse.json({ success: true, agency }, { status: 201 })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

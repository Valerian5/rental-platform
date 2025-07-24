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
    console.log("📊 API Agency Stats GET for agency:", params.id)

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

    // Get agency basic info
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("id, name, created_at")
      .eq("id", params.id)
      .single()

    if (agencyError || !agency) {
      console.error("❌ Error fetching agency:", agencyError)
      return NextResponse.json({ error: "Agency not found" }, { status: 404 })
    }

    // Get users count
    const { count: usersCount, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", params.id)

    if (usersError) {
      console.error("❌ Error counting users:", usersError)
    }

    // Get properties count
    const { count: propertiesCount, error: propertiesError } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", params.id)

    if (propertiesError) {
      console.error("❌ Error counting properties:", propertiesError)
    }

    // Get applications count
    const { count: applicationsCount, error: applicationsError } = await supabase
      .from("applications")
      .select("applications.*, properties!inner(agency_id)", { count: "exact", head: true })
      .eq("properties.agency_id", params.id)

    if (applicationsError) {
      console.error("❌ Error counting applications:", applicationsError)
    }

    // Get active leases count
    const { count: leasesCount, error: leasesError } = await supabase
      .from("leases")
      .select("leases.*, properties!inner(agency_id)", { count: "exact", head: true })
      .eq("properties.agency_id", params.id)
      .eq("status", "active")

    if (leasesError) {
      console.error("❌ Error counting leases:", leasesError)
    }

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: recentApplicationsCount, error: recentApplicationsError } = await supabase
      .from("applications")
      .select("applications.*, properties!inner(agency_id)", { count: "exact", head: true })
      .eq("properties.agency_id", params.id)
      .gte("applications.created_at", thirtyDaysAgo.toISOString())

    if (recentApplicationsError) {
      console.error("❌ Error counting recent applications:", recentApplicationsError)
    }

    const stats = {
      agency: {
        id: agency.id,
        name: agency.name,
        created_at: agency.created_at,
      },
      counts: {
        users: usersCount || 0,
        properties: propertiesCount || 0,
        applications: applicationsCount || 0,
        active_leases: leasesCount || 0,
        recent_applications: recentApplicationsCount || 0,
      },
    }

    console.log("✅ Agency stats retrieved:", stats)
    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

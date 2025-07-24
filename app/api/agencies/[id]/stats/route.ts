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
    const isAdmin = user.user_type === "admin"
    const isAgencyMember = user.agency_id === params.id

    if (!isAdmin && !isAgencyMember) {
      console.log("❌ Utilisateur non autorisé pour cette agence")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get statistics in parallel
    const [{ count: propertiesCount }, { count: applicationsCount }, { count: visitsCount }, { count: leasesCount }] =
      await Promise.all([
        supabase.from("properties").select("*", { count: "exact", head: true }).eq("agency_id", params.id),
        supabase.from("applications").select("*", { count: "exact", head: true }).eq("agency_id", params.id),
        supabase.from("visits").select("*", { count: "exact", head: true }).eq("agency_id", params.id),
        supabase.from("leases").select("*", { count: "exact", head: true }).eq("agency_id", params.id),
      ])

    // Calculate revenue from active leases
    const { data: activeLeases, error: leasesError } = await supabase
      .from("leases")
      .select("monthly_rent")
      .eq("agency_id", params.id)
      .eq("status", "active")

    let totalRevenue = 0
    if (!leasesError && activeLeases) {
      totalRevenue = activeLeases.reduce((sum, lease) => sum + (lease.monthly_rent || 0), 0)
    }

    const stats = {
      properties: propertiesCount || 0,
      applications: applicationsCount || 0,
      visits: visitsCount || 0,
      leases: leasesCount || 0,
      revenue: totalRevenue,
    }

    console.log("✅ Agency stats retrieved:", stats)
    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

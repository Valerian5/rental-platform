import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Vérifier que l'utilisateur est admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("user_type").eq("id", user.id).single()

    if (!userData || userData.user_type !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Compter les baux et calculer les revenus
    const { data: leases, error } = await supabase.from("leases").select("monthly_rent, charges, status")

    if (error) {
      console.error("Erreur récupération baux:", error)
      return NextResponse.json({ count: 0, revenue: 0 })
    }

    const activeLeases = leases?.filter((lease) => lease.status === "active") || []
    const totalRevenue = activeLeases.reduce((sum, lease) => sum + (lease.monthly_rent || 0) + (lease.charges || 0), 0)

    return NextResponse.json({
      count: leases?.length || 0,
      revenue: totalRevenue,
    })
  } catch (error) {
    console.error("Erreur API stats leases:", error)
    return NextResponse.json({ count: 0, revenue: 0 })
  }
}

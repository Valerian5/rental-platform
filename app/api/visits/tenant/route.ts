import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id is required" }, { status: 400 })
    }

    // Récupérer les visites du locataire
    const { data: visits, error: visitsError } = await supabase
      .from("visits")
      .select(`
        id,
        visit_date,
        visit_time,
        status,
        created_at,
        property:properties (
          id,
          title,
          address,
          city,
          property_images (
            url,
            is_primary
          )
        ),
        application:applications (
          id,
          status
        )
      `)
      .eq("tenant_id", tenantId)
      .order("visit_date", { ascending: true })
      .limit(limit)

    if (visitsError) {
      console.error("Erreur récupération visites:", visitsError)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    // Compter le total
    const { count: totalCount } = await supabase
      .from("visits")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)

    return NextResponse.json({
      visits: visits || [],
      total: totalCount || 0,
    })
  } catch (error) {
    console.error("Erreur API visites tenant:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

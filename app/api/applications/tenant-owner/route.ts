import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const ownerId = searchParams.get("owner_id")

    if (!tenantId || !ownerId) {
      return NextResponse.json({ error: "tenant_id et owner_id sont requis" }, { status: 400 })
    }

    console.log("🔍 Recherche candidatures:", { tenantId, ownerId })

    // Récupérer les candidatures du locataire pour les propriétés de ce propriétaire
    const { data: applications, error } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        created_at,
        message,
        property:properties(
          id,
          title,
          address,
          city,
          price,
          images
        )
      `)
      .eq("tenant_id", tenantId)
      .eq("properties.owner_id", ownerId)

    if (error) {
      console.error("❌ Erreur récupération candidatures:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des candidatures" }, { status: 500 })
    }

    console.log("✅ Candidatures trouvées:", applications?.length || 0)

    return NextResponse.json({
      applications: applications || [],
      count: applications?.length || 0,
    })
  } catch (error) {
    console.error("❌ Erreur API candidatures tenant-owner:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

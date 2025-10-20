import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const ownerId = searchParams.get("owner_id")

    console.log("🔍 Debug candidatures:", { tenantId, ownerId })

    // Test 1: Récupérer toutes les candidatures du tenant
    if (tenantId) {
      const { data: tenantApplications, error: tenantError } = await supabase
        .from("applications")
        .select("*")
        .eq("tenant_id", tenantId)

      console.log("📋 Candidatures du tenant:", tenantApplications?.length || 0)
      if (tenantError) console.error("❌ Erreur candidatures tenant:", tenantError)
    }

    // Test 2: Récupérer toutes les propriétés du owner
    if (ownerId) {
      const { data: ownerProperties, error: ownerError } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", ownerId)

      console.log("🏠 Propriétés du owner:", ownerProperties?.length || 0)
      if (ownerError) console.error("❌ Erreur propriétés owner:", ownerError)
    }

    // Test 3: Récupérer toutes les candidatures
    const { data: allApplications, error: allError } = await supabase.from("applications").select("*").limit(10)

    console.log("📋 Toutes les candidatures (10 premières):", allApplications?.length || 0)
    if (allError) console.error("❌ Erreur toutes candidatures:", allError)

    // Test 4: Récupérer toutes les propriétés
    const { data: allProperties, error: allPropsError } = await supabase.from("properties").select("*").limit(10)

    console.log("🏠 Toutes les propriétés (10 premières):", allProperties?.length || 0)
    if (allPropsError) console.error("❌ Erreur toutes propriétés:", allPropsError)

    return NextResponse.json({
      tenant_applications: tenantId
        ? (await supabase.from("applications").select("*").eq("tenant_id", tenantId)).data
        : null,
      owner_properties: ownerId ? (await supabase.from("properties").select("*").eq("owner_id", ownerId)).data : null,
      sample_applications: allApplications?.slice(0, 3) || [],
      sample_properties: allProperties?.slice(0, 3) || [],
    })
  } catch (error) {
    console.error("❌ Erreur debug candidatures:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

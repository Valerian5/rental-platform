import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const limit = searchParams.get("limit") || "10"

    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id is required" }, { status: 400 })
    }

    console.log("📋 API Visits/Tenant - GET", { tenantId, limit })

    // Vérifier si la table visits existe
    const { data: tableExists, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "visits")
      .single()

    if (tableError || !tableExists) {
      console.log("⚠️ Table visits n'existe pas encore")
      return NextResponse.json({
        success: true,
        data: [],
        message: "Table visits not found, returning empty array",
      })
    }

    // Récupérer les visites du locataire avec les informations des propriétés
    const { data: visits, error } = await supabase
      .from("visits")
      .select(`
        id,
        property_id,
        visit_date,
        visit_time,
        status,
        notes,
        created_at,
        properties (
          id,
          title,
          location,
          price,
          images,
          owner_id
        )
      `)
      .eq("tenant_id", tenantId)
      .order("visit_date", { ascending: true })
      .limit(Number.parseInt(limit))

    if (error) {
      console.error("❌ Erreur récupération visites:", error)
      // Retourner des données vides au lieu d'une erreur 500
      return NextResponse.json({
        success: true,
        data: [],
        message: "Error fetching visits, returning empty array",
      })
    }

    console.log(`✅ ${visits?.length || 0} visites récupérées`)

    return NextResponse.json({
      success: true,
      data: visits || [],
    })
  } catch (error) {
    console.error("❌ Erreur dans API visits/tenant:", error)
    // Retourner des données vides au lieu d'une erreur 500
    return NextResponse.json({
      success: true,
      data: [],
      message: "Unexpected error, returning empty array",
    })
  }
}

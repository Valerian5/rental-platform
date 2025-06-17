import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leaseType = searchParams.get("lease_type")
    const activeOnly = searchParams.get("active_only") === "true"

    let query = supabase.from("lease_templates").select("*").order("created_at", { ascending: false })

    if (leaseType) {
      query = query.eq("lease_type", leaseType)
    }

    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      templates: data || [],
    })
  } catch (error) {
    console.error("Erreur récupération templates:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, lease_type, template_content, field_mapping, is_default, version, legal_references } =
      body

    // Si c'est un template par défaut, désactiver les autres templates par défaut du même type
    if (is_default) {
      await supabase
        .from("lease_templates")
        .update({ is_default: false })
        .eq("lease_type", lease_type)
        .eq("is_default", true)
    }

    const { data, error } = await supabase
      .from("lease_templates")
      .insert({
        name,
        description,
        lease_type,
        template_content,
        field_mapping,
        is_default: is_default || false,
        version: version || "1.0",
        legal_references,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      template: data,
    })
  } catch (error) {
    console.error("Erreur création template:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

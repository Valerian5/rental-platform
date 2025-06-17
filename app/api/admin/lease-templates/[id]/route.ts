import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase.from("lease_templates").select("*").eq("id", params.id).single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      template: data,
    })
  } catch (error) {
    console.error("Erreur récupération template:", error)
    return NextResponse.json({ success: false, error: "Template non trouvé" }, { status: 404 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, description, template_content, field_mapping, is_active, is_default, version, legal_references } =
      body

    // Si c'est un template par défaut, désactiver les autres templates par défaut du même type
    if (is_default) {
      const { data: currentTemplate } = await supabase
        .from("lease_templates")
        .select("lease_type")
        .eq("id", params.id)
        .single()

      if (currentTemplate) {
        await supabase
          .from("lease_templates")
          .update({ is_default: false })
          .eq("lease_type", currentTemplate.lease_type)
          .eq("is_default", true)
          .neq("id", params.id)
      }
    }

    const { data, error } = await supabase
      .from("lease_templates")
      .update({
        name,
        description,
        template_content,
        field_mapping,
        is_active,
        is_default,
        version,
        legal_references,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      template: data,
    })
  } catch (error) {
    console.error("Erreur mise à jour template:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from("lease_templates").delete().eq("id", params.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Template supprimé",
    })
  } catch (error) {
    console.error("Erreur suppression template:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

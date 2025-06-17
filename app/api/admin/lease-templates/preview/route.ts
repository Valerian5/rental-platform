import { type NextRequest, NextResponse } from "next/server"
import { leaseTemplateService } from "@/lib/lease-template-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template_content, lease_type, sample_data } = body

    if (!template_content) {
      return NextResponse.json({ success: false, error: "Contenu du template requis" }, { status: 400 })
    }

    const mockTemplate = {
      id: "preview",
      name: "Aperçu",
      description: "",
      lease_type: lease_type || "unfurnished",
      template_content,
      field_mapping: {},
      is_active: true,
      is_default: false,
      version: "1.0",
      legal_references: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const preview = leaseTemplateService.generatePreview(mockTemplate, sample_data)

    return NextResponse.json({
      success: true,
      preview,
    })
  } catch (error) {
    console.error("Erreur génération preview:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la génération de l'aperçu" }, { status: 500 })
  }
}

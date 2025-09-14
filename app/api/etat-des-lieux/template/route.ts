import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { etatDesLieuxPDFGenerator } from "@/lib/etat-des-lieux-pdf-generator"

export async function POST(request: NextRequest) {
  try {
    const { type, room_count, property_data, lease_data } = await request.json()
    const server = createServerClient()

    // Chercher un modèle personnalisé uploadé par l'admin
    const { data: customTemplate, error: templateError } = await server
      .from("etat_des_lieux_templates")
      .select("*")
      .eq("type", type)
      .eq("room_count", room_count)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (customTemplate && !templateError) {
      // Utiliser le modèle personnalisé
      try {
        const response = await fetch(customTemplate.file_url)
        if (response.ok) {
          const pdfBuffer = await response.arrayBuffer()
          return new NextResponse(pdfBuffer, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${customTemplate.file_name}"`,
            },
          })
        }
      } catch (error) {
        console.warn("Erreur récupération modèle personnalisé:", error)
        // Fallback vers le générateur par défaut
      }
    }

    // Fallback : générer le PDF avec le générateur par défaut
    const pdfBuffer = await etatDesLieuxPDFGenerator.generatePDF({
      type,
      room_count,
      property_data,
      lease_data,
    })

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="etat-des-lieux-${type}-${room_count}pieces.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erreur génération template:", error)
    return NextResponse.json({ error: "Erreur lors de la génération du template" }, { status: 500 })
  }
}

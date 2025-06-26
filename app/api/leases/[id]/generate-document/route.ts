import { type NextRequest, NextResponse } from "next/server"
import { leaseDataAnalyzer } from "@/lib/lease-data-analyzer"
import { supabase } from "@/lib/supabase"

// Moteur de template simple pour remplacer les variables
function compileTemplate(template: string, data: any): string {
  let result = template

  console.log("🔧 [TEMPLATE] Compilation avec", Object.keys(data).length, "variables")

  // Remplacer les variables simples {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key]
    if (value !== undefined && value !== null && value !== "") {
      console.log("✅ [TEMPLATE] Remplacé:", key, "=", value)
      return String(value)
    } else {
      console.log("❌ [TEMPLATE] Variable non trouvée:", key)
      return match
    }
  })

  // Remplacer les conditions {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    const value = data[key]
    return value && value !== "" ? content : ""
  })

  // Remplacer les boucles {{#each array}}...{{/each}}
  result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, content) => {
    const array = data[key]
    if (!Array.isArray(array)) return ""

    return array
      .map((item) => {
        let itemContent = content
        itemContent = itemContent.replace(/\{\{this\}\}/g, String(item))
        return itemContent
      })
      .join("")
  })

  return result
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    console.log("🚀 [GENERATE] Génération document pour bail:", leaseId)

    // 1. Analyser les données du bail
    console.log("🔍 [GENERATE] Début analyse des données...")
    const analysis = await leaseDataAnalyzer.analyze(leaseId)

    console.log("📊 [GENERATE] Résultat analyse:")
    console.log("- Taux completion:", analysis.completionRate + "%")
    console.log("- Peut générer:", analysis.canGenerate)
    console.log("- Champs manquants:", analysis.missingRequired)

    if (!analysis.canGenerate) {
      console.log("❌ [GENERATE] Génération impossible - données incomplètes")
      return NextResponse.json(
        {
          success: false,
          error: "Données obligatoires incomplètes",
          missingFields: analysis.missingRequired,
          completionRate: analysis.completionRate,
          redirectTo: `/owner/leases/${leaseId}/complete-data`,
        },
        { status: 400 },
      )
    }

    // 2. Récupérer le bail pour le type
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("lease_type")
      .eq("id", leaseId)
      .single()

    if (leaseError) {
      console.error("❌ [GENERATE] Erreur récupération bail:", leaseError)
      return NextResponse.json({ success: false, error: "Bail non trouvé" }, { status: 404 })
    }

    console.log("📋 [GENERATE] Type de bail:", lease.lease_type)

    // 3. Récupérer le template approprié
    const { data: template, error: templateError } = await supabase
      .from("lease_templates")
      .select("*")
      .eq("lease_type", lease.lease_type)
      .eq("is_default", true)
      .eq("is_active", true)
      .single()

    if (templateError) {
      console.error("❌ [GENERATE] Erreur récupération template:", templateError)
      return NextResponse.json(
        { success: false, error: `Template non trouvé pour le type: ${lease.lease_type}` },
        { status: 404 },
      )
    }

    console.log("📄 [GENERATE] Template récupéré:", template.name)

    // 4. Préparer les données pour le template
    const templateData: Record<string, any> = {}
    for (const [key, field] of Object.entries(analysis.availableData)) {
      templateData[key] = field.value || ""
    }

    console.log("📊 [GENERATE] Données template préparées:", Object.keys(templateData).length, "champs")

    // 5. Compiler le template
    const generatedDocument = compileTemplate(template.template_content, templateData)
    console.log("✅ [GENERATE] Document généré, longueur:", generatedDocument.length, "caractères")

    // 6. Sauvegarder le document généré
    const { data: updateResult, error: updateError } = await supabase
      .from("leases")
      .update({
        generated_document: generatedDocument,
        document_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", leaseId)
      .select("id, generated_document")

    if (updateError) {
      console.error("❌ [GENERATE] Erreur sauvegarde:", updateError)
      return NextResponse.json({ success: false, error: "Erreur lors de la sauvegarde" }, { status: 500 })
    }

    console.log("✅ [GENERATE] Document sauvegardé:", {
      id: updateResult?.[0]?.id,
      documentSaved: !!updateResult?.[0]?.generated_document,
      savedLength: updateResult?.[0]?.generated_document?.length || 0,
    })

    return NextResponse.json({
      success: true,
      message: "Document généré avec succès",
      document: {
        content: generatedDocument,
        template: template.name,
        generatedAt: new Date().toISOString(),
      },
      analysis: {
        completionRate: analysis.completionRate,
        totalFields: Object.keys(analysis.availableData).length,
      },
    })
  } catch (error) {
    console.error("❌ [GENERATE] Erreur:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la génération du document",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

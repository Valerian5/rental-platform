import { type NextRequest, NextResponse } from "next/server"
import { leaseDataAnalyzer } from "@/lib/lease-data-analyzer"
import { leaseTemplateService } from "@/lib/lease-template-service"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    console.log("🚀 [SERVER] Génération document pour bail:", leaseId)

    // Analyser les données du bail
    const analysis = await leaseDataAnalyzer.analyze(leaseId)
    console.log(`📊 [SERVER] Analyse: ${analysis.completionRate}% complet`)
    console.log("🎯 [SERVER] Peut générer:", analysis.canGenerate)

    if (!analysis.canGenerate) {
      const missingFields = analysis.missingRequired.map((field) => {
        const fieldDef = analysis.availableData[field]
        return `${fieldDef?.label || field}`
      })

      console.log("❌ [SERVER] Champs manquants détaillés:", analysis.missingRequired)
      return NextResponse.json(
        {
          error: "Données manquantes",
          message: "Certaines données obligatoires sont manquantes",
          missingFields,
          redirectTo: `/owner/leases/${leaseId}/complete-data`,
        },
        { status: 400 },
      )
    }

    // Récupérer le bail pour déterminer le type
    const { data: lease } = await supabase.from("leases").select("lease_type").eq("id", leaseId).single()

    if (!lease) {
      return NextResponse.json({ error: "Bail non trouvé" }, { status: 404 })
    }

    // Récupérer le template approprié
    const template = await leaseTemplateService.getDefaultTemplate(lease.lease_type)
    if (!template) {
      return NextResponse.json({ error: `Template non trouvé pour le type: ${lease.lease_type}` }, { status: 404 })
    }

    console.log("📄 [SERVER] Template trouvé:", template.name)

    // Préparer les données pour le template
    const templateData: Record<string, any> = {}
    for (const [key, field] of Object.entries(analysis.availableData)) {
      templateData[key] = field.value
    }

    console.log("🔧 [SERVER] Compilation du template...")
    console.log("🔧 Compilation template avec", Object.keys(templateData).length, "variables")

    // Compiler le template avec Handlebars
    const Handlebars = require("handlebars")

    // Enregistrer les helpers
    Handlebars.registerHelper("if", function (conditional: any, options: any) {
      if (conditional) {
        return options.fn(this)
      } else {
        return options.inverse(this)
      }
    })

    Handlebars.registerHelper("each", (context: any[], options: any) => {
      let ret = ""
      if (context && context.length > 0) {
        for (let i = 0; i < context.length; i++) {
          ret += options.fn(context[i])
        }
      }
      return ret
    })

    // Debug: vérifier les variables utilisées dans le template
    const templateVariables = template.template_content.match(/\{\{([^}]+)\}\}/g) || []
    const uniqueVariables = [...new Set(templateVariables.map((v) => v.replace(/[{}]/g, "").trim()))]

    for (const variable of uniqueVariables) {
      if (templateData[variable] !== undefined) {
        console.log(`✅ Remplacé: ${variable} = ${templateData[variable]}`)
      } else {
        console.log(`❌ Variable non trouvée: ${variable}`)
      }
    }

    const compiledTemplate = Handlebars.compile(template.template_content)
    const documentContent = compiledTemplate(templateData)

    console.log("✅ [SERVER] Document généré, longueur:", documentContent.length, "caractères")

    // Sauvegarder le document généré
    console.log("💾 [SERVER] Sauvegarde du document...")
    const { error: saveError } = await supabase
      .from("leases")
      .update({
        generated_document: documentContent,
        document_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", leaseId)

    if (saveError) {
      console.error("❌ [SERVER] Erreur sauvegarde:", saveError)
      throw saveError
    }

    console.log("✅ [SERVER] Document sauvegardé avec succès")

    // CORRIGÉ : Retourner le document généré
    return NextResponse.json({
      success: true,
      message: "Document généré avec succès",
      document: {
        content: documentContent,
        template: template.name,
        generatedAt: new Date().toISOString(),
      },
      analysis: {
        completionRate: analysis.completionRate,
        totalFields: Object.keys(analysis.availableData).length,
      },
    })
  } catch (error) {
    console.error("❌ [SERVER] Erreur génération:", error)
    return NextResponse.json(
      { error: "Erreur lors de la génération du document", details: error instanceof Error ? error.message : error },
      { status: 500 },
    )
  }
}

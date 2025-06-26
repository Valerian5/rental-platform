import { type NextRequest, NextResponse } from "next/server"
import { leaseDataAnalyzer } from "@/lib/lease-data-analyzer"
import { supabase } from "@/lib/supabase"

// Moteur de template simple pour remplacer les variables
function compileTemplate(template: string, data: any): string {
  let result = template

  console.log("🔧 Compilation template avec", Object.keys(data).length, "variables")

  // Remplacer les variables simples {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key]
    if (value !== undefined && value !== null && value !== "") {
      console.log("✅ Remplacé:", key, "=", value)
      return String(value)
    } else {
      console.log("❌ Variable non trouvée:", key)
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
        // Remplacer {{this}} par l'élément actuel
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
    console.log("🚀 [SERVER] Génération document pour bail:", leaseId)

    // 1. Analyser les données du bail
    console.log("🔍 [SERVER] Début analyse des données...")
    const analysis = await leaseDataAnalyzer.analyze(leaseId)

    console.log("📊 [SERVER] Résultat analyse:")
    console.log("- Taux completion:", analysis.completionRate + "%")
    console.log("- Peut générer:", analysis.canGenerate)
    console.log("- Champs manquants:", analysis.missingRequired)

    if (!analysis.canGenerate) {
      console.log("❌ [SERVER] Génération impossible - données obligatoires incomplètes")
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

    console.log("✅ [SERVER] Données suffisantes pour génération")

    // 2. Récupérer le bail pour le type
    console.log("🔍 [SERVER] Récupération du bail...")
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("lease_type")
      .eq("id", leaseId)
      .single()

    if (leaseError) {
      console.error("❌ [SERVER] Erreur récupération bail:", leaseError)
      return NextResponse.json({ success: false, error: "Bail non trouvé" }, { status: 404 })
    }

    console.log("📋 [SERVER] Type de bail:", lease.lease_type)

    // 3. Récupérer le template approprié
    console.log("🔍 [SERVER] Récupération du template...")
    const { data: template, error: templateError } = await supabase
      .from("lease_templates")
      .select("*")
      .eq("lease_type", lease.lease_type)
      .eq("is_default", true)
      .eq("is_active", true)
      .single()

    if (templateError) {
      console.error("❌ [SERVER] Erreur récupération template:", templateError)
      return NextResponse.json(
        { success: false, error: `Template non trouvé pour le type: ${lease.lease_type}` },
        { status: 404 },
      )
    }

    console.log("📄 [SERVER] Template récupéré:", template.name)

    // 4. Préparer les données pour le template
    console.log("🔧 [SERVER] Préparation des données template...")
    const templateData: Record<string, any> = {}

    for (const [key, field] of Object.entries(analysis.availableData)) {
      templateData[key] = field.value || ""
    }

    console.log("📊 [SERVER] Données template préparées:", Object.keys(templateData).length, "champs")

    // 5. Compiler le template
    console.log("🔧 [SERVER] Compilation du template...")
    const generatedDocument = compileTemplate(template.template_content, templateData)

    console.log("✅ [SERVER] Document généré, longueur:", generatedDocument.length, "caractères")

    // 6. CORRECTION : Sauvegarder le document généré avec vérification
    console.log("💾 [SERVER] Sauvegarde du document...")

    const updateData = {
      generated_document: generatedDocument,
      document_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("💾 [SERVER] Données à sauvegarder:", {
      documentLength: generatedDocument.length,
      hasContent: !!generatedDocument,
    })

    const { data: updateResult, error: updateError } = await supabase
      .from("leases")
      .update(updateData)
      .eq("id", leaseId)
      .select("id, generated_document, document_generated_at")

    if (updateError) {
      console.error("❌ [SERVER] Erreur sauvegarde document:", updateError)
      return NextResponse.json({ success: false, error: "Erreur lors de la sauvegarde du document" }, { status: 500 })
    }

    console.log("✅ [SERVER] Document sauvegardé avec succès:", {
      id: updateResult?.[0]?.id,
      documentSaved: !!updateResult?.[0]?.generated_document,
      savedLength: updateResult?.[0]?.generated_document?.length || 0,
    })

    // 7. Vérification de la sauvegarde
    const { data: verifyLease, error: verifyError } = await supabase
      .from("leases")
      .select("generated_document, document_generated_at")
      .eq("id", leaseId)
      .single()

    if (verifyError) {
      console.error("❌ [SERVER] Erreur vérification:", verifyError)
    } else {
      console.log("🔍 [SERVER] Vérification sauvegarde:", {
        hasDocument: !!verifyLease.generated_document,
        documentLength: verifyLease.generated_document?.length || 0,
        generatedAt: verifyLease.document_generated_at,
      })
    }

    // 8. Retourner la réponse avec le document
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
      debug: {
        documentLength: generatedDocument.length,
        templateUsed: template.name,
        savedToDatabase: !!updateResult?.[0]?.generated_document,
      },
    })
  } catch (error) {
    console.error("❌ [SERVER] Erreur génération document:", error)
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

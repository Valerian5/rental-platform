import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { leaseDataAnalyzer } from "@/lib/lease-data-analyzer"

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
    console.log("🔄 [SERVER] Génération document pour bail:", params.id)

    // 1. Analyser les données complétées
    console.log("🔍 [SERVER] Début analyse des données...")
    const analysis = await leaseDataAnalyzer.analyze(params.id)

    console.log("📊 [SERVER] Résultat analyse:")
    console.log("- Taux completion:", analysis.completionRate + "%")
    console.log("- Peut générer:", analysis.canGenerate)
    console.log("- Champs manquants:", analysis.missingRequired)
    console.log("- Nombre champs manquants:", analysis.missingRequired.length)

    // LOGS DÉTAILLÉS pour débugger la différence client/serveur
    console.log("🔍 [SERVER] Détail des champs obligatoires:")
    for (const [key, field] of Object.entries(analysis.availableData)) {
      if (field.required) {
        const isEmpty = !field.value || field.value === "" || field.value === null || field.value === undefined
        if (isEmpty) {
          console.log(`❌ [SERVER] Champ obligatoire manquant: ${key} = "${field.value}"`)
        } else {
          console.log(`✅ [SERVER] Champ obligatoire OK: ${key} = "${field.value}"`)
        }
      }
    }

    if (!analysis.canGenerate) {
      console.log("❌ [SERVER] Génération impossible - données obligatoires incomplètes")
      console.log("❌ [SERVER] Champs manquants détaillés:", analysis.missingRequired)

      return NextResponse.json(
        {
          success: false,
          error: "Données obligatoires incomplètes",
          missingFields: analysis.missingRequired,
          completionRate: analysis.completionRate,
          needsCompletion: true,
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
      .eq("id", params.id)
      .single()

    if (leaseError) {
      console.error("❌ [SERVER] Erreur récupération bail:", leaseError)
      throw leaseError
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
      console.error("❌ [SERVER] Détails erreur template:", {
        lease_type: lease.lease_type,
        error: templateError,
      })
      throw templateError
    }

    console.log("📄 [SERVER] Template récupéré:", template.name)

    // 4. Préparer les données pour le template
    console.log("🔧 [SERVER] Préparation des données template...")
    const templateData: Record<string, any> = {}

    for (const [key, field] of Object.entries(analysis.availableData)) {
      templateData[key] = field.value || "" // Utiliser une chaîne vide si pas de valeur
    }

    console.log("📊 [SERVER] Données template préparées:", Object.keys(templateData).length, "champs")
    console.log("🔍 [SERVER] Échantillon données:", Object.fromEntries(Object.entries(templateData).slice(0, 10)))

    // 5. Compiler le template
    console.log("🔧 [SERVER] Compilation du template...")
    const generatedDocument = compileTemplate(template.template_content, templateData)

    console.log("✅ [SERVER] Document généré, longueur:", generatedDocument.length, "caractères")

    // 6. Sauvegarder le document généré
    console.log("💾 [SERVER] Sauvegarde du document...")
    const { error: updateError } = await supabase
      .from("leases")
      .update({
        generated_document: generatedDocument,
        document_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (updateError) {
      console.error("❌ [SERVER] Erreur sauvegarde document:", updateError)
      throw updateError
    }

    console.log("✅ [SERVER] Document sauvegardé avec succès")

    return NextResponse.json({
      success: true,
      document: generatedDocument,
      template_used: template.name,
      completion_rate: analysis.completionRate,
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

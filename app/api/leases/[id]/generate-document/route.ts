import { type NextRequest, NextResponse } from "next/server"
import { leaseDataAnalyzer } from "@/lib/lease-data-analyzer"
import { supabase } from "@/lib/supabase"

// Moteur de template amélioré avec mise en forme
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
      console.log("❌ [TEMPLATE] Variable non trouvée:", key, "- utilisation placeholder")
      return `[${key.replace(/_/g, " ").toUpperCase()}]`
    }
  })

  // Remplacer les conditions {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    const value = data[key]
    return value && value !== "" && value !== "false" ? content : ""
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

// Convertir le texte en HTML avec mise en forme
function formatAsHTML(content: string): string {
  return (
    content
      // Titres principaux
      .replace(/^([A-Z\s]+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-4 text-blue-800">$1</h2>')
      // Sous-titres avec numéros
      .replace(/^([IVX]+\.\s+.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-blue-600">$1</h3>')
      // Sous-sections avec lettres
      .replace(/^([A-Z]\.\s+.+)$/gm, '<h4 class="text-base font-medium mt-3 mb-2 text-gray-800">$1</h4>')
      // Numérotation
      .replace(/^(\d+°?\s+.+)$/gm, '<h5 class="text-sm font-medium mt-2 mb-1 text-gray-700">$1</h5>')
      // Listes avec tirets
      .replace(/^-\s+(.+)$/gm, '<li class="ml-4 mb-1">• $1</li>')
      // Paragraphes
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/^(?!<[h|l])/gm, '<p class="mb-3">')
      .replace(/$/g, "</p>")
      // Nettoyage
      .replace(/<p class="mb-3"><\/p>/g, "")
      .replace(/<p class="mb-3">(<[h|l])/g, "$1")
  )
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

    // 4. Préparer les données pour le template avec valeurs par défaut
    const templateData: Record<string, any> = {}
    for (const [key, field] of Object.entries(analysis.availableData)) {
      let value = field.value || ""

      // Formatage spécial pour certains champs
      if (key.includes("date") && value && value !== "") {
        try {
          value = new Date(value).toLocaleDateString("fr-FR")
        } catch (e) {
          // Garder la valeur originale si erreur de parsing
        }
      }

      // Formatage booléens
      if (typeof value === "boolean") {
        value = value ? "Oui" : "Non"
      }

      // Formatage nombres
      if (key.includes("montant") && value && !isNaN(value)) {
        value = `${Number(value).toFixed(2)} €`
      }

      templateData[key] = value
    }

    // Ajouter des valeurs par défaut pour les champs manquants
    const defaultValues = {
      soumis_decret_evolution: "Non",
      soumis_loyer_reference: "Non",
      modalite_reglement_charges: "Forfait",
      paiement_echeance: "À terme échu",
      lieu_paiement: "Virement bancaire",
      clause_solidarite: "Applicable",
      clause_resolutoire: "Applicable",
      destination_locaux: "Usage d'habitation exclusivement",
      usage_prevu: "Résidence principale",
    }

    Object.entries(defaultValues).forEach(([key, defaultValue]) => {
      if (!templateData[key] || templateData[key] === "") {
        templateData[key] = defaultValue
      }
    })

    console.log("📊 [GENERATE] Données template préparées:", Object.keys(templateData).length, "champs")

    // 5. Compiler le template
    const generatedDocument = compileTemplate(template.template_content, templateData)
    console.log("✅ [GENERATE] Document généré, longueur:", generatedDocument.length, "caractères")

    // 6. Convertir en HTML avec mise en forme
    const formattedHTML = formatAsHTML(generatedDocument)

    // 7. Sauvegarder le document généré
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
        formattedHTML: formattedHTML,
        template: template.name,
        generatedAt: new Date().toISOString(),
      },
      analysis: {
        completionRate: analysis.completionRate,
        totalFields: Object.keys(analysis.availableData).length,
        missingFields: analysis.missingRequired,
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

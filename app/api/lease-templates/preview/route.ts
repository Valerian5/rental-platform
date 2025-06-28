import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { templateId, leaseType, formData } = await request.json()

    console.log("🔍 [PREVIEW] Génération preview pour:", { templateId, leaseType })

    // Récupérer le template
    let template
    if (templateId) {
      const { data, error } = await supabase.from("lease_templates").select("*").eq("id", templateId).single()
      if (error) throw error
      template = data
    } else if (leaseType) {
      const { data, error } = await supabase
        .from("lease_templates")
        .select("*")
        .eq("lease_type", leaseType)
        .eq("is_default", true)
        .eq("is_active", true)
        .single()
      if (error) throw error
      template = data
    } else {
      throw new Error("Template ID ou lease type requis")
    }

    if (!template) {
      throw new Error("Template non trouvé")
    }

    // Préparer les données pour le template
    const templateData = {
      // Parties
      bailleur_nom_prenom: formData.bailleur_nom_prenom || "[Nom du bailleur]",
      bailleur_domicile: formData.bailleur_domicile || "[Adresse du bailleur]",
      bailleur_email: formData.bailleur_email || "[Email du bailleur]",
      bailleur_telephone: formData.bailleur_telephone || "[Téléphone du bailleur]",
      bailleur_qualite: formData.bailleur_qualite || "Propriétaire",

      locataire_nom_prenom: formData.locataire_nom_prenom || "[Nom du locataire]",
      locataire_domicile: formData.locataire_domicile || "[Adresse du locataire]",
      locataire_email: formData.locataire_email || "[Email du locataire]",
      locataire_telephone: formData.locataire_telephone || "[Téléphone du locataire]",

      // Logement
      localisation_logement: formData.localisation_logement || "[Adresse du logement]",
      identifiant_fiscal: formData.identifiant_fiscal || "[Identifiant fiscal]",
      type_habitat: formData.type_habitat || "[Type d'habitat]",
      regime_juridique: formData.regime_juridique || "Copropriété",
      periode_construction: formData.periode_construction || "Après 1949",
      surface_habitable: formData.surface_habitable || "[Surface]",
      nombre_pieces: formData.nombre_pieces || "[Nombre de pièces]",
      niveau_performance_dpe: formData.niveau_performance_dpe || "D",

      // Financier
      montant_loyer_mensuel: formData.montant_loyer_mensuel || "[Montant du loyer]",
      montant_provisions_charges: formData.montant_provisions_charges || "[Charges]",
      montant_depot_garantie: formData.montant_depot_garantie || "[Dépôt de garantie]",
      periodicite_paiement: formData.periodicite_paiement || "Mensuelle",
      date_paiement: formData.date_paiement || "1",

      // Durée
      date_prise_effet: formData.date_prise_effet
        ? new Date(formData.date_prise_effet).toLocaleDateString("fr-FR")
        : "[Date de début]",
      duree_contrat: formData.duree_contrat || "[Durée]",
      evenement_duree_reduite: formData.evenement_duree_reduite || "",

      // Signature
      lieu_signature: formData.lieu_signature || "[Lieu de signature]",
      date_signature: formData.date_signature
        ? new Date(formData.date_signature).toLocaleDateString("fr-FR")
        : new Date().toLocaleDateString("fr-FR"),

      // Annexes
      annexe_dpe: formData.annexe_dpe ? "Oui" : "Non",
      annexe_risques: formData.annexe_risques ? "Oui" : "Non",
      annexe_notice: formData.annexe_notice ? "Oui" : "Non",
      annexe_etat_lieux: formData.annexe_etat_lieux ? "Oui" : "Non",
      annexe_reglement: formData.annexe_reglement ? "Oui" : "Non",

      // Autres
      usage_prevu: formData.usage_prevu || "résidence principale",
      conditions_particulieres: formData.special_conditions || formData.conditions_particulieres || "",
    }

    // Compiler le template
    let compiledContent = template.template_content

    // Remplacer les variables simples {{variable}}
    compiledContent = compiledContent.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = templateData[key]
      return value !== undefined && value !== null && value !== "" ? String(value) : match
    })

    // Remplacer les conditions {{#if variable}}...{{/if}}
    compiledContent = compiledContent.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
      const value = templateData[key]
      return value && value !== "" && value !== "Non" ? content : ""
    })

    // Convertir en HTML avec mise en forme
    const htmlContent = compiledContent
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>")
      .replace(/^/, "<p>")
      .replace(/$/, "</p>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")

    return NextResponse.json({
      success: true,
      preview: htmlContent,
      template: {
        id: template.id,
        name: template.name,
        type: template.lease_type,
      },
    })
  } catch (error) {
    console.error("❌ [PREVIEW] Erreur:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la génération de la prévisualisation",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

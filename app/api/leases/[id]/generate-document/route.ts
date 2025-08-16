import { type NextRequest, NextResponse } from "next/server"
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

// Fonction utilitaire pour parser les données JSON de manière sécurisée
function safeParseJSON(value: any, defaultValue: any = null): any {
  if (value === null || value === undefined) {
    return defaultValue
  }

  // Si c'est déjà un objet/array, le retourner directement
  if (typeof value === "object") {
    return value
  }

  // Si c'est une chaîne, essayer de la parser
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch (error) {
      console.log("⚠️ [PARSE] Impossible de parser JSON:", value, "- utilisation valeur par défaut")
      return defaultValue
    }
  }

  return defaultValue
}

// Fonction utilitaire pour formater les listes
function formatList(items: any, separator = ", "): string {
  if (!items) return ""

  // Si c'est déjà un array
  if (Array.isArray(items)) {
    return items.filter(Boolean).join(separator)
  }

  // Si c'est une chaîne JSON
  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items)
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).join(separator)
      }
    } catch (error) {
      // Si ce n'est pas du JSON, traiter comme une chaîne simple
      return items
    }
  }

  return String(items)
}

// Fonction pour formater les équipements avec détails
function formatEquipments(types: any, details: any = {}, autres = ""): string {
  let typesList: string[] = []

  // Parser les types
  if (Array.isArray(types)) {
    typesList = types
  } else if (typeof types === "string") {
    try {
      const parsed = JSON.parse(types)
      typesList = Array.isArray(parsed) ? parsed : []
    } catch (error) {
      typesList = types ? [types] : []
    }
  }

  if (typesList.length === 0) return ""

  const list = typesList
    .map((type) => {
      if (type === "cave" && details?.cave_numero) return `Cave (n° ${details.cave_numero})`
      if (type === "parking" && details?.parking_numero) return `Parking (n° ${details.parking_numero})`
      if (type === "garage" && details?.garage_numero) return `Garage (n° ${details.garage_numero})`
      if (type !== "autres") return type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")
      return null
    })
    .filter(Boolean)

  if (typesList.includes("autres") && autres) {
    list.push(autres)
  }

  return list.join(", ")
}

// Fonction pour récupérer les données du dossier de location
async function getRentalFileData(tenantId: string) {
  try {
    console.log("📋 [RENTAL_FILE] Récupération dossier pour tenant:", tenantId)

    const { data: rentalFile, error } = await supabase
      .from("rental_files")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()

    if (error) {
      console.log("⚠️ [RENTAL_FILE] Pas de dossier trouvé:", error.message)
      return null
    }

    console.log("✅ [RENTAL_FILE] Dossier récupéré:", {
      id: rentalFile.id,
      rental_situation: rentalFile.rental_situation,
      cotenants_count: rentalFile.cotenants?.length || 0,
      guarantors_count: rentalFile.guarantors?.length || 0,
    })

    return rentalFile
  } catch (error) {
    console.error("❌ [RENTAL_FILE] Erreur récupération:", error)
    return null
  }
}

// Fonction pour formater les informations des colocataires/conjoints
function formatCotenants(cotenants: any[], rentalSituation: string): string {
  if (!cotenants || cotenants.length === 0) return ""

  const label = rentalSituation === "couple" ? "conjoint(e)" : "colocataire"

  return cotenants
    .map((cotenant, index) => {
      const name = `${cotenant.first_name || ""} ${cotenant.last_name || ""}`.trim()
      const birthDate = cotenant.birth_date ? new Date(cotenant.birth_date).toLocaleDateString("fr-FR") : ""
      const birthPlace = cotenant.birth_place || ""
      const nationality = cotenant.nationality || ""
      const profession = cotenant.profession || ""
      const activity = cotenant.main_activity || ""
      const income = cotenant.income_sources?.work_income?.amount || 0

      let cotenantInfo = `${label} ${index + 1}: ${name}`
      if (birthDate) cotenantInfo += `, né(e) le ${birthDate}`
      if (birthPlace) cotenantInfo += ` à ${birthPlace}`
      if (nationality) cotenantInfo += `, de nationalité ${nationality}`
      if (profession) cotenantInfo += `, profession: ${profession}`
      if (activity) cotenantInfo += ` (${activity})`
      if (income > 0) cotenantInfo += `, revenus: ${income.toLocaleString("fr-FR")} €/mois`

      return cotenantInfo
    })
    .join(";\n")
}

// Fonction pour calculer les revenus totaux
function calculateTotalIncome(mainTenant: any, cotenants: any[]): number {
  let total = 0

  // Revenus du locataire principal
  if (mainTenant?.income_sources?.work_income?.amount) {
    total += Number(mainTenant.income_sources.work_income.amount)
  }

  // Revenus des colocataires/conjoints
  if (cotenants && cotenants.length > 0) {
    cotenants.forEach((cotenant) => {
      if (cotenant.income_sources?.work_income?.amount) {
        total += Number(cotenant.income_sources.work_income.amount)
      }
    })
  }

  return total
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leaseId = params.id
    console.log("🚀 [GENERATE] Génération document pour bail:", leaseId)

    // 1. Récupérer le bail complet avec toutes les données
    const { data: lease, error: leaseError } = await supabase.from("leases").select("*").eq("id", leaseId).single()

    if (leaseError) {
      console.error("❌ [GENERATE] Erreur récupération bail:", leaseError)
      return NextResponse.json({ success: false, error: "Bail non trouvé" }, { status: 404 })
    }

    console.log("📋 [GENERATE] Bail récupéré:", lease.id, "- Type:", lease.lease_type)

    // 2. Récupérer le dossier de location pour les informations des colocataires/conjoints
    let rentalFile = null
    if (lease.tenant_id) {
      rentalFile = await getRentalFileData(lease.tenant_id)
    }

    // 3. Vérifier que les données essentielles sont présentes
    const requiredFields = [
      "bailleur_nom_prenom",
      "locataire_nom_prenom",
      "adresse_logement",
      "montant_loyer_mensuel",
      "date_prise_effet",
      "duree_contrat",
    ]

    const missingFields = requiredFields.filter((field) => !lease[field])

    if (missingFields.length > 0) {
      console.log("❌ [GENERATE] Champs manquants:", missingFields)
      return NextResponse.json(
        {
          success: false,
          error: "Données obligatoires incomplètes",
          missingFields: missingFields,
          completionRate: Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100),
          redirectTo: `/owner/leases/${leaseId}/complete-data`,
        },
        { status: 400 },
      )
    }

    // 4. Récupérer le template approprié
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

    // 5. Préparer les données pour le template avec parsing sécurisé
    const metadata = safeParseJSON(lease.metadata, {})
    const locataires = safeParseJSON(metadata.locataires, [])
    const garants = safeParseJSON(metadata.garants, [])
    const clauses = safeParseJSON(metadata.clauses, {})

    // Données des colocataires/conjoints depuis le dossier de location
    const cotenants = rentalFile?.cotenants || []
    const mainTenant = rentalFile?.main_tenant || {}
    const rentalSituation = rentalFile?.rental_situation || "alone"

    // Calculer les revenus totaux
    const totalIncome = calculateTotalIncome(mainTenant, cotenants)

    console.log("👥 [GENERATE] Situation de location:", {
      rental_situation: rentalSituation,
      cotenants_count: cotenants.length,
      total_income: totalIncome,
    })

    const templateData: Record<string, any> = {
      // === PARTIES ===
      bailleur_nom_prenom: lease.bailleur_nom_prenom || "[Nom du bailleur]",
      bailleur_domicile: lease.bailleur_domicile || "[Adresse du bailleur]",
      bailleur_qualite: lease.bailleur_qualite || "Particulier",
      bailleur_email: lease.bailleur_email || "[Email du bailleur]",
      bailleur_telephone: lease.bailleur_telephone || "[Téléphone du bailleur]",

      // Mandataire
      mandataire_nom: lease.mandataire_represente ? lease.mandataire_nom || "" : "",
      mandataire_adresse: lease.mandataire_represente ? lease.mandataire_adresse || "" : "",
      mandataire_activite: lease.mandataire_represente ? lease.mandataire_activite || "" : "",
      mandataire_carte_pro: lease.mandataire_represente ? lease.mandataire_carte_pro || "" : "",

      // SCI
      sci_denomination: lease.sci_denomination || "",
      sci_mandataire_nom: lease.sci_mandataire_nom || "",
      sci_mandataire_adresse: lease.sci_mandataire_adresse || "",

      // Personne morale
      personne_morale_denomination: lease.personne_morale_denomination || "",
      personne_morale_mandataire_nom: lease.personne_morale_mandataire_nom || "",
      personne_morale_mandataire_adresse: lease.personne_morale_mandataire_adresse || "",

      // === LOCATAIRES ===
      nom_locataire: lease.locataire_nom_prenom || "[Nom du locataire]",
      locataire_nom_prenom: lease.locataire_nom_prenom || "[Nom du locataire]",
      locataire_email: lease.locataire_email || "[Email du locataire]",
      telephone_locataire: lease.telephone_locataire || "",
      locataire_domicile: lease.locataire_domicile || "",

      // Informations détaillées du locataire principal depuis le dossier
      locataire_date_naissance: mainTenant.birth_date
        ? new Date(mainTenant.birth_date).toLocaleDateString("fr-FR")
        : "",
      locataire_lieu_naissance: mainTenant.birth_place || "",
      locataire_nationalite: mainTenant.nationality || "",
      locataire_profession: mainTenant.profession || "",
      locataire_activite: mainTenant.main_activity || "",
      locataire_revenus: mainTenant.income_sources?.work_income?.amount || 0,

      // Situation de location
      situation_location:
        rentalSituation === "alone"
          ? "Seul(e)"
          : rentalSituation === "couple"
            ? "En couple"
            : rentalSituation === "colocation"
              ? "En colocation"
              : "Non spécifié",

      // Colocataires/Conjoints
      colocataires_conjoints: formatCotenants(cotenants, rentalSituation),
      nombre_colocataires: cotenants.length,
      revenus_totaux: totalIncome,

      // Liste formatée pour les templates
      locataires_list: (() => {
        const list = []

        // Locataire principal
        if (lease.locataire_nom_prenom) {
          list.push(`${lease.locataire_nom_prenom} - ${lease.locataire_email || ""}`)
        }

        // Colocataires/Conjoints
        cotenants.forEach((cotenant: any, index: number) => {
          const name = `${cotenant.first_name || ""} ${cotenant.last_name || ""}`.trim()
          const email = cotenant.email || ""
          const label = rentalSituation === "couple" ? "Conjoint(e)" : `Colocataire ${index + 1}`
          list.push(`${name} (${label}) - ${email}`)
        })

        return list.length > 0 ? list.join("<br/>") : "[Aucun locataire]"
      })(),

      // === LOGEMENT ===
      localisation_logement:
        [lease.adresse_logement, lease.complement_adresse].filter(Boolean).join(", ") || "[Adresse du logement]",
      identifiant_fiscal: lease.identifiant_fiscal || "",
      type_habitat: lease.type_habitat || "",
      regime_juridique: lease.regime_juridique || "",
      periode_construction: lease.periode_construction || "",
      surface_habitable: lease.surface_habitable || "",
      nombre_pieces: lease.nombre_pieces || "",

      // Équipements et locaux avec parsing sécurisé
      locaux_accessoires: formatEquipments(
        lease.locaux_privatifs_types,
        {
          cave_numero: lease.cave_numero,
          parking_numero: lease.parking_numero,
          garage_numero: lease.garage_numero,
        },
        lease.locaux_privatifs_autres,
      ),
      locaux_communs: formatEquipments(lease.locaux_communs_types, {}, lease.locaux_communs_autres),
      autres_parties: formatEquipments(lease.autres_parties_types, {}, lease.autres_parties_autres),
      elements_equipements: formatEquipments(lease.equipements_logement_types, {}, lease.equipements_logement_autres),
      equipement_technologies: formatList(lease.equipement_technologies_types),

      modalite_chauffage: lease.production_chauffage === "collectif" ? "Collectif" : "Individuel",
      modalite_eau_chaude: lease.production_eau_chaude === "collective" ? "Collective" : "Individuelle",
      niveau_performance_dpe: lease.performance_dpe || "",
      destination_locaux: lease.destination_locaux || "",

      // === DATES ET DURÉE ===
      date_prise_effet: lease.date_prise_effet
        ? new Date(lease.date_prise_effet).toLocaleDateString("fr-FR")
        : "[Date début]",
      duree_contrat: lease.duree_contrat || "",
      evenement_duree_reduite: lease.raison_duree_reduite || "",

      // === CONDITIONS FINANCIÈRES ===
      montant_loyer_mensuel: lease.montant_loyer_mensuel || "",
      soumis_loyer_reference: lease.zone_encadree ? "Oui" : "Non",
      montant_loyer_reference: lease.loyer_reference || "",
      montant_loyer_reference_majore: lease.loyer_reference_majore || "",
      complement_loyer: lease.complement_loyer || "",
      complement_loyer_justification: lease.complement_loyer_justification || "",

      date_revision:
        lease.date_revision_loyer === "autre" ? lease.date_revision_personnalisee : lease.date_revision_loyer || "",
      date_reference_irl: lease.trimestre_reference_irl || "",
      soumis_decret_evolution_loyers: lease.soumis_decret_evolution || "Non",

      // Ancien loyer
      montant_dernier_loyer: lease.dernier_loyer_ancien || "",
      date_dernier_loyer: lease.date_dernier_loyer
        ? new Date(lease.date_dernier_loyer).toLocaleDateString("fr-FR")
        : "",
      date_derniere_revision: lease.date_revision_dernier_loyer
        ? new Date(lease.date_revision_dernier_loyer).toLocaleDateString("fr-FR")
        : "",

      // Charges
      modalite_reglement_charges: lease.modalite_reglement_charges || lease.type_charges || "",
      montant_provisions_charges: lease.montant_provisions_charges || lease.montant_charges || "",
      modalites_revision_forfait: lease.modalite_revision_forfait || "",

      // Assurance colocation
      assurance_colocataires: lease.assurance_colocataires ? "Oui" : "Non",
      assurance_montant: lease.assurance_montant || "",
      assurance_montant_mensuel:
        lease.assurance_montant && lease.assurance_frequence === "annuel"
          ? (Number(lease.assurance_montant) / 12).toFixed(2)
          : lease.assurance_montant || "",

      // Modalités de paiement
      periodicite_paiement: "Mensuel",
      paiement_echeance: lease.paiement_echeance || (lease.paiement_avance ? "À échoir" : "À terme échu"),
      date_paiement: lease.date_paiement || `le ${lease.jour_paiement_loyer || "1"} de chaque mois`,
      lieu_paiement: lease.lieu_paiement || "Virement bancaire",

      // Total loyer avec revenus totaux pour le ratio
      montant_total_loyer: (() => {
        const loyer = Number(lease.montant_loyer_mensuel) || 0
        const charges = Number(lease.montant_charges) || 0
        return (loyer + charges).toFixed(2) + " €"
      })(),

      // Ratio revenus/loyer avec revenus totaux
      ratio_revenus_loyer: (() => {
        const loyer = Number(lease.montant_loyer_mensuel) || 0
        if (totalIncome > 0 && loyer > 0) {
          return (totalIncome / loyer).toFixed(1) + "x"
        }
        return "N/A"
      })(),

      // Dépenses énergie
      montant_depenses_energie:
        lease.estimation_depenses_energie_min && lease.estimation_depenses_energie_max
          ? `${lease.estimation_depenses_energie_min} - ${lease.estimation_depenses_energie_max} €/an`
          : "",
      annee_reference_energie: lease.annee_reference_energie || "",

      // === GARANTIES ===
      depot_garantie: lease.depot_garantie || "",
      montant_depot_garantie: lease.montant_depot_garantie || lease.depot_garantie || "",

      // === CLAUSES ===
      clause_resolutoire: clauses.clause_resolutoire?.enabled ? clauses.clause_resolutoire.text : "",
      clause_solidarite: clauses.clause_solidarite?.enabled ? clauses.clause_solidarite.text : "",
      visites_relouer_vendre: clauses.visites_relouer_vendre?.enabled ? clauses.visites_relouer_vendre.text : "",
      mode_paiement_loyer: clauses.mode_paiement_loyer?.enabled ? clauses.mode_paiement_loyer.text : "",
      mise_disposition_meubles: clauses.mise_disposition_meubles?.enabled
        ? clauses.mise_disposition_meubles.text
        : lease.mise_disposition_meubles || "",
      animaux_domestiques: clauses.animaux_domestiques?.enabled ? clauses.animaux_domestiques.text : "",
      assurance_habitation_locataire: clauses.assurance_habitation_locataire?.enabled
        ? clauses.assurance_habitation_locataire.text
        : "",
      entretien_annuel_appareils: clauses.entretien_annuel_appareils?.enabled
        ? clauses.entretien_annuel_appareils.text
        : "",
      degradations_locataire: clauses.degradations_locataire?.enabled ? clauses.degradations_locataire.text : "",
      renonciation_regularisation: clauses.renonciation_regularisation?.enabled
        ? clauses.renonciation_regularisation.text
        : "",
      travaux_bailleur: clauses.travaux_bailleur?.enabled ? clauses.travaux_bailleur.text : "",
      travaux_locataire: clauses.travaux_locataire?.enabled ? clauses.travaux_locataire.text : "",
      travaux_entre_locataires: clauses.travaux_entre_locataires?.enabled ? clauses.travaux_entre_locataires.text : "",

      // === HONORAIRES ===
      montant_plafond_honoraires: lease.plafond_honoraires_locataire || "",
      honoraires_locataire: lease.honoraires_locataire_visite || "",
      honoraires_bailleur: lease.honoraires_bailleur_visite || "",
      plafond_honoraires_etat_lieux: lease.plafond_honoraires_etat_lieux || "",
      honoraires_etat_lieux_bailleur: lease.honoraires_bailleur_etat_lieux || "",
      honoraires_etat_lieux_locataire: lease.honoraires_locataire_etat_lieux || "",
      autres_prestations: lease.autres_prestations === "true" ? "Oui" : "Non",
      details_autres_prestations: lease.details_autres_prestations || "",
      honoraires_autres_prestations: lease.honoraires_autres_prestations || "",

      // === SIGNATURE ===
      date_signature: new Date().toLocaleDateString("fr-FR"),
      lieu_signature: lease.lieu_signature || "",

      // === USAGE ===
      usage_prevu: lease.usage_prevu || "résidence principale",
    }

    console.log("📊 [GENERATE] Données template préparées:", Object.keys(templateData).length, "champs")
    console.log("👥 [GENERATE] Données colocataires/conjoints:", {
      situation: templateData.situation_location,
      nombre: templateData.nombre_colocataires,
      revenus_totaux: templateData.revenus_totaux,
      ratio: templateData.ratio_revenus_loyer,
    })

    // 6. Compiler le template
    const generatedDocument = compileTemplate(template.template_content, templateData)
    console.log("✅ [GENERATE] Document généré, longueur:", generatedDocument.length, "caractères")

    // 7. Convertir en HTML avec mise en forme
    const formattedHTML = formatAsHTML(generatedDocument)

    // 8. Sauvegarder le document généré
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
        completionRate: 100,
        totalFields: Object.keys(templateData).length,
        missingFields: [],
        rentalSituation: {
          type: rentalSituation,
          cotenants_count: cotenants.length,
          total_income: totalIncome,
        },
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

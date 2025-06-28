import { supabase } from "./supabase"

export interface FieldMapping {
  key: string
  label: string
  value: any
  source: "auto" | "manual" | "missing"
  required: boolean
  type: "text" | "number" | "date" | "email" | "select" | "textarea" | "boolean"
  category: "parties" | "logement" | "financier" | "duree" | "annexes" | "conditions" | "travaux"
  options?: string[]
  description?: string
}

export interface LeaseAnalysis {
  leaseId: string
  availableData: Record<string, FieldMapping>
  missingRequired: string[]
  completionRate: number
  canGenerate: boolean
}

class LeaseDataAnalyzer {
  // Définition COMPLÈTE des champs basée sur le template officiel
  private fieldDefinitions: Record<string, Omit<FieldMapping, "value" | "source">> = {
    // === PARTIES ===
    bailleur_nom_prenom: {
      key: "bailleur_nom_prenom",
      label: "Nom et prénom du bailleur",
      required: true,
      type: "text",
      category: "parties",
    },
    bailleur_domicile: {
      key: "bailleur_domicile",
      label: "Domicile du bailleur",
      required: true,
      type: "textarea",
      category: "parties",
    },
    bailleur_email: {
      key: "bailleur_email",
      label: "Email du bailleur",
      required: true,
      type: "email",
      category: "parties",
    },
    bailleur_qualite: {
      key: "bailleur_qualite",
      label: "Qualité du bailleur",
      required: false,
      type: "select",
      category: "parties",
      options: ["Propriétaire", "Mandataire", "Gérant"],
    },
    locataire_nom_prenom: {
      key: "locataire_nom_prenom",
      label: "Nom et prénom du locataire",
      required: true,
      type: "text",
      category: "parties",
    },
    locataire_email: {
      key: "locataire_email",
      label: "Email du locataire",
      required: true,
      type: "email",
      category: "parties",
    },

    // === LOGEMENT ===
    localisation_logement: {
      key: "localisation_logement",
      label: "Localisation du logement",
      required: true,
      type: "text",
      category: "logement",
    },
    identifiant_fiscal: {
      key: "identifiant_fiscal",
      label: "Identifiant fiscal du logement",
      required: false,
      type: "text",
      category: "logement",
    },
    type_habitat: {
      key: "type_habitat",
      label: "Type d'habitat",
      required: true,
      type: "select",
      category: "logement",
      options: ["Appartement", "Maison", "Studio", "Chambre"],
    },
    regime_juridique: {
      key: "regime_juridique",
      label: "Régime juridique de l'immeuble",
      required: false,
      type: "select",
      category: "logement",
      options: ["Copropriété", "Monopropriété"],
    },
    periode_construction: {
      key: "periode_construction",
      label: "Période de construction",
      required: false,
      type: "select",
      category: "logement",
      options: ["Avant 1949", "1949-1974", "1975-1989", "1990-2005", "Après 2005"],
    },
    surface_habitable: {
      key: "surface_habitable",
      label: "Surface habitable (m²)",
      required: true,
      type: "number",
      category: "logement",
    },
    nombre_pieces: {
      key: "nombre_pieces",
      label: "Nombre de pièces principales",
      required: true,
      type: "number",
      category: "logement",
    },
    autres_parties: {
      key: "autres_parties",
      label: "Autres parties du logement",
      required: false,
      type: "textarea",
      category: "logement",
    },
    elements_equipements: {
      key: "elements_equipements",
      label: "Éléments d'équipements du logement",
      required: false,
      type: "textarea",
      category: "logement",
    },
    modalite_chauffage: {
      key: "modalite_chauffage",
      label: "Modalité de production de chauffage",
      required: false,
      type: "text",
      category: "logement",
    },
    modalite_eau_chaude: {
      key: "modalite_eau_chaude",
      label: "Modalité de production d'eau chaude sanitaire",
      required: false,
      type: "text",
      category: "logement",
    },
    niveau_performance_dpe: {
      key: "niveau_performance_dpe",
      label: "Niveau de performance du logement (DPE)",
      required: false,
      type: "select",
      category: "logement",
      options: ["A", "B", "C", "D", "E", "F", "G"],
    },
    destination_locaux: {
      key: "destination_locaux",
      label: "Destination des locaux",
      required: false,
      type: "text",
      category: "logement",
    },
    locaux_accessoires: {
      key: "locaux_accessoires",
      label: "Locaux et équipements accessoires à usage privatif",
      required: false,
      type: "textarea",
      category: "logement",
    },
    locaux_communs: {
      key: "locaux_communs",
      label: "Locaux, parties, équipements et accessoires à usage commun",
      required: false,
      type: "textarea",
      category: "logement",
    },
    equipement_technologies: {
      key: "equipement_technologies",
      label: "Équipement d'accès aux technologies de l'information",
      required: false,
      type: "textarea",
      category: "logement",
    },

    // === CONDITIONS FINANCIÈRES ===
    montant_loyer_mensuel: {
      key: "montant_loyer_mensuel",
      label: "Montant du loyer mensuel (€)",
      required: true,
      type: "number",
      category: "financier",
    },
    soumis_decret_evolution: {
      key: "soumis_decret_evolution",
      label: "Soumis au décret d'évolution des loyers",
      required: false,
      type: "select",
      category: "financier",
      options: ["Oui", "Non"],
    },
    soumis_loyer_reference: {
      key: "soumis_loyer_reference",
      label: "Soumis au loyer de référence majoré",
      required: false,
      type: "select",
      category: "financier",
      options: ["Oui", "Non"],
    },
    montant_provisions_charges: {
      key: "montant_provisions_charges",
      label: "Provisions pour charges (€)",
      required: true,
      type: "number",
      category: "financier",
    },
    modalite_reglement_charges: {
      key: "modalite_reglement_charges",
      label: "Modalité de règlement des charges",
      required: false,
      type: "select",
      category: "financier",
      options: ["Forfait", "Provisions avec régularisation"],
    },
    montant_depot_garantie: {
      key: "montant_depot_garantie",
      label: "Dépôt de garantie (€)",
      required: true,
      type: "number",
      category: "financier",
    },
    periodicite_paiement: {
      key: "periodicite_paiement",
      label: "Périodicité du paiement",
      required: false,
      type: "select",
      category: "financier",
      options: ["Mensuelle", "Trimestrielle"],
    },
    paiement_echeance: {
      key: "paiement_echeance",
      label: "Paiement à échoir/terme échu",
      required: false,
      type: "select",
      category: "financier",
      options: ["À échoir", "À terme échu"],
    },
    date_paiement: {
      key: "date_paiement",
      label: "Date de paiement",
      required: false,
      type: "text",
      category: "financier",
    },
    lieu_paiement: {
      key: "lieu_paiement",
      label: "Lieu de paiement",
      required: false,
      type: "text",
      category: "financier",
    },
    montant_depenses_energie: {
      key: "montant_depenses_energie",
      label: "Montant estimé des dépenses annuelles d'énergie",
      required: false,
      type: "text",
      category: "financier",
    },

    // === DURÉE ===
    date_prise_effet: {
      key: "date_prise_effet",
      label: "Date de prise d'effet",
      required: true,
      type: "date",
      category: "duree",
    },
    duree_contrat: {
      key: "duree_contrat",
      label: "Durée du contrat (mois)",
      required: true,
      type: "number",
      category: "duree",
    },
    evenement_duree_reduite: {
      key: "evenement_duree_reduite",
      label: "Événement justifiant une durée réduite",
      required: false,
      type: "textarea",
      category: "duree",
    },

    // === TRAVAUX ===
    montant_travaux_amelioration: {
      key: "montant_travaux_amelioration",
      label: "Montant et nature des travaux d'amélioration",
      required: false,
      type: "textarea",
      category: "travaux",
    },

    // === CONDITIONS PARTICULIÈRES ===
    clause_solidarite: {
      key: "clause_solidarite",
      label: "Clause de solidarité",
      required: false,
      type: "select",
      category: "conditions",
      options: ["Applicable", "Non applicable"],
    },
    clause_resolutoire: {
      key: "clause_resolutoire",
      label: "Clause résolutoire",
      required: false,
      type: "select",
      category: "conditions",
      options: ["Applicable", "Non applicable"],
    },
    usage_prevu: {
      key: "usage_prevu",
      label: "Usage prévu",
      required: false,
      type: "text",
      category: "conditions",
    },

    // === HONORAIRES ===
    honoraires_locataire: {
      key: "honoraires_locataire",
      label: "Honoraires à la charge du locataire",
      required: false,
      type: "text",
      category: "financier",
    },
    plafond_honoraires_etat_lieux: {
      key: "plafond_honoraires_etat_lieux",
      label: "Plafond honoraires état des lieux",
      required: false,
      type: "text",
      category: "financier",
    },

    // === SIGNATURE ===
    lieu_signature: {
      key: "lieu_signature",
      label: "Lieu de signature",
      required: true,
      type: "text",
      category: "annexes",
    },
    date_signature: {
      key: "date_signature",
      label: "Date de signature",
      required: false,
      type: "date",
      category: "annexes",
    },

    // === ANNEXES ===
    annexe_dpe: {
      key: "annexe_dpe",
      label: "Annexe DPE",
      required: false,
      type: "boolean",
      category: "annexes",
    },
    annexe_risques: {
      key: "annexe_risques",
      label: "Annexe état des risques",
      required: false,
      type: "boolean",
      category: "annexes",
    },
    annexe_notice: {
      key: "annexe_notice",
      label: "Annexe notice d'information",
      required: false,
      type: "boolean",
      category: "annexes",
    },
    annexe_etat_lieux: {
      key: "annexe_etat_lieux",
      label: "Annexe état des lieux",
      required: false,
      type: "boolean",
      category: "annexes",
    },
    annexe_reglement: {
      key: "annexe_reglement",
      label: "Annexe règlement de copropriété",
      required: false,
      type: "boolean",
      category: "annexes",
    },
    annexe_plomb: {
      key: "annexe_plomb",
      label: "Annexe constat plomb",
      required: false,
      type: "boolean",
      category: "annexes",
    },
    annexe_amiante: {
      key: "annexe_amiante",
      label: "Annexe état amiante",
      required: false,
      type: "boolean",
      category: "annexes",
    },
    annexe_electricite_gaz: {
      key: "annexe_electricite_gaz",
      label: "Annexe état installation électricité/gaz",
      required: false,
      type: "boolean",
      category: "annexes",
    },
  }

  async analyze(leaseId: string): Promise<LeaseAnalysis> {
    try {
      console.log("🔍 [ANALYZER] Analyse des données pour bail:", leaseId)

      // Récupérer le bail avec toutes les relations
      const { data: lease, error: leaseError } = await supabase
        .from("leases")
        .select(`
          *,
          property:properties(*),
          tenant:users!leases_tenant_id_fkey(*),
          owner:users!leases_owner_id_fkey(*)
        `)
        .eq("id", leaseId)
        .single()

      if (leaseError) {
        console.error("❌ [ANALYZER] Erreur récupération bail:", leaseError)
        throw leaseError
      }

      console.log("📋 [ANALYZER] Bail récupéré:", lease.id)

      // Mapper les données automatiques
      const autoData = this.mapAutomaticData(lease)
      console.log("🤖 [ANALYZER] Données automatiques mappées:", Object.keys(autoData).length, "champs")

      // Construire l'analyse complète
      const availableData: Record<string, FieldMapping> = {}
      const missingRequired: string[] = []

      for (const [key, definition] of Object.entries(this.fieldDefinitions)) {
        // Priorité : valeur en DB > valeur automatique > vide
        const dbValue = lease[key]
        const autoValue = autoData[key]

        let value = dbValue || autoValue || ""
        let source: "auto" | "manual" | "missing" = "missing"

        if (dbValue !== undefined && dbValue !== null && dbValue !== "") {
          source = "manual"
          value = dbValue
        } else if (autoValue !== undefined && autoValue !== null && autoValue !== "") {
          source = "auto"
          value = autoValue
        }

        availableData[key] = {
          ...definition,
          value,
          source,
        }

        // Vérifier les champs obligatoires
        const isEmpty = !value || value === "" || value === null || value === undefined
        if (definition.required && isEmpty) {
          console.log(`❌ [ANALYZER] Champ obligatoire manquant: ${key}`)
          missingRequired.push(key)
        } else if (definition.required) {
          console.log(`✅ [ANALYZER] Champ obligatoire OK: ${key} = ${value}`)
        }
      }

      const totalRequiredFields = Object.values(this.fieldDefinitions).filter((f) => f.required).length
      const completedRequiredFields = totalRequiredFields - missingRequired.length
      const completionRate =
        totalRequiredFields > 0 ? Math.round((completedRequiredFields / totalRequiredFields) * 100) : 100

      console.log(
        `📊 [ANALYZER] Analyse terminée: ${completedRequiredFields}/${totalRequiredFields} champs obligatoires (${completionRate}%)`,
      )
      console.log("❌ [ANALYZER] Champs manquants:", missingRequired)

      return {
        leaseId,
        availableData,
        missingRequired,
        completionRate,
        canGenerate: missingRequired.length === 0,
      }
    } catch (error) {
      console.error("❌ [ANALYZER] Erreur analyse:", error)
      throw error
    }
  }

  private mapAutomaticData(lease: any): Record<string, any> {
    const data: Record<string, any> = {}

    try {
      console.log("🗺️ [ANALYZER] Mapping automatique des données...")

      // === PARTIES ===
      if (lease.owner?.first_name && lease.owner?.last_name) {
        data.bailleur_nom_prenom = `${lease.owner.first_name} ${lease.owner.last_name}`
      }
      if (lease.tenant?.first_name && lease.tenant?.last_name) {
        data.locataire_nom_prenom = `${lease.tenant.first_name} ${lease.tenant.last_name}`
      }

      data.bailleur_domicile = lease.owner?.address || ""
      data.bailleur_email = lease.owner?.email || ""
      data.locataire_email = lease.tenant?.email || ""
      data.bailleur_qualite = "Propriétaire"

      // === LOGEMENT ===
      data.localisation_logement = lease.property?.address || ""

      const propertyType = lease.property?.property_type || ""
      if (propertyType.toLowerCase().includes("apartment")) {
        data.type_habitat = "Appartement"
      } else if (propertyType.toLowerCase().includes("house")) {
        data.type_habitat = "Maison"
      } else if (propertyType.toLowerCase().includes("studio")) {
        data.type_habitat = "Studio"
      } else if (propertyType.toLowerCase().includes("room")) {
        data.type_habitat = "Chambre"
      } else {
        data.type_habitat = propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
      }

      data.surface_habitable = lease.property?.surface || ""
      data.nombre_pieces = lease.property?.rooms || ""
      data.regime_juridique = "Copropriété"
      data.periode_construction = "Après 1949"
      data.niveau_performance_dpe = "D"
      data.destination_locaux = "Usage d'habitation exclusivement"

      // === FINANCIER ===
      data.montant_loyer_mensuel = lease.monthly_rent || ""
      data.montant_provisions_charges = lease.charges || 0
      data.montant_depot_garantie = lease.deposit_amount || ""
      data.periodicite_paiement = "Mensuelle"
      data.paiement_echeance = "À terme échu"
      data.date_paiement = "1"
      data.lieu_paiement = "Virement bancaire"
      data.soumis_decret_evolution = "Non"
      data.soumis_loyer_reference = "Non"
      data.modalite_reglement_charges = "Forfait"

      // === DURÉE ===
      data.date_prise_effet = lease.start_date ? this.formatDateForInput(lease.start_date) : ""

      // Calculer la durée en mois
      if (lease.start_date && lease.end_date) {
        const startDate = new Date(lease.start_date)
        const endDate = new Date(lease.end_date)
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44))
        data.duree_contrat = diffMonths
      } else {
        data.duree_contrat = lease.lease_type === "furnished" ? 12 : 36
      }

      // === CONDITIONS ===
      data.clause_solidarite = "Applicable"
      data.clause_resolutoire = "Applicable"
      data.usage_prevu = "Résidence principale"

      // === SIGNATURE ===
      data.lieu_signature = lease.property?.city || ""
      data.date_signature = new Date().toISOString().split("T")[0]

      // === ANNEXES ===
      data.annexe_dpe = true
      data.annexe_risques = true
      data.annexe_notice = true

      return data
    } catch (error) {
      console.error("❌ [ANALYZER] Erreur mapping automatique:", error)
      return data
    }
  }

  private formatDateForInput(dateString: string): string {
    try {
      return new Date(dateString).toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  async saveCompletedData(leaseId: string, fieldName: string, fieldValue: any, source: "manual" = "manual") {
    try {
      console.log("💾 [ANALYZER] Sauvegarde:", fieldName, "=", fieldValue)

      const updateData: Record<string, any> = {
        [fieldName]: fieldValue,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("leases").update(updateData).eq("id", leaseId)

      if (error) {
        console.error("❌ [ANALYZER] Erreur sauvegarde:", error)
        throw error
      }

      console.log("✅ [ANALYZER] Sauvegarde réussie")
    } catch (error) {
      console.error("❌ [ANALYZER] Erreur sauvegarde:", error)
      throw error
    }
  }

  getFieldsByCategory(availableData: Record<string, FieldMapping>) {
    const categories = {
      parties: [] as FieldMapping[],
      logement: [] as FieldMapping[],
      financier: [] as FieldMapping[],
      duree: [] as FieldMapping[],
      travaux: [] as FieldMapping[],
      conditions: [] as FieldMapping[],
      annexes: [] as FieldMapping[],
    }

    for (const field of Object.values(availableData)) {
      categories[field.category].push(field)
    }

    return categories
  }
}

export const leaseDataAnalyzer = new LeaseDataAnalyzer()

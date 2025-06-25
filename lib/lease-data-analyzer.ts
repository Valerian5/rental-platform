import { supabase } from "./supabase"

export interface FieldMapping {
  key: string
  label: string
  value: any
  source: "auto" | "manual" | "missing"
  required: boolean
  type: "text" | "number" | "date" | "email" | "select" | "textarea"
  category: "parties" | "logement" | "financier" | "duree" | "annexes"
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
  // Harmonisation : Ajout des alias pour compatibilité avec les anciens templates
  private fieldDefinitions: Record<string, Omit<FieldMapping, "value" | "source">> = {
    // === PARTIES ===
    nom_bailleur: {
      key: "nom_bailleur",
      label: "Nom et prénom du bailleur",
      required: true,
      type: "text",
      category: "parties",
    },
    bailleur_nom_prenom: {
      key: "bailleur_nom_prenom",
      label: "Nom et prénom du bailleur (alias)",
      required: false,
      type: "text",
      category: "parties",
      description: "Alias pour compatibilité template"
    },
    adresse_bailleur: {
      key: "adresse_bailleur",
      label: "Adresse du bailleur",
      required: true,
      type: "textarea",
      category: "parties",
    },
    bailleur_domicile: {
      key: "bailleur_domicile",
      label: "Domicile du bailleur (alias)",
      required: false,
      type: "textarea",
      category: "parties",
      description: "Alias pour compatibilité template"
    },
    email_bailleur: {
      key: "email_bailleur",
      label: "Email du bailleur",
      required: true,
      type: "email",
      category: "parties",
    },
    bailleur_email: {
      key: "bailleur_email",
      label: "Email du bailleur (alias)",
      required: false,
      type: "email",
      category: "parties",
    },
    bailleur_qualite: {
      key: "bailleur_qualite",
      label: "Qualité du bailleur",
      required: false,
      type: "text",
      category: "parties",
    },
    telephone_bailleur: {
      key: "telephone_bailleur",
      label: "Téléphone du bailleur",
      required: true,
      type: "text",
      category: "parties",
    },
    nom_locataire: {
      key: "nom_locataire",
      label: "Nom et prénom du locataire",
      required: true,
      type: "text",
      category: "parties",
    },
    locataire_nom_prenom: {
      key: "locataire_nom_prenom",
      label: "Nom et prénom du locataire (alias)",
      required: false,
      type: "text",
      category: "parties",
      description: "Alias pour compatibilité template"
    },
    adresse_locataire: {
      key: "adresse_locataire",
      label: "Adresse du locataire",
      required: true,
      type: "textarea",
      category: "parties",
    },
    email_locataire: {
      key: "email_locataire",
      label: "Email du locataire",
      required: true,
      type: "email",
      category: "parties",
    },
    locataire_email: {
      key: "locataire_email",
      label: "Email du locataire (alias)",
      required: false,
      type: "email",
      category: "parties",
    },
    telephone_locataire: {
      key: "telephone_locataire",
      label: "Téléphone du locataire",
      required: true,
      type: "text",
      category: "parties",
    },

    // === LOGEMENT ===
    adresse_postale: {
      key: "adresse_postale",
      label: "Adresse du logement",
      required: true,
      type: "text",
      category: "logement",
    },
    code_postal: {
      key: "code_postal",
      label: "Code postal",
      required: true,
      type: "text",
      category: "logement",
    },
    ville: {
      key: "ville",
      label: "Ville",
      required: true,
      type: "text",
      category: "logement",
    },
    localisation_logement: {
      key: "localisation_logement",
      label: "Localisation du logement (alias)",
      required: false,
      type: "text",
      category: "logement",
      description: "Alias pour compatibilité template"
    },
    type_logement: {
      key: "type_logement",
      label: "Type de logement",
      required: true,
      type: "select",
      category: "logement",
      options: ["Appartement", "Maison", "Studio", "Chambre"],
    },
    type_habitat: {
      key: "type_habitat",
      label: "Type d'habitat (alias)",
      required: false,
      type: "select",
      category: "logement",
      options: ["Appartement", "Maison", "Studio", "Chambre"],
      description: "Alias pour compatibilité template"
    },
    surface_m2: {
      key: "surface_m2",
      label: "Surface (m²)",
      required: true,
      type: "number",
      category: "logement",
    },
    surface_habitable: {
      key: "surface_habitable",
      label: "Surface habitable (alias)",
      required: false,
      type: "number",
      category: "logement",
      description: "Alias pour compatibilité template"
    },
    nombre_pieces: {
      key: "nombre_pieces",
      label: "Nombre de pièces",
      required: true,
      type: "number",
      category: "logement",
    },
    etage: {
      key: "etage",
      label: "Étage",
      required: false,
      type: "text",
      category: "logement",
    },
    zone_geographique: {
      key: "zone_geographique",
      label: "Zone géographique",
      required: true,
      type: "select",
      category: "logement",
      options: ["Paris", "zone tendue", "zone non tendue"],
    },
    identifiant_fiscal: {
      key: "identifiant_fiscal",
      label: "Identifiant fiscal du logement",
      required: false,
      type: "text",
      category: "logement",
    },
    regime_juridique: {
      key: "regime_juridique",
      label: "Régime juridique de l'immeuble",
      required: false,
      type: "text",
      category: "logement",
    },
    periode_construction: {
      key: "periode_construction",
      label: "Période de construction",
      required: false,
      type: "text",
      category: "logement",
    },
    autres_parties: {
      key: "autres_parties",
      label: "Autres parties du logement",
      required: false,
      type: "text",
      category: "logement",
    },
    elements_equipements: {
      key: "elements_equipements",
      label: "Éléments d'équipements du logement",
      required: false,
      type: "text",
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
      label: "Niveau de performance du logement",
      required: false,
      type: "text",
      category: "logement",
    },
    locaux_accessoires: {
      key: "locaux_accessoires",
      label: "Locaux et équipements accessoires",
      required: false,
      type: "text",
      category: "logement",
    },
    locaux_communs: {
      key: "locaux_communs",
      label: "Locaux à usage commun",
      required: false,
      type: "text",
      category: "logement",
    },
    equipement_technologies: {
      key: "equipement_technologies",
      label: "Équipement d'accès aux technologies",
      required: false,
      type: "text",
      category: "logement",
    },

    // === CONDITIONS FINANCIÈRES ===
    loyer: {
      key: "loyer",
      label: "Loyer mensuel (€)",
      required: true,
      type: "number",
      category: "financier",
    },
    charges: {
      key: "charges",
      label: "Charges (€)",
      required: true,
      type: "number",
      category: "financier",
    },
    loyer_cc: {
      key: "loyer_cc",
      label: "Loyer charges comprises (€)",
      required: true,
      type: "number",
      category: "financier",
    },
    depot_garantie: {
      key: "depot_garantie",
      label: "Dépôt de garantie (€)",
      required: true,
      type: "number",
      category: "financier",
    },
    montant_loyer_mensuel: {
      key: "montant_loyer_mensuel",
      label: "Montant du loyer mensuel (alias)",
      required: false,
      type: "number",
      category: "financier",
    },
    soumis_decret_evolution: {
      key: "soumis_decret_evolution",
      label: "Soumis au décret d'évolution des loyers",
      required: false,
      type: "select",
      category: "financier",
      options: ["Oui", "Non"]
    },
    soumis_loyer_reference: {
      key: "soumis_loyer_reference",
      label: "Soumis au loyer de référence majoré",
      required: false,
      type: "select",
      category: "financier",
      options: ["Oui", "Non"]
    },
    montant_loyer_reference: {
      key: "montant_loyer_reference",
      label: "Montant du loyer de référence",
      required: false,
      type: "number",
      category: "financier",
    },
    montant_loyer_reference_majore: {
      key: "montant_loyer_reference_majore",
      label: "Montant du loyer de référence majoré",
      required: false,
      type: "number",
      category: "financier",
    },
    complement_loyer: {
      key: "complement_loyer",
      label: "Complément de loyer",
      required: false,
      type: "number",
      category: "financier",
    },
    infos_dernier_loyer: {
      key: "infos_dernier_loyer",
      label: "Informations relatives au loyer du dernier locataire",
      required: false,
      type: "textarea",
      category: "financier",
    },
    date_revision: {
      key: "date_revision",
      label: "Date de révision",
      required: false,
      type: "date",
      category: "financier",
    },
    date_reference_irl: {
      key: "date_reference_irl",
      label: "Date de référence de l'IRL",
      required: false,
      type: "date",
      category: "financier",
    },
    modalite_reglement_charges: {
      key: "modalite_reglement_charges",
      label: "Modalité de règlement des charges",
      required: false,
      type: "text",
      category: "financier",
    },
    montant_provisions_charges: {
      key: "montant_provisions_charges",
      label: "Montant des provisions sur charges",
      required: false,
      type: "number",
      category: "financier",
    },
    modalites_revision_forfait: {
      key: "modalites_revision_forfait",
      label: "Modalités de révision du forfait",
      required: false,
      type: "text",
      category: "financier",
    },
    contribution_economies: {
      key: "contribution_economies",
      label: "Contribution partage économies de charges",
      required: false,
      type: "text",
      category: "financier",
    },
    periodicite_paiement: {
      key: "periodicite_paiement",
      label: "Périodicité du paiement",
      required: false,
      type: "text",
      category: "financier",
    },
    paiement_echeance: {
      key: "paiement_echeance",
      label: "Paiement à échoir ou échu",
      required: false,
      type: "text",
      category: "financier",
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
    montant_premiere_echeance: {
      key: "montant_premiere_echeance",
      label: "Montant total première échéance",
      required: false,
      type: "number",
      category: "financier",
    },
    reevaluation_loyer: {
      key: "reevaluation_loyer",
      label: "Modalités de réévaluation d'un loyer sous-évalué",
      required: false,
      type: "text",
      category: "financier",
    },
    montant_depenses_energie: {
      key: "montant_depenses_energie",
      label: "Montant estimé des dépenses annuelles d'énergie",
      required: false,
      type: "number",
      category: "financier",
    },

    // === DURÉE ===
    date_debut: {
      key: "date_debut",
      label: "Date de début",
      required: true,
      type: "date",
      category: "duree",
    },
    date_prise_effet: {
      key: "date_prise_effet",
      label: "Date de prise d'effet du contrat (alias)",
      required: false,
      type: "date",
      category: "duree",
      description: "Alias pour compatibilité template"
    },
    date_fin: {
      key: "date_fin",
      label: "Date de fin",
      required: true,
      type: "date",
      category: "duree",
    },
    duree: {
      key: "duree",
      label: "Durée (mois)",
      required: true,
      type: "number",
      category: "duree",
    },
    duree_contrat: {
      key: "duree_contrat",
      label: "Durée du contrat (alias)",
      required: false,
      type: "text",
      category: "duree",
    },
    evenement_duree_reduite: {
      key: "evenement_duree_reduite",
      label: "Événement justifiant durée réduite",
      required: false,
      type: "text",
      category: "duree",
    },

    // === USAGE ET CLAUSES ===
    usage_prevu: {
      key: "usage_prevu",
      label: "Usage prévu",
      required: true,
      type: "select",
      category: "annexes",
      options: ["résidence principale", "résidence secondaire", "logement étudiant"],
    },
    destination_locaux: {
      key: "destination_locaux",
      label: "Destination des locaux",
      required: false,
      type: "text",
      category: "annexes",
    },
    clauses_particulieres: {
      key: "clauses_particulieres",
      label: "Clauses particulières",
      required: false,
      type: "textarea",
      category: "annexes",
    },
    conditions_particulieres: {
      key: "conditions_particulieres",
      label: "Conditions particulières (alias)",
      required: false,
      type: "textarea",
      category: "annexes",
    },
    // === SIGNATURE ===
    ville_signature: {
      key: "ville_signature",
      label: "Ville de signature",
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

    // === GARANTIES, TRAVAUX, ETC ===
    travaux_amelioration: {
      key: "travaux_amelioration",
      label: "Travaux d'amélioration",
      required: false,
      type: "textarea",
      category: "annexes",
    },
    majoration_travaux: {
      key: "majoration_travaux",
      label: "Majoration du loyer consécutive à des travaux",
      required: false,
      type: "text",
      category: "annexes",
    },
    diminution_travaux: {
      key: "diminution_travaux",
      label: "Diminution de loyer consécutive à des travaux",
      required: false,
      type: "text",
      category: "annexes",
    },
    montant_depot_garantie: {
      key: "montant_depot_garantie",
      label: "Montant du dépôt de garantie (alias)",
      required: false,
      type: "number",
      category: "financier",
    },
    clause_solidarite: {
      key: "clause_solidarite",
      label: "Clause de solidarité",
      required: false,
      type: "textarea",
      category: "annexes",
    },
    clause_resolutoire: {
      key: "clause_resolutoire",
      label: "Clause résolutoire",
      required: false,
      type: "textarea",
      category: "annexes",
    },

    // === HONORAIRES ===
    plafond_honoraires_visite: {
      key: "plafond_honoraires_visite",
      label: "Honoraires visite/dossier/rédaction",
      required: false,
      type: "number",
      category: "financier",
    },
    plafond_honoraires_etat_lieux: {
      key: "plafond_honoraires_etat_lieux",
      label: "Honoraires état des lieux",
      required: false,
      type: "number",
      category: "financier",
    },
    honoraires_bailleur: {
      key: "honoraires_bailleur",
      label: "Honoraires à la charge du bailleur",
      required: false,
      type: "number",
      category: "financier",
    },
    honoraires_locataire: {
      key: "honoraires_locataire",
      label: "Honoraires à la charge du locataire",
      required: false,
      type: "number",
      category: "financier",
    },

    // === ANNEXES (diagnostics, etc) ===
    annexe_reglement: {
      key: "annexe_reglement",
      label: "Extrait du règlement de copropriété",
      required: false,
      type: "text",
      category: "annexes",
    },
    annexe_dpe: {
      key: "annexe_dpe",
      label: "Diagnostic de performance énergétique",
      required: false,
      type: "text",
      category: "annexes",
    },
    annexe_plomb: {
      key: "annexe_plomb",
      label: "Constat de risque d'exposition au plomb",
      required: false,
      type: "text",
      category: "annexes",
    },
    annexe_amiante: {
      key: "annexe_amiante",
      label: "État amiante",
      required: false,
      type: "text",
      category: "annexes",
    },
    annexe_electricite_gaz: {
      key: "annexe_electricite_gaz",
      label: "État installation électricité/gaz",
      required: false,
      type: "text",
      category: "annexes",
    },
    annexe_risques: {
      key: "annexe_risques",
      label: "État des risques naturels et technologiques",
      required: false,
      type: "text",
      category: "annexes",
    },
    annexe_notice: {
      key: "annexe_notice",
      label: "Notice d'information",
      required: false,
      type: "text",
      category: "annexes",
    },
    annexe_etat_lieux: {
      key: "annexe_etat_lieux",
      label: "État des lieux",
      required: false,
      type: "text",
      category: "annexes",
    },
    annexe_autorisation: {
      key: "annexe_autorisation",
      label: "Autorisation préalable de mise en location",
      required: false,
      type: "text",
      category: "annexes",
    },
    annexe_references_loyers: {
      key: "annexe_references_loyers",
      label: "Références loyers voisinage",
      required: false,
      type: "text",
      category: "annexes",
    },
  }

  async analyze(leaseId: string): Promise<LeaseAnalysis> {
    try {
      console.log("🔍 Analyse des données pour bail:", leaseId)

      // Récupérer toutes les données du bail
      const { data: lease, error: leaseError } = await supabase
        .from("leases")
        .select(`
          *,
          property:properties(*),
          tenant:users!tenant_id(*),
          owner:users!owner_id(*)
        `)
        .eq("id", leaseId)
        .single()

      if (leaseError) {
        console.error("❌ Erreur récupération bail:", leaseError)
        throw leaseError
      }

      // Récupérer les données complétées précédemment
      const { data: completedData, error: completedError } = await supabase
        .from("lease_completed_data")
        .select("field_name, field_value, source")
        .eq("lease_id", leaseId)

      if (completedError) {
        console.error("❌ Erreur récupération données complétées:", completedError)
      }

      const completedFields =
        completedData?.reduce(
          (acc, item) => {
            acc[item.field_name] = {
              value: item.field_value,
              source: item.source as "auto" | "manual",
            }
            return acc
          },
          {} as Record<string, { value: any; source: "auto" | "manual" }>,
        ) || {}

      // Mapper les données automatiques (inclut les alias pour compatibilité template)
      const autoData = this.mapAutomaticData(lease)

      // Construire l'analyse complète
      const availableData: Record<string, FieldMapping> = {}
      const missingRequired: string[] = []

      for (const [key, definition] of Object.entries(this.fieldDefinitions)) {
        const completed = completedFields[key]
        const autoValue = autoData[key]

        let value = completed?.value || autoValue || ""
        let source: "auto" | "manual" | "missing" = "missing"

        if (completed?.value !== undefined && completed?.value !== null && completed?.value !== "") {
          source = completed.source
          value = completed.value
        } else if (autoValue !== undefined && autoValue !== null && autoValue !== "") {
          source = "auto"
          value = autoValue
        }

        availableData[key] = {
          ...definition,
          value,
          source,
        }

        const isEmpty = !value || value === "" || value === null || value === undefined
        if (definition.required && isEmpty) {
          missingRequired.push(key)
        }
      }

      const totalFields = Object.keys(this.fieldDefinitions).filter((k) => this.fieldDefinitions[k].required).length
      const completedFields_count = totalFields - missingRequired.length
      const completionRate = Math.round((completedFields_count / totalFields) * 100)

      return {
        leaseId,
        availableData,
        missingRequired,
        completionRate,
        canGenerate: missingRequired.length === 0,
      }
    } catch (error) {
      console.error("❌ Erreur analyse:", error)
      throw error
    }
  }

  private mapAutomaticData(lease: any): Record<string, any> {
    const data: Record<string, any> = {}

    try {
      // === PARTIES ===
      if (lease.owner?.first_name && lease.owner?.last_name) {
        data.nom_bailleur = `${lease.owner.first_name} ${lease.owner.last_name}`
        data.bailleur_nom_prenom = data.nom_bailleur
      }
      if (lease.owner?.address) {
        data.adresse_bailleur = lease.owner.address
        data.bailleur_domicile = lease.owner.address
      }
      data.email_bailleur = lease.owner?.email || ""
      data.bailleur_email = lease.owner?.email || ""
      data.telephone_bailleur = lease.owner?.phone || ""
      data.bailleur_qualite = "Personne physique"

      if (lease.tenant?.first_name && lease.tenant?.last_name) {
        data.nom_locataire = `${lease.tenant.first_name} ${lease.tenant.last_name}`
        data.locataire_nom_prenom = data.nom_locataire
      }
      data.adresse_locataire = lease.tenant?.address || ""
      data.email_locataire = lease.tenant?.email || ""
      data.locataire_email = lease.tenant?.email || ""
      data.telephone_locataire = lease.tenant?.phone || ""

      // === LOGEMENT ===
      data.adresse_postale = lease.property?.address || ""
      data.code_postal = lease.property?.postal_code || ""
      data.ville = lease.property?.city || ""
      data.localisation_logement = lease.property?.address ? `${lease.property.address}, ${lease.property.city}` : ""
      data.type_logement = (() => {
        const propertyType = lease.property?.property_type || ""
        if (propertyType.toLowerCase().includes("apartment")) return "Appartement"
        if (propertyType.toLowerCase().includes("house")) return "Maison"
        if (propertyType.toLowerCase().includes("studio")) return "Studio"
        if (propertyType.toLowerCase().includes("room")) return "Chambre"
        return propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
      })()
      data.type_habitat = data.type_logement
      data.surface_m2 = lease.property?.surface || ""
      data.surface_habitable = lease.property?.surface || ""
      data.nombre_pieces = lease.property?.rooms || ""
      data.etage = lease.property?.floor || ""
      data.zone_geographique = this.getZoneGeographique(lease.property?.city || "")

      // Champs supplémentaires du template : vides par défaut (saisie manuelle possible)
      data.identifiant_fiscal = ""
      data.regime_juridique = ""
      data.periode_construction = ""
      data.autres_parties = ""
      data.elements_equipements = ""
      data.modalite_chauffage = ""
      data.modalite_eau_chaude = ""
      data.niveau_performance_dpe = ""
      data.locaux_accessoires = ""
      data.locaux_communs = ""
      data.equipement_technologies = ""

      // === FINANCIER ===
      data.loyer = lease.monthly_rent || ""
      data.charges = lease.charges || 0
      data.loyer_cc = (lease.monthly_rent || 0) + (lease.charges || 0)
      data.depot_garantie = lease.deposit_amount || ""
      data.montant_loyer_mensuel = lease.monthly_rent || ""
      data.soumis_decret_evolution = "Non"
      data.soumis_loyer_reference = "Non"
      data.montant_loyer_reference = ""
      data.montant_loyer_reference_majore = ""
      data.complement_loyer = ""
      data.infos_dernier_loyer = ""
      data.date_revision = ""
      data.date_reference_irl = ""
      data.modalite_reglement_charges = "Provisions sur charges avec régularisation annuelle"
      data.montant_provisions_charges = lease.charges || 0
      data.modalites_revision_forfait = ""
      data.contribution_economies = ""
      data.periodicite_paiement = "Mensuel"
      data.paiement_echeance = "À échoir"
      data.date_paiement = "Le 1er de chaque mois"
      data.lieu_paiement = lease.property?.city || ""
      data.montant_premiere_echeance = (lease.monthly_rent || 0) + (lease.charges || 0)
      data.reevaluation_loyer = ""
      data.montant_depenses_energie = ""

      // === DURÉE ===
      data.date_debut = lease.start_date ? this.formatDateForInput(lease.start_date) : ""
      data.date_prise_effet = data.date_debut
      data.date_fin = lease.end_date ? this.formatDateForInput(lease.end_date) : ""
      if (lease.start_date && lease.end_date) {
        const startDate = new Date(lease.start_date)
        const endDate = new Date(lease.end_date)
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44))
        data.duree = diffMonths
        data.duree_contrat = diffMonths > 12 ? `${Math.round(diffMonths / 12)} ans` : `${diffMonths} mois`
      } else {
        if (lease.lease_type === "furnished") {
          data.duree = 12
          data.duree_contrat = "1 an"
        } else if (lease.lease_type === "unfurnished") {
          data.duree = 36
          data.duree_contrat = "3 ans"
        }
      }
      data.evenement_duree_reduite = ""

      // === USAGE ET CLAUSES ===
      data.usage_prevu = "résidence principale"
      data.destination_locaux = "Usage d'habitation"
      data.clauses_particulieres = lease.metadata?.special_conditions || ""
      data.conditions_particulieres = lease.metadata?.special_conditions || ""

      // === SIGNATURE ===
      data.ville_signature = lease.property?.city || ""
      data.date_signature = ""

      // === GARANTIES, TRAVAUX, ETC ===
      data.travaux_amelioration = ""
      data.majoration_travaux = ""
      data.diminution_travaux = ""
      data.montant_depot_garantie = lease.deposit_amount || ""
      data.clause_solidarite = ""
      data.clause_resolutoire = ""

      // === HONORAIRES ===
      data.plafond_honoraires_visite = ""
      data.plafond_honoraires_etat_lieux = ""
      data.honoraires_bailleur = ""
      data.honoraires_locataire = ""

      // === ANNEXES ===
      data.annexe_reglement = ""
      data.annexe_dpe = ""
      data.annexe_plomb = ""
      data.annexe_amiante = ""
      data.annexe_electricite_gaz = ""
      data.annexe_risques = ""
      data.annexe_notice = ""
      data.annexe_etat_lieux = ""
      data.annexe_autorisation = ""
      data.annexe_references_loyers = ""
    } catch (error) {
      console.error("❌ Erreur mapping automatique:", error)
    }

    return data
  }

  private getZoneGeographique(ville: string): string {
    if (!ville) return ""
    const villeNormalized = ville.toLowerCase()
    if (villeNormalized.includes("paris")) return "Paris"
    const zonesTendues = [
      "marseille","lyon","toulouse","nice","nantes","montpellier","strasbourg","bordeaux","lille","rennes","reims",
      "toulon","saint-étienne","le havre","grenoble","dijon","angers","nîmes","villeurbanne","saint-denis",
      "aix-en-provence","brest","limoges","tours","amiens","perpignan","metz","besançon","orléans","mulhouse",
      "rouen","caen","nancy"
    ]
    const isZoneTendue = zonesTendues.some((zoneTendue) => villeNormalized.includes(zoneTendue))
    return isZoneTendue ? "zone tendue" : "zone non tendue"
  }

  private formatDateForInput(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toISOString().split("T")[0]
    } catch (error) {
      console.error("❌ Erreur formatage date:", dateString, error)
      return ""
    }
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      console.error("❌ Erreur formatage date:", dateString, error)
      return ""
    }
  }

  async saveCompletedData(leaseId: string, fieldName: string, fieldValue: any, source: "manual" = "manual") {
    try {
      const { error } = await supabase.from("lease_completed_data").upsert(
        {
          lease_id: leaseId,
          field_name: fieldName,
          field_value: fieldValue,
          source,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "lease_id,field_name",
        },
      )

      if (error) {
        console.error("❌ Erreur sauvegarde:", error)
        throw error
      }
    } catch (error) {
      console.error("❌ Erreur sauvegarde:", error)
      throw error
    }
  }

  getFieldsByCategory(availableData: Record<string, FieldMapping>) {
    const categories = {
      parties: [] as FieldMapping[],
      logement: [] as FieldMapping[],
      financier: [] as FieldMapping[],
      duree: [] as FieldMapping[],
      annexes: [] as FieldMapping[],
    }

    for (const field of Object.values(availableData)) {
      categories[field.category].push(field)
    }

    return categories
  }
}

export const leaseDataAnalyzer = new LeaseDataAnalyzer()
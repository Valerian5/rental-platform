import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🚀 [LEASES] Création bail avec données:", Object.keys(body))

    // Validation des champs obligatoires
    const requiredFields = ["property_id", "tenant_id", "owner_id", "start_date", "monthly_rent", "lease_type"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `Champ obligatoire manquant: ${field}` }, { status: 400 })
      }
    }

    // Extraire les métadonnées
    const { metadata, ...leaseData } = body

    // Fonction utilitaire pour convertir les dates
    const parseDate = (dateValue: any): string | null => {
      if (!dateValue) return null
      if (typeof dateValue === "string") {
        // Si c'est déjà une date ISO, la retourner
        if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) return dateValue
        // Si c'est un objet Date stringifié
        try {
          const parsed = new Date(dateValue)
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split("T")[0]
          }
        } catch {
          return null
        }
      }
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split("T")[0]
      }
      return null
    }

    // Fonction utilitaire pour convertir les nombres
    const parseNumber = (value: any): number | null => {
      if (value === null || value === undefined || value === "") return null
      const num = Number(value)
      return isNaN(num) ? null : num
    }

    // Fonction utilitaire pour convertir les booléens
    const parseBoolean = (value: any): boolean => {
      if (typeof value === "boolean") return value
      if (typeof value === "string") {
        return value.toLowerCase() === "true" || value === "1"
      }
      return Boolean(value)
    }

    // Fonction utilitaire pour les tableaux
    const parseArray = (value: any): string[] => {
      if (Array.isArray(value)) return value.filter((v) => v && typeof v === "string")
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? parsed.filter((v) => v && typeof v === "string") : []
        } catch {
          return value.split(",").filter((v) => v.trim())
        }
      }
      return []
    }

    // Préparer les données pour l'insertion en respectant EXACTEMENT les types de colonnes
    const insertData = {
      // === CHAMPS DE BASE OBLIGATOIRES ===
      property_id: leaseData.property_id,
      tenant_id: leaseData.tenant_id,
      owner_id: leaseData.owner_id,
      start_date: parseDate(leaseData.start_date), // date not null
      end_date: parseDate(leaseData.end_date), // date not null
      monthly_rent: parseNumber(leaseData.monthly_rent) || 0, // numeric(10,2) not null
      deposit_amount: parseNumber(leaseData.deposit_amount) || 0, // numeric(10,2) not null
      status: "draft", // varchar(20) not null
      signed_by_tenant: false, // boolean
      signed_by_owner: false, // boolean
      lease_type: leaseData.lease_type || "unfurnished", // varchar(20)

      // === CHAMPS OPTIONNELS DE BASE ===
      charges: parseNumber(leaseData.charges) || 0, // numeric(10,2)
      deposit: parseNumber(leaseData.deposit_amount), // numeric(10,2)
      security_deposit: parseNumber(leaseData.deposit_amount) || 0, // numeric(10,2)
      application_id: leaseData.application_id || null, // uuid

      // === DATES (toutes les colonnes date) ===
      signed_date: null, // date
      date_signature: null, // date
      date_debut: parseDate(leaseData.start_date), // date
      date_fin: parseDate(leaseData.end_date), // date
      date_prise_effet: parseDate(leaseData.date_entree || leaseData.start_date), // date

      // ATTENTION: Ces champs ne sont PAS des dates mais des TEXT
      // date_revision est TEXT, pas date !
      date_revision:
        leaseData.date_revision_loyer === "autre"
          ? leaseData.date_revision_personnalisee
          : leaseData.date_revision_loyer, // TEXT (pas date!)

      // Ces champs sont des vraies dates
      date_reference_irl: parseDate(leaseData.date_reference_irl), // date
      date_dernier_loyer: parseDate(leaseData.date_dernier_loyer), // date
      date_revision_dernier_loyer: parseDate(leaseData.date_revision_dernier_loyer), // date

      // === PARTIES - BAILLEUR (tous TEXT) ===
      nom_bailleur: leaseData.bailleur_nom_prenom, // text
      bailleur_nom_prenom: leaseData.bailleur_nom_prenom, // text
      adresse_bailleur: leaseData.bailleur_adresse, // text
      bailleur_domicile: leaseData.bailleur_adresse, // text
      bailleur_telephone: leaseData.bailleur_telephone, // text
      email_bailleur: leaseData.bailleur_email, // text
      bailleur_email: leaseData.bailleur_email, // text
      bailleur_qualite:
        leaseData.owner_type === "individual"
          ? "Particulier"
          : leaseData.owner_type === "sci"
            ? "SCI"
            : "Personne morale", // text

      // Mandataire (tous TEXT)
      mandataire_represente: leaseData.mandataire_represente ? "true" : "false", // text (pas boolean!)
      mandataire_nom: leaseData.mandataire_nom, // text
      mandataire_adresse: leaseData.mandataire_adresse, // text
      mandataire_activite: leaseData.mandataire_activite, // text
      mandataire_carte_pro: leaseData.mandataire_carte_pro, // text
      mandataire_garant_nom: leaseData.mandataire_garant_nom, // text
      mandataire_garant_adresse: leaseData.mandataire_garant_adresse, // text

      // SCI (tous TEXT)
      sci_denomination: leaseData.sci_denomination, // text
      sci_mandataire_nom: leaseData.sci_mandataire_nom, // text
      sci_mandataire_adresse: leaseData.sci_mandataire_adresse, // text

      // Personne morale (tous TEXT)
      personne_morale_denomination: leaseData.personne_morale_denomination, // text
      personne_morale_mandataire_nom: leaseData.personne_morale_mandataire_nom, // text
      personne_morale_mandataire_adresse: leaseData.personne_morale_mandataire_adresse, // text

      // === LOCATAIRES (tous TEXT) ===
      nom_locataire: metadata?.locataires?.[0]
        ? `${metadata.locataires[0].prenom} ${metadata.locataires[0].nom}`
        : null, // text
      locataire_nom_prenom: metadata?.locataires?.[0]
        ? `${metadata.locataires[0].prenom} ${metadata.locataires[0].nom}`
        : null, // text
      locataire_domicile: metadata?.locataires?.[0]?.adresse, // text
      telephone_locataire: metadata?.locataires?.[0]?.telephone, // text
      email_locataire: metadata?.locataires?.[0]?.email, // text
      locataire_email: metadata?.locataires?.[0]?.email, // text

      // === LOGEMENT ===
      // Adresses (TEXT)
      adresse_postale: leaseData.adresse_logement, // text
      adresse_logement: leaseData.adresse_logement, // text
      localisation_logement: leaseData.adresse_logement, // text
      complement_adresse: leaseData.complement_adresse, // text
      complement_adresse_logement: leaseData.complement_adresse, // text
      code_postal: leaseData.code_postal || "00000", // text
      ville: leaseData.ville || "Non spécifié", // text

      // Caractéristiques (NUMERIC/INTEGER)
      nombre_pieces: parseNumber(leaseData.nombre_pieces), // integer
      surface_habitable: parseNumber(leaseData.surface_habitable), // numeric
      surface_m2: parseNumber(leaseData.surface_habitable), // numeric

      // Caractéristiques (TEXT)
      type_logement: leaseData.type_habitat, // text
      type_habitat: leaseData.type_habitat, // text
      type_habitat_detail: leaseData.type_habitat, // text (avec contrainte check)
      performance_dpe: leaseData.performance_dpe, // text
      niveau_performance_dpe: leaseData.performance_dpe, // text
      regime_juridique: leaseData.regime_juridique, // text (avec contrainte check)
      destination_locaux: leaseData.destination_locaux, // text (avec contrainte check)
      production_chauffage: leaseData.production_chauffage, // text
      modalite_chauffage: leaseData.production_chauffage, // text (avec contrainte check)
      production_eau_chaude: leaseData.production_eau_chaude, // text
      modalite_eau_chaude: leaseData.production_eau_chaude, // text (avec contrainte check)
      identifiant_fiscal: leaseData.identifiant_fiscal, // text
      periode_construction: leaseData.periode_construction, // text
      etage: leaseData.etage, // text
      zone_geographique: leaseData.zone_tendue ? "Zone tendue" : "Zone normale", // text

      // === TABLEAUX POSTGRESQL (text[]) ===
      autres_parties_types: parseArray(leaseData.autres_parties_types), // text[]
      equipements_types: parseArray(leaseData.equipements_logement_types), // text[]
      locaux_privatifs_types: parseArray(leaseData.locaux_privatifs_types), // text[]
      locaux_communs_types: parseArray(leaseData.locaux_communs_types), // text[]
      equipement_technologies_types: parseArray(leaseData.equipement_technologies_types), // text[]

      // Détails des équipements (TEXT)
      autres_parties_autres: leaseData.autres_parties_autres, // text
      equipements_autres: leaseData.equipements_logement_autres, // text
      equipements_logement_autres: leaseData.equipements_logement_autres, // text
      equipements_logement_types: leaseData.equipements_logement_types?.join(","), // text
      locaux_privatifs_autres: leaseData.locaux_privatifs_autres, // text
      cave_numero: leaseData.cave_numero, // text
      parking_numero: leaseData.parking_numero, // text
      garage_numero: leaseData.garage_numero, // text
      locaux_communs_autres: leaseData.locaux_communs_autres, // text
      equipement_technologies_autres: leaseData.equipement_technologies_autres, // text

      // Descriptions détaillées (TEXT)
      autres_parties:
        leaseData.autres_parties_types?.join(", ") +
        (leaseData.autres_parties_autres ? `, ${leaseData.autres_parties_autres}` : ""), // text
      elements_equipements:
        leaseData.equipements_logement_types?.join(", ") +
        (leaseData.equipements_logement_autres ? `, ${leaseData.equipements_logement_autres}` : ""), // text
      locaux_accessoires:
        leaseData.locaux_privatifs_types?.join(", ") +
        (leaseData.locaux_privatifs_autres ? `, ${leaseData.locaux_privatifs_autres}` : ""), // text
      locaux_communs:
        leaseData.locaux_communs_types?.join(", ") +
        (leaseData.locaux_communs_autres ? `, ${leaseData.locaux_communs_autres}` : ""), // text
      equipement_technologies: leaseData.equipement_technologies_types?.join(", "), // text

      // === COLONNES JSONB ===
      equipements_logement: leaseData.equipements_logement_types || [], // jsonb
      equipements_privatifs: leaseData.locaux_privatifs_types || [], // jsonb
      equipements_communs: leaseData.locaux_communs_types || [], // jsonb
      equipements_technologies: leaseData.equipement_technologies_types || [], // jsonb

      // === FINANCIER ===
      // Montants principaux (NUMERIC)
      loyer: parseNumber(leaseData.monthly_rent), // numeric
      loyer_cc: parseNumber(leaseData.monthly_rent) + parseNumber(leaseData.montant_charges || 0), // numeric
      montant_loyer_mensuel: parseNumber(leaseData.monthly_rent), // numeric
      depot_garantie: parseNumber(leaseData.deposit_amount), // numeric
      montant_depot_garantie: parseNumber(leaseData.deposit_amount), // numeric

      // Zone encadrée (BOOLEAN et NUMERIC)
      zone_encadree: parseBoolean(leaseData.zone_encadree), // boolean
      soumis_loyer_reference: parseBoolean(leaseData.zone_encadree), // boolean
      loyer_reference: parseNumber(leaseData.loyer_reference), // numeric
      loyer_reference_majore: parseNumber(leaseData.loyer_reference_majore), // numeric
      montant_loyer_reference: parseNumber(leaseData.loyer_reference), // numeric
      montant_loyer_reference_majore: parseNumber(leaseData.loyer_reference_majore), // numeric
      complement_loyer: parseNumber(leaseData.complement_loyer), // numeric
      complement_loyer_justification: leaseData.complement_loyer_justification, // text

      zone_tendue: parseBoolean(leaseData.zone_tendue), // boolean

      // Charges (TEXT et NUMERIC)
      type_charges: leaseData.type_charges, // text
      montant_charges: parseNumber(leaseData.montant_charges), // numeric
      montant_provisions_charges: parseNumber(leaseData.montant_charges), // numeric
      modalite_reglement_charges:
        leaseData.type_charges === "provisions"
          ? "Provisions"
          : leaseData.type_charges === "forfait"
            ? "Forfait"
            : "Autre", // text
      modalite_revision_forfait: leaseData.modalite_revision_forfait, // text
      modalites_revision_forfait: leaseData.modalite_revision_forfait, // text

      // Assurance colocation (BOOLEAN et NUMERIC et TEXT)
      assurance_colocataires: parseBoolean(leaseData.assurance_colocataires), // boolean
      assurance_colocataire: parseBoolean(leaseData.assurance_colocataires), // boolean
      assurance_montant: parseNumber(leaseData.assurance_montant), // numeric
      assurance_colocataire_montant: parseNumber(leaseData.assurance_montant), // numeric
      assurance_frequence: leaseData.assurance_frequence, // text
      assurance_colocataire_frequence: leaseData.assurance_frequence, // text (avec contrainte check)

      // IRL et révision (TEXT principalement)
      trimestre_reference_irl: leaseData.trimestre_reference_irl, // text
      date_revision_loyer: leaseData.date_revision_loyer, // text
      date_revision_personnalisee: leaseData.date_revision_personnalisee, // text
      ancien_locataire_duree: leaseData.ancien_locataire_duree, // text
      dernier_loyer_ancien: parseNumber(leaseData.dernier_loyer_ancien), // numeric
      infos_dernier_loyer:
        leaseData.ancien_locataire_duree === "moins_18_mois"
          ? `Dernier loyer: ${leaseData.dernier_loyer_ancien}€`
          : null, // text

      // Énergie (NUMERIC et TEXT)
      estimation_depenses_energie_min: parseNumber(leaseData.estimation_depenses_energie_min), // numeric
      estimation_depenses_energie_max: parseNumber(leaseData.estimation_depenses_energie_max), // numeric
      annee_reference_energie: leaseData.annee_reference_energie, // varchar(4)
      montant_depenses_energie: parseNumber(leaseData.estimation_depenses_energie_max), // numeric

      // === DURÉE ===
      duree: parseNumber(leaseData.duree_contrat), // integer
      duree_contrat: leaseData.duree_contrat?.toString(), // text
      contrat_duree_reduite: parseBoolean(leaseData.contrat_duree_reduite), // boolean
      raison_duree_reduite: leaseData.raison_duree_reduite, // text
      evenement_duree_reduite: leaseData.raison_duree_reduite, // text

      // Paiement (TEXT principalement)
      jour_paiement_loyer: leaseData.jour_paiement_loyer?.toString(), // text
      paiement_avance: parseBoolean(leaseData.paiement_avance), // boolean
      paiement_echeance: leaseData.paiement_avance ? "À échoir" : "À terme échu", // text
      date_paiement: `Le ${leaseData.jour_paiement_loyer || "1"} de chaque mois`, // text
      mode_paiement_loyer: leaseData.mode_paiement_loyer, // varchar(50)
      lieu_paiement:
        leaseData.mode_paiement_loyer === "virement"
          ? "Virement bancaire"
          : leaseData.mode_paiement_loyer === "cheque"
            ? "Chèque"
            : leaseData.mode_paiement_loyer === "prelevement"
              ? "Prélèvement automatique"
              : leaseData.mode_paiement_loyer, // text
      periodicite_paiement: "Mensuel", // text

      // === CLAUSES (BOOLEAN principalement) ===
      clause_solidarite: parseBoolean(metadata?.clauses?.clause_solidarite?.enabled), // boolean
      clause_resolutoire: parseBoolean(metadata?.clauses?.clause_resolutoire?.enabled), // boolean

      // Textes des clauses (TEXT)
      clauses_particulieres: leaseData.clause_libre, // text
      conditions_particulieres: leaseData.clause_libre, // text
      clauses_personnalisees: Object.entries(metadata?.clauses || {})
        .filter(([_, clause]) => clause && typeof clause === "object" && clause.enabled)
        .map(([key, clause]) => `${key}: ${clause.text}`)
        .join("\n\n"), // text

      // === HONORAIRES (TEXT principalement) ===
      honoraires_professionnel: leaseData.honoraires_professionnel ? "true" : "false", // text
      honoraires_locataire_visite: leaseData.honoraires_locataire_visite?.toString(), // text
      plafond_honoraires_locataire: leaseData.plafond_honoraires_locataire?.toString(), // text
      honoraires_bailleur_visite: leaseData.honoraires_bailleur_visite?.toString(), // text
      etat_lieux_professionnel: leaseData.etat_lieux_professionnel ? "true" : "false", // text
      honoraires_locataire_etat_lieux: leaseData.honoraires_locataire_etat_lieux?.toString(), // text
      plafond_honoraires_etat_lieux: leaseData.plafond_honoraires_etat_lieux?.toString(), // text
      honoraires_bailleur_etat_lieux: leaseData.honoraires_bailleur_etat_lieux?.toString(), // text
      autres_prestations: leaseData.autres_prestations ? "true" : "false", // text
      details_autres_prestations: leaseData.details_autres_prestations, // text
      honoraires_autres_prestations: leaseData.honoraires_autres_prestations?.toString(), // text

      // Totaux des honoraires (NUMERIC)
      honoraires_bailleur:
        parseNumber(leaseData.honoraires_bailleur_visite || 0) +
        parseNumber(leaseData.honoraires_bailleur_etat_lieux || 0), // numeric
      honoraires_locataire:
        parseNumber(leaseData.honoraires_locataire_visite || 0) +
        parseNumber(leaseData.honoraires_locataire_etat_lieux || 0), // numeric
      plafond_honoraires_visite: parseNumber(leaseData.plafond_honoraires_locataire), // numeric

      // === MEUBLÉ/FRANCHISE/CLAUSE LIBRE (TEXT) ===
      mise_disposition_meubles: leaseData.mise_disposition_meubles, // text
      franchise_loyer: leaseData.franchise_loyer, // text
      clause_libre: leaseData.clause_libre, // text

      // === ANNEXES (BOOLEAN) ===
      annexe_reglement: false, // boolean
      annexe_dpe: false, // boolean
      annexe_plomb: false, // boolean
      annexe_amiante: false, // boolean
      annexe_electricite_gaz: false, // boolean
      annexe_risques: false, // boolean
      annexe_notice: false, // boolean
      annexe_etat_lieux: false, // boolean
      annexe_autorisation: false, // boolean
      annexe_references_loyers: false, // boolean
      annexe_actes_caution: null, // text

      // === AUTRES CHAMPS ===
      usage_prevu: "résidence principale", // text
      ville_signature: "Non spécifié", // text
      lieu_signature: "Non spécifié", // text

      // === COMPLETION (INTEGER et TEXT) ===
      completion_rate: 100, // integer
      completion_percentage: 100, // integer
      form_version: "v12_dynamic_fields", // text
      last_updated_section: "clauses", // text
      document_validation_status: "pending", // varchar(50)

      // === MÉTADONNÉES (JSONB) ===
      metadata: {
        form_version: "v12_dynamic_fields",
        locataires: metadata?.locataires || [],
        garants: metadata?.garants || [],
        clauses: metadata?.clauses || {},
        bail_type: leaseData.bail_type,
        owner_type: leaseData.owner_type,
        guarantee_type: leaseData.guarantee_type,
        ...metadata,
      }, // jsonb

      completed_data: {}, // jsonb

      // === TIMESTAMPS (timestamp with time zone) ===
      created_at: new Date().toISOString(), // timestamp with time zone
      updated_at: new Date().toISOString(), // timestamp with time zone
      data_completed_at: new Date().toISOString(), // timestamp with time zone

      // Champs optionnels pour les timestamps
      document_generated_at: null, // timestamp with time zone
      owner_signature_date: null, // timestamp with time zone
      tenant_signature_date: null, // timestamp with time zone

      // Champs optionnels
      template_id: null, // uuid
      document_url: null, // text
      lease_document_url: null, // text
      generated_document: null, // text

      // Champs spécialisés
      jardin_description: null, // text
      jardin_surface: null, // numeric
      installations_sanitaires_description: null, // text
      evolution_loyer_relocation: false, // boolean
      travaux_bailleur_cours_html: null, // text
      travaux_locataire_cours_html: null, // text
      travaux_entre_locataires_html: null, // text
      clause_animaux_domestiques_id: null, // uuid
      clause_entretien_appareils_id: null, // uuid
      clause_degradations_locataire_id: null, // uuid

      // Champs financiers supplémentaires
      soumis_decret_evolution: false, // boolean
      contribution_economies: 0, // numeric
      montant_premiere_echeance: null, // numeric
      reevaluation_loyer: null, // text
      travaux_amelioration: null, // text
      majoration_travaux: 0, // numeric
      diminution_travaux: 0, // numeric
    }

    console.log("📝 [LEASES] Données préparées pour insertion:", Object.keys(insertData).length, "champs")

    // Validation supplémentaire avant insertion
    const validationErrors = []

    // Vérifier les contraintes check
    if (insertData.modalite_chauffage && !["individuel", "collectif"].includes(insertData.modalite_chauffage)) {
      validationErrors.push(`modalite_chauffage invalide: ${insertData.modalite_chauffage}`)
    }

    if (insertData.modalite_eau_chaude && !["individuelle", "collective"].includes(insertData.modalite_eau_chaude)) {
      validationErrors.push(`modalite_eau_chaude invalide: ${insertData.modalite_eau_chaude}`)
    }

    if (
      insertData.type_habitat_detail &&
      !["immeuble_collectif", "individuel"].includes(insertData.type_habitat_detail)
    ) {
      validationErrors.push(`type_habitat_detail invalide: ${insertData.type_habitat_detail}`)
    }

    if (insertData.destination_locaux && !["usage_habitation", "usage_mixte"].includes(insertData.destination_locaux)) {
      validationErrors.push(`destination_locaux invalide: ${insertData.destination_locaux}`)
    }

    if (insertData.lease_type && !["unfurnished", "furnished", "commercial"].includes(insertData.lease_type)) {
      validationErrors.push(`lease_type invalide: ${insertData.lease_type}`)
    }

    if (
      insertData.assurance_colocataire_frequence &&
      !["mensuel", "annuel"].includes(insertData.assurance_colocataire_frequence)
    ) {
      validationErrors.push(`assurance_colocataire_frequence invalide: ${insertData.assurance_colocataire_frequence}`)
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Erreurs de validation",
          details: validationErrors.join(", "),
        },
        { status: 400 },
      )
    }

    // Insérer le bail
    const { data: lease, error: insertError } = await supabase.from("leases").insert(insertData).select("*").single()

    if (insertError) {
      console.error("❌ [LEASES] Erreur insertion:", insertError)
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la création du bail",
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
        },
        { status: 500 },
      )
    }

    console.log("✅ [LEASES] Bail créé avec succès:", lease.id)

    // Mettre à jour le statut de la candidature si applicable
    if (leaseData.application_id) {
      const { error: updateError } = await supabase
        .from("applications")
        .update({
          status: "lease_created",
          lease_id: lease.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leaseData.application_id)

      if (updateError) {
        console.error("❌ [LEASES] Erreur mise à jour candidature:", updateError)
      } else {
        console.log("✅ [LEASES] Candidature mise à jour")
      }
    }

    return NextResponse.json({
      success: true,
      message: "Bail créé avec succès",
      lease: lease,
    })
  } catch (error) {
    console.error("❌ [LEASES] Erreur:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création du bail",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("owner_id")

    if (!ownerId) {
      return NextResponse.json({ success: false, error: "owner_id requis" }, { status: 400 })
    }

const { data: leases, error } = await supabase
  .from("leases")
  .select(`
    *,
    property:properties(*),
    tenant:users!leases_tenant_id_fkey(*),
    application:applications!leases_application_id_fkey(
      *,
      rental_file:rental_files(*)
    )
  `)
  .eq("owner_id", ownerId)
  .order("created_at", { ascending: false });


    if (error) {
      console.error("❌ [LEASES] Erreur récupération:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la récupération des baux",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      leases: leases || [],
    })
  } catch (error) {
    console.error("❌ [LEASES] Erreur:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des baux",
      },
      { status: 500 },
    )
  }
}

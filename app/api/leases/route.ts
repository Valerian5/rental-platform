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

    // Préparer les données pour l'insertion en utilisant EXACTEMENT les colonnes de la table
    const insertData = {
      // === CHAMPS DE BASE (colonnes existantes) ===
      property_id: leaseData.property_id,
      tenant_id: leaseData.tenant_id,
      owner_id: leaseData.owner_id,
      start_date: leaseData.start_date,
      end_date: leaseData.end_date,
      monthly_rent: Number(leaseData.monthly_rent) || 0,
      charges: Number(leaseData.charges) || 0,
      deposit_amount: Number(leaseData.deposit_amount) || 0,
      security_deposit: Number(leaseData.security_deposit) || Number(leaseData.deposit_amount) || 0,
      lease_type: leaseData.lease_type,
      status: "draft",
      signed_by_tenant: false,
      signed_by_owner: false,
      application_id: leaseData.application_id,

      // === CHAMPS EXISTANTS DANS LA TABLE ===
      deposit: Number(leaseData.deposit_amount) || 0,
      loyer: Number(leaseData.monthly_rent) || 0,
      loyer_cc: Number(leaseData.monthly_rent) + Number(leaseData.charges || 0),
      depot_garantie: Number(leaseData.deposit_amount) || 0,
      date_debut: leaseData.start_date,
      date_fin: leaseData.end_date,
      duree: Number(leaseData.duree_contrat) || null,

      // === PARTIES - BAILLEUR (colonnes existantes) ===
      bailleur_nom_prenom: leaseData.bailleur_nom_prenom,
      bailleur_domicile: leaseData.bailleur_adresse,
      bailleur_qualite:
        leaseData.owner_type === "individual"
          ? "Particulier"
          : leaseData.owner_type === "sci"
            ? "SCI"
            : "Personne morale",
      bailleur_email: leaseData.bailleur_email,
      email_bailleur: leaseData.bailleur_email,
      bailleur_telephone: leaseData.bailleur_telephone,

      // Mandataire (colonnes existantes)
      mandataire_represente: leaseData.mandataire_represente ? "true" : "false",
      mandataire_nom: leaseData.mandataire_nom,
      mandataire_adresse: leaseData.mandataire_adresse,
      mandataire_activite: leaseData.mandataire_activite,
      mandataire_carte_pro: leaseData.mandataire_carte_pro,
      mandataire_garant_nom: leaseData.mandataire_garant_nom,
      mandataire_garant_adresse: leaseData.mandataire_garant_adresse,

      // SCI (colonnes existantes)
      sci_denomination: leaseData.sci_denomination,
      sci_mandataire_nom: leaseData.sci_mandataire_nom,
      sci_mandataire_adresse: leaseData.sci_mandataire_adresse,

      // Personne morale (colonnes existantes)
      personne_morale_denomination: leaseData.personne_morale_denomination,
      personne_morale_mandataire_nom: leaseData.personne_morale_mandataire_nom,
      personne_morale_mandataire_adresse: leaseData.personne_morale_mandataire_adresse,

      // === LOCATAIRES (colonnes existantes) ===
      locataire_nom_prenom: metadata?.locataires?.[0]
        ? `${metadata.locataires[0].prenom} ${metadata.locataires[0].nom}`
        : null,
      locataire_email: metadata?.locataires?.[0]?.email,
      email_locataire: metadata?.locataires?.[0]?.email,
      nom_locataire: metadata?.locataires?.[0]
        ? `${metadata.locataires[0].prenom} ${metadata.locataires[0].nom}`
        : null,
      telephone_locataire: metadata?.locataires?.[0]?.telephone,
      locataire_domicile: metadata?.locataires?.[0]?.adresse,

      // === LOGEMENT (colonnes existantes) ===
      adresse_logement: leaseData.adresse_logement,
      localisation_logement: leaseData.adresse_logement,
      complement_adresse: leaseData.complement_adresse,
      complement_adresse_logement: leaseData.complement_adresse,
      adresse_postale: leaseData.adresse_logement,
      ville: leaseData.ville || "Non spécifié",
      code_postal: leaseData.code_postal || "00000",

      nombre_pieces: Number(leaseData.nombre_pieces) || null,
      surface_habitable: Number(leaseData.surface_habitable) || null,
      surface_m2: Number(leaseData.surface_habitable) || null,

      performance_dpe: leaseData.performance_dpe,
      niveau_performance_dpe: leaseData.performance_dpe,

      type_habitat: leaseData.type_habitat,
      type_habitat_detail: leaseData.type_habitat,
      type_logement: leaseData.type_habitat,

      regime_juridique: leaseData.regime_juridique,
      destination_locaux: leaseData.destination_locaux,

      production_chauffage: leaseData.production_chauffage,
      modalite_chauffage: leaseData.production_chauffage,

      production_eau_chaude: leaseData.production_eau_chaude,
      modalite_eau_chaude: leaseData.production_eau_chaude,

      identifiant_fiscal: leaseData.identifiant_fiscal,
      periode_construction: leaseData.periode_construction,

      // === TABLEAUX POSTGRESQL (text[]) - colonnes existantes ===
      autres_parties_types: leaseData.autres_parties_types || [],
      autres_parties_autres: leaseData.autres_parties_autres,

      equipements_types: leaseData.equipements_logement_types || [],
      equipements_autres: leaseData.equipements_logement_autres,
      equipements_logement_types: leaseData.equipements_logement_types?.join(",") || null,
      equipements_logement_autres: leaseData.equipements_logement_autres,

      locaux_privatifs_types: leaseData.locaux_privatifs_types || [],
      locaux_privatifs_autres: leaseData.locaux_privatifs_autres,
      cave_numero: leaseData.cave_numero,
      parking_numero: leaseData.parking_numero,
      garage_numero: leaseData.garage_numero,

      locaux_communs_types: leaseData.locaux_communs_types || [],
      locaux_communs_autres: leaseData.locaux_communs_autres,

      equipement_technologies_types: leaseData.equipement_technologies_types || [],
      equipement_technologies_autres: leaseData.equipement_technologies_autres,

      // === COLONNES JSONB (existantes) ===
      equipements_logement: leaseData.equipements_logement_types || [],
      equipements_privatifs: leaseData.locaux_privatifs_types || [],
      equipements_communs: leaseData.locaux_communs_types || [],
      equipements_technologies: leaseData.equipement_technologies_types || [],

      // === FINANCIER (colonnes existantes) ===
      montant_loyer_mensuel: Number(leaseData.monthly_rent) || null,
      montant_depot_garantie: Number(leaseData.deposit_amount) || null,

      // Zone encadrée (colonnes existantes)
      zone_encadree: leaseData.zone_encadree || false,
      soumis_loyer_reference: leaseData.zone_encadree || false,
      loyer_reference: Number(leaseData.loyer_reference) || null,
      loyer_reference_majore: Number(leaseData.loyer_reference_majore) || null,
      complement_loyer: Number(leaseData.complement_loyer) || null,
      complement_loyer_justification: leaseData.complement_loyer_justification,
      montant_loyer_reference: Number(leaseData.loyer_reference) || null,
      montant_loyer_reference_majore: Number(leaseData.loyer_reference_majore) || null,

      zone_tendue: leaseData.zone_tendue || false,
      zone_geographique: leaseData.zone_tendue ? "Zone tendue" : "Zone normale",

      // Charges (colonnes existantes)
      type_charges: leaseData.type_charges,
      montant_charges: Number(leaseData.montant_charges) || null,
      montant_provisions_charges: Number(leaseData.montant_charges) || null,
      modalite_reglement_charges:
        leaseData.type_charges === "provisions"
          ? "Provisions"
          : leaseData.type_charges === "forfait"
            ? "Forfait"
            : "Autre",
      modalite_revision_forfait: leaseData.modalite_revision_forfait,
      modalites_revision_forfait: leaseData.modalite_revision_forfait,

      // Assurance colocation (colonnes existantes)
      assurance_colocataires: leaseData.assurance_colocataires || false,
      assurance_colocataire: leaseData.assurance_colocataires || false,
      assurance_montant: Number(leaseData.assurance_montant) || null,
      assurance_colocataire_montant: Number(leaseData.assurance_montant) || null,
      assurance_frequence: leaseData.assurance_frequence,
      assurance_colocataire_frequence: leaseData.assurance_frequence,

      // IRL et révision (colonnes existantes)
      trimestre_reference_irl: leaseData.trimestre_reference_irl,
      date_revision_loyer: leaseData.date_revision_loyer,
      date_revision:
        leaseData.date_revision_loyer === "autre"
          ? leaseData.date_revision_personnalisee
          : leaseData.date_revision_loyer,
      date_revision_personnalisee: leaseData.date_revision_personnalisee,
      date_reference_irl: leaseData.date_dernier_loyer,

      ancien_locataire_duree: leaseData.ancien_locataire_duree,
      dernier_loyer_ancien: Number(leaseData.dernier_loyer_ancien) || null,
      date_dernier_loyer: leaseData.date_dernier_loyer,
      date_revision_dernier_loyer: leaseData.date_revision_dernier_loyer,
      infos_dernier_loyer:
        leaseData.ancien_locataire_duree === "moins_18_mois"
          ? `Dernier loyer: ${leaseData.dernier_loyer_ancien}€`
          : null,

      // Énergie (colonnes existantes)
      estimation_depenses_energie_min: Number(leaseData.estimation_depenses_energie_min) || null,
      estimation_depenses_energie_max: Number(leaseData.estimation_depenses_energie_max) || null,
      annee_reference_energie: leaseData.annee_reference_energie,
      montant_depenses_energie: Number(leaseData.estimation_depenses_energie_max) || null,

      // === DURÉE (colonnes existantes) ===
      date_entree: leaseData.date_entree,
      date_prise_effet: leaseData.date_entree,
      duree_contrat: leaseData.duree_contrat?.toString(),
      contrat_duree_reduite: leaseData.contrat_duree_reduite || false,
      raison_duree_reduite: leaseData.raison_duree_reduite,
      evenement_duree_reduite: leaseData.raison_duree_reduite,

      // Paiement (colonnes existantes)
      jour_paiement_loyer: leaseData.jour_paiement_loyer?.toString(),
      paiement_avance: leaseData.paiement_avance,
      paiement_echeance: leaseData.paiement_avance ? "À échoir" : "À terme échu",
      date_paiement: `Le ${leaseData.jour_paiement_loyer || "1"} de chaque mois`,
      mode_paiement_loyer: leaseData.mode_paiement_loyer,
      lieu_paiement:
        leaseData.mode_paiement_loyer === "virement"
          ? "Virement bancaire"
          : leaseData.mode_paiement_loyer === "cheque"
            ? "Chèque"
            : leaseData.mode_paiement_loyer === "prelevement"
              ? "Prélèvement automatique"
              : leaseData.mode_paiement_loyer,
      periodicite_paiement: "Mensuel",

      // === CLAUSES (colonnes existantes) ===
      clause_solidarite: metadata?.clauses?.clause_solidarite?.enabled || false,
      clause_resolutoire: metadata?.clauses?.clause_resolutoire?.enabled || false,
      clauses_particulieres: leaseData.clause_libre,
      conditions_particulieres: leaseData.clause_libre,
      clauses_personnalisees: Object.entries(metadata?.clauses || {})
        .filter(([_, clause]) => clause && typeof clause === "object" && clause.enabled)
        .map(([key, clause]) => `${key}: ${clause.text}`)
        .join("\n\n"),

      // === HONORAIRES (colonnes existantes) ===
      honoraires_professionnel: leaseData.honoraires_professionnel ? "true" : "false",
      honoraires_locataire_visite: leaseData.honoraires_locataire_visite?.toString(),
      plafond_honoraires_locataire: leaseData.plafond_honoraires_locataire?.toString(),
      honoraires_bailleur_visite: leaseData.honoraires_bailleur_visite?.toString(),
      etat_lieux_professionnel: leaseData.etat_lieux_professionnel ? "true" : "false",
      honoraires_locataire_etat_lieux: leaseData.honoraires_locataire_etat_lieux?.toString(),
      plafond_honoraires_etat_lieux: leaseData.plafond_honoraires_etat_lieux?.toString(),
      honoraires_bailleur_etat_lieux: leaseData.honoraires_bailleur_etat_lieux?.toString(),
      autres_prestations: leaseData.autres_prestations ? "true" : "false",
      details_autres_prestations: leaseData.details_autres_prestations,
      honoraires_autres_prestations: leaseData.honoraires_autres_prestations?.toString(),
      honoraires_bailleur:
        Number(leaseData.honoraires_bailleur_visite || 0) + Number(leaseData.honoraires_bailleur_etat_lieux || 0),
      honoraires_locataire:
        Number(leaseData.honoraires_locataire_visite || 0) + Number(leaseData.honoraires_locataire_etat_lieux || 0),
      plafond_honoraires_visite: Number(leaseData.plafond_honoraires_locataire || 0),

      // === MEUBLÉ/FRANCHISE/CLAUSE LIBRE (colonnes existantes) ===
      mise_disposition_meubles: leaseData.mise_disposition_meubles,
      franchise_loyer: leaseData.franchise_loyer,
      clause_libre: leaseData.clause_libre,

      // === ANNEXES (colonnes existantes) ===
      annexe_reglement: false,
      annexe_dpe: false,
      annexe_plomb: false,
      annexe_amiante: false,
      annexe_electricite_gaz: false,
      annexe_risques: false,
      annexe_notice: false,
      annexe_etat_lieux: false,
      annexe_autorisation: false,
      annexe_references_loyers: false,
      annexe_actes_caution: null,

      // === AUTRES CHAMPS (colonnes existantes) ===
      usage_prevu: "résidence principale",
      etage: leaseData.etage || null,
      ville_signature: "Non spécifié",
      lieu_signature: "Non spécifié",
      date_signature: null,
      signed_date: null,

      // === COMPLETION (colonnes existantes) ===
      completion_rate: 100,
      completion_percentage: 100,
      form_version: "v12_dynamic_fields",
      last_updated_section: "clauses",
      completed_data: {},
      data_completed_at: new Date().toISOString(),
      document_validation_status: "pending",

      // === MÉTADONNÉES (colonne existante) ===
      metadata: {
        form_version: "v12_dynamic_fields",
        locataires: metadata?.locataires || [],
        garants: metadata?.garants || [],
        clauses: metadata?.clauses || {},
        bail_type: leaseData.bail_type,
        owner_type: leaseData.owner_type,
        guarantee_type: leaseData.guarantee_type,
        ...metadata,
      },

      // === TIMESTAMPS (colonnes existantes) ===
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("📝 [LEASES] Données préparées pour insertion:", Object.keys(insertData).length, "champs")

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
        tenant:users!leases_tenant_id_fkey(*)
      `)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })

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

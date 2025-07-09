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

    // Préparer les données pour l'insertion avec mapping complet
    const insertData = {
      // === CHAMPS DE BASE ===
      property_id: leaseData.property_id,
      tenant_id: leaseData.tenant_id,
      owner_id: leaseData.owner_id,
      start_date: leaseData.start_date,
      end_date: leaseData.end_date,
      monthly_rent: Number(leaseData.monthly_rent) || 0,
      charges: Number(leaseData.charges) || 0,
      deposit_amount: Number(leaseData.deposit_amount) || 0,
      security_deposit: Number(leaseData.security_deposit) || 0,
      lease_type: leaseData.lease_type,
      status: "draft",
      signed_by_tenant: false,
      signed_by_owner: false,
      application_id: leaseData.application_id,

      // === PARTIES - BAILLEUR ===
      bailleur_nom_prenom: leaseData.bailleur_nom_prenom,
      bailleur_email: leaseData.bailleur_email,
      bailleur_telephone: leaseData.bailleur_telephone,
      bailleur_domicile: leaseData.bailleur_adresse,
      bailleur_qualite:
        leaseData.owner_type === "individual"
          ? "Particulier"
          : leaseData.owner_type === "sci"
            ? "SCI"
            : "Personne morale",
      email_bailleur: leaseData.bailleur_email,

      // Mandataire
      mandataire_represente: leaseData.mandataire_represente ? "true" : "false",
      mandataire_nom: leaseData.mandataire_nom,
      mandataire_adresse: leaseData.mandataire_adresse,
      mandataire_activite: leaseData.mandataire_activite,
      mandataire_carte_pro: leaseData.mandataire_carte_pro,
      mandataire_garant_nom: leaseData.mandataire_garant_nom,
      mandataire_garant_adresse: leaseData.mandataire_garant_adresse,

      // SCI
      sci_denomination: leaseData.sci_denomination,
      sci_mandataire_nom: leaseData.sci_mandataire_nom,
      sci_mandataire_adresse: leaseData.sci_mandataire_adresse,

      // Personne morale
      personne_morale_denomination: leaseData.personne_morale_denomination,
      personne_morale_mandataire_nom: leaseData.personne_morale_mandataire_nom,
      personne_morale_mandataire_adresse: leaseData.personne_morale_mandataire_adresse,

      // === LOCATAIRES ===
      locataire_nom_prenom: metadata?.locataires?.[0]
        ? `${metadata.locataires[0].prenom} ${metadata.locataires[0].nom}`
        : null,
      locataire_email: metadata?.locataires?.[0]?.email,
      email_locataire: metadata?.locataires?.[0]?.email,

      // === LOGEMENT ===
      adresse_logement: leaseData.adresse_logement,
      complement_adresse_logement: leaseData.complement_adresse,
      complement_adresse: leaseData.complement_adresse,
      nombre_pieces: Number(leaseData.nombre_pieces) || null,
      surface_habitable: Number(leaseData.surface_habitable) || null,
      surface_m2: Number(leaseData.surface_habitable) || null,
      performance_dpe: leaseData.performance_dpe,
      type_habitat: leaseData.type_habitat,
      type_habitat_detail: leaseData.type_habitat,
      regime_juridique: leaseData.regime_juridique,
      destination_locaux: leaseData.destination_locaux,
      production_chauffage: leaseData.production_chauffage,
      modalite_chauffage: leaseData.production_chauffage,
      production_eau_chaude: leaseData.production_eau_chaude,
      modalite_eau_chaude: leaseData.production_eau_chaude,
      identifiant_fiscal: leaseData.identifiant_fiscal,
      periode_construction: leaseData.periode_construction,

      // === TABLEAUX POSTGRESQL (text[]) ===
      // Pour les colonnes text[], on passe directement les tableaux JavaScript
      autres_parties_types: leaseData.autres_parties_types || [],
      autres_parties_autres: leaseData.autres_parties_autres,
      equipements_types: leaseData.equipements_logement_types || [],
      equipements_autres: leaseData.equipements_logement_autres,
      locaux_privatifs_types: leaseData.locaux_privatifs_types || [],
      cave_numero: leaseData.cave_numero,
      parking_numero: leaseData.parking_numero,
      garage_numero: leaseData.garage_numero,
      locaux_privatifs_autres: leaseData.locaux_privatifs_autres,
      locaux_communs_types: leaseData.locaux_communs_types || [],
      locaux_communs_autres: leaseData.locaux_communs_autres,
      equipement_technologies_types: leaseData.equipement_technologies_types || [],

      // === COLONNES JSONB ===
      // Pour les colonnes jsonb, on peut passer directement les objets/tableaux JavaScript
      equipements_logement: leaseData.equipements_logement_types || [],
      equipements_privatifs: leaseData.locaux_privatifs_types || [],
      equipements_communs: leaseData.locaux_communs_types || [],
      equipements_technologies: leaseData.equipement_technologies_types || [],

      // Champs texte pour compatibilité
      equipements_logement_types: leaseData.equipements_logement_types?.join(",") || null,
      equipements_logement_autres: leaseData.equipements_logement_autres,

      // === FINANCIER ===
      loyer_mensuel: Number(leaseData.loyer_mensuel) || null,
      montant_loyer_mensuel: Number(leaseData.loyer_mensuel) || null,
      loyer: Number(leaseData.loyer_mensuel) || null,
      depot_garantie: Number(leaseData.depot_garantie) || null,
      montant_depot_garantie: Number(leaseData.depot_garantie) || null,

      // Zone encadrée
      zone_encadree: leaseData.zone_encadree || false,
      soumis_loyer_reference: leaseData.zone_encadree || false,
      loyer_reference: Number(leaseData.loyer_reference) || null,
      loyer_reference_majore: Number(leaseData.loyer_reference_majore) || null,
      complement_loyer: Number(leaseData.complement_loyer) || null,
      complement_loyer_justification: leaseData.complement_loyer_justification,

      zone_tendue: leaseData.zone_tendue || false,

      // Charges
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

      // Assurance colocation
      assurance_colocataires: leaseData.assurance_colocataires || false,
      assurance_colocataire: leaseData.assurance_colocataires || false,
      assurance_montant: Number(leaseData.assurance_montant) || null,
      assurance_colocataire_montant: Number(leaseData.assurance_montant) || null,
      assurance_frequence: leaseData.assurance_frequence,
      assurance_colocataire_frequence: leaseData.assurance_frequence,

      // IRL et révision
      trimestre_reference_irl: leaseData.trimestre_reference_irl,
      date_revision_loyer: leaseData.date_revision_loyer,
      date_revision:
        leaseData.date_revision_loyer === "autre"
          ? leaseData.date_revision_personnalisee
          : leaseData.date_revision_loyer,
      date_revision_personnalisee: leaseData.date_revision_personnalisee,
      ancien_locataire_duree: leaseData.ancien_locataire_duree,
      dernier_loyer_ancien: Number(leaseData.dernier_loyer_ancien) || null,
      date_dernier_loyer: leaseData.date_dernier_loyer,
      date_revision_dernier_loyer: leaseData.date_revision_dernier_loyer,

      // Énergie
      estimation_depenses_energie_min: Number(leaseData.estimation_depenses_energie_min) || null,
      estimation_depenses_energie_max: Number(leaseData.estimation_depenses_energie_max) || null,
      annee_reference_energie: leaseData.annee_reference_energie,

      // === DURÉE ===
      date_entree: leaseData.date_entree,
      date_prise_effet: leaseData.date_entree,
      date_debut: leaseData.date_entree,
      date_fin: leaseData.end_date,
      duree_contrat: leaseData.duree_contrat?.toString(),
      duree: Number(leaseData.duree_contrat) || null,
      contrat_duree_reduite: leaseData.contrat_duree_reduite || false,
      raison_duree_reduite: leaseData.raison_duree_reduite,
      evenement_duree_reduite: leaseData.raison_duree_reduite,

      // Paiement
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

      // === CLAUSES ===
      clause_solidarite: metadata?.clauses?.clause_solidarite?.enabled || false,
      clause_resolutoire: metadata?.clauses?.clause_resolutoire?.enabled || false,

      // === HONORAIRES ===
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

      // === MEUBLÉ/FRANCHISE/CLAUSE LIBRE ===
      mise_disposition_meubles: leaseData.mise_disposition_meubles,
      franchise_loyer: leaseData.franchise_loyer,
      clause_libre: leaseData.clause_libre,

      // === ANNEXES ===
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

      // === USAGE ===
      usage_prevu: "résidence principale",

      // === COMPLETION ===
      completion_rate: 100,
      completion_percentage: 100,
      form_version: "v12_dynamic_fields",
      completed_data: {},
      data_completed_at: new Date().toISOString(),
      document_validation_status: "pending",

      // === MÉTADONNÉES ===
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

      // === TIMESTAMPS ===
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("📝 [LEASES] Données préparées pour insertion:", Object.keys(insertData).length, "champs")

    // Insérer le bail
    const { data: lease, error: insertError } = await supabase.from("leases").insert(insertData).select("*").single()

    if (insertError) {
      console.error("❌ [LEASES] Erreur insertion:", insertError)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la création du bail", details: insertError.message },
        { status: 500 },
      )
    }

    console.log("✅ [LEASES] Bail créé avec succès:", lease.id)

    // Gérer les clauses spécifiques dans la table lease_clauses si nécessaire
    if (metadata?.clauses) {
      const clausesToInsert = []

      for (const [category, clauseData] of Object.entries(metadata.clauses)) {
        if (clauseData && typeof clauseData === "object" && clauseData.enabled) {
          clausesToInsert.push({
            lease_id: lease.id,
            category: category,
            clause_text: clauseData.text || "",
            is_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      }

      if (clausesToInsert.length > 0) {
        const { error: clausesError } = await supabase.from("lease_clauses").insert(clausesToInsert)

        if (clausesError) {
          console.error("❌ [LEASES] Erreur insertion clauses:", clausesError)
          // Ne pas faire échouer la création du bail pour les clauses
        } else {
          console.log(`✅ [LEASES] ${clausesToInsert.length} clauses insérées pour le bail ${lease.id}`)
        }
      }
    }

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
      return NextResponse.json({ success: false, error: "Erreur lors de la récupération des baux" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      leases: leases || [],
    })
  } catch (error) {
    console.error("❌ [LEASES] Erreur:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la récupération des baux" }, { status: 500 })
  }
}

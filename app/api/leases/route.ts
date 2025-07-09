import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const leaseData = await request.json()

    console.log("Données reçues pour création du bail:", {
      property_id: leaseData.property_id,
      tenant_id: leaseData.tenant_id,
      owner_id: leaseData.owner_id,
      lease_type: leaseData.lease_type,
      monthly_rent: leaseData.monthly_rent,
      charges: leaseData.charges,
      deposit_amount: leaseData.deposit_amount,
      start_date: leaseData.start_date,
      end_date: leaseData.end_date,
      metadata_keys: Object.keys(leaseData.metadata || {}),
      clauses_count: Object.keys(leaseData.metadata?.clauses || {}).length,
    })

    // Insérer le bail principal
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .insert({
        property_id: leaseData.property_id,
        tenant_id: leaseData.tenant_id,
        owner_id: leaseData.owner_id,
        start_date: leaseData.start_date,
        end_date: leaseData.end_date,
        monthly_rent: leaseData.monthly_rent,
        charges: leaseData.charges,
        deposit_amount: leaseData.deposit_amount,
        lease_type: leaseData.lease_type,
        status: "draft",
        application_id: leaseData.application_id,

        // Tous les champs du formulaire SAUF les clauses individuelles
        bail_type: leaseData.bail_type,
        owner_type: leaseData.owner_type,
        guarantee_type: leaseData.guarantee_type,

        // === PARTIES - BAILLEUR COMPLET ===
        bailleur_qualite:
          leaseData.owner_type === "company"
            ? "Personne morale"
            : leaseData.owner_type === "sci"
              ? "SCI"
              : "Personne physique",

        // === PARTIES - LOCATAIRE COMPLET ===
        locataire_nom_prenom:
          leaseData.locataires && leaseData.locataires[0]
            ? `${leaseData.locataires[0].prenom} ${leaseData.locataires[0].nom}`
            : null,
        locataire_email: (leaseData.locataires && leaseData.locataires[0]?.email) || null,
        telephone_locataire: (leaseData.locataires && leaseData.locataires[0]?.telephone) || null,
        locataire_domicile: (leaseData.locataires && leaseData.locataires[0]?.adresse) || null,

        // Parties
        bailleur_nom_prenom: leaseData.bailleur_nom_prenom,
        bailleur_email: leaseData.bailleur_email,
        bailleur_telephone: leaseData.bailleur_telephone,
        bailleur_adresse: leaseData.bailleur_adresse,
        mandataire_represente: leaseData.mandataire_represente,
        mandataire_nom: leaseData.mandataire_nom,
        mandataire_adresse: leaseData.mandataire_adresse,
        mandataire_activite: leaseData.mandataire_activite,
        mandataire_carte_pro: leaseData.mandataire_carte_pro,
        mandataire_garant_nom: leaseData.mandataire_garant_nom,
        mandataire_garant_adresse: leaseData.mandataire_garant_adresse,
        sci_denomination: leaseData.sci_denomination,
        sci_mandataire_nom: leaseData.sci_mandataire_nom,
        sci_mandataire_adresse: leaseData.sci_mandataire_adresse,
        sci_mandataire_activite: leaseData.sci_mandataire_activite,
        sci_mandataire_carte_pro: leaseData.sci_mandataire_carte_pro,
        personne_morale_denomination: leaseData.personne_morale_denomination,
        personne_morale_mandataire_nom: leaseData.personne_morale_mandataire_nom,
        personne_morale_mandataire_adresse: leaseData.personne_morale_mandataire_adresse,
        personne_morale_mandataire_activite: leaseData.personne_morale_mandataire_activite,
        personne_morale_mandataire_carte_pro: leaseData.personne_morale_mandataire_carte_pro,

        // Logement
        nombre_pieces: leaseData.nombre_pieces,
        surface_habitable: leaseData.surface_habitable,
        adresse_logement: leaseData.adresse_logement,
        complement_adresse: leaseData.complement_adresse,

        // === LOGEMENT COMPLET ===
        localisation_logement: [leaseData.adresse_logement, leaseData.complement_adresse].filter(Boolean).join(", "),
        periode_construction: leaseData.periode_construction,
        autres_parties:
          leaseData.autres_parties_types?.length > 0
            ? [...leaseData.autres_parties_types, leaseData.autres_parties_autres].filter(Boolean).join(", ")
            : null,
        elements_equipements:
          leaseData.equipements_logement_types?.length > 0
            ? [...leaseData.equipements_logement_types, leaseData.equipements_logement_autres]
                .filter(Boolean)
                .join(", ")
            : null,
        locaux_accessoires:
          leaseData.locaux_privatifs_types?.length > 0
            ? [...leaseData.locaux_privatifs_types, leaseData.locaux_privatifs_autres].filter(Boolean).join(", ")
            : null,
        locaux_communs:
          leaseData.locaux_communs_types?.length > 0
            ? [...leaseData.locaux_communs_types, leaseData.locaux_communs_autres].filter(Boolean).join(", ")
            : null,
        equipement_technologies: leaseData.equipement_technologies_types?.join(", ") || null,
        modalite_chauffage: leaseData.production_chauffage,
        modalite_eau_chaude: leaseData.production_eau_chaude,
        niveau_performance_dpe: leaseData.performance_dpe,

        periode_construction: leaseData.periode_construction,
        performance_dpe: leaseData.performance_dpe,
        type_habitat: leaseData.type_habitat,
        regime_juridique: leaseData.regime_juridique,
        destination_locaux: leaseData.destination_locaux,
        production_chauffage: leaseData.production_chauffage,
        production_eau_chaude: leaseData.production_eau_chaude,
        autres_parties: leaseData.autres_parties,
        equipements_logement: leaseData.equipements_logement,
        equipements_privatifs: leaseData.equipements_privatifs,
        equipements_communs: leaseData.equipements_communs,
        equipements_technologies: leaseData.equipements_technologies,
        identifiant_fiscal: leaseData.identifiant_fiscal,

        // Financier
        zone_encadree: leaseData.zone_encadree,
        loyer_reference: leaseData.loyer_reference,
        loyer_reference_majore: leaseData.loyer_reference_majore,
        complement_loyer: leaseData.complement_loyer,
        complement_loyer_justification: leaseData.complement_loyer_justification,
        zone_tendue: leaseData.zone_tendue,
        type_charges: leaseData.type_charges,
        modalite_revision_forfait: leaseData.modalite_revision_forfait,
        assurance_colocataires: leaseData.assurance_colocataires,
        assurance_montant: leaseData.assurance_montant,
        assurance_frequence: leaseData.assurance_frequence,
        trimestre_reference_irl: leaseData.trimestre_reference_irl,
        date_revision_loyer: leaseData.date_revision_loyer,
        date_revision_personnalisee: leaseData.date_revision_personnalisee,
        ancien_locataire_duree: leaseData.ancien_locataire_duree,
        dernier_loyer_ancien: leaseData.dernier_loyer_ancien,
        date_dernier_loyer: leaseData.date_dernier_loyer,
        date_revision_dernier_loyer: leaseData.date_revision_dernier_loyer,
        estimation_depenses_energie_min: leaseData.estimation_depenses_energie_min,
        estimation_depenses_energie_max: leaseData.estimation_depenses_energie_max,
        annee_reference_energie: leaseData.annee_reference_energie,

        // === FINANCIER COMPLET ===
        montant_loyer_mensuel: Number(leaseData.loyer_mensuel) || null,
        montant_provisions_charges: Number(leaseData.montant_charges) || null,
        montant_depot_garantie: Number(leaseData.depot_garantie) || null,
        soumis_loyer_reference: leaseData.zone_encadree,
        montant_loyer_reference: Number(leaseData.loyer_reference) || null,
        montant_loyer_reference_majore: Number(leaseData.loyer_reference_majore) || null,
        complement_loyer: Number(leaseData.complement_loyer) || null,
        soumis_decret_evolution: leaseData.zone_tendue,
        modalite_reglement_charges: leaseData.type_charges,
        modalites_revision_forfait: leaseData.modalite_revision_forfait,
        date_revision:
          leaseData.date_revision_loyer === "autre"
            ? leaseData.date_revision_personnalisee
            : leaseData.date_revision_loyer,
        date_reference_irl: leaseData.trimestre_reference_irl,
        periodicite_paiement: "Mensuel",
        paiement_echeance: leaseData.paiement_avance ? "À échoir" : "À terme échu",
        date_paiement: `Le ${leaseData.jour_paiement_loyer} de chaque mois`,
        lieu_paiement:
          leaseData.mode_paiement_loyer === "virement" ? "Virement bancaire" : leaseData.mode_paiement_loyer,
        montant_depenses_energie:
          leaseData.estimation_depenses_energie_min && leaseData.estimation_depenses_energie_max
            ? `${leaseData.estimation_depenses_energie_min} - ${leaseData.estimation_depenses_energie_max} €/an`
            : null,

        // Durée
        duree_contrat: leaseData.duree_contrat,
        contrat_duree_reduite: leaseData.contrat_duree_reduite,
        raison_duree_reduite: leaseData.raison_duree_reduite,
        jour_paiement_loyer: leaseData.jour_paiement_loyer,
        paiement_avance: leaseData.paiement_avance,

        // === DATES ET DURÉE ===
        date_prise_effet: leaseData.date_entree?.toISOString().split("T")[0],
        evenement_duree_reduite: leaseData.raison_duree_reduite,

        // Clauses génériques
        clause_resolutoire: leaseData.clause_resolutoire,
        clause_solidarite: leaseData.clause_solidarite,
        visites_relouer_vendre: leaseData.visites_relouer_vendre,
        mode_paiement_loyer: leaseData.mode_paiement_loyer,
        mise_disposition_meubles: leaseData.mise_disposition_meubles,

        // === CLAUSES PRINCIPALES ===
        clause_solidarite: leaseData.clauses?.clause_solidarite?.enabled || false,
        clause_resolutoire: leaseData.clauses?.clause_resolutoire?.enabled || false,
        usage_prevu: "résidence principale",

        // Honoraires
        honoraires_professionnel: leaseData.honoraires_professionnel,
        honoraires_locataire_visite: leaseData.honoraires_locataire_visite,
        plafond_honoraires_locataire: leaseData.plafond_honoraires_locataire,
        honoraires_bailleur_visite: leaseData.honoraires_bailleur_visite,
        etat_lieux_professionnel: leaseData.etat_lieux_professionnel,
        honoraires_locataire_etat_lieux: leaseData.honoraires_locataire_etat_lieux,
        plafond_honoraires_etat_lieux: leaseData.plafond_honoraires_etat_lieux,
        honoraires_bailleur_etat_lieux: leaseData.honoraires_bailleur_etat_lieux,
        autres_prestations: leaseData.autres_prestations,
        details_autres_prestations: leaseData.details_autres_prestations,
        honoraires_autres_prestations: leaseData.honoraires_autres_prestations,

        // === HONORAIRES ===
        plafond_honoraires_visite: Number(leaseData.plafond_honoraires_locataire) || null,
        plafond_honoraires_etat_lieux: Number(leaseData.plafond_honoraires_etat_lieux) || null,
        honoraires_bailleur: Number(leaseData.honoraires_bailleur_visite) || null,
        honoraires_locataire: Number(leaseData.honoraires_locataire_visite) || null,

        franchise_loyer: leaseData.franchise_loyer,
        clause_libre: leaseData.clause_libre,

        // Annexes
        annexe_surface_habitable: leaseData.annexe_surface_habitable,
        annexe_dpe: leaseData.annexe_dpe,
        annexe_plomb: leaseData.annexe_plomb,
        annexe_amiante: leaseData.annexe_amiante,
        annexe_electricite: leaseData.annexe_electricite,
        annexe_gaz: leaseData.annexe_gaz,
        annexe_erp: leaseData.annexe_erp,
        annexe_bruit: leaseData.annexe_bruit,
        annexe_autres: leaseData.annexe_autres,
        annexe_etat_lieux: leaseData.annexe_etat_lieux,
        annexe_notice_information: leaseData.annexe_notice_information,
        annexe_inventaire_meubles: leaseData.annexe_inventaire_meubles,
        annexe_liste_charges: leaseData.annexe_liste_charges,
        annexe_reparations_locatives: leaseData.annexe_reparations_locatives,
        annexe_grille_vetuste: leaseData.annexe_grille_vetuste,
        annexe_bail_parking: leaseData.annexe_bail_parking,
        annexe_actes_caution: leaseData.annexe_actes_caution,

        // === SIGNATURE ===
        lieu_signature: leaseData.lieu_signature || null,
        date_signature: new Date().toISOString().split("T")[0],

        // === ANNEXES ===
        annexe_dpe: true,
        annexe_risques: true,
        annexe_notice: true,
        annexe_etat_lieux: false,
        annexe_reglement: false,
        annexe_plomb: false,
        annexe_amiante: false,
        annexe_electricite_gaz: false,
        annexe_autorisation: false,
        annexe_references_loyers: false,

        // === CHAMPS DE COMPLETION ===
        completion_rate: 100,
        data_completed_at: new Date().toISOString(),

        // Métadonnées
        metadata: {
          form_version: "v13_complete_form",
          locataires: leaseData.locataires,
          garants: leaseData.garants,
          clauses: leaseData.clauses,
          bail_type: leaseData.bail_type,
          owner_type: leaseData.owner_type,
          guarantee_type: leaseData.guarantee_type,
          autres_parties_types: leaseData.autres_parties_types,
          equipements_logement_types: leaseData.equipements_logement_types,
          locaux_privatifs_types: leaseData.locaux_privatifs_types,
          locaux_communs_types: leaseData.locaux_communs_types,
          equipement_technologies_types: leaseData.equipement_technologies_types,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (leaseError) {
      console.error("Erreur création bail:", leaseError)
      return NextResponse.json({ error: `Erreur lors de la création du bail: ${leaseError.message}` }, { status: 400 })
    }

    console.log("Bail créé avec succès:", lease.id)

    // Gérer les clauses spécifiques dans la table lease_clauses
    if (leaseData.metadata?.clauses) {
      const clausesToInsert = []

      for (const [category, clauseData] of Object.entries(leaseData.metadata.clauses)) {
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
          console.error("Erreur insertion clauses:", clausesError)
          // Ne pas faire échouer la création du bail pour les clauses
        } else {
          console.log(`${clausesToInsert.length} clauses insérées pour le bail ${lease.id}`)
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
        console.error("Erreur mise à jour candidature:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      lease: lease,
      message: "Bail créé avec succès",
    })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("owner_id")

    if (!ownerId) {
      return NextResponse.json({ error: "owner_id requis" }, { status: 400 })
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
      console.error("Erreur récupération baux:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des baux" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      leases: leases || [],
    })
  } catch (error) {
    console.error("Erreur serveur:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

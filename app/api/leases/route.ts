import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📝 [LEASES API] Données reçues:", Object.keys(body))

    // Validation des champs obligatoires
    const requiredFields = ["property_id", "tenant_id", "owner_id", "start_date", "monthly_rent"]
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      console.error("❌ [LEASES API] Champs manquants:", missingFields)
      return NextResponse.json({ error: `Champs obligatoires manquants: ${missingFields.join(", ")}` }, { status: 400 })
    }

    // Préparer les données pour l'insertion - CORRECTION DES TYPES
    const leaseData = {
      // Champs de base
      property_id: body.property_id,
      tenant_id: body.tenant_id,
      owner_id: body.owner_id,
      start_date: body.start_date,
      end_date: body.end_date || null,
      monthly_rent: Number.parseFloat(String(body.monthly_rent)) || 0,
      charges: Number.parseFloat(String(body.charges)) || 0,
      deposit_amount: Number.parseFloat(String(body.deposit_amount)) || 0,
      lease_type: body.lease_type || "unfurnished",
      status: "draft",
      application_id: body.application_id || null,

      // === SÉLECTION DE BASE ===
      bail_type: body.bail_type || null,
      owner_type: body.owner_type || null,
      guarantee_type: body.guarantee_type || null,

      // === PARTIES - BAILLEUR ===
      bailleur_nom_prenom: body.bailleur_nom_prenom || null,
      bailleur_domicile: body.bailleur_domicile || null,
      bailleur_email: body.bailleur_email || null,
      bailleur_telephone: body.bailleur_telephone || null,
      bailleur_qualite: body.bailleur_qualite || null,

      // Mandataire
      mandataire_represente: body.mandataire_represente || false,
      mandataire_nom: body.mandataire_nom || null,
      mandataire_adresse: body.mandataire_adresse || null,
      mandataire_activite: body.mandataire_activite || null,
      mandataire_carte_pro: body.mandataire_carte_pro || null,
      mandataire_garant_nom: body.mandataire_garant_nom || null,
      mandataire_garant_adresse: body.mandataire_garant_adresse || null,

      // === PARTIES - LOCATAIRE ===
      locataire_nom_prenom: body.locataire_nom_prenom || null,
      locataire_domicile: body.locataire_domicile || null,
      locataire_email: body.locataire_email || null,
      locataire_telephone: body.locataire_telephone || null,
      locataire_date_naissance: body.locataire_date_naissance || null,

      // === LOGEMENT DÉTAILLÉ ===
      localisation_logement: body.localisation_logement || null,
      identifiant_fiscal: body.identifiant_fiscal || null,
      type_habitat: body.type_habitat || null,
      regime_juridique: body.regime_juridique || null,
      periode_construction: body.periode_construction || null,
      surface_habitable: body.surface_habitable ? Number.parseFloat(String(body.surface_habitable)) : null,
      nombre_pieces: body.nombre_pieces ? Number.parseInt(String(body.nombre_pieces)) : null,
      autres_parties: body.autres_parties || null,
      elements_equipements: body.elements_equipements || null,
      modalite_chauffage: body.modalite_chauffage || null,
      modalite_eau_chaude: body.modalite_eau_chaude || null,
      niveau_performance_dpe: body.niveau_performance_dpe || null,
      destination_locaux: body.destination_locaux || null,
      locaux_accessoires: body.locaux_accessoires || null,
      locaux_communs: body.locaux_communs || null,
      equipement_technologies: body.equipement_technologies || null,

      // === FINANCIER COMPLET ===
      montant_loyer_mensuel: body.montant_loyer_mensuel ? Number.parseFloat(String(body.montant_loyer_mensuel)) : null,
      montant_depot_garantie: body.montant_depot_garantie
        ? Number.parseFloat(String(body.montant_depot_garantie))
        : null,

      // Encadrement loyer
      zone_encadree: body.zone_encadree || false,
      montant_loyer_reference: body.montant_loyer_reference
        ? Number.parseFloat(String(body.montant_loyer_reference))
        : null,
      montant_loyer_reference_majore: body.montant_loyer_reference_majore
        ? Number.parseFloat(String(body.montant_loyer_reference_majore))
        : null,
      complement_loyer: body.complement_loyer ? Number.parseFloat(String(body.complement_loyer)) : null,
      complement_loyer_justification: body.complement_loyer_justification || null,

      // Charges
      type_charges: body.type_charges || null,
      montant_provisions_charges: body.montant_provisions_charges
        ? Number.parseFloat(String(body.montant_provisions_charges))
        : null,
      modalite_reglement_charges: body.modalite_reglement_charges || null,
      modalites_revision_forfait: body.modalites_revision_forfait || null,

      // Assurance colocataires
      assurance_colocataires: body.assurance_colocataires || false,
      montant_assurance_colocataires_annuel: body.montant_assurance_colocataires_annuel
        ? Number.parseFloat(String(body.montant_assurance_colocataires_annuel))
        : null,
      montant_assurance_colocataires_mensuel: body.montant_assurance_colocataires_mensuel
        ? Number.parseFloat(String(body.montant_assurance_colocataires_mensuel))
        : null,
      frequence_assurance: body.frequence_assurance || null,

      // Indexation du loyer
      trimestre_reference_irl: body.trimestre_reference_irl || null,
      date_revision_loyer: body.date_revision_loyer || null,
      date_revision_personnalisee: body.date_revision_personnalisee || null,
      zone_tendue: body.zone_tendue || false,
      ancien_locataire_duree: body.ancien_locataire_duree || null,
      dernier_loyer_ancien: body.dernier_loyer_ancien ? Number.parseFloat(String(body.dernier_loyer_ancien)) : null,
      date_dernier_loyer: body.date_dernier_loyer || null,
      date_revision_dernier_loyer: body.date_revision_dernier_loyer || null,

      // Dépenses énergie - CORRECTION: séparer min et max
      montant_depenses_energie_min: body.montant_depenses_energie_min
        ? Number.parseFloat(String(body.montant_depenses_energie_min))
        : null,
      montant_depenses_energie_max: body.montant_depenses_energie_max
        ? Number.parseFloat(String(body.montant_depenses_energie_max))
        : null,
      annee_reference_prix_energie: body.annee_reference_prix_energie || null,

      // Travaux
      travaux_amelioration_montant: body.travaux_amelioration_montant
        ? Number.parseFloat(String(body.travaux_amelioration_montant))
        : null,
      travaux_amelioration_nature: body.travaux_amelioration_nature || null,
      travaux_majoration_loyer: body.travaux_majoration_loyer || false,
      travaux_majoration_nature: body.travaux_majoration_nature || null,
      travaux_majoration_modalites: body.travaux_majoration_modalites || null,
      travaux_majoration_delai: body.travaux_majoration_delai || null,
      travaux_majoration_montant: body.travaux_majoration_montant
        ? Number.parseFloat(String(body.travaux_majoration_montant))
        : null,
      travaux_diminution_loyer: body.travaux_diminution_loyer || false,
      travaux_diminution_duree: body.travaux_diminution_duree || null,
      travaux_diminution_modalites: body.travaux_diminution_modalites || null,

      // === ÉCHÉANCES ===
      date_prise_effet: body.date_prise_effet || null,
      duree_contrat: body.duree_contrat ? Number.parseInt(String(body.duree_contrat)) : null,
      evenement_duree_reduite: body.evenement_duree_reduite || null,
      date_paiement_loyer: body.date_paiement_loyer || null,
      paiement_avance_ou_terme: body.paiement_avance_ou_terme || null,
      lieu_paiement: body.lieu_paiement || null,
      montant_premiere_echeance: body.montant_premiere_echeance
        ? Number.parseFloat(String(body.montant_premiere_echeance))
        : null,

      // === CLAUSES GÉNÉRIQUES ===
      clause_resolutoire: body.clause_resolutoire || false,
      clause_solidarite: body.clause_solidarite || false,
      visites_relouer_vendre: body.visites_relouer_vendre || false,
      mode_paiement_loyer: body.mode_paiement_loyer || null,
      mise_disposition_meubles: body.mise_disposition_meubles || null,
      animaux_domestiques: body.animaux_domestiques || null,
      entretien_appareils: body.entretien_appareils || null,
      degradations_locataire: body.degradations_locataire || null,

      // === HONORAIRES ===
      location_avec_professionnel: body.location_avec_professionnel || false,
      honoraires_locataire_visite: body.honoraires_locataire_visite
        ? Number.parseFloat(String(body.honoraires_locataire_visite))
        : null,
      plafond_honoraires_locataire: body.plafond_honoraires_locataire
        ? Number.parseFloat(String(body.plafond_honoraires_locataire))
        : null,
      honoraires_bailleur_visite: body.honoraires_bailleur_visite
        ? Number.parseFloat(String(body.honoraires_bailleur_visite))
        : null,
      etat_lieux_professionnel: body.etat_lieux_professionnel || false,
      honoraires_locataire_etat_lieux: body.honoraires_locataire_etat_lieux
        ? Number.parseFloat(String(body.honoraires_locataire_etat_lieux))
        : null,
      plafond_honoraires_etat_lieux: body.plafond_honoraires_etat_lieux
        ? Number.parseFloat(String(body.plafond_honoraires_etat_lieux))
        : null,
      honoraires_bailleur_etat_lieux: body.honoraires_bailleur_etat_lieux
        ? Number.parseFloat(String(body.honoraires_bailleur_etat_lieux))
        : null,
      autres_prestations: body.autres_prestations || null,
      honoraires_autres_prestations: body.honoraires_autres_prestations
        ? Number.parseFloat(String(body.honoraires_autres_prestations))
        : null,

      // === CLAUSES OPTIONNELLES ===
      franchise_loyer: body.franchise_loyer || null,
      clause_libre: body.clause_libre || null,
      travaux_bailleur_cours: body.travaux_bailleur_cours || null,
      travaux_locataire_cours: body.travaux_locataire_cours || null,
      travaux_entre_locataires: body.travaux_entre_locataires || null,

      // === ANNEXES ===
      // === ANNEXES (tous les booléens) ===
      annexe_dpe: data.annexe_dpe === true || data.annexe_dpe === "true" ? "true" : "false",
      annexe_risques: data.annexe_risques === true || data.annexe_risques === "true" ? "true" : "false",
      annexe_notice: data.annexe_notice === true || data.annexe_notice === "true" ? "true" : "false",
      annexe_etat_lieux: data.annexe_etat_lieux === true || data.annexe_etat_lieux === "true" ? "true" : "false",
      annexe_reglement: data.annexe_reglement === true || data.annexe_reglement === "true" ? "true" : "false",
      annexe_plomb: data.annexe_plomb === true || data.annexe_plomb === "true" ? "true" : "false",
      annexe_amiante: data.annexe_amiante === true || data.annexe_amiante === "true" ? "true" : "false",
      annexe_electricite_gaz: data.annexe_electricite_gaz === true || data.annexe_electricite_gaz === "true" ? "true" : "false",
      annexe_autorisation: data.annexe_autorisation === true || data.annexe_autorisation === "true" ? "true" : "false",
      annexe_references_loyers: data.annexe_references_loyers === true || data.annexe_references_loyers === "true" ? "true" : "false",

      // === SIGNATURE ===
      lieu_signature: body.lieu_signature || null,
      date_signature: body.date_signature || null,

      // === MÉTADONNÉES ===
      special_conditions: body.special_conditions || null,
      metadata: body.metadata || {},

      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("💾 [LEASES API] Insertion des données...")

    // Insérer le bail
    const { data: lease, error: insertError } = await supabase.from("leases").insert([leaseData]).select().single()

    if (insertError) {
      console.error("❌ [LEASES API] Erreur insertion:", insertError)
      return NextResponse.json({ error: `Erreur lors de la création: ${insertError.message}` }, { status: 500 })
    }

    console.log("✅ [LEASES API] Bail créé avec succès:", lease.id)

    // Insérer les garants si présents
    if (body.garants && Array.isArray(body.garants) && body.garants.length > 0) {
      console.log("👥 [LEASES API] Insertion des garants...")
      const garantsData = body.garants.map((garant: any) => ({
        lease_id: lease.id,
        prenom: garant.prenom || null,
        nom: garant.nom || null,
        adresse: garant.adresse || null,
        date_fin_engagement: garant.date_fin_engagement || null,
        montant_max_engagement: garant.montant_max_engagement
          ? Number.parseFloat(String(garant.montant_max_engagement))
          : null,
        pour_locataire: garant.pour_locataire || null,
        created_at: new Date().toISOString(),
      }))

      const { error: garantsError } = await supabase.from("lease_guarantors").insert(garantsData)

      if (garantsError) {
        console.error("⚠️ [LEASES API] Erreur insertion garants:", garantsError)
        // Ne pas faire échouer la création du bail pour les garants
      } else {
        console.log("✅ [LEASES API] Garants insérés avec succès")
      }
    }

    // Mettre à jour le statut de la candidature si applicable
    if (body.application_id) {
      console.log("📋 [LEASES API] Mise à jour candidature...")
      const { error: updateError } = await supabase
        .from("applications")
        .update({
          status: "lease_created",
          lease_id: lease.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.application_id)

      if (updateError) {
        console.error("⚠️ [LEASES API] Erreur mise à jour candidature:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      lease: lease,
      message: "Bail créé avec succès",
    })
  } catch (error) {
    console.error("❌ [LEASES API] Erreur générale:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne du serveur" },
      { status: 500 },
    )
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
      .select(
        `
        *,
        property:properties(*),
        tenant:users!leases_tenant_id_fkey(*),
        owner:users!leases_owner_id_fkey(*)
      `,
      )
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ [LEASES API] Erreur récupération:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ leases })
  } catch (error) {
    console.error("❌ [LEASES API] Erreur générale GET:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

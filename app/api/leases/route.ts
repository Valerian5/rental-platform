import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const leaseData = await request.json()

    console.log("[LEASES API] Données reçues:", {
      property_id: leaseData.property_id,
      tenant_id: leaseData.tenant_id,
      owner_id: leaseData.owner_id,
      monthly_rent: leaseData.monthly_rent,
      charges: leaseData.charges,
      deposit_amount: leaseData.deposit_amount,
      start_date: leaseData.start_date,
      end_date: leaseData.end_date,
      lease_type: leaseData.lease_type,
      metadata_keys: Object.keys(leaseData.metadata || {}),
      total_fields: Object.keys(leaseData).length,
    })

    // Préparer les données pour l'insertion - MAPPING EXACT AVEC LA TABLE
    const insertData = {
      // === CHAMPS DE BASE ===
      property_id: leaseData.property_id,
      tenant_id: leaseData.tenant_id,
      owner_id: leaseData.owner_id,
      start_date: leaseData.start_date,
      end_date: leaseData.end_date,
      monthly_rent: leaseData.monthly_rent || 0,
      charges: leaseData.charges || 0,
      deposit_amount: leaseData.deposit_amount || 0,
      lease_type: leaseData.lease_type || "unfurnished",
      status: "draft",
      application_id: leaseData.application_id || null,

      // === PARTIES - BAILLEUR ===
      bailleur_nom_prenom: leaseData.bailleur_nom_prenom || null,
      bailleur_domicile: leaseData.bailleur_domicile || null,
      bailleur_email: leaseData.bailleur_email || null,
      bailleur_telephone: leaseData.bailleur_telephone || null,
      bailleur_qualite: leaseData.bailleur_qualite || null,
      mandataire_nom: leaseData.mandataire_nom || null,
      mandataire_adresse: leaseData.mandataire_adresse || null,
      mandataire_activite: leaseData.mandataire_activite || null,
      mandataire_carte_pro: leaseData.mandataire_carte_pro || null,

      // === PARTIES - LOCATAIRE ===
      locataire_nom_prenom: leaseData.locataire_nom_prenom || null,
      locataire_domicile: leaseData.locataire_domicile || null,
      locataire_email: leaseData.locataire_email || null,
      locataire_telephone: leaseData.locataire_telephone || null,
      locataire_date_naissance: leaseData.locataire_date_naissance || null,

      // === LOGEMENT DÉTAILLÉ ===
      localisation_logement: leaseData.localisation_logement || null,
      identifiant_fiscal: leaseData.identifiant_fiscal || null,
      type_habitat: leaseData.type_habitat || null,
      regime_juridique: leaseData.regime_juridique || null,
      periode_construction: leaseData.periode_construction || null,
      surface_habitable: leaseData.surface_habitable || null,
      nombre_pieces: leaseData.nombre_pieces || null,
      autres_parties: leaseData.autres_parties || null,
      elements_equipements: leaseData.elements_equipements || null,
      modalite_chauffage: leaseData.modalite_chauffage || null,
      modalite_eau_chaude: leaseData.modalite_eau_chaude || null,
      niveau_performance_dpe: leaseData.niveau_performance_dpe || null,
      destination_locaux: leaseData.destination_locaux || null,
      locaux_accessoires: leaseData.locaux_accessoires || null,
      locaux_communs: leaseData.locaux_communs || null,
      equipement_technologies: leaseData.equipement_technologies || null,

      // === FINANCIER COMPLET ===
      montant_loyer_reference: leaseData.montant_loyer_reference || null,
      montant_loyer_reference_majore: leaseData.montant_loyer_reference_majore || null,
      complement_loyer: leaseData.complement_loyer || null,
      modalite_reglement_charges: leaseData.modalite_reglement_charges || null,
      modalites_revision_forfait: leaseData.modalites_revision_forfait || null,

      // === INDEXATION DU LOYER ===
      trimestre_reference_irl: leaseData.trimestre_reference_irl || null,
      date_revision_loyer: leaseData.date_revision_loyer || null,
      date_revision_personnalisee: leaseData.date_revision_personnalisee || null,
      zone_tendue: leaseData.zone_tendue || false,
      ancien_locataire_duree: leaseData.ancien_locataire_duree || null,
      dernier_loyer_ancien: leaseData.dernier_loyer_ancien || null,
      date_dernier_loyer: leaseData.date_dernier_loyer || null,
      date_revision_dernier_loyer: leaseData.date_revision_dernier_loyer || null,

      // === DÉPENSES ÉNERGIE ===
      montant_depenses_energie_min: leaseData.montant_depenses_energie_min || null,
      montant_depenses_energie_max: leaseData.montant_depenses_energie_max || null,

      // === ÉCHÉANCES ===
      date_prise_effet: leaseData.date_prise_effet || null,
      duree_contrat: leaseData.duree_contrat || null,
      evenement_duree_reduite: leaseData.evenement_duree_reduite || null,
      date_paiement_loyer: leaseData.date_paiement_loyer || null,
      paiement_avance_ou_terme: leaseData.paiement_avance_ou_terme || null,

      // === CLAUSES ===
      clause_resolutoire: leaseData.clause_resolutoire || false,
      clause_solidarite: leaseData.clause_solidarite || false,
      visites_relouer_vendre: leaseData.visites_relouer_vendre || false,
      mode_paiement_loyer: leaseData.mode_paiement_loyer || null,
      animaux_domestiques: leaseData.animaux_domestiques || null,

      // === HONORAIRES ===
      location_avec_professionnel: leaseData.location_avec_professionnel || false,
      honoraires_locataire_visite: leaseData.honoraires_locataire_visite || null,
      plafond_honoraires_locataire: leaseData.plafond_honoraires_locataire || null,
      honoraires_bailleur_visite: leaseData.honoraires_bailleur_visite || null,
      etat_lieux_professionnel: leaseData.etat_lieux_professionnel || false,
      honoraires_locataire_etat_lieux: leaseData.honoraires_locataire_etat_lieux || null,
      plafond_honoraires_etat_lieux: leaseData.plafond_honoraires_etat_lieux || null,
      honoraires_bailleur_etat_lieux: leaseData.honoraires_bailleur_etat_lieux || null,

      // === CLAUSES OPTIONNELLES ===
      franchise_loyer: leaseData.franchise_loyer || null,
      clause_libre: leaseData.clause_libre || null,
      travaux_bailleur_cours: leaseData.travaux_bailleur_cours || null,

      // === ANNEXES ===
      annexe_dpe: leaseData.annexe_dpe || false,
      annexe_risques: leaseData.annexe_risques || false,
      annexe_notice: leaseData.annexe_notice || false,
      annexe_etat_lieux: leaseData.annexe_etat_lieux || false,
      annexe_reglement: leaseData.annexe_reglement || false,
      annexe_plomb: leaseData.annexe_plomb || false,
      annexe_amiante: leaseData.annexe_amiante || false,
      annexe_electricite_gaz: leaseData.annexe_electricite_gaz || false,

      // === SIGNATURE ===
      lieu_signature: leaseData.lieu_signature || null,
      date_signature: leaseData.date_signature || null,

      // === MÉTADONNÉES ===
      metadata: leaseData.metadata || {},
    }

    console.log("[LEASES API] Données préparées pour insertion:", {
      keys: Object.keys(insertData),
      monthly_rent: insertData.monthly_rent,
      charges: insertData.charges,
      deposit_amount: insertData.deposit_amount,
      montant_depenses_energie_min: insertData.montant_depenses_energie_min,
      montant_depenses_energie_max: insertData.montant_depenses_energie_max,
      surface_habitable: insertData.surface_habitable,
      nombre_pieces: insertData.nombre_pieces,
    })

    // Insérer le bail
    const { data: lease, error } = await supabase.from("leases").insert(insertData).select("*").single()

    if (error) {
      console.error("[LEASES API] Erreur insertion:", error)
      return NextResponse.json(
        {
          error: "Erreur lors de la création du bail",
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 },
      )
    }

    console.log("[LEASES API] Bail créé avec succès:", lease.id)

    // Mettre à jour l'application si fournie
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
        console.error("[LEASES API] Erreur mise à jour application:", updateError)
      } else {
        console.log("[LEASES API] Application mise à jour:", leaseData.application_id)
      }
    }

    return NextResponse.json({
      success: true,
      lease: lease,
      message: "Bail créé avec succès",
    })
  } catch (error) {
    console.error("[LEASES API] Erreur générale:", error)
    return NextResponse.json(
      {
        error: "Erreur serveur lors de la création du bail",
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
      console.error("[LEASES API] Erreur récupération:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des baux" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      leases: leases || [],
    })
  } catch (error) {
    console.error("[LEASES API] Erreur générale GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

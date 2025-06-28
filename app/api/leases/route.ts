import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Créer le client Supabase avec les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [LEASES API] Début création bail")

    // Tester la connexion Supabase
    const { data: testConnection, error: connectionError } = await supabase.from("users").select("id").limit(1)

    if (connectionError) {
      console.error("❌ [LEASES API] Erreur connexion Supabase:", connectionError)
      return NextResponse.json(
        { error: "Erreur de connexion à la base de données", details: connectionError },
        { status: 500 },
      )
    }

    console.log("✅ [LEASES API] Connexion Supabase OK")

    const data = await request.json()
    console.log("📝 [LEASES API] Données reçues:", Object.keys(data).length, "champs")

    // Validation des champs obligatoires
    const requiredFields = ["property_id", "tenant_id", "start_date", "monthly_rent"]
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Champ obligatoire manquant: ${field}` }, { status: 400 })
      }
    }

    // Calculer la date de fin si pas fournie
    let endDate = data.end_date
    if (!endDate && data.start_date && data.duree_contrat) {
      const startDate = new Date(data.start_date)
      const durationMonths = Number.parseInt(data.duree_contrat) || (data.lease_type === "furnished" ? 12 : 36)
      endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + durationMonths)
      endDate = endDate.toISOString().split("T")[0]
    }

    // Préparer les données pour insertion - MAPPING COMPLET
const leaseData = {
  // Identification
  bailleur_nom_prenom: data.bailleur_nom_prenom,
  bailleur_domicile: data.bailleur_domicile,
  bailleur_qualite: data.bailleur_qualite ?? "Particulier",
  bailleur_email: data.bailleur_email ?? data.email_bailleur,
  telephone_bailleur: data.telephone_bailleur,

  locataire_nom_prenom: data.locataire_nom_prenom,
  locataire_email: data.locataire_email ?? data.email_locataire,
  telephone_locataire: data.telephone_locataire,

  // Adresse
  localisation_logement: data.localisation_logement,
  adresse_postale: data.adresse_postale,
  code_postal: data.code_postal,
  ville: data.ville,
  etage: data.etage,
  zone_geographique: data.zone_geographique,

  // Logement
  type_logement: data.type_logement,
  type_habitat: data.type_habitat,
  regime_juridique: data.regime_juridique ?? "Copropriété",
  periode_construction: data.periode_construction,
  surface_habitable: data.surface_habitable,
  surface_m2: data.surface_habitable,
  nombre_pieces: data.nombre_pieces,
  autres_parties: data.autres_parties,
  elements_equipements: data.elements_equipements,
  modalite_chauffage: data.modalite_chauffage,
  modalite_eau_chaude: data.modalite_eau_chaude,
  niveau_performance_dpe: data.niveau_performance_dpe,
  destination_locaux: data.destination_locaux ?? "Usage d'habitation",
  locaux_accessoires: data.locaux_accessoires,
  locaux_communs: data.locaux_communs,
  equipement_technologies: data.equipement_technologies,
  identifiant_fiscal: data.identifiant_fiscal,

  // Dates
  start_date: data.date_prise_effet ?? data.start_date,
  end_date: data.date_fin,
  date_debut: data.date_prise_effet ?? data.start_date,
  date_fin: data.date_fin,
  date_prise_effet: data.date_prise_effet,
  duree: data.duree ?? parseInt(data.duree_contrat),
  duree_contrat: data.duree_contrat,
  evenement_duree_reduite: data.evenement_duree_reduite,

  // Loyer & charges
  loyer: data.montant_loyer_mensuel,
  loyer_cc: data.loyer_cc,
  montant_loyer_mensuel: data.montant_loyer_mensuel,
  mensual_rent: data.montant_loyer_mensuel,
  charges: data.montant_provisions_charges ?? 0,
  montant_provisions_charges: data.montant_provisions_charges,
  modalite_reglement_charges: data.modalite_reglement_charges ?? "Forfait",
  modalites_revision_forfait: data.modalites_revision_forfait,
  soumis_decret_evolution: data.soumis_decret_evolution ?? false,
  soumis_loyer_reference: data.soumis_loyer_reference ?? false,
  montant_loyer_reference: data.montant_loyer_reference,
  montant_loyer_reference_majore: data.montant_loyer_reference_majore,
  complement_loyer: data.complement_loyer ?? 0,
  infos_dernier_loyer: data.infos_dernier_loyer,
  date_revision: data.date_revision,
  date_reference_irl: data.date_reference_irl,
  contribution_economies: data.contribution_economies ?? 0,
  reevaluation_loyer: data.reevaluation_loyer,

  // Paiement
  periodicite_paiement: data.periodicite_paiement ?? "Mensuel",
  paiement_echeance: data.paiement_echeance ?? "À terme échu",
  date_paiement: data.date_paiement ?? "Le 1er de chaque mois",
  lieu_paiement: data.lieu_paiement ?? "Virement bancaire",
  montant_premiere_echeance: data.montant_premiere_echeance,

  // Dépôt & garantie
  montant_depot_garantie: data.montant_depot_garantie,
  deposit: data.montant_depot_garantie,
  deposit_amount: data.montant_depot_garantie,
  security_deposit: data.montant_depot_garantie,

  // Travaux
  travaux_amelioration: data.travaux_amelioration,
  majoration_travaux: data.majoration_travaux ?? 0,
  diminution_travaux: data.diminution_travaux ?? 0,

  // Annexes
  annexe_dpe: data.annexe_dpe ?? false,
  annexe_risques: data.annexe_risques ?? false,
  annexe_notice: data.annexe_notice ?? false,
  annexe_etat_lieux: data.annexe_etat_lieux ?? false,
  annexe_reglement: data.annexe_reglement ?? false,
  annexe_plomb: data.annexe_plomb ?? false,
  annexe_amiante: data.annexe_amiante ?? false,
  annexe_electricite_gaz: data.annexe_electricite_gaz ?? false,
  annexe_autorisation: data.annexe_autorisation ?? false,
  annexe_references_loyers: data.annexe_references_loyers ?? false,

  // Signatures & statut
  clause_solidarite: data.clause_solidarite ?? true,
  clause_resolutoire: data.clause_resolutoire ?? true,
  statut: data.status ?? "draft",
  document_validation_status: data.document_validation_status ?? "pending",
  date_signature: data.date_signature,
  ville_signature: data.lieu_signature,
  nom_bailleur: data.nom_bailleur ?? data.bailleur_nom_prenom,
  nom_locataire: data.nom_locataire ?? data.locataire_nom_prenom,

  // Honoraires
  plafond_honoraires_visite: data.plafond_honoraires_visite,
  plafond_honoraires_etat_lieux: data.plafond_honoraires_etat_lieux,
  honoraires_bailleur: data.honoraires_bailleur ?? 0,
  honoraires_locataire: data.honoraires_locataire ?? 0,

  // Informations diverses
  montant_depenses_energie: data.montant_depenses_energie,
  conditions_particulieres: data.conditions_particulieres,
}


    console.log("💾 [LEASES API] Données préparées pour insertion:", {
      totalFields: Object.keys(leaseData).length,
      bailleur: leaseData.bailleur_nom_prenom,
      locataire: leaseData.locataire_nom_prenom,
      logement: leaseData.localisation_logement,
      loyer: leaseData.montant_loyer_mensuel,
    })

    // Insérer le bail
    const { data: lease, error: insertError } = await supabase.from("leases").insert(leaseData).select("*").single()

    if (insertError) {
      console.error("❌ [LEASES API] Erreur insertion:", insertError)
      return NextResponse.json({ error: "Erreur lors de la création du bail", details: insertError }, { status: 500 })
    }

    console.log("✅ [LEASES API] Bail créé:", lease.id)

    // Mettre à jour l'application si fournie
    if (data.application_id) {
      console.log("🔗 [LEASES API] Mise à jour application:", data.application_id)
      await supabase
        .from("applications")
        .update({
          status: "lease_created",
          lease_id: lease.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.application_id)
    }

    return NextResponse.json({
      success: true,
      message: "Bail créé avec succès",
      lease: lease,
    })
  } catch (error) {
    console.error("❌ [LEASES API] Erreur:", error)
    return NextResponse.json(
      {
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
    const tenantId = searchParams.get("tenant_id")

    let query = supabase.from("leases").select(`
      *,
      property:properties(*),
      tenant:users!leases_tenant_id_fkey(*),
      owner:users!leases_owner_id_fkey(*)
    `)

    if (ownerId) {
      query = query.eq("owner_id", ownerId)
    } else if (tenantId) {
      query = query.eq("tenant_id", tenantId)
    }

    const { data: leases, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur récupération baux:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des baux" }, { status: 500 })
    }

    return NextResponse.json({ leases })
  } catch (error) {
    console.error("Erreur API leases:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

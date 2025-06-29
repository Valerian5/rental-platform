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

    // Préparer les données pour insertion - MAPPING COMPLET selon le schéma CSV
    const leaseData = {
      // === IDENTIFIANTS DE BASE ===
      property_id: data.property_id,
      tenant_id: data.tenant_id,
      owner_id: data.owner_id,
      template_id: data.template_id || null,
      application_id: data.application_id || null,

      // === DATES ===
      start_date: data.start_date || data.date_prise_effet,
      end_date: endDate || data.date_fin,
      date_debut: data.start_date || data.date_prise_effet,
      date_fin: endDate || data.date_fin,
      date_prise_effet: data.date_prise_effet || data.start_date,
      date_signature: data.date_signature || null,
      signed_date: data.signed_date || null,
      owner_signature_date: data.owner_signature_date || null,
      tenant_signature_date: data.tenant_signature_date || null,
      data_completed_at: data.data_completed_at || null,
      document_generated_at: data.document_generated_at || null,

      // === DURÉE ===
      duree: data.duree_contrat ? Number(data.duree_contrat) : null,
      duree_contrat: data.duree_contrat ? String(data.duree_contrat) : null,
      evenement_duree_reduite: data.evenement_duree_reduite || null,

      // === BAILLEUR (selon schéma exact) ===
      nom_bailleur: data.bailleur_nom_prenom || data.nom_bailleur,
      bailleur_nom_prenom: data.bailleur_nom_prenom,
      adresse_bailleur: data.bailleur_domicile || data.adresse_bailleur,
      bailleur_domicile: data.bailleur_domicile,
      email_bailleur: data.bailleur_email || data.email_bailleur,
      bailleur_email: data.bailleur_email,
      bailleur_telephone: data.bailleur_telephone,
      bailleur_qualite: data.bailleur_qualite || "Propriétaire",

      // === LOCATAIRE (selon schéma exact) ===
      nom_locataire: data.locataire_nom_prenom || data.nom_locataire,
      locataire_nom_prenom: data.locataire_nom_prenom,
      locataire_domicile: data.locataire_domicile,
      email_locataire: data.locataire_email || data.email_locataire,
      locataire_email: data.locataire_email,
      telephone_locataire: data.telephone_locataire,

      // === ADRESSE LOGEMENT ===
      localisation_logement: data.localisation_logement,
      adresse_postale: data.adresse_postale,
      code_postal: data.code_postal,
      ville: data.ville,
      etage: data.etage,
      zone_geographique: data.zone_geographique,

      // === LOGEMENT ===
      type_logement: data.type_logement,
      type_habitat: data.type_habitat,
      regime_juridique: data.regime_juridique || "Copropriété",
      periode_construction: data.periode_construction,
      surface_habitable: data.surface_habitable ? Number.parseFloat(data.surface_habitable) : null,
      surface_m2: data.surface_habitable ? Number.parseFloat(data.surface_habitable) : null,
      nombre_pieces: data.nombre_pieces ? Number(data.nombre_pieces) : null,
      autres_parties: data.autres_parties,
      elements_equipements: data.elements_equipements,
      modalite_chauffage: data.modalite_chauffage,
      modalite_eau_chaude: data.modalite_eau_chaude,
      niveau_performance_dpe: data.niveau_performance_dpe,
      destination_locaux: data.destination_locaux || "Usage d'habitation",
      locaux_accessoires: data.locaux_accessoires,
      locaux_communs: data.locaux_communs,
      equipement_technologies: data.equipement_technologies,
      identifiant_fiscal: data.identifiant_fiscal,

      // === FINANCIER (tous les champs loyer) ===
      monthly_rent: data.monthly_rent ? Number.parseFloat(data.monthly_rent) : null,
      loyer: data.monthly_rent ? Number.parseFloat(data.monthly_rent) : null,
      loyer_cc: data.loyer_cc ? Number.parseFloat(data.loyer_cc) : null,
      montant_loyer_mensuel: data.monthly_rent ? Number.parseFloat(data.monthly_rent) : null,

      // Charges
      charges: data.charges ? Number.parseFloat(data.charges) : 0,
      montant_provisions_charges: data.charges ? Number.parseFloat(data.charges) : null,
      modalite_reglement_charges: data.modalite_reglement_charges || "Forfait",
      modalites_revision_forfait: data.modalites_revision_forfait,

      // Encadrement loyer
      soumis_decret_evolution:
        data.soumis_decret_evolution === "Oui" || data.soumis_decret_evolution === true ? "true" : "false",
      soumis_loyer_reference:
        data.soumis_loyer_reference === "Oui" || data.soumis_loyer_reference === true ? "true" : "false",
      montant_loyer_reference: data.montant_loyer_reference ? Number.parseFloat(data.montant_loyer_reference) : null,
      montant_loyer_reference_majore: data.montant_loyer_reference_majore
        ? Number.parseFloat(data.montant_loyer_reference_majore)
        : null,
      complement_loyer: data.complement_loyer ? Number.parseFloat(data.complement_loyer) : 0,

      // Révision loyer
      infos_dernier_loyer: data.infos_dernier_loyer,
      date_revision: data.date_revision,
      date_reference_irl: data.date_reference_irl,
      contribution_economies: data.contribution_economies ? Number.parseFloat(data.contribution_economies) : 0,
      reevaluation_loyer: data.reevaluation_loyer,

      // === PAIEMENT ===
      periodicite_paiement: data.periodicite_paiement || "Mensuel",
      paiement_echeance: data.paiement_echeance || "À terme échu",
      date_paiement: data.date_paiement || "1",
      lieu_paiement: data.lieu_paiement || "Virement bancaire",
      montant_premiere_echeance: data.montant_premiere_echeance
        ? Number.parseFloat(data.montant_premiere_echeance)
        : null,

      // === DÉPÔT DE GARANTIE (tous les champs) ===
      deposit_amount: data.deposit_amount ? Number.parseFloat(data.deposit_amount) : null,
      depot_garantie: data.deposit_amount ? Number.parseFloat(data.deposit_amount) : null,
      montant_depot_garantie: data.deposit_amount ? Number.parseFloat(data.deposit_amount) : null,
      deposit: data.deposit_amount ? Number.parseFloat(data.deposit_amount) : null,
      security_deposit: data.security_deposit ? Number.parseFloat(data.security_deposit) : 0,

      // === TRAVAUX ===
      travaux_amelioration: data.travaux_amelioration,
      majoration_travaux: data.majoration_travaux ? Number.parseFloat(data.majoration_travaux) : 0,
      diminution_travaux: data.diminution_travaux ? Number.parseFloat(data.diminution_travaux) : 0,

      // === ANNEXES (tous les booléens) ===
      annexe_dpe: data.annexe_dpe === true || data.annexe_dpe === "true" ? "true" : "false",
      annexe_risques: data.annexe_risques === true || data.annexe_risques === "true" ? "true" : "false",
      annexe_notice: data.annexe_notice === true || data.annexe_notice === "true" ? "true" : "false",
      annexe_etat_lieux: data.annexe_etat_lieux === true || data.annexe_etat_lieux === "true" ? "true" : "false",
      annexe_reglement: data.annexe_reglement === true || data.annexe_reglement === "true" ? "true" : "false",
      annexe_plomb: data.annexe_plomb === true || data.annexe_plomb === "true" ? "true" : "false",
      annexe_amiante: data.annexe_amiante === true || data.annexe_amiante === "true" ? "true" : "false",
      annexe_electricite_gaz:
        data.annexe_electricite_gaz === true || data.annexe_electricite_gaz === "true" ? "true" : "false",
      annexe_autorisation: data.annexe_autorisation === true || data.annexe_autorisation === "true" ? "true" : "false",
      annexe_references_loyers:
        data.annexe_references_loyers === true || data.annexe_references_loyers === "true" ? "true" : "false",

      // === CLAUSES ===
      clause_solidarite: data.clause_solidarite === "Applicable" || data.clause_solidarite === true ? "true" : "false",
      clause_resolutoire:
        data.clause_resolutoire === "Applicable" || data.clause_resolutoire === true ? "true" : "false",

      // === HONORAIRES ===
      plafond_honoraires_visite: data.plafond_honoraires_visite
        ? Number.parseFloat(data.plafond_honoraires_visite)
        : null,
      plafond_honoraires_etat_lieux: data.plafond_honoraires_etat_lieux
        ? Number.parseFloat(data.plafond_honoraires_etat_lieux)
        : null,
      honoraires_bailleur: data.honoraires_bailleur ? Number.parseFloat(data.honoraires_bailleur) : 0,
      honoraires_locataire: data.honoraires_locataire ? Number.parseFloat(data.honoraires_locataire) : 0,

      // === DIVERS ===
      montant_depenses_energie: data.montant_depenses_energie,
      conditions_particulieres: data.conditions_particulieres,
      clauses_particulieres: data.clauses_particulieres,
      usage_prevu: data.usage_prevu || "résidence principale",
      lieu_signature: data.lieu_signature,
      ville_signature: data.lieu_signature,

      // === TYPE ET STATUT ===
      lease_type: data.lease_type || "unfurnished",
      status: data.status || "draft",
      document_validation_status: data.document_validation_status || "pending",
      signed_by_tenant: data.signed_by_tenant === true || data.signed_by_tenant === "true" ? "true" : "false",
      signed_by_owner: data.signed_by_owner === true || data.signed_by_owner === "true" ? "true" : "false",

      // === DOCUMENTS ===
      document_url: data.document_url,
      lease_document_url: data.lease_document_url,
      generated_document: data.generated_document,

      // === MÉTADONNÉES ===
      metadata: JSON.stringify(
        data.metadata || {
          special_conditions: data.special_conditions || "",
          documents_count: data.documents?.length || 0,
          form_completed: true,
          created_from: "api_v2_complete",
          total_fields_mapped: Object.keys(data).length,
        },
      ),
      completed_data: JSON.stringify(data.completed_data || {}),
      completion_rate: data.completion_rate || 0,

      // === TIMESTAMPS ===
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("💾 [LEASES API] Données préparées pour insertion:", {
      totalFields: Object.keys(leaseData).length,
      bailleur: leaseData.bailleur_nom_prenom,
      locataire: leaseData.locataire_nom_prenom,
      logement: leaseData.localisation_logement,
      loyer: leaseData.monthly_rent,
      charges: leaseData.charges,
      depot: leaseData.deposit_amount,
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

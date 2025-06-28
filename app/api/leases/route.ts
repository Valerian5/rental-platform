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
      // Champs de base
      property_id: data.property_id,
      tenant_id: data.tenant_id,
      owner_id: data.owner_id,
      start_date: data.start_date,
      end_date: endDate,
      monthly_rent: Number.parseFloat(data.monthly_rent) || Number.parseFloat(data.montant_loyer_mensuel) || 0,
      charges: Number.parseFloat(data.charges) || Number.parseFloat(data.montant_provisions_charges) || 0,
      deposit_amount: Number.parseFloat(data.deposit) || Number.parseFloat(data.montant_depot_garantie) || 0,
      lease_type: data.lease_type || "unfurnished",
      status: "draft",
      application_id: data.application_id || null,

      // === PARTIES ===
      bailleur_nom_prenom: data.bailleur_nom_prenom || "",
      bailleur_domicile: data.bailleur_domicile || "",
      bailleur_email: data.bailleur_email || "",
      bailleur_telephone: data.telephone_bailleur || "",
      bailleur_qualite: data.bailleur_qualite || "Propriétaire",

      locataire_nom_prenom: data.locataire_nom_prenom || "",
      locataire_domicile: data.locataire_domicile || "",
      locataire_email: data.locataire_email || "",
      locataire_telephone: data.locataire_telephone || "",
	  email_bailleur: data.email_bailleur || data.bailleur_email || "",
	email_locataire: data.email_locataire || data.locataire_email || "",
	adresse_locataire: data.adresse_locataire || "",
	adresse_bailleur: data.adresse_bailleur || data.bailleur_domicile || "",
	code_postal: data.code_postal || "",
	ville: data.ville || "",

      // === LOGEMENT ===
      localisation_logement: data.localisation_logement || "",
      identifiant_fiscal: data.identifiant_fiscal || "",
      type_habitat: data.type_habitat || "",
      regime_juridique: data.regime_juridique || "Copropriété",
      periode_construction: data.periode_construction || "Après 1949",
      surface_habitable: Number.parseFloat(data.surface_habitable) || 0,
      nombre_pieces: Number.parseInt(data.nombre_pieces) || 0,
      autres_parties: data.autres_parties || "",
      elements_equipements: data.elements_equipements || "",
      modalite_chauffage: data.modalite_chauffage || "",
      modalite_eau_chaude: data.modalite_eau_chaude || "",
      niveau_performance_dpe: data.niveau_performance_dpe || "D",
      destination_locaux: data.destination_locaux || "Usage d'habitation exclusivement",
      locaux_accessoires: data.locaux_accessoires || "",
      locaux_communs: data.locaux_communs || "",
      equipement_technologies: data.equipement_technologies || "",

      // === FINANCIER ===
      montant_loyer_mensuel: Number.parseFloat(data.montant_loyer_mensuel) || Number.parseFloat(data.monthly_rent) || 0,
      soumis_decret_evolution: data.soumis_decret_evolution || "Non",
      soumis_loyer_reference: data.soumis_loyer_reference || "Non",
      montant_provisions_charges:
        Number.parseFloat(data.montant_provisions_charges) || Number.parseFloat(data.charges) || 0,
      modalite_reglement_charges: data.modalite_reglement_charges || "Forfait",
      montant_depot_garantie:
        Number.parseFloat(data.montant_depot_garantie) || Number.parseFloat(data.deposit_amount) || 0,
      periodicite_paiement: data.periodicite_paiement || "Mensuelle",
      paiement_echeance: data.paiement_echeance || "À terme échu",
      date_paiement: data.date_paiement || "1",
      lieu_paiement: data.lieu_paiement || "Virement bancaire",
      montant_depenses_energie: data.montant_depenses_energie || "",

      // === DURÉE ===
      date_prise_effet: data.date_prise_effet || data.start_date,
      duree_contrat: Number.parseInt(data.duree_contrat) || (data.lease_type === "furnished" ? 12 : 36),
      evenement_duree_reduite: data.evenement_duree_reduite || "",

      // === TRAVAUX ===
      montant_travaux_amelioration: data.montant_travaux_amelioration || "",

      // === CONDITIONS ===
      clause_solidarite: data.clause_solidarite || "Applicable",
      clause_resolutoire: data.clause_resolutoire || "Applicable",
      usage_prevu: data.usage_prevu || "Résidence principale",

      // === HONORAIRES ===
      honoraires_locataire: data.honoraires_locataire || "",
      plafond_honoraires_etat_lieux: data.plafond_honoraires_etat_lieux || "",

      // === ANNEXES ===
      annexe_dpe: data.annexe_dpe || false,
      annexe_risques: data.annexe_risques || false,
      annexe_notice: data.annexe_notice || false,
      annexe_etat_lieux: data.annexe_etat_lieux || false,
      annexe_reglement: data.annexe_reglement || false,
      annexe_plomb: data.annexe_plomb || false,
      annexe_amiante: data.annexe_amiante || false,
      annexe_electricite_gaz: data.annexe_electricite_gaz || false,

      // === SIGNATURE ===
      lieu_signature: data.lieu_signature || "",
      date_signature: data.date_signature || null,

      // === AUTRES ===
      conditions_particulieres: data.special_conditions || data.conditions_particulieres || "",

      // Métadonnées
      metadata: JSON.stringify({
        special_conditions: data.special_conditions || "",
        documents_count: data.documents?.length || 0,
        form_completed: true,
        created_from: "new_form_v3_complete",
        total_fields_mapped: Object.keys(data).length,
      }),

      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

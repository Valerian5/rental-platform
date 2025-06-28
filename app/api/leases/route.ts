import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { authService } from "@/lib/auth-service"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [LEASES API] Début création bail")

    // Vérifier l'authentification
    const user = await authService.getCurrentUser()
    if (!user || user.user_type !== "owner") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

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
      owner_id: user.id,
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
      bailleur_telephone: data.bailleur_telephone || "",
      bailleur_qualite: data.bailleur_qualite || "Propriétaire",

      locataire_nom_prenom: data.locataire_nom_prenom || "",
      locataire_domicile: data.locataire_domicile || "",
      locataire_email: data.locataire_email || "",
      locataire_telephone: data.locataire_telephone || "",

      // === LOGEMENT ===
      localisation_logement: data.localisation_logement || "",
      identifiant_fiscal: data.identifiant_fiscal || "",
      type_habitat: data.type_habitat || "",
      regime_juridique: data.regime_juridique || "Copropriété",
      periode_construction: data.periode_construction || "Après 1949",
      surface_habitable: Number.parseFloat(data.surface_habitable) || 0,
      nombre_pieces: Number.parseInt(data.nombre_pieces) || 0,
      niveau_performance_dpe: data.niveau_performance_dpe || "D",

      // === FINANCIER ===
      montant_loyer_mensuel: Number.parseFloat(data.montant_loyer_mensuel) || Number.parseFloat(data.monthly_rent) || 0,
      montant_provisions_charges:
        Number.parseFloat(data.montant_provisions_charges) || Number.parseFloat(data.charges) || 0,
      montant_depot_garantie:
        Number.parseFloat(data.montant_depot_garantie) || Number.parseFloat(data.deposit_amount) || 0,
      periodicite_paiement: data.periodicite_paiement || "Mensuelle",
      date_paiement: data.date_paiement || "1",

      // === DURÉE ===
      date_prise_effet: data.date_prise_effet || data.start_date,
      duree_contrat: Number.parseInt(data.duree_contrat) || (data.lease_type === "furnished" ? 12 : 36),
      evenement_duree_reduite: data.evenement_duree_reduite || "",

      // === ANNEXES ===
      annexe_dpe: data.annexe_dpe || false,
      annexe_risques: data.annexe_risques || false,
      annexe_notice: data.annexe_notice || false,
      annexe_etat_lieux: data.annexe_etat_lieux || false,
      annexe_reglement: data.annexe_reglement || false,

      // === SIGNATURE ===
      lieu_signature: data.lieu_signature || "",
      date_signature: data.date_signature || null,

      // === AUTRES ===
      usage_prevu: data.usage_prevu || "résidence principale",
      conditions_particulieres: data.special_conditions || data.conditions_particulieres || "",

      // Métadonnées
      metadata: JSON.stringify({
        special_conditions: data.special_conditions || "",
        documents_count: data.documents?.length || 0,
        form_completed: true,
        created_from: "new_form_v2",
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
    const user = await authService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("owner_id")

    let query = supabase.from("leases").select(`
      *,
      property:properties(*),
      tenant:users!leases_tenant_id_fkey(*),
      owner:users!leases_owner_id_fkey(*)
    `)

    if (user.user_type === "owner") {
      query = query.eq("owner_id", user.id)
    } else if (user.user_type === "tenant") {
      query = query.eq("tenant_id", user.id)
    } else if (ownerId && user.user_type === "admin") {
      query = query.eq("owner_id", ownerId)
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

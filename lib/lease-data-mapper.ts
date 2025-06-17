import { supabase } from "./supabase"

export interface LeaseDataField {
  label: string
  value: any
  source: "auto" | "manual" | "missing"
  required: boolean
  type: "text" | "number" | "date" | "email" | "select" | "textarea" | "boolean"
  options?: string[]
  description?: string
}

export interface LeaseDataMapping {
  [key: string]: LeaseDataField
}

export const leaseDataMapper = {
  async mapLeaseData(leaseId: string): Promise<LeaseDataMapping> {
    try {
      console.log("🔄 Mapping données pour bail:", leaseId)

      // Récupérer toutes les données nécessaires
      const { data: lease, error: leaseError } = await supabase
        .from("leases")
        .select(`
          *,
          property:properties(*),
          tenant:users!tenant_id(*),
          owner:users!owner_id(*)
        `)
        .eq("id", leaseId)
        .single()

      if (leaseError) throw leaseError

      console.log("📋 Données bail récupérées:", lease.id)

      // Initialiser le mapping avec les champs obligatoires
      const mapping: LeaseDataMapping = {}

      // === PARTIES ===
      mapping.bailleur_nom_prenom = {
        label: "Nom et prénom du bailleur",
        value: lease.owner ? `${lease.owner.first_name || ""} ${lease.owner.last_name || ""}`.trim() : "",
        source: lease.owner?.first_name ? "auto" : "missing",
        required: true,
        type: "text",
      }

      mapping.bailleur_domicile = {
        label: "Domicile du bailleur",
        value: lease.owner?.address || "",
        source: lease.owner?.address ? "auto" : "missing",
        required: true,
        type: "text",
      }

      mapping.bailleur_qualite = {
        label: "Qualité du bailleur",
        value: "personne physique",
        source: "auto",
        required: true,
        type: "select",
        options: ["personne physique", "personne morale"],
      }

      mapping.bailleur_email = {
        label: "Email du bailleur",
        value: lease.owner?.email || "",
        source: lease.owner?.email ? "auto" : "missing",
        required: false,
        type: "email",
      }

      mapping.locataire_nom_prenom = {
        label: "Nom et prénom du locataire",
        value: lease.tenant ? `${lease.tenant.first_name || ""} ${lease.tenant.last_name || ""}`.trim() : "",
        source: lease.tenant?.first_name ? "auto" : "missing",
        required: true,
        type: "text",
      }

      mapping.locataire_email = {
        label: "Email du locataire",
        value: lease.tenant?.email || "",
        source: lease.tenant?.email ? "auto" : "missing",
        required: false,
        type: "email",
      }

      // === LOGEMENT ===
      mapping.localisation_logement = {
        label: "Localisation du logement",
        value: lease.property ? `${lease.property.address || ""}, ${lease.property.city || ""}`.trim() : "",
        source: lease.property?.address ? "auto" : "missing",
        required: true,
        type: "text",
      }

      mapping.identifiant_fiscal = {
        label: "Identifiant fiscal du logement",
        value: "",
        source: "missing",
        required: false,
        type: "text",
      }

      mapping.type_habitat = {
        label: "Type d'habitat",
        value: "immeuble collectif",
        source: "auto",
        required: true,
        type: "select",
        options: ["immeuble collectif", "immeuble individuel"],
      }

      mapping.regime_juridique = {
        label: "Régime juridique de l'immeuble",
        value: "copropriété",
        source: "auto",
        required: true,
        type: "select",
        options: ["mono propriété", "copropriété"],
      }

      mapping.periode_construction = {
        label: "Période de construction",
        value: "",
        source: "missing",
        required: false,
        type: "select",
        options: ["avant 1949", "de 1949 à 1974", "de 1975 à 1989", "de 1989 à 2005", "depuis 2005"],
      }

      mapping.surface_habitable = {
        label: "Surface habitable (m²)",
        value: lease.property?.surface || "",
        source: lease.property?.surface ? "auto" : "missing",
        required: true,
        type: "number",
      }

      mapping.nombre_pieces = {
        label: "Nombre de pièces principales",
        value: lease.property?.rooms || "",
        source: lease.property?.rooms ? "auto" : "missing",
        required: true,
        type: "number",
      }

      mapping.niveau_performance_dpe = {
        label: "Classe DPE",
        value: "",
        source: "missing",
        required: true,
        type: "select",
        options: ["A", "B", "C", "D", "E", "F", "G"],
      }

      // === CONDITIONS FINANCIÈRES ===
      mapping.montant_loyer_mensuel = {
        label: "Montant du loyer mensuel (€)",
        value: lease.monthly_rent || "",
        source: lease.monthly_rent ? "auto" : "missing",
        required: true,
        type: "number",
      }

      mapping.montant_provisions_charges = {
        label: "Montant des provisions sur charges (€)",
        value: lease.charges || "",
        source: lease.charges ? "auto" : "missing",
        required: false,
        type: "number",
      }

      mapping.montant_depot_garantie = {
        label: "Montant du dépôt de garantie (€)",
        value: lease.deposit || "",
        source: lease.deposit ? "auto" : "missing",
        required: false,
        type: "number",
      }

      mapping.periodicite_paiement = {
        label: "Périodicité du paiement",
        value: "mensuel",
        source: "auto",
        required: true,
        type: "select",
        options: ["mensuel", "trimestriel"],
      }

      mapping.date_paiement = {
        label: "Date de paiement",
        value: "le 1er de chaque mois",
        source: "auto",
        required: true,
        type: "text",
      }

      // === DURÉE ===
      mapping.date_prise_effet = {
        label: "Date de prise d'effet",
        value: lease.start_date ? lease.start_date.split("T")[0] : "",
        source: lease.start_date ? "auto" : "missing",
        required: true,
        type: "date",
      }

      mapping.duree_contrat = {
        label: "Durée du contrat",
        value: lease.lease_type === "furnished" ? "durée minimale d'un an" : "durée minimale de trois ans",
        source: "auto",
        required: true,
        type: "text",
      }

      mapping.evenement_duree_reduite = {
        label: "Événement justifiant une durée réduite",
        value: "",
        source: "missing",
        required: false,
        type: "textarea",
      }

      // === ANNEXES ===
      mapping.annexe_dpe = {
        label: "Diagnostic de performance énergétique",
        value: true,
        source: "auto",
        required: true,
        type: "boolean",
      }

      mapping.annexe_risques = {
        label: "État des risques naturels et technologiques",
        value: true,
        source: "auto",
        required: true,
        type: "boolean",
      }

      mapping.annexe_notice = {
        label: "Notice d'information",
        value: true,
        source: "auto",
        required: true,
        type: "boolean",
      }

      mapping.annexe_etat_lieux = {
        label: "État des lieux",
        value: true,
        source: "auto",
        required: true,
        type: "boolean",
      }

      mapping.annexe_reglement = {
        label: "Règlement de copropriété",
        value: false,
        source: "auto",
        required: false,
        type: "boolean",
      }

      // Charger les données complétées précédemment si elles existent
      if (lease.completed_data) {
        try {
          const completedData =
            typeof lease.completed_data === "string" ? JSON.parse(lease.completed_data) : lease.completed_data

          for (const [key, value] of Object.entries(completedData)) {
            if (mapping[key]) {
              mapping[key].value = value
              mapping[key].source = "manual"
            }
          }
        } catch (e) {
          console.error("Erreur parsing completed_data:", e)
        }
      }

      console.log("✅ Mapping terminé:", Object.keys(mapping).length, "champs")
      return mapping
    } catch (error) {
      console.error("❌ Erreur mapping:", error)
      throw error
    }
  },
}

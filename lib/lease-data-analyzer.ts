import { supabase } from "./supabase"

export interface FieldMapping {
  key: string
  label: string
  value: any
  source: "auto" | "manual" | "missing"
  required: boolean
  type: "text" | "number" | "date" | "email" | "select" | "textarea"
  category: "parties" | "logement" | "financier" | "duree" | "annexes"
  options?: string[]
  description?: string
}

export interface LeaseAnalysis {
  leaseId: string
  availableData: Record<string, FieldMapping>
  missingRequired: string[]
  completionRate: number
  canGenerate: boolean
}

class LeaseDataAnalyzer {
  // Définition des champs avec mapping intelligent
  private fieldDefinitions: Record<string, Omit<FieldMapping, "value" | "source">> = {
    // === PARTIES ===
    bailleur_nom_prenom: {
      key: "bailleur_nom_prenom",
      label: "Nom et prénom du bailleur",
      required: true,
      type: "text",
      category: "parties",
    },
    bailleur_domicile: {
      key: "bailleur_domicile",
      label: "Domicile du bailleur",
      required: true,
      type: "textarea",
      category: "parties",
    },
    bailleur_email: {
      key: "bailleur_email",
      label: "Email du bailleur",
      required: true,
      type: "email",
      category: "parties",
    },
    bailleur_telephone: {
      key: "bailleur_telephone",
      label: "Téléphone du bailleur",
      required: true,
      type: "text",
      category: "parties",
    },
    locataire_nom_prenom: {
      key: "locataire_nom_prenom",
      label: "Nom et prénom du locataire",
      required: true,
      type: "text",
      category: "parties",
    },
    locataire_email: {
      key: "locataire_email",
      label: "Email du locataire",
      required: true,
      type: "email",
      category: "parties",
    },
    locataire_telephone: {
      key: "locataire_telephone",
      label: "Téléphone du locataire",
      required: true,
      type: "text",
      category: "parties",
    },

    // === LOGEMENT ===
    localisation_logement: {
      key: "localisation_logement",
      label: "Localisation complète du logement",
      required: true,
      type: "textarea",
      category: "logement",
    },
    surface_habitable: {
      key: "surface_habitable",
      label: "Surface habitable (m²)",
      required: true,
      type: "number",
      category: "logement",
    },
    nombre_pieces: {
      key: "nombre_pieces",
      label: "Nombre de pièces principales",
      required: true,
      type: "number",
      category: "logement",
    },
    niveau_performance_dpe: {
      key: "niveau_performance_dpe",
      label: "Classe DPE",
      required: true,
      type: "select",
      category: "logement",
      options: ["A", "B", "C", "D", "E", "F", "G"],
    },
    periode_construction: {
      key: "periode_construction",
      label: "Période de construction",
      required: true,
      type: "select",
      category: "logement",
      options: ["avant 1949", "de 1949 à 1974", "de 1975 à 1989", "de 1989 à 2005", "depuis 2005"],
    },

    // === CONDITIONS FINANCIÈRES ===
    montant_loyer_mensuel: {
      key: "montant_loyer_mensuel",
      label: "Montant du loyer mensuel (€)",
      required: true,
      type: "number",
      category: "financier",
    },
    montant_provisions_charges: {
      key: "montant_provisions_charges",
      label: "Montant des provisions sur charges (€)",
      required: true,
      type: "number",
      category: "financier",
    },
    montant_depot_garantie: {
      key: "montant_depot_garantie",
      label: "Montant du dépôt de garantie (€)",
      required: true,
      type: "number",
      category: "financier",
    },

    // === DURÉE ===
    date_prise_effet: {
      key: "date_prise_effet",
      label: "Date de prise d'effet",
      required: true,
      type: "date",
      category: "duree",
    },
    duree_contrat: {
      key: "duree_contrat",
      label: "Durée du contrat",
      required: true,
      type: "select",
      category: "duree",
      options: ["1 an (meublé)", "3 ans (vide)", "6 ans (commercial)"],
    },

    // === ANNEXES ===
    ville_signature: {
      key: "ville_signature",
      label: "Ville de signature",
      required: true,
      type: "text",
      category: "annexes",
    },
    date_signature: {
      key: "date_signature",
      label: "Date de signature",
      required: true,
      type: "date",
      category: "annexes",
    },
  }

  async analyze(leaseId: string): Promise<LeaseAnalysis> {
    try {
      console.log("🔍 Analyse des données pour bail:", leaseId)

      // Récupérer toutes les données du bail
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

      // Récupérer les données complétées précédemment
      const { data: completedData } = await supabase
        .from("lease_completed_data")
        .select("field_name, field_value, source")
        .eq("lease_id", leaseId)

      const completedFields = completedData?.reduce(
        (acc, item) => {
          acc[item.field_name] = {
            value: item.field_value,
            source: item.source as "auto" | "manual",
          }
          return acc
        },
        {} as Record<string, { value: any; source: "auto" | "manual" }>,
      )

      // Mapper les données automatiques
      const autoData = this.mapAutomaticData(lease)

      // Construire l'analyse complète
      const availableData: Record<string, FieldMapping> = {}
      const missingRequired: string[] = []

      for (const [key, definition] of Object.entries(this.fieldDefinitions)) {
        const completed = completedFields?.[key]
        const autoValue = autoData[key]

        let value = completed?.value || autoValue || ""
        let source: "auto" | "manual" | "missing" = "missing"

        if (completed?.value) {
          source = completed.source
          value = completed.value
        } else if (autoValue) {
          source = "auto"
          value = autoValue
        }

        availableData[key] = {
          ...definition,
          value,
          source,
        }

        if (definition.required && !value) {
          missingRequired.push(key)
        }
      }

      const totalFields = Object.keys(this.fieldDefinitions).length
      const completedFields_count = totalFields - missingRequired.length
      const completionRate = Math.round((completedFields_count / totalFields) * 100)

      console.log(`📊 Analyse terminée: ${completedFields_count}/${totalFields} champs (${completionRate}%)`)

      return {
        leaseId,
        availableData,
        missingRequired,
        completionRate,
        canGenerate: missingRequired.length === 0,
      }
    } catch (error) {
      console.error("❌ Erreur analyse:", error)
      throw error
    }
  }

  private mapAutomaticData(lease: any): Record<string, any> {
    const data: Record<string, any> = {}

    // === PARTIES ===
    // Mapping des champs composés
    if (lease.owner?.first_name && lease.owner?.last_name) {
      data.bailleur_nom_prenom = `${lease.owner.first_name} ${lease.owner.last_name}`
    }
    if (lease.tenant?.first_name && lease.tenant?.last_name) {
      data.locataire_nom_prenom = `${lease.tenant.first_name} ${lease.tenant.last_name}`
    }

    // Adresses
    data.bailleur_domicile = lease.owner?.address || ""
    data.bailleur_email = lease.owner?.email || ""
    data.bailleur_telephone = lease.owner?.phone || ""
    data.locataire_email = lease.tenant?.email || ""
    data.locataire_telephone = lease.tenant?.phone || ""

    // === LOGEMENT ===
    if (lease.property?.address && lease.property?.city) {
      data.localisation_logement = `${lease.property.address}, ${lease.property.postal_code || ""} ${
        lease.property.city
      }`.trim()
    }
    data.surface_habitable = lease.property?.surface || ""
    data.nombre_pieces = lease.property?.rooms || ""

    // === FINANCIER ===
    data.montant_loyer_mensuel = lease.monthly_rent || ""
    data.montant_provisions_charges = lease.charges || ""
    data.montant_depot_garantie = lease.deposit || ""

    // === DURÉE ===
    data.date_prise_effet = lease.start_date ? lease.start_date.split("T")[0] : ""

    // Durée selon le type
    if (lease.lease_type === "furnished") {
      data.duree_contrat = "1 an (meublé)"
    } else if (lease.lease_type === "unfurnished") {
      data.duree_contrat = "3 ans (vide)"
    }

    // === ANNEXES ===
    data.ville_signature = lease.property?.city || ""
    data.date_signature = new Date().toISOString().split("T")[0]

    return data
  }

  async saveCompletedData(leaseId: string, fieldName: string, fieldValue: any, source: "manual" = "manual") {
    try {
      const { error } = await supabase.from("lease_completed_data").upsert(
        {
          lease_id: leaseId,
          field_name: fieldName,
          field_value: fieldValue,
          source,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "lease_id,field_name",
        },
      )

      if (error) throw error
    } catch (error) {
      console.error("❌ Erreur sauvegarde:", error)
      throw error
    }
  }

  getFieldsByCategory(availableData: Record<string, FieldMapping>) {
    const categories = {
      parties: [] as FieldMapping[],
      logement: [] as FieldMapping[],
      financier: [] as FieldMapping[],
      duree: [] as FieldMapping[],
      annexes: [] as FieldMapping[],
    }

    for (const field of Object.values(availableData)) {
      categories[field.category].push(field)
    }

    return categories
  }
}

export const leaseDataAnalyzer = new LeaseDataAnalyzer()

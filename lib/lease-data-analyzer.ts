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
  // Définition des champs basée sur les templates existants
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

    // === LOGEMENT ===
    localisation_logement: {
      key: "localisation_logement",
      label: "Localisation du logement",
      required: true,
      type: "text",
      category: "logement",
    },
    type_habitat: {
      key: "type_habitat",
      label: "Type d'habitat",
      required: true,
      type: "select",
      category: "logement",
      options: ["Appartement", "Maison", "Studio", "Chambre"],
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
      label: "Nombre de pièces",
      required: true,
      type: "number",
      category: "logement",
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
      label: "Provisions pour charges (€)",
      required: true,
      type: "number",
      category: "financier",
    },
    montant_depot_garantie: {
      key: "montant_depot_garantie",
      label: "Dépôt de garantie (€)",
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
      label: "Durée du contrat (mois)",
      required: true,
      type: "number",
      category: "duree",
    },

    // === SIGNATURE ===
    lieu_signature: {
      key: "lieu_signature",
      label: "Lieu de signature",
      required: true,
      type: "text",
      category: "annexes",
    },
    date_signature: {
      key: "date_signature",
      label: "Date de signature",
      required: false,
      type: "date",
      category: "annexes",
    },
  }

  async analyze(leaseId: string): Promise<LeaseAnalysis> {
    try {
      console.log("🔍 [ANALYZER] Analyse des données pour bail:", leaseId)

      // Récupérer le bail avec toutes les relations
      const { data: lease, error: leaseError } = await supabase
        .from("leases")
        .select(`
          *,
          property:properties(*),
          tenant:users!leases_tenant_id_fkey(*),
          owner:users!leases_owner_id_fkey(*)
        `)
        .eq("id", leaseId)
        .single()

      if (leaseError) {
        console.error("❌ [ANALYZER] Erreur récupération bail:", leaseError)
        throw leaseError
      }

      console.log("📋 [ANALYZER] Bail récupéré:", lease.id)

      // Mapper les données automatiques
      const autoData = this.mapAutomaticData(lease)
      console.log("🤖 [ANALYZER] Données automatiques mappées:", Object.keys(autoData).length, "champs")

      // Construire l'analyse complète
      const availableData: Record<string, FieldMapping> = {}
      const missingRequired: string[] = []

      for (const [key, definition] of Object.entries(this.fieldDefinitions)) {
        // Priorité : valeur en DB > valeur automatique > vide
        const dbValue = lease[key]
        const autoValue = autoData[key]

        let value = dbValue || autoValue || ""
        let source: "auto" | "manual" | "missing" = "missing"

        if (dbValue !== undefined && dbValue !== null && dbValue !== "") {
          source = "manual"
          value = dbValue
        } else if (autoValue !== undefined && autoValue !== null && autoValue !== "") {
          source = "auto"
          value = autoValue
        }

        availableData[key] = {
          ...definition,
          value,
          source,
        }

        // Vérifier les champs obligatoires
        const isEmpty = !value || value === "" || value === null || value === undefined
        if (definition.required && isEmpty) {
          console.log(`❌ [ANALYZER] Champ obligatoire manquant: ${key}`)
          missingRequired.push(key)
        } else if (definition.required) {
          console.log(`✅ [ANALYZER] Champ obligatoire OK: ${key} = ${value}`)
        }
      }

      const totalFields = Object.keys(this.fieldDefinitions).length
      const completedFields_count = totalFields - missingRequired.length
      const completionRate = Math.round((completedFields_count / totalFields) * 100)

      console.log(`📊 [ANALYZER] Analyse terminée: ${completedFields_count}/${totalFields} champs (${completionRate}%)`)
      console.log("❌ [ANALYZER] Champs manquants:", missingRequired)

      return {
        leaseId,
        availableData,
        missingRequired,
        completionRate,
        canGenerate: missingRequired.length === 0,
      }
    } catch (error) {
      console.error("❌ [ANALYZER] Erreur analyse:", error)
      throw error
    }
  }

  private mapAutomaticData(lease: any): Record<string, any> {
    const data: Record<string, any> = {}

    try {
      console.log("🗺️ [ANALYZER] Mapping automatique des données...")

      // === PARTIES ===
      if (lease.owner?.first_name && lease.owner?.last_name) {
        data.bailleur_nom_prenom = `${lease.owner.first_name} ${lease.owner.last_name}`
      }
      if (lease.tenant?.first_name && lease.tenant?.last_name) {
        data.locataire_nom_prenom = `${lease.tenant.first_name} ${lease.tenant.last_name}`
      }

      data.bailleur_domicile = lease.owner?.address || ""
      data.bailleur_email = lease.owner?.email || ""
      data.locataire_email = lease.tenant?.email || ""

      // === LOGEMENT ===
      data.localisation_logement = lease.property?.address || ""

      const propertyType = lease.property?.property_type || ""
      if (propertyType.toLowerCase().includes("apartment")) {
        data.type_habitat = "Appartement"
      } else if (propertyType.toLowerCase().includes("house")) {
        data.type_habitat = "Maison"
      } else if (propertyType.toLowerCase().includes("studio")) {
        data.type_habitat = "Studio"
      } else if (propertyType.toLowerCase().includes("room")) {
        data.type_habitat = "Chambre"
      } else {
        data.type_habitat = propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
      }

      data.surface_habitable = lease.property?.surface || ""
      data.nombre_pieces = lease.property?.rooms || ""

      // === FINANCIER ===
      data.montant_loyer_mensuel = lease.monthly_rent || ""
      data.montant_provisions_charges = lease.charges || 0
      data.montant_depot_garantie = lease.deposit_amount || ""

      // === DURÉE ===
      data.date_prise_effet = lease.start_date ? this.formatDateForInput(lease.start_date) : ""

      // Calculer la durée en mois
      if (lease.start_date && lease.end_date) {
        const startDate = new Date(lease.start_date)
        const endDate = new Date(lease.end_date)
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44))
        data.duree_contrat = diffMonths
      } else {
        data.duree_contrat = lease.lease_type === "furnished" ? 12 : 36
      }

      // === SIGNATURE ===
      data.lieu_signature = lease.property?.city || ""
      data.date_signature = new Date().toISOString().split("T")[0]

      return data
    } catch (error) {
      console.error("❌ [ANALYZER] Erreur mapping automatique:", error)
      return data
    }
  }

  private formatDateForInput(dateString: string): string {
    try {
      return new Date(dateString).toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  async saveCompletedData(leaseId: string, fieldName: string, fieldValue: any, source: "manual" = "manual") {
    try {
      console.log("💾 [ANALYZER] Sauvegarde:", fieldName, "=", fieldValue)

      const updateData: Record<string, any> = {
        [fieldName]: fieldValue,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("leases").update(updateData).eq("id", leaseId)

      if (error) {
        console.error("❌ [ANALYZER] Erreur sauvegarde:", error)
        throw error
      }

      console.log("✅ [ANALYZER] Sauvegarde réussie")
    } catch (error) {
      console.error("❌ [ANALYZER] Erreur sauvegarde:", error)
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

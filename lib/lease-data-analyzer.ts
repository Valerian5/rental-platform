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
    nom_bailleur: {
      key: "nom_bailleur",
      label: "Nom et prénom du bailleur",
      required: true,
      type: "text",
      category: "parties",
    },
    adresse_bailleur: {
      key: "adresse_bailleur",
      label: "Adresse du bailleur",
      required: true,
      type: "textarea",
      category: "parties",
    },
    email_bailleur: {
      key: "email_bailleur",
      label: "Email du bailleur",
      required: true,
      type: "email",
      category: "parties",
    },
    telephone_bailleur: {
      key: "telephone_bailleur",
      label: "Téléphone du bailleur",
      required: true,
      type: "text",
      category: "parties",
    },
    nom_locataire: {
      key: "nom_locataire",
      label: "Nom et prénom du locataire",
      required: true,
      type: "text",
      category: "parties",
    },
    adresse_locataire: {
      key: "adresse_locataire",
      label: "Adresse du locataire",
      required: true,
      type: "textarea",
      category: "parties",
    },
    email_locataire: {
      key: "email_locataire",
      label: "Email du locataire",
      required: true,
      type: "email",
      category: "parties",
    },
    telephone_locataire: {
      key: "telephone_locataire",
      label: "Téléphone du locataire",
      required: true,
      type: "text",
      category: "parties",
    },

    // === LOGEMENT ===
    adresse_postale: {
      key: "adresse_postale",
      label: "Adresse du logement",
      required: true,
      type: "text",
      category: "logement",
    },
    code_postal: {
      key: "code_postal",
      label: "Code postal",
      required: true,
      type: "text",
      category: "logement",
    },
    ville: {
      key: "ville",
      label: "Ville",
      required: true,
      type: "text",
      category: "logement",
    },
    type_logement: {
      key: "type_logement",
      label: "Type de logement",
      required: true,
      type: "select",
      category: "logement",
      options: ["Appartement", "Maison", "Studio", "Chambre"],
    },
    surface_m2: {
      key: "surface_m2",
      label: "Surface (m²)",
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
    etage: {
      key: "etage",
      label: "Étage",
      required: false,
      type: "text",
      category: "logement",
    },
    zone_geographique: {
      key: "zone_geographique",
      label: "Zone géographique",
      required: true,
      type: "select",
      category: "logement",
      options: ["Paris", "zone tendue", "zone non tendue"],
    },

    // === CONDITIONS FINANCIÈRES ===
    loyer: {
      key: "loyer",
      label: "Loyer mensuel (€)",
      required: true,
      type: "number",
      category: "financier",
    },
    charges: {
      key: "charges",
      label: "Charges (€)",
      required: true,
      type: "number",
      category: "financier",
    },
    loyer_cc: {
      key: "loyer_cc",
      label: "Loyer charges comprises (€)",
      required: true,
      type: "number",
      category: "financier",
    },
    depot_garantie: {
      key: "depot_garantie",
      label: "Dépôt de garantie (€)",
      required: true,
      type: "number",
      category: "financier",
    },

    // === DURÉE ===
    date_debut: {
      key: "date_debut",
      label: "Date de début",
      required: true,
      type: "date",
      category: "duree",
    },
    date_fin: {
      key: "date_fin",
      label: "Date de fin",
      required: true,
      type: "date",
      category: "duree",
    },
    duree: {
      key: "duree",
      label: "Durée (mois)",
      required: true,
      type: "number",
      category: "duree",
    },

    // === USAGE ET CLAUSES ===
    usage_prevu: {
      key: "usage_prevu",
      label: "Usage prévu",
      required: true,
      type: "select",
      category: "annexes",
      options: ["résidence principale", "résidence secondaire", "logement étudiant"],
    },
    clauses_particulieres: {
      key: "clauses_particulieres",
      label: "Clauses particulières",
      required: false,
      type: "textarea",
      category: "annexes",
    },

    // === SIGNATURE ===
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
      required: false,
      type: "date",
      category: "annexes",
    },
  }

  async analyze(leaseId: string): Promise<LeaseAnalysis> {
    try {
      console.log("🔍 Analyse des données pour bail:", leaseId)

      // CORRIGÉ : Récupérer le bail avec TOUTES les nouvelles colonnes
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

      if (leaseError) {
        console.error("❌ Erreur récupération bail:", leaseError)
        throw leaseError
      }

      console.log("📋 Bail récupéré:", lease.id)
      console.log("💾 Données bail dans DB:", {
        nom_bailleur: lease.nom_bailleur,
        adresse_bailleur: lease.adresse_bailleur,
        nom_locataire: lease.nom_locataire,
        adresse_locataire: lease.adresse_locataire,
        adresse_postale: lease.adresse_postale,
        loyer: lease.loyer,
        depot_garantie: lease.depot_garantie,
      })

      // Récupérer les données complétées de l'ancienne table (pour migration)
      const { data: completedData, error: completedError } = await supabase
        .from("lease_completed_data")
        .select("field_name, field_value, source")
        .eq("lease_id", leaseId)

      if (completedError) {
        console.error("❌ Erreur récupération données complétées:", completedError)
      }

      console.log("💾 Données complétées (ancienne table):", completedData?.length || 0, "champs")

      const completedFields =
        completedData?.reduce(
          (acc, item) => {
            acc[item.field_name] = {
              value: item.field_value,
              source: item.source as "auto" | "manual",
            }
            return acc
          },
          {} as Record<string, { value: any; source: "auto" | "manual" }>,
        ) || {}

      // Mapper les données automatiques
      const autoData = this.mapAutomaticData(lease)
      console.log("🤖 Données automatiques mappées:", Object.keys(autoData).length, "champs")

      // Construire l'analyse complète
      const availableData: Record<string, FieldMapping> = {}
      const missingRequired: string[] = []

      for (const [key, definition] of Object.entries(this.fieldDefinitions)) {
        // CORRIGÉ : Priorité aux données de la table leases
        const dbValue = lease[key] // Valeur directe de la table leases
        const completed = completedFields[key] // Valeur de l'ancienne table
        const autoValue = autoData[key] // Valeur automatique

        let value = dbValue || completed?.value || autoValue || ""
        let source: "auto" | "manual" | "missing" = "missing"

        if (dbValue !== undefined && dbValue !== null && dbValue !== "") {
          source = "manual" // Données saisies dans la table leases
          value = dbValue
        } else if (completed?.value !== undefined && completed?.value !== null && completed?.value !== "") {
          source = completed.source
          value = completed.value
        } else if (autoValue !== undefined && autoValue !== null && autoValue !== "") {
          source = "auto"
          value = autoValue
        }

        availableData[key] = {
          ...definition,
          value,
          source,
        }

        // LOGS DÉTAILLÉS pour débugger
        const isEmpty = !value || value === "" || value === null || value === undefined
        if (definition.required && isEmpty) {
          console.log(`❌ Champ obligatoire manquant: ${key} (${definition.label})`)
          console.log(`   - Valeur DB: ${dbValue}`)
          console.log(`   - Valeur complétée: ${completed?.value}`)
          console.log(`   - Valeur auto: ${autoValue}`)
          console.log(`   - Valeur finale: ${value}`)
          missingRequired.push(key)
        } else if (definition.required) {
          console.log(`✅ Champ obligatoire OK: ${key} = ${value} (source: ${source})`)
        }
      }

      const totalFields = Object.keys(this.fieldDefinitions).length
      const completedFields_count = totalFields - missingRequired.length
      const completionRate = Math.round((completedFields_count / totalFields) * 100)

      console.log(`📊 Analyse terminée: ${completedFields_count}/${totalFields} champs (${completionRate}%)`)
      console.log("❌ Champs manquants:", missingRequired)
      console.log("🎯 Peut générer:", missingRequired.length === 0)

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

    try {
      console.log("🗺️ Mapping automatique des données...")

      // === PARTIES ===
      if (lease.owner?.first_name && lease.owner?.last_name) {
        data.nom_bailleur = `${lease.owner.first_name} ${lease.owner.last_name}`
      }
      if (lease.tenant?.first_name && lease.tenant?.last_name) {
        data.nom_locataire = `${lease.tenant.first_name} ${lease.tenant.last_name}`
      }

      // Adresses et contacts
      data.adresse_bailleur = lease.owner?.address || ""
      data.email_bailleur = lease.owner?.email || ""
      data.telephone_bailleur = lease.owner?.phone || ""
      data.adresse_locataire = lease.tenant?.address || ""
      data.email_locataire = lease.tenant?.email || ""
      data.telephone_locataire = lease.tenant?.phone || ""

      // === LOGEMENT ===
      data.adresse_postale = lease.property?.address || ""
      data.code_postal = lease.property?.postal_code || ""
      data.ville = lease.property?.city || ""

      // Mapping du type de logement
      const propertyType = lease.property?.property_type || ""
      if (propertyType.toLowerCase().includes("apartment")) {
        data.type_logement = "Appartement"
      } else if (propertyType.toLowerCase().includes("house")) {
        data.type_logement = "Maison"
      } else if (propertyType.toLowerCase().includes("studio")) {
        data.type_logement = "Studio"
      } else if (propertyType.toLowerCase().includes("room")) {
        data.type_logement = "Chambre"
      } else {
        data.type_logement = propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
      }

      data.surface_m2 = lease.property?.surface || ""
      data.nombre_pieces = lease.property?.rooms || ""
      data.etage = lease.property?.floor || ""
      data.zone_geographique = this.getZoneGeographique(lease.property?.city || "")

      // === FINANCIER ===
      data.loyer = lease.monthly_rent || ""
      data.charges = lease.charges || 0
      data.loyer_cc = (lease.monthly_rent || 0) + (lease.charges || 0)
      data.depot_garantie = lease.deposit_amount || ""

      // === DURÉE ===
      data.date_debut = lease.start_date ? this.formatDateForInput(lease.start_date) : ""
      data.date_fin = lease.end_date ? this.formatDateForInput(lease.end_date) : ""

      // Calculer la durée en mois entre les dates
      if (lease.start_date && lease.end_date) {
        const startDate = new Date(lease.start_date)
        const endDate = new Date(lease.end_date)
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44))
        data.duree = diffMonths
      } else {
        if (lease.lease_type === "furnished") {
          data.duree = 12
        } else if (lease.lease_type === "unfurnished") {
          data.duree = 36
        }
      }

      // === USAGE ET CLAUSES ===
      data.usage_prevu = "résidence principale"
      data.clauses_particulieres = lease.metadata?.special_conditions || ""

      // === SIGNATURE ===
      data.ville_signature = lease.property?.city || ""

      return data
    } catch (error) {
      console.error("❌ Erreur mapping automatique:", error)
      return data
    }
  }

  private getZoneGeographique(ville: string): string {
    if (!ville) return ""
    const villeNormalized = ville.toLowerCase()
    if (villeNormalized.includes("paris")) return "Paris"

    const zonesTendues = [
      "marseille",
      "lyon",
      "toulouse",
      "nice",
      "nantes",
      "montpellier",
      "strasbourg",
      "bordeaux",
      "lille",
      "rennes",
      "reims",
      "toulon",
      "saint-étienne",
      "le havre",
      "grenoble",
      "dijon",
      "angers",
      "nîmes",
      "villeurbanne",
      "saint-denis",
    ]

    return zonesTendues.some((zone) => villeNormalized.includes(zone)) ? "zone tendue" : "zone non tendue"
  }

  private formatDateForInput(dateString: string): string {
    try {
      return new Date(dateString).toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  // CORRIGÉ : Sauvegarder directement dans la table leases
  async saveCompletedData(leaseId: string, fieldName: string, fieldValue: any, source: "manual" = "manual") {
    try {
      console.log("💾 Sauvegarde directe dans leases:", fieldName, "=", fieldValue)

      // Construire l'objet de mise à jour
      const updateData: Record<string, any> = {
        [fieldName]: fieldValue,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("leases").update(updateData).eq("id", leaseId)

      if (error) {
        console.error("❌ Erreur sauvegarde directe:", error)
        throw error
      }

      console.log("✅ Sauvegarde directe réussie")
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

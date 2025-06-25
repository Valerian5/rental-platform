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

      if (leaseError) {
        console.error("❌ Erreur récupération bail:", leaseError)
        throw leaseError
      }

      console.log("📋 Bail récupéré:", lease.id)
      console.log("🏠 Propriété:", lease.property?.title)
      console.log("👤 Locataire:", lease.tenant?.email)
      console.log("🏠 Owner:", lease.owner?.email)

      // Récupérer les données complétées précédemment
      const { data: completedData, error: completedError } = await supabase
        .from("lease_completed_data")
        .select("field_name, field_value, source")
        .eq("lease_id", leaseId)

      if (completedError) {
        console.error("❌ Erreur récupération données complétées:", completedError)
      }

      console.log("💾 Données complétées récupérées:", completedData?.length || 0, "champs")

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
        const completed = completedFields[key]
        const autoValue = autoData[key]

        let value = completed?.value || autoValue || ""
        let source: "auto" | "manual" | "missing" = "missing"

        if (completed?.value !== undefined && completed?.value !== null && completed?.value !== "") {
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

        if (definition.required && (!value || value === "")) {
          missingRequired.push(key)
        }
      }

      const totalFields = Object.keys(this.fieldDefinitions).length
      const completedFields_count = totalFields - missingRequired.length
      const completionRate = Math.round((completedFields_count / totalFields) * 100)

      console.log(`📊 Analyse terminée: ${completedFields_count}/${totalFields} champs (${completionRate}%)`)
      console.log("❌ Champs manquants:", missingRequired)

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
      console.log("📋 Lease data:", {
        monthly_rent: lease.monthly_rent,
        charges: lease.charges,
        deposit: lease.deposit,
        start_date: lease.start_date,
        end_date: lease.end_date,
      })
      console.log("🏠 Property data:", {
        address: lease.property?.address,
        city: lease.property?.city,
        postal_code: lease.property?.postal_code,
        property_type: lease.property?.property_type,
        surface: lease.property?.surface,
        rooms: lease.property?.rooms,
        floor: lease.property?.floor,
        charges_amount: lease.property?.charges_amount,
      })

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

      // Mapping du type de logement - CORRIGÉ
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
        // Fallback pour les types français
        data.type_logement = propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
      }

      data.surface_m2 = lease.property?.surface || ""
      data.nombre_pieces = lease.property?.rooms || ""
      data.etage = lease.property?.floor || ""

      // Zone géographique (à déterminer selon la ville)
      data.zone_geographique = this.getZoneGeographique(lease.property?.city || "")

      // === FINANCIER - CORRIGÉ ===
      data.loyer = lease.monthly_rent || ""
      data.charges = lease.charges || 0
      data.loyer_cc = (lease.monthly_rent || 0) + (lease.charges || 0)
      data.depot_garantie = lease.deposit || ""

      // === DURÉE - CORRIGÉ ===
      data.date_debut = lease.start_date ? this.formatDate(lease.start_date) : ""
      data.date_fin = lease.end_date ? this.formatDate(lease.end_date) : ""

      // Durée selon le type
      if (lease.lease_type === "furnished") {
        data.duree = 12
      } else if (lease.lease_type === "unfurnished") {
        data.duree = 36
      }

      // === USAGE ET CLAUSES ===
      data.usage_prevu = "résidence principale"
      data.clauses_particulieres = lease.metadata?.special_conditions || ""

      // === SIGNATURE ===
      data.ville_signature = lease.property?.city || ""
      data.date_signature = this.formatDate(new Date().toISOString())

      console.log("🗺️ Données automatiques mappées:", {
        nom_bailleur: data.nom_bailleur,
        nom_locataire: data.nom_locataire,
        adresse_postale: data.adresse_postale,
        type_logement: data.type_logement,
        surface_m2: data.surface_m2,
        loyer: data.loyer,
        charges: data.charges,
        depot_garantie: data.depot_garantie,
        date_debut: data.date_debut,
        date_fin: data.date_fin,
      })
    } catch (error) {
      console.error("❌ Erreur mapping automatique:", error)
    }

    return data
  }

  private getZoneGeographique(ville: string): string {
    if (!ville) return ""

    const villeNormalized = ville.toLowerCase()

    // Paris
    if (villeNormalized.includes("paris")) {
      return "Paris"
    }

    // Zones tendues (liste simplifiée)
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
      "aix-en-provence",
      "brest",
      "limoges",
      "tours",
      "amiens",
      "perpignan",
      "metz",
      "besançon",
      "orléans",
      "mulhouse",
      "rouen",
      "caen",
      "nancy",
    ]

    const isZoneTendue = zonesTendues.some((zoneTendue) => villeNormalized.includes(zoneTendue))
    return isZoneTendue ? "zone tendue" : "zone non tendue"
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  async saveCompletedData(leaseId: string, fieldName: string, fieldValue: any, source: "manual" = "manual") {
    try {
      console.log("💾 Sauvegarde:", fieldName, "=", fieldValue)

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

      if (error) {
        console.error("❌ Erreur sauvegarde:", error)
        throw error
      }

      console.log("✅ Sauvegarde réussie")
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

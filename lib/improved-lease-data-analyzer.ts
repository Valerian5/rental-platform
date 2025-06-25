import { supabase } from "./supabase"

export interface LeaseDataComplete {
  // Parties
  bailleur_nom?: string
  bailleur_adresse?: string
  bailleur_telephone?: string
  locataire_nom?: string
  locataire_adresse?: string
  locataire_telephone?: string

  // Logement
  logement_adresse?: string
  logement_code_postal?: string
  logement_ville?: string
  logement_type?: string
  logement_surface?: number
  logement_pieces?: number
  logement_etage?: string
  zone_geographique?: string

  // Financier
  loyer_charges_comprises?: number

  // Durée
  duree_mois?: number

  // Usage
  usage_prevu?: string
  clauses_particulieres?: string

  // Signature
  ville_signature?: string
  date_signature?: string

  // Métadonnées
  completion_rate?: number
  data_completed_at?: string
}

class ImprovedLeaseDataAnalyzer {
  async analyzeAndComplete(leaseId: string): Promise<{
    canGenerate: boolean
    completionRate: number
    missingFields: string[]
    data: Record<string, any>
  }> {
    try {
      console.log("🔍 [IMPROVED] Analyse des données pour bail:", leaseId)

      // Récupérer le bail avec toutes les relations
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

      // Mapper automatiquement les données
      const autoData = this.mapAutomaticData(lease)

      // Préparer les données complètes
      const completeData: Record<string, any> = {
        // Parties
        nom_bailleur: lease.bailleur_nom || autoData.nom_bailleur || "",
        adresse_bailleur: lease.bailleur_adresse || autoData.adresse_bailleur || "",
        email_bailleur: lease.owner?.email || "",
        telephone_bailleur: lease.bailleur_telephone || autoData.telephone_bailleur || "",

        nom_locataire: lease.locataire_nom || autoData.nom_locataire || "",
        adresse_locataire: lease.locataire_adresse || autoData.adresse_locataire || "",
        email_locataire: lease.tenant?.email || "",
        telephone_locataire: lease.locataire_telephone || autoData.telephone_locataire || "",

        // Logement
        adresse_postale: lease.logement_adresse || autoData.adresse_postale || "",
        code_postal: lease.logement_code_postal || autoData.code_postal || "",
        ville: lease.logement_ville || autoData.ville || "",
        type_logement: lease.logement_type || autoData.type_logement || "",
        surface_m2: lease.logement_surface || autoData.surface_m2 || "",
        nombre_pieces: lease.logement_pieces || autoData.nombre_pieces || "",
        etage: lease.logement_etage || autoData.etage || "",
        zone_geographique: lease.zone_geographique || autoData.zone_geographique || "",

        // Financier
        loyer: lease.monthly_rent || "",
        charges: lease.charges || 0,
        loyer_cc: lease.loyer_charges_comprises || autoData.loyer_cc || "",
        depot_garantie: lease.deposit_amount || "",

        // Durée
        date_debut: lease.start_date ? this.formatDateForInput(lease.start_date) : "",
        date_fin: lease.end_date ? this.formatDateForInput(lease.end_date) : "",
        duree: lease.duree_mois || autoData.duree || "",

        // Usage
        usage_prevu: lease.usage_prevu || "résidence principale",
        clauses_particulieres: lease.clauses_particulieres || "",

        // Signature
        ville_signature: lease.ville_signature || autoData.ville_signature || "",
        date_signature: lease.date_signature || "",
      }

      // Vérifier les champs obligatoires
      const requiredFields = [
        "nom_bailleur",
        "adresse_bailleur",
        "email_bailleur",
        "telephone_bailleur",
        "nom_locataire",
        "adresse_locataire",
        "email_locataire",
        "telephone_locataire",
        "adresse_postale",
        "code_postal",
        "ville",
        "type_logement",
        "surface_m2",
        "nombre_pieces",
        "zone_geographique",
        "loyer",
        "charges",
        "loyer_cc",
        "depot_garantie",
        "date_debut",
        "date_fin",
        "duree",
        "usage_prevu",
        "ville_signature",
      ]

      const missingFields = requiredFields.filter((field) => {
        const value = completeData[field]
        return !value || value === "" || value === null || value === undefined
      })

      const completionRate = Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100)

      console.log(
        `📊 [IMPROVED] Analyse: ${requiredFields.length - missingFields.length}/${requiredFields.length} (${completionRate}%)`,
      )
      console.log("❌ [IMPROVED] Champs manquants:", missingFields)

      return {
        canGenerate: missingFields.length === 0,
        completionRate,
        missingFields,
        data: completeData,
      }
    } catch (error) {
      console.error("❌ [IMPROVED] Erreur analyse:", error)
      throw error
    }
  }

  private mapAutomaticData(lease: any): Record<string, any> {
    const data: Record<string, any> = {}

    // Parties
    if (lease.owner?.first_name && lease.owner?.last_name) {
      data.nom_bailleur = `${lease.owner.first_name} ${lease.owner.last_name}`
    }
    if (lease.tenant?.first_name && lease.tenant?.last_name) {
      data.nom_locataire = `${lease.tenant.first_name} ${lease.tenant.last_name}`
    }

    data.adresse_bailleur = lease.owner?.address || ""
    data.telephone_bailleur = lease.owner?.phone || ""
    data.adresse_locataire = lease.tenant?.address || ""
    data.telephone_locataire = lease.tenant?.phone || ""

    // Logement
    data.adresse_postale = lease.property?.address || ""
    data.code_postal = lease.property?.postal_code || ""
    data.ville = lease.property?.city || ""

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

    // Financier
    data.loyer_cc = (lease.monthly_rent || 0) + (lease.charges || 0)

    // Durée
    if (lease.start_date && lease.end_date) {
      const startDate = new Date(lease.start_date)
      const endDate = new Date(lease.end_date)
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44))
      data.duree = diffMonths
    }

    // Signature
    data.ville_signature = lease.property?.city || ""

    return data
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

  async saveCompleteData(leaseId: string, data: LeaseDataComplete): Promise<void> {
    try {
      const { error } = await supabase
        .from("leases")
        .update({
          ...data,
          data_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", leaseId)

      if (error) throw error
    } catch (error) {
      console.error("❌ Erreur sauvegarde données complètes:", error)
      throw error
    }
  }
}

export const improvedLeaseDataAnalyzer = new ImprovedLeaseDataAnalyzer()

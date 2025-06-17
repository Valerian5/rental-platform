import { supabase } from "./supabase"

export interface LeaseDataMapping {
  [key: string]: {
    value: any
    source: "auto" | "manual" | "missing"
    required: boolean
    label: string
    type: string
  }
}

export class LeaseDataMapper {
  async mapLeaseData(leaseId: string): Promise<LeaseDataMapping> {
    // Récupérer toutes les données du bail
    const { data: lease, error } = await supabase
      .from("leases")
      .select(`
        *,
        property:properties(*),
        tenant:users!tenant_id(*),
        owner:users!owner_id(*)
      `)
      .eq("id", leaseId)
      .single()

    if (error) throw error

    // Récupérer le template approprié
    const { data: template } = await supabase
      .from("lease_templates")
      .select("field_mapping")
      .eq("lease_type", lease.lease_type)
      .eq("is_default", true)
      .single()

    if (!template) throw new Error("Template non trouvé")

    const fieldMapping = template.field_mapping
    const mappedData: LeaseDataMapping = {}

    // Mapper chaque champ du template
    for (const [fieldName, fieldConfig] of Object.entries(fieldMapping)) {
      const config = fieldConfig as any
      let value: any = null
      let source: "auto" | "manual" | "missing" = "missing"

      // Mapping automatique selon la source
      switch (config.source) {
        case "owner":
          value = this.mapOwnerData(fieldName, lease.owner)
          break
        case "tenant":
          value = this.mapTenantData(fieldName, lease.tenant)
          break
        case "property":
          value = this.mapPropertyData(fieldName, lease.property)
          break
        case "lease":
          value = this.mapLeaseData(fieldName, lease)
          break
        default:
          // Essayer de mapper automatiquement
          value = this.autoMapField(fieldName, lease, config)
          break
      }

      if (value !== null && value !== undefined && value !== "") {
        source = "auto"
      }

      // Utiliser la valeur par défaut si disponible
      if ((value === null || value === undefined || value === "") && config.default) {
        value = config.default
        source = "auto"
      }

      mappedData[fieldName] = {
        value,
        source,
        required: config.required || false,
        label: config.label || fieldName,
        type: config.type || "string",
      }
    }

    return mappedData
  }

  private mapOwnerData(fieldName: string, owner: any): any {
    const mapping: { [key: string]: string } = {
      bailleur_nom_prenom: `${owner.first_name} ${owner.last_name}`,
      bailleur_domicile: owner.address,
      bailleur_email: owner.email,
      nom_bailleur: `${owner.first_name} ${owner.last_name}`,
    }
    return mapping[fieldName] || null
  }

  private mapTenantData(fieldName: string, tenant: any): any {
    const mapping: { [key: string]: string } = {
      locataire_nom_prenom: `${tenant.first_name} ${tenant.last_name}`,
      locataire_email: tenant.email,
      nom_locataire: `${tenant.first_name} ${tenant.last_name}`,
    }
    return mapping[fieldName] || null
  }

  private mapPropertyData(fieldName: string, property: any): any {
    const mapping: { [key: string]: any } = {
      localisation_logement: `${property.address}, ${property.city}`,
      surface_habitable: property.surface,
      nombre_pieces: property.rooms,
    }
    return mapping[fieldName] || null
  }

  private mapLeaseData(fieldName: string, lease: any): any {
    const mapping: { [key: string]: any } = {
      date_prise_effet: lease.start_date,
      montant_loyer_mensuel: lease.monthly_rent,
      montant_provisions_charges: lease.charges,
      montant_depot_garantie: lease.deposit,
    }
    return mapping[fieldName] || null
  }

  private autoMapField(fieldName: string, lease: any, config: any): any {
    // Mapping automatique intelligent
    const autoMappings: { [key: string]: any } = {
      bailleur_qualite: "Personne physique",
      destination_locaux: "Usage d'habitation",
      duree_contrat: lease.lease_type === "furnished" ? "1 an" : "3 ans",
      periodicite_paiement: "Mensuel",
      paiement_echeance: "À échoir",
      date_paiement: "Le 1er de chaque mois",
      montant_premiere_echeance: lease.monthly_rent + (lease.charges || 0),
      modalite_reglement_charges: "Provisions sur charges avec régularisation annuelle",
      soumis_decret_evolution: "Non",
      soumis_loyer_reference: "Non",
      annexe_dpe: true,
      annexe_risques: true,
      annexe_notice: true,
      annexe_etat_lieux: true,
      date_signature: new Date().toISOString().split("T")[0],
      lieu_signature: lease.property?.city || "",
    }

    return autoMappings[fieldName] || null
  }

  getRequiredMissingFields(mappedData: LeaseDataMapping): string[] {
    return Object.entries(mappedData)
      .filter(([_, field]) => field.required && field.source === "missing")
      .map(([fieldName, _]) => fieldName)
  }

  getFieldsBySource(mappedData: LeaseDataMapping): {
    auto: string[]
    manual: string[]
    missing: string[]
  } {
    const result = { auto: [], manual: [], missing: [] }

    for (const [fieldName, field] of Object.entries(mappedData)) {
      result[field.source].push(fieldName)
    }

    return result
  }
}

export const leaseDataMapper = new LeaseDataMapper()

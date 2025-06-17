import { supabase } from "./supabase"

export interface LeaseTemplate {
  id: string
  name: string
  description: string
  lease_type: string
  template_content: string
  field_mapping: any
  is_active: boolean
  is_default: boolean
  version: string
  legal_references: string
  created_at: string
  updated_at: string
}

export interface LeaseData {
  // Parties
  nom_bailleur: string
  adresse_bailleur: string
  email_bailleur: string
  telephone_bailleur?: string
  nom_locataire: string
  adresse_locataire: string
  email_locataire: string
  telephone_locataire?: string

  // Bien
  adresse_postale: string
  code_postal: string
  ville: string
  type_logement: string
  surface_m2: number
  nombre_pieces: number
  etage?: string
  zone_geographique: string

  // Financier
  loyer: number
  charges: number
  loyer_cc: number
  depot_garantie: number
  nb_mois_depot: number

  // Dates
  date_debut: string
  date_fin: string
  duree: number

  // Spécifique meublé
  equipements_obligatoires?: string[]
  equipements_supplementaires?: string[]
  usage_prevu?: string

  // Clauses
  clauses_particulieres?: string

  // Documents
  dpe: boolean
  etat_risques: boolean
  diagnostic_electrique: boolean
  diagnostic_gaz: boolean
  surface_carrez: boolean
  notice_informative: boolean
  reglement_copro: boolean

  // Signature
  ville_signature: string
  date_signature: string
}

class LeaseTemplateService {
  async getTemplates(leaseType?: string, activeOnly = false): Promise<LeaseTemplate[]> {
    let query = supabase.from("lease_templates").select("*").order("created_at", { ascending: false })

    if (leaseType) {
      query = query.eq("lease_type", leaseType)
    }

    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async getTemplate(id: string): Promise<LeaseTemplate | null> {
    const { data, error } = await supabase.from("lease_templates").select("*").eq("id", id).single()

    if (error) throw error
    return data
  }

  async getDefaultTemplate(leaseType: string): Promise<LeaseTemplate | null> {
    const { data, error } = await supabase
      .from("lease_templates")
      .select("*")
      .eq("lease_type", leaseType)
      .eq("is_default", true)
      .eq("is_active", true)
      .single()

    if (error) throw error
    return data
  }

  async createTemplate(template: Partial<LeaseTemplate>): Promise<LeaseTemplate> {
    // Si c'est un template par défaut, désactiver les autres
    if (template.is_default && template.lease_type) {
      await supabase
        .from("lease_templates")
        .update({ is_default: false })
        .eq("lease_type", template.lease_type)
        .eq("is_default", true)
    }

    const { data, error } = await supabase.from("lease_templates").insert(template).select().single()

    if (error) throw error
    return data
  }

  async updateTemplate(id: string, updates: Partial<LeaseTemplate>): Promise<LeaseTemplate> {
    // Si c'est un template par défaut, désactiver les autres
    if (updates.is_default) {
      const { data: currentTemplate } = await supabase
        .from("lease_templates")
        .select("lease_type")
        .eq("id", id)
        .single()

      if (currentTemplate) {
        await supabase
          .from("lease_templates")
          .update({ is_default: false })
          .eq("lease_type", currentTemplate.lease_type)
          .eq("is_default", true)
          .neq("id", id)
      }
    }

    const { data, error } = await supabase
      .from("lease_templates")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase.from("lease_templates").delete().eq("id", id)
    if (error) throw error
  }

  validateFieldMapping(mapping: any): boolean {
    try {
      if (typeof mapping !== "object" || mapping === null) return false

      for (const [key, field] of Object.entries(mapping)) {
        if (typeof field !== "object" || field === null) return false

        const fieldObj = field as any
        if (!fieldObj.type || typeof fieldObj.type !== "string") return false

        const validTypes = ["string", "number", "boolean", "date", "email", "select", "array", "textarea"]
        if (!validTypes.includes(fieldObj.type)) return false

        if (fieldObj.options && !Array.isArray(fieldObj.options)) return false
      }

      return true
    } catch {
      return false
    }
  }

  extractTemplateVariables(templateContent: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g
    const variables = new Set<string>()
    let match

    while ((match = regex.exec(templateContent)) !== null) {
      const variable = match[1].trim()
      // Ignorer les helpers Handlebars
      if (!variable.startsWith("#") && !variable.startsWith("/") && !variable.includes(" ")) {
        variables.add(variable)
      }
    }

    return Array.from(variables).sort()
  }

  generatePreview(template: LeaseTemplate, sampleData?: Partial<LeaseData>): string {
    const defaultData: LeaseData = {
      nom_bailleur: "Jean Dupont",
      adresse_bailleur: "123 rue de la Paix, 75001 Paris",
      email_bailleur: "jean.dupont@email.com",
      telephone_bailleur: "01 23 45 67 89",
      nom_locataire: "Marie Martin",
      adresse_locataire: "456 avenue des Champs, 75008 Paris",
      email_locataire: "marie.martin@email.com",
      telephone_locataire: "01 98 76 54 32",
      adresse_postale: "789 boulevard Saint-Germain",
      code_postal: "75007",
      ville: "Paris",
      type_logement: "Appartement",
      surface_m2: 45,
      nombre_pieces: 2,
      etage: "3ème étage",
      zone_geographique: "Paris",
      loyer: 1200,
      charges: 150,
      loyer_cc: 1350,
      depot_garantie: 2400,
      nb_mois_depot: 2,
      date_debut: "01/07/2025",
      date_fin: "30/06/2028",
      duree: template.lease_type === "furnished" ? 12 : 36,
      equipements_obligatoires: [
        "Literie avec couette",
        "Table et chaises",
        "Réfrigérateur",
        "Plaques de cuisson",
        "Vaisselle de base",
      ],
      equipements_supplementaires: ["Lave-linge", "Télévision"],
      usage_prevu: "résidence principale",
      clauses_particulieres: "Animaux interdits. Sous-location interdite.",
      dpe: true,
      etat_risques: true,
      diagnostic_electrique: false,
      diagnostic_gaz: false,
      surface_carrez: false,
      notice_informative: true,
      reglement_copro: false,
      ville_signature: "Paris",
      date_signature: new Date().toLocaleDateString("fr-FR"),
    }

    const data = { ...defaultData, ...sampleData }

    try {
      const Handlebars = require("handlebars")

      // Enregistrer les helpers
      Handlebars.registerHelper("if", function (conditional: any, options: any) {
        if (conditional) {
          return options.fn(this)
        } else {
          return options.inverse(this)
        }
      })

      Handlebars.registerHelper("each", (context: any[], options: any) => {
        let ret = ""
        if (context && context.length > 0) {
          for (let i = 0; i < context.length; i++) {
            ret += options.fn(context[i])
          }
        }
        return ret
      })

      const compiledTemplate = Handlebars.compile(template.template_content)
      return compiledTemplate(data)
    } catch (error) {
      console.error("Erreur génération preview:", error)
      return "Erreur lors de la génération de l'aperçu"
    }
  }
}

export const leaseTemplateService = new LeaseTemplateService()

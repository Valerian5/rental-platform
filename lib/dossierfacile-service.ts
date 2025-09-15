import { supabase } from "./supabase"

export interface DossierFacileData {
  id: string
  tenant_id: string
  dossierfacile_id?: string
  dossierfacile_verification_code?: string
  dossierfacile_pdf_url?: string
  dossierfacile_status?: "pending" | "verified" | "rejected"
  dossierfacile_verified_at?: string
  dossierfacile_data?: {
    // Données extraites du dossier DossierFacile
    personal_info: {
      first_name: string
      last_name: string
      birth_date: string
      birth_place: string
      nationality: string
    }
    professional_info: {
      profession: string
      company: string
      contract_type: string
      monthly_income: number
      activity_documents: string[]
    }
    housing_info: {
      current_situation: string
      current_address: string
      current_rent: number
      housing_documents: string[]
    }
    financial_info: {
      total_income: number
      income_sources: any[]
      tax_documents: string[]
    }
    guarantors: Array<{
      type: "physical" | "organism" | "moral_person"
      personal_info?: any
      income: number
      documents: string[]
    }>
    documents: {
      identity_documents: string[]
      income_documents: string[]
      housing_documents: string[]
      other_documents: string[]
    }
    verification: {
      is_verified: boolean
      verification_date: string
      verification_errors: string[]
    }
  }
  created_at: string
  updated_at: string
}

export interface DossierFacileApiResponse {
  success: boolean
  data?: {
    dossier_id: string
    status: string
    verification_code: string
    documents: any[]
    personal_info: any
    professional_info: any
    financial_info: any
  }
  error?: string
}

export const dossierFacileService = {
  // Créer un nouveau dossier DossierFacile via OAuth2
  async createDossierFacileFromOAuth(tenantId: string, accessToken: string, refreshToken: string, profileData: any): Promise<DossierFacileData> {
    console.log("📋 DossierFacileService.createDossierFacileFromOAuth", { tenantId })

    try {
      // 1. Extraire les données du profil
      const extractedData = this.extractDossierFacileData(profileData)

      // 2. Sauvegarder en base de données
      const dossierData: Partial<DossierFacileData> = {
        tenant_id: tenantId,
        dossierfacile_id: profileData.id || `df_${Date.now()}`,
        dossierfacile_verification_code: tenantId, // Utiliser l'ID utilisateur comme référence
        dossierfacile_status: "verified",
        dossierfacile_verified_at: new Date().toISOString(),
        dossierfacile_data: extractedData,
        access_token: accessToken,
        refresh_token: refreshToken,
      }

      const { data, error } = await supabase
        .from("dossierfacile_dossiers")
        .insert(dossierData)
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création dossier DossierFacile:", error)
        throw new Error(error.message)
      }

      console.log("✅ Dossier DossierFacile créé avec succès")
      return data as DossierFacileData
    } catch (error) {
      console.error("❌ Erreur dans createDossierFacileFromOAuth:", error)
      throw error
    }
  },

  // Obtenir un token d'accès OAuth2 pour DossierFacile Connect
  async getAccessToken(code: string, redirectUri: string): Promise<{ access_token: string; refresh_token: string }> {
    console.log("🔑 Obtention du token d'accès DossierFacile Connect")

    const tokenUrl = process.env.NODE_ENV === "production" 
      ? "https://sso.dossierfacile.fr/auth/realms/dossier-facile/protocol/openid-connect/token"
      : "https://sso-preprod.dossierfacile.fr/auth/realms/dossier-facile/protocol/openid-connect/token"

    try {
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: process.env.DOSSIERFACILE_CLIENT_ID!,
          client_secret: process.env.DOSSIERFACILE_CLIENT_SECRET!,
          code: code,
          redirect_uri: redirectUri,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur OAuth2 DossierFacile: ${response.status}`)
      }

      const data = await response.json()
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      }
    } catch (error) {
      console.error("❌ Erreur obtention token DossierFacile:", error)
      throw error
    }
  },

  // Récupérer les données du profil via DossierFacile Connect
  async getTenantProfile(accessToken: string): Promise<DossierFacileApiResponse> {
    console.log("📋 Récupération du profil DossierFacile Connect")

    const apiUrl = process.env.NODE_ENV === "production"
      ? "https://api.dossierfacile.fr/dfc/tenant/profile"
      : "https://api-preprod.dossierfacile.fr/dfc/tenant/profile"

    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur API DossierFacile Connect: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data,
      }
    } catch (error) {
      console.error("❌ Erreur récupération profil DossierFacile:", error)
      throw error
    }
  },

  // Rafraîchir le token d'accès
  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    console.log("🔄 Rafraîchissement du token DossierFacile")

    const tokenUrl = process.env.NODE_ENV === "production" 
      ? "https://sso.dossierfacile.fr/auth/realms/dossier-facile/protocol/openid-connect/token"
      : "https://sso-preprod.dossierfacile.fr/auth/realms/dossier-facile/protocol/openid-connect/token"

    try {
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.DOSSIERFACILE_CLIENT_ID!,
          client_secret: process.env.DOSSIERFACILE_CLIENT_SECRET!,
          refresh_token: refreshToken,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur refresh token DossierFacile: ${response.status}`)
      }

      const data = await response.json()
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      }
    } catch (error) {
      console.error("❌ Erreur refresh token DossierFacile:", error)
      throw error
    }
  },

  // Simuler une réponse DossierFacile pour le développement
  simulateDossierFacileResponse(verificationCode: string): DossierFacileApiResponse {
    console.log("🧪 Simulation réponse DossierFacile pour le développement")
    
    return {
      success: true,
      data: {
        dossier_id: `df_${Date.now()}`,
        status: "verified",
        verification_code: verificationCode,
        documents: [
          { type: "identity", name: "carte_identite.pdf", url: "https://example.com/ci.pdf" },
          { type: "income", name: "avis_imposition.pdf", url: "https://example.com/ai.pdf" },
          { type: "housing", name: "quittances_loyer.pdf", url: "https://example.com/ql.pdf" },
        ],
        personal_info: {
          first_name: "Jean",
          last_name: "Dupont",
          birth_date: "1990-01-15",
          birth_place: "Paris",
          nationality: "française",
        },
        professional_info: {
          profession: "Développeur",
          company: "TechCorp",
          contract_type: "CDI",
          monthly_income: 3500,
          activity_documents: ["contrat_travail.pdf"],
        },
        financial_info: {
          total_income: 3500,
          income_sources: [
            { type: "work", amount: 3500, documents: ["contrat_travail.pdf"] }
          ],
          tax_documents: ["avis_imposition.pdf"],
        },
      },
    }
  },

  // Extraire et structurer les données DossierFacile
  extractDossierFacileData(apiData: any) {
    console.log("📊 Extraction des données DossierFacile")

    return {
      personal_info: {
        first_name: apiData.personal_info?.first_name || "",
        last_name: apiData.personal_info?.last_name || "",
        birth_date: apiData.personal_info?.birth_date || "",
        birth_place: apiData.personal_info?.birth_place || "",
        nationality: apiData.personal_info?.nationality || "française",
      },
      professional_info: {
        profession: apiData.professional_info?.profession || "",
        company: apiData.professional_info?.company || "",
        contract_type: apiData.professional_info?.contract_type || "CDI",
        monthly_income: apiData.professional_info?.monthly_income || 0,
        activity_documents: apiData.professional_info?.activity_documents || [],
      },
      housing_info: {
        current_situation: apiData.housing_info?.current_situation || "locataire",
        current_address: apiData.housing_info?.current_address || "",
        current_rent: apiData.housing_info?.current_rent || 0,
        housing_documents: apiData.housing_info?.housing_documents || [],
      },
      financial_info: {
        total_income: apiData.financial_info?.total_income || 0,
        income_sources: apiData.financial_info?.income_sources || [],
        tax_documents: apiData.financial_info?.tax_documents || [],
      },
      guarantors: apiData.guarantors || [],
      documents: {
        identity_documents: apiData.documents?.filter((d: any) => d.type === "identity").map((d: any) => d.url) || [],
        income_documents: apiData.documents?.filter((d: any) => d.type === "income").map((d: any) => d.url) || [],
        housing_documents: apiData.documents?.filter((d: any) => d.type === "housing").map((d: any) => d.url) || [],
        other_documents: apiData.documents?.filter((d: any) => !["identity", "income", "housing"].includes(d.type)).map((d: any) => d.url) || [],
      },
      verification: {
        is_verified: apiData.status === "verified",
        verification_date: new Date().toISOString(),
        verification_errors: [],
      },
    }
  },

  // Récupérer un dossier DossierFacile par tenant_id
  async getDossierFacileByTenant(tenantId: string): Promise<DossierFacileData | null> {
    console.log("📋 DossierFacileService.getDossierFacileByTenant", tenantId)

    try {
      const { data, error } = await supabase
        .from("dossierfacile_dossiers")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return null
        }
        console.error("❌ Erreur récupération dossier DossierFacile:", error)
        throw new Error(error.message)
      }

      return data as DossierFacileData
    } catch (error) {
      console.error("❌ Erreur dans getDossierFacileByTenant:", error)
      return null
    }
  },

  // Convertir les données DossierFacile vers le format RentalFile
  convertToRentalFile(dossierFacileData: DossierFacileData): any {
    console.log("🔄 Conversion DossierFacile vers RentalFile")

    const data = dossierFacileData.dossierfacile_data
    if (!data) {
      throw new Error("Données DossierFacile manquantes")
    }

    return {
      tenant_id: dossierFacileData.tenant_id,
      creation_method: "dossierfacile",
      is_dossierfacile_certified: true,
      dossierfacile_id: dossierFacileData.dossierfacile_id,
      dossierfacile_verification_code: dossierFacileData.dossierfacile_verification_code,
      dossierfacile_pdf_url: dossierFacileData.dossierfacile_pdf_url,
      
      // Données principales
      monthly_income: data.professional_info.monthly_income,
      profession: data.professional_info.profession,
      company: data.professional_info.company,
      contract_type: data.professional_info.contract_type,
      
      // Structure complète du locataire principal
      main_tenant: {
        type: "main",
        first_name: data.personal_info.first_name,
        last_name: data.personal_info.last_name,
        birth_date: data.personal_info.birth_date,
        birth_place: data.personal_info.birth_place,
        nationality: data.personal_info.nationality,
        current_housing_situation: data.housing_info.current_situation,
        current_housing_documents: {
          quittances_loyer: data.housing_info.housing_documents,
        },
        main_activity: this.mapContractTypeToActivity(data.professional_info.contract_type),
        profession: data.professional_info.profession,
        company: data.professional_info.company,
        activity_documents: data.professional_info.activity_documents,
        income_sources: {
          work_income: {
            type: "salarie",
            amount: data.professional_info.monthly_income,
            documents: data.professional_info.activity_documents,
          },
        },
        tax_situation: {
          type: "own_notice",
          documents: data.financial_info.tax_documents,
        },
        identity_documents: data.documents.identity_documents,
      },
      
      // Garants
      guarantors: data.guarantors.map((guarantor, index) => ({
        type: guarantor.type,
        personal_info: guarantor.personal_info,
        organism_name: guarantor.type === "organism" ? "Organisme garant" : undefined,
        company_name: guarantor.type === "moral_person" ? "Entreprise" : undefined,
      })),
      
      // Métadonnées
      status: "validated",
      completion_percentage: 100,
      validation_score: 95, // Score élevé car certifié DossierFacile
    }
  },

  // Mapper le type de contrat vers l'activité principale
  mapContractTypeToActivity(contractType: string): string {
    const mapping: Record<string, string> = {
      "CDI": "cdi",
      "CDD": "cdd",
      "Fonction publique": "fonction_publique",
      "Indépendant": "independant",
      "Retraite": "retraite",
      "Chômage": "chomage",
      "Études": "etudes",
      "Alternance": "alternance",
    }
    return mapping[contractType] || "cdi"
  },

  // Mettre à jour un dossier DossierFacile
  async updateDossierFacile(tenantId: string, updates: Partial<DossierFacileData>): Promise<DossierFacileData> {
    console.log("📋 DossierFacileService.updateDossierFacile", { tenantId, updates })

    try {
      const { data, error } = await supabase
        .from("dossierfacile_dossiers")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenantId)
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur mise à jour dossier DossierFacile:", error)
        throw new Error(error.message)
      }

      return data as DossierFacileData
    } catch (error) {
      console.error("❌ Erreur dans updateDossierFacile:", error)
      throw error
    }
  },

  // Supprimer un dossier DossierFacile
  async deleteDossierFacile(tenantId: string): Promise<void> {
    console.log("🗑️ DossierFacileService.deleteDossierFacile", tenantId)

    try {
      const { error } = await supabase
        .from("dossierfacile_dossiers")
        .delete()
        .eq("tenant_id", tenantId)

      if (error) {
        console.error("❌ Erreur suppression dossier DossierFacile:", error)
        throw new Error(error.message)
      }

      console.log("✅ Dossier DossierFacile supprimé")
    } catch (error) {
      console.error("❌ Erreur dans deleteDossierFacile:", error)
      throw error
    }
  },
}

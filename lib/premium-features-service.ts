let cachedPremiumFeatures: any = null
let cacheExpiry = 0

export interface PremiumFeatures {
  electronic_signature: boolean
  advanced_templates: boolean
  api_integrations: boolean
}

export const premiumFeaturesService = {
  async getPremiumFeatures(): Promise<PremiumFeatures> {
    // Cache for 5 minutes
    if (cachedPremiumFeatures && Date.now() < cacheExpiry) {
      return cachedPremiumFeatures
    }

    try {
      const response = await fetch("/api/admin/settings/premium-features")
      const result = await response.json()

      if (result.success) {
        cachedPremiumFeatures = result.data
        cacheExpiry = Date.now() + 5 * 60 * 1000 // 5 minutes
        return cachedPremiumFeatures
      }
    } catch (error) {
      console.error("Erreur récupération premium features:", error)
    }

    // Fallback to default values
    return {
      electronic_signature: false,
      advanced_templates: false,
      api_integrations: false,
    }
  },

  async isElectronicSignatureEnabled(): Promise<boolean> {
    const features = await this.getPremiumFeatures()
    return features.electronic_signature
  },

  clearCache() {
    cachedPremiumFeatures = null
    cacheExpiry = 0
  },
}

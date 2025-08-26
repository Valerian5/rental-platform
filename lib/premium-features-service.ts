let cachedPremiumFeatures: any = null
let cacheExpiry = 0

export interface PremiumFeatures {
  electronic_signature: boolean
  advanced_templates: boolean
  api_integrations: boolean
}

export const premiumFeaturesService = {
  async getPremiumFeatures(): Promise<PremiumFeatures> {
    if (cachedPremiumFeatures && Date.now() < cacheExpiry) {
      console.log("[v0] Using cached premium features:", cachedPremiumFeatures)
      return cachedPremiumFeatures
    }

    try {
      console.log("[v0] Fetching premium features from API...")
      const response = await fetch("/api/admin/settings/premium-features")
      const result = await response.json()

      if (result.success) {
        cachedPremiumFeatures = result.data
        cacheExpiry = Date.now() + 1 * 60 * 1000 // 1 minute instead of 5
        console.log("[v0] Premium features loaded:", cachedPremiumFeatures)
        return cachedPremiumFeatures
      }
    } catch (error) {
      console.error("Erreur récupération premium features:", error)
    }

    // Fallback to default values
    const defaultFeatures = {
      electronic_signature: false,
      advanced_templates: false,
      api_integrations: false,
    }
    console.log("[v0] Using default premium features:", defaultFeatures)
    return defaultFeatures
  },

  async isElectronicSignatureEnabled(): Promise<boolean> {
    const features = await this.getPremiumFeatures()
    console.log("[v0] Electronic signature enabled:", features.electronic_signature)
    return features.electronic_signature
  },

  clearCache() {
    console.log("[v0] Clearing premium features cache")
    cachedPremiumFeatures = null
    cacheExpiry = 0
  },
}

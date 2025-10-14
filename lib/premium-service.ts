import { createServerClient } from "@/lib/supabase"

export interface PremiumModule {
  id: string
  name: string
  display_name: string
  description: string
  icon: string
  category: string
  is_active: boolean
}

export interface PricingPlan {
  id: string
  name: string
  display_name: string
  description: string
  price_monthly: number
  price_yearly: number
  stripe_product_id?: string | null
  stripe_price_monthly_id?: string | null
  stripe_price_yearly_id?: string | null
  is_free: boolean
  is_popular: boolean
  max_properties: number | null
  max_tenants: number | null
  max_storage_gb: number | null
  modules: PremiumModule[]
}

export interface AgencySubscription {
  id: string
  agency_id: string
  plan_id: string
  status: "active" | "cancelled" | "expired" | "trial"
  started_at: string
  expires_at: string | null
  trial_ends_at: string | null
  is_trial: boolean
  plan: PricingPlan
}

export class PremiumService {
  private supabase = createServerClient()

  // Vérifier si une agence a accès à un module
  async hasModuleAccess(agencyId: string, moduleName: string): Promise<boolean> {
    try {
      const { data: subscription } = await this.supabase
        .from("agency_subscriptions")
        .select(`
          *,
          pricing_plans!inner (
            *,
            plan_modules!inner (
              is_included,
              usage_limit,
              premium_modules!inner (
                name
              )
            )
          )
        `)
        .eq("agency_id", agencyId)
        .eq("status", "active")
        .eq("pricing_plans.plan_modules.premium_modules.name", moduleName)
        .single()

      if (!subscription) return false

      const planModule = subscription.pricing_plans.plan_modules[0]
      if (!planModule?.is_included) return false

      // Vérifier les limites d'utilisation si applicable
      if (planModule.usage_limit) {
        const usage = await this.getModuleUsage(agencyId, moduleName)
        return usage < planModule.usage_limit
      }

      return true
    } catch (error) {
      console.error("❌ Erreur vérification accès module:", error)
      return false
    }
  }

  // Obtenir l'utilisation actuelle d'un module
  async getModuleUsage(agencyId: string, moduleName: string): Promise<number> {
    try {
      const { data: module } = await this.supabase.from("premium_modules").select("id").eq("name", moduleName).single()

      if (!module) return 0

      const { data: usage } = await this.supabase
        .from("agency_module_usage")
        .select("usage_count")
        .eq("agency_id", agencyId)
        .eq("module_id", module.id)
        .single()

      return usage?.usage_count || 0
    } catch (error) {
      console.error("❌ Erreur récupération utilisation:", error)
      return 0
    }
  }

  // Incrémenter l'utilisation d'un module
  async incrementModuleUsage(agencyId: string, moduleName: string): Promise<void> {
    try {
      const { data: module } = await this.supabase.from("premium_modules").select("id").eq("name", moduleName).single()

      if (!module) return

      await this.supabase.from("agency_module_usage").upsert(
        {
          agency_id: agencyId,
          module_id: module.id,
          usage_count: 1,
          last_used_at: new Date().toISOString(),
        },
        {
          onConflict: "agency_id,module_id",
          ignoreDuplicates: false,
        },
      )

      // Incrémenter si existe déjà
      await this.supabase.rpc("increment_module_usage", {
        p_agency_id: agencyId,
        p_module_id: module.id,
      })
    } catch (error) {
      console.error("❌ Erreur incrémentation utilisation:", error)
    }
  }

  // Obtenir tous les plans disponibles
  async getPricingPlans(): Promise<PricingPlan[]> {
    try {
      const { data: plans } = await this.supabase
        .from("pricing_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")

      return (
        plans?.map((plan) => ({
          ...plan,
          modules: [], // Plus de modules basés sur premium_modules
        })) || []
      )
    } catch (error) {
      console.error("❌ Erreur récupération plans:", error)
      return []
    }
  }

  // Obtenir l'abonnement actuel d'une agence
  async getAgencySubscription(agencyId: string): Promise<AgencySubscription | null> {
    try {
      const { data: subscription } = await this.supabase
        .from("agency_subscriptions")
        .select(`
          *,
          pricing_plans (
            *,
            plan_modules (
              is_included,
              usage_limit,
              premium_modules (*)
            )
          )
        `)
        .eq("agency_id", agencyId)
        .eq("status", "active")
        .single()

      if (!subscription) return null

      return {
        ...subscription,
        plan: {
          ...subscription.pricing_plans,
          modules: subscription.pricing_plans.plan_modules
            .filter((pm: any) => pm.is_included)
            .map((pm: any) => pm.premium_modules),
        },
      }
    } catch (error) {
      console.error("❌ Erreur récupération abonnement:", error)
      return null
    }
  }

  // Créer ou mettre à jour un abonnement
  async updateAgencySubscription(agencyId: string, planId: string, isTrialMode = false): Promise<void> {
    try {
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + (isTrialMode ? 1 : 12))

      await this.supabase.from("agency_subscriptions").upsert(
        {
          agency_id: agencyId,
          plan_id: planId,
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_trial: isTrialMode,
          trial_ends_at: isTrialMode ? expiresAt.toISOString() : null,
        },
        {
          onConflict: "agency_id",
        },
      )
    } catch (error) {
      console.error("❌ Erreur mise à jour abonnement:", error)
      throw error
    }
  }
}

export const premiumService = new PremiumService()

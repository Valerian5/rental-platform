import { createServerClient } from "@/lib/supabase"
import { resolveUserPlan } from "@/lib/subscription-resolver"

export interface PlanLimits {
  maxProperties: number | null
  applicationsLimit: number | null
  hasPropertyManagement: boolean
  hasElectronicSignature: boolean
  hasScoringCustomization: boolean
  hasPayments: boolean
  hasLeases: boolean
  planId: string | null
  planName: string | null
}

export async function getOwnerPlanLimits(userId: string): Promise<PlanLimits> {
  const resolved = await resolveUserPlan(userId)
  
  if (!resolved.plan) {
    // Plan gratuit par défaut
    return {
      maxProperties: 1,
      applicationsLimit: 50,
      hasPropertyManagement: false,
      hasElectronicSignature: false,
      hasScoringCustomization: false,
      hasPayments: false,
      hasLeases: true,
      planId: null,
      planName: "free",
    }
  }

  const plan = resolved.plan as any
  const features = plan.features || []
  const quotas = plan.quotas || {}

  return {
    maxProperties: plan.max_properties ?? 1,
    applicationsLimit: quotas.applications || (plan.is_free ? 50 : null),
    hasPropertyManagement: features.includes("property_management"),
    hasElectronicSignature: features.includes("electronic_signature"),
    hasScoringCustomization: features.includes("scoring_customization"),
    hasPayments: features.includes("payments"),
    hasLeases: features.includes("leases") || true, // Toujours accessible
    planId: plan.id,
    planName: plan.name ?? null,
  }
}



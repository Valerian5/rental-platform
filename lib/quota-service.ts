import { createServerClient } from "@/lib/supabase"
import { premiumService } from "@/lib/premium-service"

export interface PlanLimits {
  maxProperties: number | null
  applicationsLimit: number | null
  hasPropertyManagement: boolean
  planId: string | null
  planName: string | null
}

export async function getOwnerPlanLimits(userId: string): Promise<PlanLimits> {
  const supabase = createServerClient()
  // Récupérer agency_id de l'utilisateur
  const { data: user } = await supabase.from("users").select("agency_id").eq("id", userId).single()
  const agencyId = user?.agency_id
  if (!agencyId) {
    // Aucun rattachement agence → plan gratuit par défaut
    return {
      maxProperties: 1,
      applicationsLimit: 50,
      hasPropertyManagement: false,
      planId: null,
      planName: "free",
    }
  }

  const subscription = await premiumService.getAgencySubscription(agencyId)
  if (!subscription?.plan) {
    return {
      maxProperties: 1,
      applicationsLimit: 50,
      hasPropertyManagement: false,
      planId: null,
      planName: "free",
    }
  }

  const plan = subscription.plan as any
  const maxProperties: number | null = plan.max_properties ?? null
  // Chercher un module "applications" avec usage_limit s'il est configuré
  let applicationsLimit: number | null = null
  try {
    const { data: pm } = await supabase
      .from("plan_modules")
      .select("usage_limit, premium_modules(name)")
      .eq("plan_id", plan.id)
    const applicationsModule = (pm || []).find((row: any) => row.premium_modules?.name === "applications")
    if (applicationsModule?.usage_limit != null) {
      applicationsLimit = applicationsModule.usage_limit
    }
  } catch {
    // ignore
  }

  // Fallback: plan gratuit → 50 candidatures max, sinon illimité
  if (applicationsLimit == null) applicationsLimit = plan.is_free ? 50 : null

  // Déterminer si gestion locative incluse (module "property_management" inclus)
  let hasPropertyManagement = false
  try {
    const { data: pm } = await supabase
      .from("plan_modules")
      .select("is_included, premium_modules(name)")
      .eq("plan_id", plan.id)
    hasPropertyManagement = (pm || []).some((row: any) => row.is_included && row.premium_modules?.name === "property_management")
  } catch {
    // ignore
  }

  return {
    maxProperties,
    applicationsLimit,
    hasPropertyManagement,
    planId: plan.id,
    planName: plan.name ?? null,
  }
}



import { createServerClient } from "@/lib/supabase"

export async function resolveUserPlan(userId: string): Promise<{ plan: any | null; planId: string | null; scope: "owner" | "agency" | null }> {
  const supabase = createServerClient()
  // 1) Owner-level subscription if exists
  const { data: ownerSub } = await supabase
    .from("owner_subscriptions")
    .select(`*, pricing_plans (*)`)
    .eq("owner_id", userId)
    .eq("status", "active")
    .maybeSingle()

  if (ownerSub?.pricing_plans) {
    return { plan: ownerSub.pricing_plans, planId: ownerSub.pricing_plans.id, scope: "owner" }
  }

  // 2) Fallback to agency-level subscription
  const { data: user } = await supabase.from("users").select("agency_id").eq("id", userId).maybeSingle()
  const agencyId = user?.agency_id
  if (agencyId) {
    const { data: agencySub } = await supabase
      .from("agency_subscriptions")
      .select(`*, pricing_plans (*)`)
      .eq("agency_id", agencyId)
      .eq("status", "active")
      .maybeSingle()
    if (agencySub?.pricing_plans) {
      return { plan: agencySub.pricing_plans, planId: agencySub.pricing_plans.id, scope: "agency" }
    }
  }

  return { plan: null, planId: null, scope: null }
}



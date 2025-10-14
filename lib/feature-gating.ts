import { createServerClient } from "@/lib/supabase"
import { premiumService } from "@/lib/premium-service"

export async function getUserAgencyId(userId: string): Promise<string | null> {
  const supabase = createServerClient()
  const { data: user } = await supabase.from("users").select("agency_id").eq("id", userId).single()
  return user?.agency_id || null
}

export async function hasAccessToModule(userId: string, moduleName: string): Promise<boolean> {
  const agencyId = await getUserAgencyId(userId)
  if (!agencyId) return false
  return premiumService.hasModuleAccess(agencyId, moduleName)
}

export async function assertModuleAccess(userId: string, moduleName: string): Promise<void> {
  const ok = await hasAccessToModule(userId, moduleName)
  if (!ok) {
    const error: any = new Error("Accès refusé à la fonctionnalité")
    error.status = 403
    throw error
  }
}



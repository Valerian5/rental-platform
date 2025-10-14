import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { premiumService } from "@/lib/premium-service"
import { resolveUserPlan } from "@/lib/subscription-resolver"

export async function POST(request: NextRequest) {
  try {
    const { module_name } = await request.json()
    if (!module_name) return NextResponse.json({ success: false, error: "module_name requis" }, { status: 400 })

    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })

    const resolved = await resolveUserPlan(user.id)
    if (!resolved.planId) return NextResponse.json({ success: true, allowed: false })

    // Vérifier l'inclusion selon les règles de page (stockées dans site_settings)
    const { data: rules } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "page_module_access")
      .single()
    
    const pageRules = rules?.setting_value || []
    const rule = pageRules.find((r: any) => r.module_name === module_name)
    
    // Si pas de règle spécifique, utiliser les fonctionnalités par défaut du plan
    let allowed = false
    if (rule) {
      // Logique basée sur les règles de page (à implémenter selon tes besoins)
      allowed = true // Pour l'instant, on autorise si une règle existe
    } else {
      // Fonctionnalités par défaut selon le plan
      const plan = resolved.plan
      switch (module_name) {
        case "applications":
          allowed = true // Toujours accessible, mais limité par quota
          break
        case "property_management":
          allowed = !plan.is_free
          break
        case "leases":
          allowed = true
          break
        case "payments":
          allowed = !plan.is_free
          break
        case "scoring_customization":
          allowed = !plan.is_free
          break
        case "electronic_signature":
          allowed = !plan.is_free
          break
        default:
          allowed = false
      }
    }
    
    return NextResponse.json({ success: true, allowed })
  } catch (e) {
    console.error("❌ Erreur premium access:", e)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}



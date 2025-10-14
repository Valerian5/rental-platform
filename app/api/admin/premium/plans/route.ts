import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { premiumService } from "@/lib/premium-service"

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()
    
    if (userData?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Accès refusé" }, { status: 403 })
    }

    const plans = await premiumService.getPricingPlans()
    return NextResponse.json({ success: true, plans })
  } catch (error) {
    console.error("❌ Erreur récupération plans:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()
    
    if (userData?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Accès refusé" }, { status: 403 })
    }

    const data = await request.json()

    const { data: plan, error } = await supabase
      .from("pricing_plans")
      .insert({
        name: data.name,
        display_name: data.display_name,
        description: data.description,
        price_monthly: data.price_monthly,
        price_yearly: data.price_yearly,
        stripe_product_id: data.stripe_product_id,
        stripe_price_monthly_id: data.stripe_price_monthly_id,
        stripe_price_yearly_id: data.stripe_price_yearly_id,
        is_free: data.is_free,
        is_popular: data.is_popular,
        max_properties: data.max_properties,
        max_tenants: data.max_tenants,
        max_storage_gb: data.max_storage_gb,
        sort_order: data.sort_order,
      })
      .select()
      .single()

    if (error) throw error

    // Associer les modules au plan
    if (data.modules && data.modules.length > 0) {
      const planModules = data.modules.map((module: any) => ({
        plan_id: plan.id,
        module_id: module.id,
        is_included: module.is_included,
        usage_limit: module.usage_limit,
      }))

      await supabase.from("plan_modules").insert(planModules)
    }

    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error("❌ Erreur création plan:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

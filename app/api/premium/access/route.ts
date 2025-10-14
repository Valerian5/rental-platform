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

    // Vérifier l'inclusion module
    const allowed = (resolved.plan?.plan_modules || []).some(
      (pm: any) => pm.is_included && pm.premium_modules?.name === module_name,
    )
    return NextResponse.json({ success: true, allowed })
  } catch (e) {
    console.error("❌ Erreur premium access:", e)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}



import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@supabase/supabase-js"
import { premiumService } from "@/lib/premium-service"
import { resolveUserPlan } from "@/lib/subscription-resolver"

export async function POST(request: NextRequest) {
  try {
    const { module_name } = await request.json()
    if (!module_name) return NextResponse.json({ success: false, error: "module_name requis" }, { status: 400 })

    const authHeader = request.headers.get("authorization") || ""
    const hasBearer = authHeader.toLowerCase().startsWith("bearer ")
    const token = hasBearer ? authHeader.slice(7) : null
    const supabase = hasBearer
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        })
      : createServerClient(request)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })

    const resolved = await resolveUserPlan(user.id)
    if (!resolved.planId) return NextResponse.json({ success: true, allowed: false })

    // Décision d'accès basée UNIQUEMENT sur les features du plan résolu
    const plan = resolved.plan || {}
    const features: string[] = Array.isArray(plan.features) ? plan.features : []
    let allowed = false
    switch (module_name) {
      case "applications":
        allowed = true // Toujours accessible, quotas ailleurs
        break
      case "visits":
      case "property_management":
      case "rental_management_incidents":
      case "rental_management_maintenance":
      case "rental_management_documents":
      case "rental_management_rent_revision":
      case "rental_management_revision":
      case "rental_management_fiscal":
      case "rental_management_overview":
      case "payments":
      case "scoring_customization":
      case "electronic_signature":
        allowed = features.includes(module_name)
        break
      case "leases":
        allowed = true
        break
      default:
        allowed = false
    }
    
    return NextResponse.json({ success: true, allowed })
  } catch (e) {
    console.error("❌ Erreur premium access:", e)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}



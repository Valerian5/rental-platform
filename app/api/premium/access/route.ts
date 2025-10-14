import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { premiumService } from "@/lib/premium-service"

export async function POST(request: NextRequest) {
  try {
    const { module_name } = await request.json()
    if (!module_name) return NextResponse.json({ success: false, error: "module_name requis" }, { status: 400 })

    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })

    // Récupérer agency_id de l'utilisateur
    const { data: profile } = await supabase.from("users").select("agency_id").eq("id", user.id).maybeSingle()
    const agencyId = profile?.agency_id
    if (!agencyId) return NextResponse.json({ success: true, allowed: false })

    const allowed = await premiumService.hasModuleAccess(agencyId, module_name)
    return NextResponse.json({ success: true, allowed })
  } catch (e) {
    console.error("❌ Erreur premium access:", e)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}



import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server-client"
import { createClient } from "@supabase/supabase-js"
import { premiumService } from "@/lib/premium-service"
import { resolveUserPlan } from "@/lib/subscription-resolver"
import { getOwnerPlanLimits } from "@/lib/quota-service"

export async function POST(request: NextRequest) {
  try {
    const { module_name } = await request.json()
    if (!module_name) return NextResponse.json({ success: false, error: "module_name requis" }, { status: 400 })

    // Utiliser la même approche que les autres APIs qui fonctionnent
    const supabase = createServerClient(request)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })

    // Utiliser directement getOwnerPlanLimits comme dans le composant
    const limits = await getOwnerPlanLimits(user.id)
    
    // Mapper le moduleName vers la propriété correspondante
    let allowed = false
    switch (module_name) {
      case "leases":
        allowed = limits.hasLeases
        break
      case "scoring_customization":
        allowed = limits.hasScoringCustomization
        break
      case "visits":
        allowed = limits.hasVisits
        break
      case "applications":
        allowed = (limits.applicationsLimit ?? 0) > 0
        break
      case "property_management":
        allowed = limits.hasPropertyManagement
        break
      case "rental_management_incidents":
        allowed = limits.hasRentalManagementIncidents
        break
      case "rental_management_maintenance":
        allowed = limits.hasRentalManagementMaintenance
        break
      case "rental_management_documents":
        allowed = limits.hasRentalManagementDocuments
        break
      case "rental_management_fiscal":
        allowed = limits.hasRentalManagementFiscal
        break
      case "electronic_signature":
        allowed = limits.hasElectronicSignature
        break
      case "payments":
        allowed = limits.hasPayments
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



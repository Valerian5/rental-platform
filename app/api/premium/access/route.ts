import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { premiumService } from "@/lib/premium-service"
import { resolveUserPlan } from "@/lib/subscription-resolver"
import { getOwnerPlanLimits } from "@/lib/quota-service"

export async function POST(request: NextRequest) {
  try {
    const { module_name } = await request.json()
    if (!module_name) return NextResponse.json({ success: false, error: "module_name requis" }, { status: 400 })

    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Token d'authentification manquant" }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Créer un client Supabase avec service_role pour les opérations backend
    const supabase = createServerClient()
    
    // Vérifier l'authentification utilisateur avec le token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error("❌ Erreur auth premium access:", authError)
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 401 })
    }

    console.log("✅ User authentifié:", user.id, "Module:", module_name)

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
      case "rental_management_overview":
        allowed = limits.hasRentalManagementOverview
        break
      case "rental_management_rent_revision":
        allowed = limits.hasRentalManagementRentRevision
        break
      case "rental_management_revision":
        allowed = limits.hasRentalManagementRevision
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
    
    console.log("🔍 Limites du plan:", limits)
    console.log("🔍 Module:", module_name, "Allowed:", allowed)
    
    return NextResponse.json({ success: true, allowed })
  } catch (e) {
    console.error("❌ Erreur premium access:", e)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}



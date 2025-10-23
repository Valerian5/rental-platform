import { createServerClient } from "@/lib/supabase"
import { resolveUserPlan } from "@/lib/subscription-resolver"

export interface PlanLimits {
  maxProperties: number | null
  applicationsLimit: number | null
  hasPropertyManagement: boolean
  hasVisits: boolean
  hasRentalManagementIncidents: boolean
  hasRentalManagementMaintenance: boolean
  hasRentalManagementDocuments: boolean
  hasRentalManagementRentRevision: boolean
  hasRentalManagementRevision: boolean
  hasRentalManagementFiscal: boolean
  hasRentalManagementOverview: boolean
  hasElectronicSignature: boolean
  hasScoringCustomization: boolean
  hasPayments: boolean
  hasLeases: boolean
  planId: string | null
  planName: string | null
}

export async function getOwnerPlanLimits(userId: string): Promise<PlanLimits> {
  const resolved = await resolveUserPlan(userId)
  
  if (!resolved.plan) {
    // Plan gratuit par défaut
    return {
      maxProperties: 1,
      applicationsLimit: 50,
      hasPropertyManagement: false,
      hasVisits: false,
      hasRentalManagementIncidents: false,
      hasRentalManagementMaintenance: false,
      hasRentalManagementDocuments: false,
      hasRentalManagementRentRevision: false,
      hasRentalManagementRevision: false,
      hasRentalManagementFiscal: false,
      hasRentalManagementOverview: false,
      hasElectronicSignature: false,
      hasScoringCustomization: false,
      hasPayments: false,
      hasLeases: false,
      planId: null,
      planName: "free",
    }
  }

  const plan = resolved.plan as any
  const features = plan.features || []
  const quotas = plan.quotas || {}
  
  console.log("🔍 Plan résolu:", {
    planId: plan.id,
    planName: plan.name,
    features: features,
    hasLeasesFeature: features.includes("leases")
  })

  return {
    maxProperties: plan.max_properties ?? 1,
    applicationsLimit: quotas.applications || (plan.is_free ? 50 : null),
    hasPropertyManagement: features.includes("property_management"),
    hasVisits: features.includes("visits"),
    hasRentalManagementIncidents: features.includes("rental_management_incidents"),
    hasRentalManagementMaintenance: features.includes("rental_management_maintenance"),
    hasRentalManagementDocuments: features.includes("rental_management_documents"),
    hasRentalManagementRentRevision: features.includes("rental_management_rent_revision"),
    hasRentalManagementRevision: features.includes("rental_management_revision"),
    hasRentalManagementFiscal: features.includes("rental_management_fiscal"),
    hasRentalManagementOverview: features.includes("rental_management_overview"),
    hasElectronicSignature: features.includes("electronic_signature"),
    hasScoringCustomization: features.includes("scoring_customization"),
    hasPayments: features.includes("payments"),
    hasLeases: features.includes("leases"),
    planId: plan.id,
    planName: plan.name ?? null,
  }
}



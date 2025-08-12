// Service pour enrichir les données des candidatures de manière cohérente
export const applicationEnrichmentService = {
  // Enrichir une candidature avec les données du dossier de location
  async enrichApplication(application: any, rentalFile?: any): Promise<any> {
    console.log(`🔄 Enrichissement candidature ${application.id}`)

    // Calculer les revenus totaux (locataire principal + colocataires)
    let totalIncome = application.income || 0

    if (rentalFile?.main_tenant?.income_sources?.work_income?.amount) {
      totalIncome = rentalFile.main_tenant.income_sources.work_income.amount
    } else if (rentalFile?.main_tenant?.income_sources?.work_income?.monthly_amount) {
      totalIncome = rentalFile.main_tenant.income_sources.work_income.monthly_amount
    } else if (rentalFile?.main_tenant?.monthly_income) {
      totalIncome = rentalFile.main_tenant.monthly_income
    }

    // Ajouter les revenus des colocataires
    if (rentalFile?.cotenants && rentalFile.cotenants.length > 0) {
      rentalFile.cotenants.forEach((cotenant: any) => {
        if (cotenant.income_sources?.work_income?.amount) {
          totalIncome += cotenant.income_sources.work_income.amount
        }
      })
    }

    // Déterminer si il y a des garants
    const hasGuarantor =
      (rentalFile?.guarantors && rentalFile.guarantors.length > 0) || application.has_guarantor || false

    // Revenus du garant principal
    const guarantorIncome =
      rentalFile?.guarantors?.[0]?.personal_info?.income_sources?.work_income?.amount ||
      application.guarantor_income ||
      0

    // Type de contrat
    const contractType = rentalFile?.main_tenant?.main_activity || application.contract_type || "Non spécifié"

    // Complétude du dossier
    const completionPercentage = rentalFile?.completion_percentage || 0
    const documentsComplete = completionPercentage >= 80 || application.documents_complete || false

    // Documents vérifiés
    const hasVerifiedDocuments = rentalFile?.has_verified_documents || application.has_verified_documents || false

    // Message de présentation
    const presentation = rentalFile?.presentation_message || application.presentation || application.message || ""

    // Profession et entreprise
    const profession = rentalFile?.main_tenant?.profession || application.profession || "Non spécifié"
    const company = rentalFile?.main_tenant?.company || application.company || "Non spécifié"

    // Ancienneté et période d'essai
    const seniorityMonths =
      rentalFile?.main_tenant?.professional_info?.seniority_months || application.seniority_months || 0
    const trialPeriod = rentalFile?.main_tenant?.professional_info?.trial_period || application.trial_period || false

    const enrichedApplication = {
      ...application,
      // Données financières
      income: totalIncome,
      has_guarantor: hasGuarantor,
      guarantor_income: guarantorIncome,

      // Données professionnelles
      contract_type: contractType,
      profession: profession,
      company: company,
      seniority_months: seniorityMonths,
      trial_period: trialPeriod,

      // Données du dossier
      documents_complete: documentsComplete,
      has_verified_documents: hasVerifiedDocuments,
      presentation: presentation,
      completion_percentage: completionPercentage,

      // Métadonnées d'enrichissement
      enriched_at: new Date().toISOString(),
      rental_file_id: rentalFile?.id || null,
    }

    console.log(`✅ Candidature enrichie:`, {
      id: enrichedApplication.id,
      income: enrichedApplication.income,
      has_guarantor: enrichedApplication.has_guarantor,
      guarantor_income: enrichedApplication.guarantor_income,
      contract_type: enrichedApplication.contract_type,
      documents_complete: enrichedApplication.documents_complete,
      completion_percentage: enrichedApplication.completion_percentage,
    })

    return enrichedApplication
  },

  // Enrichir plusieurs candidatures en lot
  async enrichApplications(applications: any[], loadRentalFile: (tenantId: string) => Promise<any>): Promise<any[]> {
    console.log(`🔄 Enrichissement de ${applications.length} candidatures`)

    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        try {
          let rentalFile = null
          if (app.tenant_id) {
            rentalFile = await loadRentalFile(app.tenant_id)
          }
          return await this.enrichApplication(app, rentalFile)
        } catch (error) {
          console.error(`❌ Erreur enrichissement candidature ${app.id}:`, error)
          return app // Retourner l'application non enrichie en cas d'erreur
        }
      }),
    )

    console.log(`✅ ${enrichedApplications.length} candidatures enrichies`)
    return enrichedApplications
  },
}

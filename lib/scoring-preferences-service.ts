import { createServerClient } from "@/lib/supabase"

// Cache simple pour les préférences
const preferencesCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const scoringPreferencesService = {
  // Récupérer les préférences d'un propriétaire
  async getOwnerPreferences(ownerId: string, useCache = true): Promise<any> {
    const cacheKey = `prefs_${ownerId}`

    if (useCache && preferencesCache.has(cacheKey)) {
      const cached = preferencesCache.get(cacheKey)!
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📋 Préférences récupérées du cache pour ${ownerId}`)
        return cached.data
      }
    }

    try {
      const supabase = createServerClient()
      const { data, error } = await supabase
        .from("scoring_preferences")
        .select("*")
        .eq("owner_id", ownerId)
        .eq("is_default", true)
        .single()

      if (error || !data) {
        console.log(`📋 Aucune préférence trouvée pour ${ownerId}, utilisation des préférences par défaut`)
        // Retourner les préférences par défaut
        const defaultPrefs = this.getDefaultPreferences(ownerId)
        if (useCache) {
          preferencesCache.set(cacheKey, {
            data: defaultPrefs,
            timestamp: Date.now(),
          })
        }
        return defaultPrefs
      }

      console.log(`📋 Préférences chargées depuis la DB pour ${ownerId}:`, {
        name: data.name,
        model_type: data.model_type,
        system_preference_id: data.system_preference_id,
      })

      if (useCache) {
        preferencesCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        })
      }

      return data
    } catch (error) {
      console.error("Erreur récupération préférences:", error)
      return this.getDefaultPreferences(ownerId)
    }
  },

  // Préférences par défaut
  getDefaultPreferences(ownerId: string): any {
    return {
      owner_id: ownerId,
      name: "Modèle standard",
      description: "Critères de scoring par défaut",
      model_type: "standard",
      criteria: {
        income_ratio: {
          weight: 18,
          thresholds: {
            excellent: 3.5,
            good: 3.0,
            acceptable: 2.5,
            minimum: 2.0,
          },
          per_person_check: true,
          use_guarantor_income_for_students: false,
        },
        professional_stability: {
          weight: 17,
          contract_scoring: {
            cdi_confirmed: 20,
            cdi_trial: 15,
            cdd_long: 14,
            cdd_short: 10,
            freelance: 8,
            student: 6,
            unemployed: 0,
            retired: 15,
            civil_servant: 20,
          },
          seniority_bonus: {
            enabled: true,
            min_months: 6,
            bonus_points: 2,
          },
          trial_period_penalty: 3,
        },
        guarantor: {
          weight: 17,
          required_if_income_below: 3.0,
          minimum_income_ratio: 3.0,
          verification_required: true,
          use_guarantor_income_for_students: false,
          types_accepted: {
            parent: true,
            visale: true,
            garantme: true,
            other_physical: true,
            company: true,
          },
        },
        file_quality: {
          weight: 16,
          complete_documents_required: true,
          verified_documents_required: false,
          presentation_quality_weight: 6,
          coherence_check_weight: 8,
        },
        property_coherence: {
          weight: 16,
          household_size_vs_property: true,
          colocation_structure_check: true,
          location_relevance_check: false,
          family_situation_coherence: true,
        },
        income_distribution: {
          weight: 16,
          balance_check: true,
          compensation_allowed: true,
        },
      },
      is_default: true,
      exclusion_rules: {
        incomplete_file: false,
        no_guarantor_when_required: true,
        income_ratio_below_2: false,
        unverified_documents: false,
        manifest_incoherence: true,
      },
    }
  },

  // FONCTION UNIQUE DE CALCUL DE SCORE - UTILISÉE PARTOUT
  async calculateScore(
    application: any,
    property: any,
    ownerId: string,
    useCache = true,
  ): Promise<{
    totalScore: number
    breakdown: any
    compatible: boolean
    model_used: string
    model_version: string
    calculated_at: string
    recommendations: string[]
    warnings: string[]
    exclusions: string[]
    dossierfacile_bonus?: number
  }> {
    try {
      console.log(`🎯 Calcul score pour candidature ${application.id} - Propriétaire: ${ownerId}`)
      console.log(`📊 Données d'entrée:`, {
        income: application.income,
        has_guarantor: application.has_guarantor,
        guarantor_income: application.guarantor_income,
        contract_type: application.contract_type,
        documents_complete: application.documents_complete,
        completion_percentage: application.completion_percentage,
        property_price: property.price,
      })

      const preferences = await this.getOwnerPreferences(ownerId, useCache)

      const result = {
        totalScore: 0,
        breakdown: {},
        compatible: true,
        model_used: preferences.name || "Modèle standard",
        model_version: preferences.system_preference_id || preferences.model_type || "custom",
        calculated_at: new Date().toISOString(),
        recommendations: [],
        warnings: [],
        exclusions: [],
      }

      // 1. Ratio revenus/loyer
      const incomeRatio = this.calculateIncomeRatio(application, property, preferences)
      result.breakdown.income_ratio = incomeRatio
      result.totalScore += incomeRatio.score

      // 2. Stabilité professionnelle
      const professionalStability = this.calculateProfessionalStability(application, preferences)
      result.breakdown.professional_stability = professionalStability
      result.totalScore += professionalStability.score

      // 3. Garants
      const guarantorScore = this.calculateGuarantorScore(application, property, preferences)
      result.breakdown.guarantor = guarantorScore
      result.totalScore += guarantorScore.score

      // 4. Qualité du dossier
      const fileQuality = this.calculateFileQuality(application, preferences)
      result.breakdown.file_quality = fileQuality
      result.totalScore += fileQuality.score

      // 5. Cohérence avec le bien
      const propertyCoherence = this.calculatePropertyCoherence(application, property, preferences)
      result.breakdown.property_coherence = propertyCoherence
      result.totalScore += propertyCoherence.score

      // 6. Répartition des revenus
      const incomeDistribution = this.calculateIncomeDistribution(application, preferences)
      result.breakdown.income_distribution = incomeDistribution
      result.totalScore += incomeDistribution.score

      // 7. Bonus DossierFacile
      const dossierFacileBonus = this.calculateDossierFacileBonus(application, preferences)
      result.breakdown.dossierfacile_bonus = dossierFacileBonus
      result.totalScore += dossierFacileBonus.score
      result.dossierfacile_bonus = dossierFacileBonus.score

      // Vérifier les règles d'exclusion
      const exclusions = this.checkExclusionRules(application, property, preferences)
      result.exclusions = exclusions

      // Si le profil professionnel est exclu, score total = 0
      if (!professionalStability.compatible) {
        result.totalScore = 0
        result.compatible = false
        result.warnings.push("Profil professionnel exclu")
      } else {
        // Plafonner le score à 100 maximum
        result.totalScore = Math.min(result.totalScore, 100)
        
        // Déterminer la compatibilité
        result.compatible = exclusions.length === 0 && result.totalScore >= 60
      }

      // Générer recommandations et avertissements
      result.recommendations = this.generateRecommendations(result.breakdown, preferences)
      result.warnings = [...result.warnings, ...this.generateWarnings(result.breakdown, exclusions)]

      console.log(`✅ Score calculé: ${result.totalScore}/100 - Compatible: ${result.compatible}`)
      console.log(`📋 Modèle utilisé: ${result.model_used} (${result.model_version})`)

      return result
    } catch (error) {
      console.error("❌ Erreur calcul score:", error)
      return {
        totalScore: 50,
        breakdown: {},
        compatible: false,
        model_used: "Erreur",
        model_version: "error",
        calculated_at: new Date().toISOString(),
        recommendations: ["Erreur lors du calcul"],
        warnings: ["Impossible de calculer le score"],
        exclusions: [],
      }
    }
  },

  // Calcul personnalisé avec préférences fournies directement
  calculateCustomScore(application: any, property: any, preferences: any) {
    try {
      console.log(`🎯 Calcul score personnalisé pour candidature ${application.id}`)

      const result = {
        totalScore: 0,
        breakdown: {},
        compatible: true,
        model_used: preferences.name || "Configuration personnalisée",
        model_version: "custom",
        calculated_at: new Date().toISOString(),
        recommendations: [],
        warnings: [],
        exclusions: [],
      }

      // 1. Ratio revenus/loyer
      const incomeRatio = this.calculateIncomeRatio(application, property, preferences)
      result.breakdown.income_ratio = incomeRatio
      result.totalScore += incomeRatio.score

      // 2. Stabilité professionnelle
      const professionalStability = this.calculateProfessionalStability(application, preferences)
      result.breakdown.professional_stability = professionalStability
      result.totalScore += professionalStability.score

      // 3. Garants
      const guarantorScore = this.calculateGuarantorScore(application, property, preferences)
      result.breakdown.guarantor = guarantorScore
      result.totalScore += guarantorScore.score

      // 4. Qualité du dossier
      const fileQuality = this.calculateFileQuality(application, preferences)
      result.breakdown.file_quality = fileQuality
      result.totalScore += fileQuality.score

      // 5. Cohérence avec le bien
      const propertyCoherence = this.calculatePropertyCoherence(application, property, preferences)
      result.breakdown.property_coherence = propertyCoherence
      result.totalScore += propertyCoherence.score

      // 6. Répartition des revenus
      const incomeDistribution = this.calculateIncomeDistribution(application, preferences)
      result.breakdown.income_distribution = incomeDistribution
      result.totalScore += incomeDistribution.score

      // 7. Bonus DossierFacile
      const dossierFacileBonus = this.calculateDossierFacileBonus(application, preferences)
      result.breakdown.dossierfacile_bonus = dossierFacileBonus
      result.totalScore += dossierFacileBonus.score
      result.dossierfacile_bonus = dossierFacileBonus.score

      // Vérifier les règles d'exclusion
      const exclusions = this.checkExclusionRules(application, property, preferences)
      result.exclusions = exclusions

      // Si le profil professionnel est exclu, score total = 0
      if (!professionalStability.compatible) {
        result.totalScore = 0
        result.compatible = false
        result.warnings.push("Profil professionnel exclu")
      } else {
        // Déterminer la compatibilité
        result.compatible = exclusions.length === 0 && result.totalScore >= 60
      }

      // Générer recommandations et avertissements
      result.recommendations = this.generateRecommendations(result.breakdown, preferences)
      result.warnings = [...result.warnings, ...this.generateWarnings(result.breakdown, exclusions)]

      console.log(`✅ Score personnalisé calculé: ${result.totalScore}/100`)

      return result
    } catch (error) {
      console.error("❌ Erreur calcul score personnalisé:", error)
      return {
        totalScore: 50,
        breakdown: {},
        compatible: false,
        model_used: "Erreur",
        model_version: "error",
        calculated_at: new Date().toISOString(),
        recommendations: ["Erreur lors du calcul"],
        warnings: ["Impossible de calculer le score"],
        exclusions: [],
      }
    }
  },

  // Calcul ratio revenus/loyer
  calculateIncomeRatio(application: any, property: any, preferences: any) {
    const criteria = preferences.criteria?.income_ratio || {}
    const maxScore = criteria.weight || 18
    const applicationIncome = application.income || 0
    const rent = property.price || 0

    console.log(`💰 Calcul ratio revenus/loyer: ${applicationIncome}€ / ${rent}€`)

    if (!applicationIncome || !rent) {
      return {
        score: 0,
        max: maxScore,
        ratio: 0,
        compatible: false,
        details: "Revenus ou loyer non spécifiés",
      }
    }

    // Gestion spéciale pour les étudiants
    let effectiveIncome = applicationIncome
    const isStudent =
      application.contract_type?.toLowerCase().includes("étudiant") ||
      application.contract_type?.toLowerCase().includes("student")

    if (isStudent && criteria.use_guarantor_income_for_students && application.guarantor_income) {
      effectiveIncome = application.guarantor_income
      console.log(`🎓 Étudiant: utilisation revenus garant ${effectiveIncome}€`)
    }

    const ratio = effectiveIncome / rent
    const thresholds = criteria.thresholds || {
      excellent: 3.5,
      good: 3.0,
      acceptable: 2.5,
      minimum: 2.0,
    }

    let score = 0
    let compatible = ratio >= thresholds.minimum

    if (ratio >= thresholds.excellent) {
      score = maxScore
    } else if (ratio >= thresholds.good) {
      score = Math.round(
        ((ratio - thresholds.good) / (thresholds.excellent - thresholds.good)) * maxScore * 0.2 + maxScore * 0.8,
      )
    } else if (ratio >= thresholds.acceptable) {
      score = Math.round(
        ((ratio - thresholds.acceptable) / (thresholds.good - thresholds.acceptable)) * maxScore * 0.2 + maxScore * 0.6,
      )
    } else if (ratio >= thresholds.minimum) {
      score = Math.round(
        ((ratio - thresholds.minimum) / (thresholds.acceptable - thresholds.minimum)) * maxScore * 0.4 + maxScore * 0.2,
      )
    } else {
      score = Math.round((ratio / thresholds.minimum) * maxScore * 0.2)
      compatible = false
    }

    console.log(`💰 Ratio: ${ratio.toFixed(1)}x - Score: ${score}/${maxScore} - Compatible: ${compatible}`)

    return {
      score: Math.min(score, maxScore),
      max: maxScore,
      ratio: Math.round(ratio * 10) / 10,
      compatible,
      details: `Ratio ${ratio.toFixed(1)}x (min: ${thresholds.minimum}x, excellent: ${thresholds.excellent}x)${isStudent && criteria.use_guarantor_income_for_students ? " - Revenus garant utilisés" : ""}`,
    }
  },

  // Calcul stabilité professionnelle
  calculateProfessionalStability(application: any, preferences: any) {
    const criteria = preferences.criteria?.professional_stability || {}
    const maxScore = criteria.weight || 17
    const contractType = application.contract_type?.toLowerCase() || ""
    const contractScoring = criteria.contract_scoring || {
      cdi_confirmed: 20,
      cdi_trial: 15,
      cdd_long: 14,
      cdd_short: 10,
      freelance: 8,
      student: 6,
      unemployed: 0,
      retired: 15,
      civil_servant: 20,
    }

    console.log(`💼 Calcul stabilité professionnelle: ${contractType}`)

    let score = 0
    const compatible = true

    // Déterminer le type de contrat
    let contractKey = "unemployed"
    if (contractType.includes("cdi") && !contractType.includes("essai")) {
      contractKey = "cdi_confirmed"
    } else if (contractType.includes("cdi") && contractType.includes("essai")) {
      contractKey = "cdi_trial"
    } else if (contractType.includes("cdd")) {
      contractKey = contractType.includes("long") ? "cdd_long" : "cdd_short"
    } else if (contractType.includes("freelance") || contractType.includes("indépendant")) {
      contractKey = "freelance"
    } else if (contractType.includes("étudiant") || contractType.includes("student")) {
      contractKey = "student"
    } else if (contractType.includes("retraité") || contractType.includes("retired")) {
      contractKey = "retired"
    } else if (contractType.includes("fonctionnaire") || contractType.includes("civil")) {
      contractKey = "civil_servant"
    }

    const baseScore = contractScoring[contractKey] || 0

    console.log(`💼 Type de contrat détecté: ${contractKey} - Score de base: ${baseScore}/20`)

    // Si le score de base est 0, le profil est exclu
    if (baseScore === 0) {
      return {
        score: 0,
        max: maxScore,
        compatible: false,
        details: `${contractType.toUpperCase()} - PROFIL EXCLU`,
      }
    }

    score = Math.round((baseScore / 20) * maxScore)

    // Bonus/malus selon l'ancienneté
    const seniority = application.seniority_months || 0
    const seniorityBonus = criteria.seniority_bonus || {}

    if (seniorityBonus.enabled && seniority >= (seniorityBonus.min_months || 6)) {
      score += seniorityBonus.bonus_points || 2
      console.log(`💼 Bonus ancienneté: +${seniorityBonus.bonus_points || 2} points`)
    }

    // Pénalité période d'essai
    if (contractType.includes("essai") && criteria.trial_period_penalty) {
      score -= criteria.trial_period_penalty
      console.log(`💼 Pénalité période d'essai: -${criteria.trial_period_penalty} points`)
    }

    const finalScore = Math.max(0, Math.min(score, maxScore))
    console.log(`💼 Score final stabilité: ${finalScore}/${maxScore}`)

    return {
      score: finalScore,
      max: maxScore,
      compatible,
      details: `${contractType.toUpperCase()} (score base: ${baseScore}/20)`,
    }
  },

  // Calcul score garants
  calculateGuarantorScore(application: any, property: any, preferences: any) {
    const criteria = preferences.criteria?.guarantor || {}
    const maxScore = criteria.weight || 17
    const hasGuarantor = application.has_guarantor || false
    const guarantorIncome = application.guarantor_income || 0
    const rent = property.price || 0
    const requiredIfIncomeBelow = criteria.required_if_income_below || 3.0
    const minGuarantorRatio = criteria.minimum_income_ratio || 3.0

    console.log(`🛡️ Calcul score garants: hasGuarantor=${hasGuarantor}, guarantorIncome=${guarantorIncome}€`)

    // Vérifier si un garant est requis
    const applicationIncome = application.income || 0
    const incomeRatio = applicationIncome && rent ? applicationIncome / rent : 0
    const guarantorRequired = incomeRatio < requiredIfIncomeBelow

    console.log(`🛡️ Ratio revenus: ${incomeRatio.toFixed(1)}x - Garant requis: ${guarantorRequired}`)

    let score = 0
    const compatible = true

    if (guarantorRequired && !hasGuarantor) {
      console.log(`🛡️ Garant requis mais absent - Score: 0`)
      return {
        score: 0,
        max: maxScore,
        compatible: false,
        details: "Garant requis mais absent",
      }
    }

    if (hasGuarantor) {
      if (guarantorIncome && rent) {
        const guarantorRatio = guarantorIncome / rent
        if (guarantorRatio >= minGuarantorRatio) {
          score = maxScore
        } else {
          score = Math.round((guarantorRatio / minGuarantorRatio) * maxScore)
        }
        console.log(`🛡️ Ratio garant: ${guarantorRatio.toFixed(1)}x - Score: ${score}/${maxScore}`)
      } else {
        score = Math.round(maxScore * 0.7) // Garant présent mais revenus non vérifiés
        console.log(`🛡️ Garant présent mais revenus non vérifiés - Score: ${score}/${maxScore}`)
      }
    } else if (!guarantorRequired) {
      // Pas de garant mais pas requis non plus
      score = Math.round(maxScore * 0.8)
      console.log(`🛡️ Pas de garant mais non requis - Score: ${score}/${maxScore}`)
    }

    return {
      score: Math.min(score, maxScore),
      max: maxScore,
      compatible,
      details: hasGuarantor
        ? `Garant avec revenus ${guarantorIncome ? `de ${guarantorIncome}€` : "non spécifiés"}`
        : guarantorRequired
          ? "Garant requis"
          : "Aucun garant (non requis)",
    }
  },

  // Calcul qualité du dossier
  calculateFileQuality(application: any, preferences: any) {
    const criteria = preferences.criteria?.file_quality || {}
    const maxScore = criteria.weight || 16

    // Utiliser completion_percentage si disponible, sinon documents_complete
    const completionPercentage = application.completion_percentage || 0
    const documentsComplete = completionPercentage >= 80 || application.documents_complete || false
    const hasVerifiedDocuments = application.has_verified_documents || false

    console.log(
      `📄 Calcul qualité dossier: completion=${completionPercentage}%, complete=${documentsComplete}, verified=${hasVerifiedDocuments}`,
    )

    let score = 0
    let compatible = true

    // Score de base selon la complétude
    if (documentsComplete && hasVerifiedDocuments) {
      score = maxScore
    } else if (documentsComplete) {
      score = Math.round(maxScore * 0.8)
    } else {
      // Utiliser le pourcentage de completion pour un score plus nuancé
      if (completionPercentage > 0) {
        score = Math.round((completionPercentage / 100) * maxScore * 0.6)
      } else {
        score = Math.round(maxScore * 0.4)
      }

      if (criteria.complete_documents_required) {
        compatible = false
      }
    }

    // Vérification des documents si requis
    if (criteria.verified_documents_required && !hasVerifiedDocuments) {
      score = Math.round(score * 0.5)
      compatible = false
    }

    // Bonus présentation
    const presentationWeight = criteria.presentation_quality_weight || 6
    if (application.presentation && application.presentation.length > 50) {
      score += Math.round(presentationWeight * 0.5)
    }

    console.log(`📄 Score qualité dossier: ${score}/${maxScore} - Compatible: ${compatible}`)

    return {
      score: Math.min(score, maxScore),
      max: maxScore,
      compatible,
      details: documentsComplete
        ? hasVerifiedDocuments
          ? "Dossier complet et vérifié"
          : "Dossier complet"
        : `Dossier ${completionPercentage}% complet`,
    }
  },

  // Calcul cohérence avec le bien
  calculatePropertyCoherence(application: any, property: any, preferences: any) {
    const criteria = preferences.criteria?.property_coherence || {}
    const maxScore = criteria.weight || 16

    const score = maxScore // Score de base
    const compatible = true

    console.log(`🏠 Score cohérence propriété: ${Math.round(score * 0.8)}/${maxScore}`)

    // Pour l'instant, score de base car pas assez d'infos sur la taille du foyer, etc.
    return {
      score: Math.round(score * 0.8), // Score conservateur
      max: maxScore,
      compatible,
      details: "Cohérence évaluée sur les informations disponibles",
    }
  },

  // Calcul répartition des revenus
  calculateIncomeDistribution(application: any, preferences: any) {
    const criteria = preferences.criteria?.income_distribution || {}
    const maxScore = criteria.weight || 16

    // Pour l'instant, score de base car pas d'info sur la colocation
    const score = Math.round(maxScore * 0.8)
    const compatible = true

    console.log(`👥 Score répartition revenus: ${score}/${maxScore}`)

    return {
      score,
      max: maxScore,
      compatible,
      details: "Répartition évaluée sur les informations disponibles",
    }
  },

  // Vérifier les règles d'exclusion
  checkExclusionRules(application: any, property: any, preferences: any): string[] {
    const exclusions = []
    const rules = preferences.exclusion_rules || {}

    console.log(`🚫 Vérification règles d'exclusion:`, rules)

    // Ratio minimum absolu
    if (rules.income_ratio_below_2) {
      const applicationIncome = application.income || 0
      const rent = property.price || 0
      if (applicationIncome && rent) {
        const ratio = applicationIncome / rent
        if (ratio < 2.0) {
          exclusions.push(`Ratio revenus/loyer insuffisant: ${ratio.toFixed(1)}x < 2.0x`)
        }
      }
    }

    // Garant requis si ratio faible
    if (rules.no_guarantor_when_required) {
      const applicationIncome = application.income || 0
      const rent = property.price || 0
      const requiredThreshold = preferences.criteria?.guarantor?.required_if_income_below || 3.0

      if (applicationIncome && rent) {
        const ratio = applicationIncome / rent
        if (ratio < requiredThreshold && !application.has_guarantor) {
          exclusions.push(`Garant requis pour un ratio de ${ratio.toFixed(1)}x`)
        }
      }
    }

    // Dossier incomplet
    if (rules.incomplete_file) {
      const completionPercentage = application.completion_percentage || 0
      const documentsComplete = completionPercentage >= 80 || application.documents_complete || false
      if (!documentsComplete) {
        exclusions.push("Dossier incomplet")
      }
    }

    // Documents non vérifiés
    if (rules.unverified_documents && !application.has_verified_documents) {
      exclusions.push("Documents non vérifiés")
    }

    console.log(`🚫 Exclusions trouvées:`, exclusions)

    return exclusions
  },

  // Générer des recommandations
  generateRecommendations(breakdown: any, preferences: any): string[] {
    const recommendations = []

    if (breakdown.income_ratio?.score < breakdown.income_ratio?.max * 0.8) {
      recommendations.push("Vérifier les revenus complémentaires du candidat")
    }

    if (breakdown.guarantor?.score < breakdown.guarantor?.max * 0.8) {
      recommendations.push("Demander des informations sur le garant")
    }

    if (breakdown.file_quality?.score < breakdown.file_quality?.max * 0.8) {
      recommendations.push("Demander les documents manquants")
    }

    if (breakdown.professional_stability?.score < breakdown.professional_stability?.max * 0.6) {
      recommendations.push("Évaluer la stabilité de l'emploi")
    }

    return recommendations
  },

  // Générer des avertissements
  generateWarnings(breakdown: any, exclusions: string[]): string[] {
    const warnings = []

    if (exclusions.length > 0) {
      warnings.push("Ce dossier ne respecte pas les critères d'exclusion")
    }

    if (breakdown.professional_stability?.compatible === false) {
      warnings.push("Situation professionnelle instable")
    }

    if (breakdown.income_ratio?.compatible === false) {
      warnings.push("Ratio revenus/loyer insuffisant")
    }

    return warnings
  },

  // Calculer le bonus DossierFacile
  calculateDossierFacileBonus(application: any, preferences: any): { score: number; details: any } {
    const dossierFacileWeight = preferences.criteria?.dossierfacile_bonus?.weight || 10
    let score = 0
    const details: any = {}

    // Vérifier si le dossier est certifié DossierFacile
    if (application.is_dossierfacile_certified || application.creation_method === "dossierfacile") {
      score = dossierFacileWeight
      details.has_dossierfacile = true
      details.bonus_reason = "Dossier certifié DossierFacile"
      
      // Bonus supplémentaire si le dossier est vérifié
      if (application.dossierfacile_status === "verified") {
        score += 5
        details.verified = true
        details.bonus_reason += " (vérifié)"
      }
      
      // Bonus pour la qualité des données extraites
      if (application.dossierfacile_data?.professional_info?.monthly_income) {
        score += 2
        details.has_income_data = true
      }
      
      if (application.dossierfacile_data?.professional_info?.profession) {
        score += 2
        details.has_profession_data = true
      }
      
      if (application.dossierfacile_data?.documents?.identity_documents?.length > 0) {
        score += 1
        details.has_identity_documents = true
      }
    } else {
      details.has_dossierfacile = false
      details.bonus_reason = "Dossier manuel"
    }

    return {
      score: Math.min(score, dossierFacileWeight + 10), // Plafonner le bonus
      details,
    }
  },

  // Mapper les données enrichies du RentalFile vers le format de scoring
  mapRentalFileToScoringData(rentalFile: any): any {
    console.log("🔄 Mapping RentalFile vers données de scoring", rentalFile)

    // Calculer le revenu total du locataire principal
    const mainTenantIncome = this.calculateTotalIncome(rentalFile.main_tenant?.income_sources || {})
    
    // Calculer le revenu total des colocataires
    let cotenantIncome = 0
    if (rentalFile.cotenants) {
      rentalFile.cotenants.forEach((cotenant: any) => {
        cotenantIncome += this.calculateTotalIncome(cotenant.income_sources || {})
      })
    }

    // Calculer le revenu total des garants
    let guarantorIncome = 0
    let hasGuarantor = false
    if (rentalFile.guarantors && rentalFile.guarantors.length > 0) {
      hasGuarantor = true
      rentalFile.guarantors.forEach((guarantor: any) => {
        if (guarantor.type === "physical" && guarantor.personal_info) {
          guarantorIncome += this.calculateTotalIncome(guarantor.personal_info.income_sources || {})
        } else if (guarantor.monthly_income) {
          guarantorIncome += guarantor.monthly_income
        }
      })
    }

    // Calculer le revenu total du foyer
    const totalHouseholdIncome = mainTenantIncome + cotenantIncome

    const scoringData = {
      // Revenus
      income: totalHouseholdIncome,
      main_tenant_income: mainTenantIncome,
      cotenant_income: cotenantIncome,
      guarantor_income: guarantorIncome,
      has_guarantor: hasGuarantor,

      // Informations professionnelles
      contract_type: rentalFile.main_tenant?.contract_type || rentalFile.main_tenant?.main_activity,
      seniority_months: rentalFile.main_tenant?.seniority_months || 0,
      profession: rentalFile.main_tenant?.profession,
      company: rentalFile.main_tenant?.company_name || rentalFile.main_tenant?.company,
      job_title: rentalFile.main_tenant?.job_title,

      // Informations du foyer
      household_size: 1 + (rentalFile.cotenants?.length || 0),
      rental_situation: rentalFile.rental_situation,

      // Qualité du dossier
      completion_percentage: rentalFile.completion_percentage || 0,
      documents_complete: (rentalFile.completion_percentage || 0) >= 80,
      has_verified_documents: rentalFile.is_dossierfacile_certified || false,
      presentation: rentalFile.presentation_message,

      // DossierFacile
      is_dossierfacile_certified: rentalFile.is_dossierfacile_certified || false,
      creation_method: rentalFile.creation_method,
      dossierfacile_status: rentalFile.dossierfacile_status,
      dossierfacile_data: rentalFile.dossierfacile_data,

      // Métadonnées
      id: rentalFile.id,
      tenant_id: rentalFile.tenant_id,
    }

    console.log("✅ Données de scoring mappées:", scoringData)
    return scoringData
  },

  // Calculer le revenu total à partir des sources de revenus
  calculateTotalIncome(incomeSources: any): number {
    if (!incomeSources) return 0
    
    let total = 0
    
    // Revenus du travail
    if (incomeSources.work_income?.amount) {
      total += incomeSources.work_income.amount
    }
    
    // Bourse
    if (incomeSources.scholarship?.amount) {
      total += incomeSources.scholarship.amount
    }
    
    // Aides sociales
    if (incomeSources.social_aid) {
      incomeSources.social_aid.forEach((aid: any) => {
        if (aid.amount) total += aid.amount
      })
    }
    
    // Retraites/pensions
    if (incomeSources.retirement_pension) {
      incomeSources.retirement_pension.forEach((pension: any) => {
        if (pension.amount) total += pension.amount
      })
    }
    
    // Rentes
    if (incomeSources.rent_income) {
      incomeSources.rent_income.forEach((rent: any) => {
        if (rent.amount) total += rent.amount
      })
    }
    
    return total
  },

  // Invalider le cache
  invalidateCache(ownerId?: string) {
    if (ownerId) {
      preferencesCache.delete(`prefs_${ownerId}`)
      console.log(`🗑️ Cache invalidé pour ${ownerId}`)
    } else {
      preferencesCache.clear()
      console.log(`🗑️ Cache complet invalidé`)
    }
  },
}

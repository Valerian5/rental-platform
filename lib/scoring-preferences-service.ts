import { supabase } from "./supabase"

// Type de base pour les critères de scoring
export interface ScoringPreference {
  // Identifiants
  id?: string
  owner_id: string
  name: string
  is_default: boolean
  is_system?: boolean // Si c'est un modèle système

  // Critères financiers
  min_income_ratio: number // Ratio minimal revenus/loyer (ex: 2.5 = 2.5x le loyer)
  good_income_ratio: number // Ratio considéré comme bon (ex: 3)
  excellent_income_ratio: number // Ratio excellent (ex: 3.5)

  // Stabilité professionnelle
  accepted_contracts: string[] // Types de contrats acceptés: "cdi", "cdd", "independant", etc.
  preferred_contracts: string[] // Types de contrats préférés: généralement "cdi"
  min_professional_experience: number // En mois, 0 si non applicable

  // Garants
  guarantor_required: boolean // Si un garant est requis
  min_guarantor_income_ratio: number // Ratio revenus du garant / loyer
  accepted_guarantor_types: string[] // "individual", "visale", "other_organism", "company"

  // Critères de dossier
  min_file_completion: number // Pourcentage minimum de complétion du dossier (0-100)
  verified_documents_required: boolean // Si les documents vérifiés (DossierFacile) sont requis

  // Critères supplémentaires
  max_occupants_ratio: number // Nombre max d'occupants par pièce (ex: 2)
  pet_policy: "forbidden" | "case_by_case" | "allowed" // Politique animaux

  // Pondération des critères (total = 100)
  weights: {
    income: number // Poids des revenus (ex: 40)
    stability: number // Poids de la stabilité professionnelle (ex: 25)
    guarantor: number // Poids des garants (ex: 20)
    file_quality: number // Poids de la qualité du dossier (ex: 15)
  }

  created_at?: string
  updated_at?: string
}

// Interface pour le résultat du calcul de score
export interface ScoringResult {
  totalScore: number // Score global sur 100
  compatible: boolean // Si le candidat est compatible selon les critères

  breakdown: {
    income: {
      score: number // Score pour ce critère
      details: string // Détails explicatifs
      max: number // Score maximum possible pour ce critère
      compatible: boolean // Si ce critère spécifique est compatible
    }
    stability: {
      score: number
      details: string
      max: number
      compatible: boolean
    }
    guarantor: {
      score: number
      details: string
      max: number
      compatible: boolean
    }
    file_quality: {
      score: number
      details: string
      max: number
      compatible: boolean
    }
  }

  recommendations: string[] // Recommandations pour améliorer le score
  warnings: string[] // Avertissements sur des points critiques
}

// Type de profil pour le mode simple
export interface RenterProfile {
  name: string // ex: "Excellent", "Bon", "Acceptable", "Inacceptable"
  income_ratio: number // Ratio revenus/loyer
  contract_types: string[] // Types de contrats acceptés
  guarantor: {
    required: boolean
    income_ratio?: number // Ratio revenus garant/loyer si applicable
  }
  file_completion: number // % minimum de complétion du dossier
  verified_documents: boolean // Si les documents vérifiés sont requis
  description: string // Description du profil (pour l'affichage)
}

export const scoringPreferencesService = {
  // Récupérer les préférences par défaut d'un propriétaire
  async getOwnerDefaultPreference(ownerId: string): Promise<ScoringPreference | null> {
    try {
      // Vérifier d'abord les préférences personnalisées du propriétaire
      const { data: customData, error: customError } = await supabase
        .from("scoring_preferences")
        .select("*")
        .eq("owner_id", ownerId)
        .eq("is_default", true)
        .single()

      if (customData) {
        return customData as ScoringPreference
      }

      // Si pas de préférence personnalisée, récupérer le modèle système par défaut
      const { data: systemData, error: systemError } = await supabase
        .from("scoring_preferences")
        .select("*")
        .eq("is_system", true)
        .eq("is_default", true)
        .single()

      if (systemError) {
        console.error("Erreur récupération préférences système:", systemError)
        return this.getDefaultSystemPreference()
      }

      return systemData as ScoringPreference
    } catch (error) {
      console.error("Erreur récupération préférences:", error)
      // En cas d'erreur, retourner les préférences par défaut codées en dur
      return this.getDefaultSystemPreference()
    }
  },

  // Récupérer toutes les préférences d'un propriétaire
  async getOwnerPreferences(ownerId: string): Promise<ScoringPreference[]> {
    try {
      const { data, error } = await supabase
        .from("scoring_preferences")
        .select("*")
        .eq("owner_id", ownerId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data as ScoringPreference[]) || []
    } catch (error) {
      console.error("Erreur récupération préférences:", error)
      return []
    }
  },

  // Récupérer les préférences système (modèles standards)
  async getSystemPreferences(): Promise<ScoringPreference[]> {
    try {
      const { data, error } = await supabase
        .from("scoring_preferences")
        .select("*")
        .eq("is_system", true)
        .order("is_default", { ascending: false })

      if (error) throw error
      return (data as ScoringPreference[]) || []
    } catch (error) {
      console.error("Erreur récupération préférences système:", error)
      return [this.getDefaultSystemPreference()]
    }
  },

  // Sauvegarder une préférence
  async savePreference(
    preference: Omit<ScoringPreference, "id" | "created_at" | "updated_at">,
  ): Promise<ScoringPreference> {
    try {
      // Si c'est la préférence par défaut, désactiver les autres
      if (preference.is_default) {
        await supabase.from("scoring_preferences").update({ is_default: false }).eq("owner_id", preference.owner_id)
      }

      const { data, error } = await supabase
        .from("scoring_preferences")
        .insert({
          ...preference,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data as ScoringPreference
    } catch (error) {
      console.error("Erreur sauvegarde préférence:", error)
      throw error
    }
  },

  // Mettre à jour une préférence
  async updatePreference(id: string, updates: Partial<ScoringPreference>): Promise<ScoringPreference> {
    try {
      // Si on définit comme défaut, désactiver les autres
      if (updates.is_default) {
        const { data: current } = await supabase.from("scoring_preferences").select("owner_id").eq("id", id).single()

        if (current) {
          await supabase.from("scoring_preferences").update({ is_default: false }).eq("owner_id", current.owner_id)
        }
      }

      const { data, error } = await supabase
        .from("scoring_preferences")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data as ScoringPreference
    } catch (error) {
      console.error("Erreur mise à jour préférence:", error)
      throw error
    }
  },

  // Supprimer une préférence
  async deletePreference(id: string): Promise<void> {
    try {
      // Vérifier si c'est une préférence système
      const { data: check } = await supabase.from("scoring_preferences").select("is_system").eq("id", id).single()

      // Ne pas permettre la suppression des préférences système
      if (check && check.is_system) {
        throw new Error("Impossible de supprimer une préférence système")
      }

      const { error } = await supabase.from("scoring_preferences").delete().eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("Erreur suppression préférence:", error)
      throw error
    }
  },

  // Calculer le score d'un candidat selon une préférence donnée
  calculateScore(application: any, property: any, preference: ScoringPreference): ScoringResult {
    // Initialisation du résultat
    const result: ScoringResult = {
      totalScore: 0,
      compatible: false,
      breakdown: {
        income: { score: 0, max: preference.weights.income, details: "", compatible: false },
        stability: { score: 0, max: preference.weights.stability, details: "", compatible: false },
        guarantor: { score: 0, max: preference.weights.guarantor, details: "", compatible: false },
        file_quality: { score: 0, max: preference.weights.file_quality, details: "", compatible: false },
      },
      recommendations: [],
      warnings: [],
    }

    // 1. Évaluation des revenus
    const income = application.income || 0
    const rent = property.price || 0

    if (income > 0 && rent > 0) {
      const ratio = income / rent

      // Calcul du score selon le ratio
      if (ratio >= preference.excellent_income_ratio) {
        result.breakdown.income.score = preference.weights.income
        result.breakdown.income.details = `Excellent ratio revenus/loyer (${ratio.toFixed(1)}x)`
        result.breakdown.income.compatible = true
      } else if (ratio >= preference.good_income_ratio) {
        result.breakdown.income.score = Math.round(preference.weights.income * 0.8)
        result.breakdown.income.details = `Bon ratio revenus/loyer (${ratio.toFixed(1)}x)`
        result.breakdown.income.compatible = true
      } else if (ratio >= preference.min_income_ratio) {
        result.breakdown.income.score = Math.round(preference.weights.income * 0.6)
        result.breakdown.income.details = `Ratio revenus/loyer acceptable (${ratio.toFixed(1)}x)`
        result.breakdown.income.compatible = true
      } else {
        result.breakdown.income.score = Math.round(preference.weights.income * 0.3)
        result.breakdown.income.details = `Ratio revenus/loyer insuffisant (${ratio.toFixed(1)}x < ${preference.min_income_ratio}x)`
        result.breakdown.income.compatible = false
        result.warnings.push(
          `Revenus insuffisants : ${ratio.toFixed(1)}x le loyer (minimum requis : ${preference.min_income_ratio}x)`,
        )
      }
    } else {
      result.breakdown.income.score = 0
      result.breakdown.income.details = "Revenus ou loyer non spécifiés"
      result.breakdown.income.compatible = false
      result.warnings.push("Revenus non spécifiés")
    }

    // 2. Évaluation de la stabilité professionnelle
    const contract = application.contract_type?.toLowerCase() || ""

    // Vérifier si le contrat est dans les contrats acceptés
    if (preference.accepted_contracts.includes(contract)) {
      result.breakdown.stability.compatible = true

      // Contrat préféré
      if (preference.preferred_contracts.includes(contract)) {
        result.breakdown.stability.score = preference.weights.stability
        result.breakdown.stability.details = `Type de contrat préféré (${contract.toUpperCase()})`
      } else {
        result.breakdown.stability.score = Math.round(preference.weights.stability * 0.7)
        result.breakdown.stability.details = `Type de contrat accepté (${contract.toUpperCase()})`
      }

      // Bonus pour l'expérience professionnelle
      if (
        application.professional_experience_months &&
        application.professional_experience_months >= preference.min_professional_experience
      ) {
        const experienceBonus = Math.min(10, Math.round(preference.weights.stability * 0.1))
        result.breakdown.stability.score = Math.min(
          preference.weights.stability,
          result.breakdown.stability.score + experienceBonus,
        )
        result.breakdown.stability.details += ` avec expérience suffisante (${application.professional_experience_months} mois)`
      }
    } else {
      result.breakdown.stability.score = Math.round(preference.weights.stability * 0.3)
      result.breakdown.stability.details = `Type de contrat non accepté (${contract || "non spécifié"})`
      result.breakdown.stability.compatible = false
      result.warnings.push(`Type de contrat (${contract || "non spécifié"}) non inclus dans les critères acceptés`)
    }

    // 3. Évaluation des garants
    if (preference.guarantor_required) {
      if (application.has_guarantor) {
        const guarantorType = application.guarantor_type || "individual"
        const guarantorIncome = application.guarantor_income || 0

        // Vérifier si le type de garant est accepté
        if (preference.accepted_guarantor_types.includes(guarantorType)) {
          result.breakdown.guarantor.compatible = true

          // Vérifier les revenus du garant si c'est un individu
          if (guarantorType === "individual" && guarantorIncome > 0 && rent > 0) {
            const guarantorRatio = guarantorIncome / rent

            if (guarantorRatio >= preference.min_guarantor_income_ratio) {
              result.breakdown.guarantor.score = preference.weights.guarantor
              result.breakdown.guarantor.details = `Garant avec revenus suffisants (${guarantorRatio.toFixed(1)}x le loyer)`
            } else {
              result.breakdown.guarantor.score = Math.round(preference.weights.guarantor * 0.6)
              result.breakdown.guarantor.details = `Garant avec revenus insuffisants (${guarantorRatio.toFixed(1)}x < ${preference.min_guarantor_income_ratio}x le loyer)`
              result.recommendations.push(
                `Améliorer les revenus du garant (${guarantorRatio.toFixed(1)}x le loyer, minimum recommandé: ${preference.min_guarantor_income_ratio}x)`,
              )
            }
          } else if (guarantorType === "visale") {
            // VISALE est toujours considéré comme un excellent garant
            result.breakdown.guarantor.score = preference.weights.guarantor
            result.breakdown.guarantor.details = "Garantie VISALE (excellente garantie)"
          } else {
            // Autres types de garants acceptés mais sans détails de revenus
            result.breakdown.guarantor.score = Math.round(preference.weights.guarantor * 0.8)
            result.breakdown.guarantor.details = `Garant de type ${guarantorType} accepté`
          }
        } else {
          result.breakdown.guarantor.score = Math.round(preference.weights.guarantor * 0.4)
          result.breakdown.guarantor.details = `Type de garant (${guarantorType}) non préféré`
          result.breakdown.guarantor.compatible = false
          result.recommendations.push(`Le type de garant (${guarantorType}) n'est pas dans les types préférés`)
        }
      } else {
        result.breakdown.guarantor.score = 0
        result.breakdown.guarantor.details = "Garant requis mais absent"
        result.breakdown.guarantor.compatible = false
        result.warnings.push("Garant requis selon les critères mais non fourni")
      }
    } else {
      // Si le garant n'est pas requis
      if (application.has_guarantor) {
        // Bonus pour avoir un garant même si pas requis
        result.breakdown.guarantor.score = preference.weights.guarantor
        result.breakdown.guarantor.details = "Garant fourni (non requis mais valorisé)"
        result.breakdown.guarantor.compatible = true
      } else {
        result.breakdown.guarantor.score = Math.round(preference.weights.guarantor * 0.7)
        result.breakdown.guarantor.details = "Pas de garant (non requis)"
        result.breakdown.guarantor.compatible = true
      }
    }

    // 4. Évaluation de la qualité du dossier
    const fileCompletion = application.file_completion || 0
    const hasVerifiedDocs = application.has_verified_documents || false

    if (fileCompletion >= preference.min_file_completion) {
      result.breakdown.file_quality.compatible = true

      if (preference.verified_documents_required) {
        if (hasVerifiedDocs) {
          result.breakdown.file_quality.score = preference.weights.file_quality
          result.breakdown.file_quality.details = `Dossier complet (${fileCompletion}%) avec documents vérifiés`
        } else {
          result.breakdown.file_quality.score = Math.round(preference.weights.file_quality * 0.6)
          result.breakdown.file_quality.details = `Dossier complet (${fileCompletion}%) mais sans vérification des documents`
          result.recommendations.push("Faire vérifier vos documents via DossierFacile améliorerait votre score")
        }
      } else {
        // Bonus si documents vérifiés mais pas requis
        if (hasVerifiedDocs) {
          result.breakdown.file_quality.score = preference.weights.file_quality
          result.breakdown.file_quality.details = `Dossier complet (${fileCompletion}%) avec documents vérifiés (bonus)`
        } else {
          result.breakdown.file_quality.score = Math.round(preference.weights.file_quality * 0.8)
          result.breakdown.file_quality.details = `Dossier complet (${fileCompletion}%)`
        }
      }
    } else {
      result.breakdown.file_quality.score = Math.round(
        (fileCompletion / preference.min_file_completion) * preference.weights.file_quality,
      )
      result.breakdown.file_quality.details = `Dossier incomplet (${fileCompletion}% < ${preference.min_file_completion}% requis)`
      result.breakdown.file_quality.compatible = false
      result.warnings.push(`Dossier incomplet: ${fileCompletion}% (minimum requis: ${preference.min_file_completion}%)`)
    }

    // Calcul du score total
    result.totalScore = Math.min(
      100,
      Math.round(
        result.breakdown.income.score +
          result.breakdown.stability.score +
          result.breakdown.guarantor.score +
          result.breakdown.file_quality.score,
      ),
    )

    // Déterminer la compatibilité globale
    // Un candidat est compatible si:
    // 1. Score total >= 60/100 ET
    // 2. Tous les critères critiques sont compatibles OU leur score est au minimum à 50% du max
    result.compatible =
      result.totalScore >= 60 &&
      (result.breakdown.income.compatible || result.breakdown.income.score >= result.breakdown.income.max * 0.5) &&
      (result.breakdown.stability.compatible ||
        result.breakdown.stability.score >= result.breakdown.stability.max * 0.5) &&
      (result.breakdown.guarantor.compatible ||
        result.breakdown.guarantor.score >= result.breakdown.guarantor.max * 0.5) &&
      (result.breakdown.file_quality.compatible ||
        result.breakdown.file_quality.score >= result.breakdown.file_quality.max * 0.5)

    // Ajouter des recommandations générales
    if (result.totalScore < 60) {
      if (result.breakdown.income.score < result.breakdown.income.max * 0.6) {
        result.recommendations.push("Améliorer le ratio revenus/loyer (revenus plus élevés ou garant)")
      }
      if (result.breakdown.file_quality.score < result.breakdown.file_quality.max * 0.6) {
        result.recommendations.push("Compléter votre dossier de location avec tous les documents requis")
      }
    }

    return result
  },

  // Créer une préférence à partir des profils en mode simple
  createPreferenceFromProfiles(
    ownerId: string,
    propertyRent: number,
    profiles: {
      excellent: RenterProfile
      good: RenterProfile
      acceptable: RenterProfile
      unacceptable: RenterProfile
    },
  ): ScoringPreference {
    // Déterminer les ratios de revenus
    const min_income_ratio = profiles.acceptable.income_ratio
    const good_income_ratio = profiles.good.income_ratio
    const excellent_income_ratio = profiles.excellent.income_ratio

    // Fusionner les types de contrats acceptés
    const accepted_contracts = [
      ...new Set([
        ...profiles.acceptable.contract_types,
        ...profiles.good.contract_types,
        ...profiles.excellent.contract_types,
      ]),
    ]

    // Les contrats préférés sont ceux du profil excellent
    const preferred_contracts = [...profiles.excellent.contract_types]

    // Déterminer les exigences de garant
    const guarantor_required = profiles.acceptable.guarantor.required

    // Min ratio revenu garant = plus haut ratio parmi les profils qui exigent un garant
    let min_guarantor_income_ratio = 0
    for (const profile of [profiles.acceptable, profiles.good, profiles.excellent]) {
      if (profile.guarantor.required && profile.guarantor.income_ratio) {
        min_guarantor_income_ratio = Math.max(min_guarantor_income_ratio, profile.guarantor.income_ratio)
      }
    }

    // Complétion minimale du dossier = la plus basse des profils acceptés
    const min_file_completion = profiles.acceptable.file_completion

    // Documents vérifiés requis si l'un des profils l'exige
    const verified_documents_required =
      profiles.acceptable.verified_documents ||
      profiles.good.verified_documents ||
      profiles.excellent.verified_documents

    return {
      owner_id: ownerId,
      name: "Préférence basée sur profils",
      is_default: true,

      min_income_ratio,
      good_income_ratio,
      excellent_income_ratio,

      accepted_contracts,
      preferred_contracts,
      min_professional_experience: 0, // Valeur par défaut, à personnaliser si besoin

      guarantor_required,
      min_guarantor_income_ratio: min_guarantor_income_ratio || 3, // Valeur par défaut si non spécifié
      accepted_guarantor_types: ["individual", "visale", "other_organism", "company"], // Tous les types par défaut

      min_file_completion,
      verified_documents_required,

      max_occupants_ratio: 2, // Valeur par défaut
      pet_policy: "case_by_case", // Valeur par défaut

      weights: {
        income: 40,
        stability: 25,
        guarantor: 20,
        file_quality: 15,
      },
    }
  },

  // Modèles de profils prédéfinis pour le mode simple
  getDefaultProfiles(propertyRent: number): {
    excellent: RenterProfile
    good: RenterProfile
    acceptable: RenterProfile
    unacceptable: RenterProfile
  } {
    return {
      excellent: {
        name: "Excellent",
        income_ratio: 3.5,
        contract_types: ["cdi", "fonctionnaire"],
        guarantor: {
          required: false,
        },
        file_completion: 90,
        verified_documents: true,
        description: "Candidat idéal avec stabilité professionnelle optimale et excellents revenus",
      },
      good: {
        name: "Bon",
        income_ratio: 3,
        contract_types: ["cdi", "cdd", "fonctionnaire", "retraite"],
        guarantor: {
          required: false,
        },
        file_completion: 80,
        verified_documents: false,
        description: "Candidat solide avec bonne stabilité professionnelle et revenus confortables",
      },
      acceptable: {
        name: "Acceptable",
        income_ratio: 2.5,
        contract_types: ["cdi", "cdd", "fonctionnaire", "retraite", "independant", "intermittent"],
        guarantor: {
          required: true,
          income_ratio: 3,
        },
        file_completion: 70,
        verified_documents: false,
        description: "Candidat acceptable nécessitant un garant pour sécuriser le dossier",
      },
      unacceptable: {
        name: "Insuffisant",
        income_ratio: 2,
        contract_types: [],
        guarantor: {
          required: true,
          income_ratio: 4,
        },
        file_completion: 60,
        verified_documents: false,
        description: "Candidat présentant des risques importants, dossier à renforcer significativement",
      },
    }
  },

  // Préférence système par défaut (utilisé si pas de préférence en base)
  getDefaultSystemPreference(): ScoringPreference {
    return {
      owner_id: "system",
      name: "Modèle standard",
      is_default: true,
      is_system: true,

      min_income_ratio: 2.5,
      good_income_ratio: 3,
      excellent_income_ratio: 3.5,

      accepted_contracts: ["cdi", "cdd", "fonctionnaire", "retraite", "independant", "intermittent"],
      preferred_contracts: ["cdi", "fonctionnaire"],
      min_professional_experience: 0,

      guarantor_required: false,
      min_guarantor_income_ratio: 3,
      accepted_guarantor_types: ["individual", "visale", "other_organism", "company"],

      min_file_completion: 70,
      verified_documents_required: false,

      max_occupants_ratio: 2,
      pet_policy: "case_by_case",

      weights: {
        income: 40,
        stability: 25,
        guarantor: 20,
        file_quality: 15,
      },
    }
  },
}

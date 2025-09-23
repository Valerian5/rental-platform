/**
 * Module de calcul fiscal pour la gestion locative
 * Calcule les revenus imposables selon les régimes Micro et Réel
 */

export interface LeaseData {
  id: string
  type: "unfurnished" | "furnished"
  monthly_rent: number
  charges: number
  property_title: string
  property_address: string
}

export interface RentReceipt {
  id: string
  lease_id: string
  year: number
  month: number
  rent_amount: number
  charges_amount: number
  total_amount: number
  status: "paid" | "pending" | "overdue"
}

export interface Expense {
  id: string
  lease_id: string
  property_id: string
  type: "incident" | "maintenance" | "annual_charge"
  category: "repair" | "maintenance" | "improvement" | "tax" | "insurance" | "interest" | "management"
  amount: number
  date: string
  description: string
  deductible: boolean
}

export interface FiscalData {
  leases: LeaseData[]
  rentReceipts: RentReceipt[]
  expenses: Expense[]
  year: number
}

export interface FiscalCalculation {
  // Données de base
  totalRentCollected: number
  totalRecoverableCharges: number
  totalDeductibleExpenses: number
  
  // Simulation Micro
  microFoncier: {
    applicable: boolean
    grossIncome: number
    deduction: number
    taxableIncome: number
    deductionRate: number
  }
  
  // Simulation Micro-BIC (meublé)
  microBIC: {
    applicable: boolean
    grossIncome: number
    deduction: number
    taxableIncome: number
    deductionRate: number
  }
  
  // Simulation Réel
  realRegime: {
    grossIncome: number
    deductibleExpenses: number
    taxableIncome: number
    depreciation?: number // Pour les meublés
  }
  
  // Recommandation
  recommendation: {
    regime: "micro-foncier" | "micro-bic" | "real"
    reason: string
    savings: number
  }
}

export class FiscalCalculator {
  private static readonly MICRO_FONCIER_LIMIT = 15000
  private static readonly MICRO_BIC_LIMIT = 77700
  private static readonly MICRO_FONCIER_DEDUCTION_RATE = 0.30
  private static readonly MICRO_BIC_DEDUCTION_RATE = 0.50

  /**
   * Calcule les données fiscales pour une année donnée
   */
  static calculateFiscalData(data: FiscalData): FiscalCalculation {
    const { leases, rentReceipts, expenses, year } = data

    // 1. Calculer les revenus bruts (loyers encaissés)
    const totalRentCollected = this.calculateTotalRentCollected(rentReceipts, year)
    
    // 2. Calculer les charges récupérables (non imposables)
    const totalRecoverableCharges = this.calculateRecoverableCharges(rentReceipts, year)
    
    // 3. Calculer les dépenses déductibles
    const totalDeductibleExpenses = this.calculateDeductibleExpenses(expenses, year)
    
    // 4. Déterminer le type de location (meublé ou non meublé)
    const hasFurnishedLease = leases.some(lease => lease.type === "furnished")
    
    // 5. Calculer les simulations
    const microFoncier = this.calculateMicroFoncier(totalRentCollected)
    const microBIC = this.calculateMicroBIC(totalRentCollected)
    const realRegime = this.calculateRealRegime(totalRentCollected, totalDeductibleExpenses, hasFurnishedLease)
    
    // 6. Recommander le régime optimal
    const recommendation = this.recommendRegime(microFoncier, microBIC, realRegime, hasFurnishedLease)

    return {
      totalRentCollected,
      totalRecoverableCharges,
      totalDeductibleExpenses,
      microFoncier,
      microBIC,
      realRegime,
      recommendation
    }
  }

  /**
   * Calcule le total des loyers encaissés pour une année
   */
  private static calculateTotalRentCollected(rentReceipts: RentReceipt[], year: number): number {
    console.log(`FiscalCalculator: Calcul revenus bruts pour ${rentReceipts.length} quittances en ${year}`)
    const filteredReceipts = rentReceipts.filter(receipt => {
      const matchesYear = receipt.year === year
      const matchesStatus = receipt.status === "paid"
      console.log(`FiscalCalculator: Quittance ${receipt.id} - année: ${receipt.year}, statut: ${receipt.status}, montant: ${receipt.rent_amount}`)
      return matchesYear && matchesStatus
    })
    console.log(`FiscalCalculator: ${filteredReceipts.length} quittances filtrées`)
    return filteredReceipts.reduce((sum, receipt) => sum + receipt.rent_amount, 0)
  }

  /**
   * Calcule le total des charges récupérables (non imposables)
   */
  private static calculateRecoverableCharges(rentReceipts: RentReceipt[], year: number): number {
    console.log(`FiscalCalculator: Calcul charges récupérables pour ${rentReceipts.length} quittances en ${year}`)
    const filteredReceipts = rentReceipts.filter(receipt => {
      const matchesYear = receipt.year === year
      const matchesStatus = receipt.status === "paid"
      return matchesYear && matchesStatus
    })
    console.log(`FiscalCalculator: ${filteredReceipts.length} quittances pour charges récupérables`)
    return filteredReceipts.reduce((sum, receipt) => sum + receipt.charges_amount, 0)
  }

  /**
   * Calcule le total des dépenses déductibles
   */
  private static calculateDeductibleExpenses(expenses: Expense[], year: number): number {
    const yearExpenses = expenses.filter(expense => {
      const expenseYear = new Date(expense.date).getFullYear()
      return expenseYear === year && expense.deductible
    })

    return yearExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  /**
   * Calcule la simulation Micro-foncier
   */
  private static calculateMicroFoncier(grossIncome: number) {
    const applicable = grossIncome <= this.MICRO_FONCIER_LIMIT
    const deduction = applicable ? grossIncome * this.MICRO_FONCIER_DEDUCTION_RATE : 0
    const taxableIncome = grossIncome - deduction

    return {
      applicable,
      grossIncome,
      deduction,
      taxableIncome,
      deductionRate: this.MICRO_FONCIER_DEDUCTION_RATE
    }
  }

  /**
   * Calcule la simulation Micro-BIC (pour location meublée)
   */
  private static calculateMicroBIC(grossIncome: number) {
    const applicable = grossIncome <= this.MICRO_BIC_LIMIT
    const deduction = applicable ? grossIncome * this.MICRO_BIC_DEDUCTION_RATE : 0
    const taxableIncome = grossIncome - deduction

    return {
      applicable,
      grossIncome,
      deduction,
      taxableIncome,
      deductionRate: this.MICRO_BIC_DEDUCTION_RATE
    }
  }

  /**
   * Calcule la simulation régime réel
   */
  private static calculateRealRegime(grossIncome: number, deductibleExpenses: number, hasFurnishedLease: boolean) {
    // Pour les meublés, on pourrait ajouter l'amortissement du mobilier
    // Pour l'instant, on ignore cette complexité
    const depreciation = hasFurnishedLease ? 0 : 0 // TODO: Implémenter l'amortissement
    const totalDeductions = deductibleExpenses + depreciation
    const taxableIncome = Math.max(0, grossIncome - totalDeductions)

    return {
      grossIncome,
      deductibleExpenses,
      taxableIncome,
      depreciation
    }
  }

  /**
   * Recommande le régime fiscal le plus avantageux
   */
  private static recommendRegime(
    microFoncier: any,
    microBIC: any,
    realRegime: any,
    hasFurnishedLease: boolean
  ) {
    const regimes = []

    // Ajouter Micro-foncier si applicable
    if (microFoncier.applicable) {
      regimes.push({
        regime: "micro-foncier" as const,
        taxableIncome: microFoncier.taxableIncome,
        grossIncome: microFoncier.grossIncome
      })
    }

    // Ajouter Micro-BIC si applicable et meublé
    if (microBIC.applicable && hasFurnishedLease) {
      regimes.push({
        regime: "micro-bic" as const,
        taxableIncome: microBIC.taxableIncome,
        grossIncome: microBIC.grossIncome
      })
    }

    // Ajouter régime réel
    regimes.push({
      regime: "real" as const,
      taxableIncome: realRegime.taxableIncome,
      grossIncome: realRegime.grossIncome
    })

    // Trouver le régime avec le revenu imposable le plus faible
    const bestRegime = regimes.reduce((best, current) => 
      current.taxableIncome < best.taxableIncome ? current : best
    )

    // Calculer l'économie par rapport au régime le plus défavorable
    const worstRegime = regimes.reduce((worst, current) => 
      current.taxableIncome > worst.taxableIncome ? current : worst
    )
    const savings = worstRegime.taxableIncome - bestRegime.taxableIncome

    let reason = ""
    if (bestRegime.regime === "micro-foncier") {
      reason = `Abattement forfaitaire de 30% (${(bestRegime.grossIncome * 0.30).toFixed(0)}€)`
    } else if (bestRegime.regime === "micro-bic") {
      reason = `Abattement forfaitaire de 50% (${(bestRegime.grossIncome * 0.50).toFixed(0)}€)`
    } else {
      reason = `Déduction des charges réelles (${realRegime.deductibleExpenses.toFixed(0)}€)`
    }

    return {
      regime: bestRegime.regime,
      reason,
      savings: Math.max(0, savings)
    }
  }

  /**
   * Génère un récapitulatif détaillé des dépenses par catégorie
   */
  static categorizeExpenses(expenses: Expense[], year: number) {
    const yearExpenses = expenses.filter(expense => {
      const expenseYear = new Date(expense.date).getFullYear()
      return expenseYear === year
    })

    const categories = {
      repairs: yearExpenses.filter(e => e.category === "repair" && e.deductible),
      maintenance: yearExpenses.filter(e => e.category === "maintenance" && e.deductible),
      taxes: yearExpenses.filter(e => e.category === "tax" && e.deductible),
      insurance: yearExpenses.filter(e => e.category === "insurance" && e.deductible),
      interest: yearExpenses.filter(e => e.category === "interest" && e.deductible),
      management: yearExpenses.filter(e => e.category === "management" && e.deductible),
      nonDeductible: yearExpenses.filter(e => !e.deductible)
    }

    return {
      totalDeductible: Object.values(categories)
        .filter(cat => cat !== categories.nonDeductible)
        .reduce((sum, cat) => sum + cat.reduce((s, e) => s + e.amount, 0), 0),
      totalNonDeductible: categories.nonDeductible.reduce((sum, e) => sum + e.amount, 0),
      categories
    }
  }

  /**
   * Valide les données fiscales
   */
  static validateFiscalData(data: FiscalData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.year || data.year < 2020 || data.year > new Date().getFullYear()) {
      errors.push("Année invalide")
    }

    if (!data.leases || data.leases.length === 0) {
      errors.push("Aucun bail trouvé")
    }

    if (!data.rentReceipts || data.rentReceipts.length === 0) {
      errors.push("Aucune quittance trouvée")
    }

    const hasPaidReceipts = data.rentReceipts.some(r => r.status === "paid")
    if (!hasPaidReceipts) {
      errors.push("Aucune quittance payée trouvée")
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

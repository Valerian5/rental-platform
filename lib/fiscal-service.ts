import { supabase } from "./supabase"
import { FiscalCalculator, FiscalData, LeaseData, RentReceipt, Expense } from "./fiscal-calculator"

export class FiscalService {
  /**
   * Récupère toutes les données fiscales pour une année donnée
   */
  static async getFiscalData(ownerId: string, year: number): Promise<FiscalData> {
    try {
      // 1. Récupérer les baux du propriétaire
      const { data: leases, error: leasesError } = await supabase
        .from("leases")
        .select(`
          id,
          type,
          monthly_rent,
          charges,
          property:properties(
            title,
            address
          )
        `)
        .eq("owner_id", ownerId)
        .in("status", ["active", "signed"])

      if (leasesError) throw leasesError

      // 2. Récupérer les quittances pour l'année
      const { data: receipts, error: receiptsError } = await supabase
        .from("rent_receipts")
        .select(`
          id,
          lease_id,
          year,
          month,
          rent_amount,
          charges_amount,
          total_amount,
          status
        `)
        .eq("year", year)
        .in("lease_id", leases?.map(l => l.id) || [])

      if (receiptsError) throw receiptsError

      // 3. Récupérer les dépenses pour l'année
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select(`
          id,
          lease_id,
          property_id,
          type,
          category,
          amount,
          date,
          description,
          deductible
        `)
        .eq("owner_id", ownerId)
        .gte("date", `${year}-01-01`)
        .lte("date", `${year}-12-31`)

      if (expensesError) throw expensesError

      // Transformer les données
      const leaseData: LeaseData[] = (leases || []).map(lease => ({
        id: lease.id,
        type: lease.type as "unfurnished" | "furnished",
        monthly_rent: lease.monthly_rent || 0,
        charges: lease.charges || 0,
        property_title: lease.property?.title || "Bien sans titre",
        property_address: lease.property?.address || "Adresse non renseignée"
      }))

      const rentReceiptData: RentReceipt[] = (receipts || []).map(receipt => ({
        id: receipt.id,
        lease_id: receipt.lease_id,
        year: receipt.year,
        month: receipt.month,
        rent_amount: receipt.rent_amount || 0,
        charges_amount: receipt.charges_amount || 0,
        total_amount: receipt.total_amount || 0,
        status: receipt.status as "paid" | "pending" | "overdue"
      }))

      const expenseData: Expense[] = (expenses || []).map(expense => ({
        id: expense.id,
        lease_id: expense.lease_id,
        property_id: expense.property_id,
        type: expense.type as "incident" | "maintenance" | "annual_charge",
        category: expense.category as "repair" | "maintenance" | "improvement" | "tax" | "insurance" | "interest" | "management",
        amount: expense.amount || 0,
        date: expense.date,
        description: expense.description || "",
        deductible: expense.deductible || false
      }))

      return {
        leases: leaseData,
        rentReceipts: rentReceiptData,
        expenses: expenseData,
        year
      }
    } catch (error) {
      console.error("Erreur récupération données fiscales:", error)
      throw error
    }
  }

  /**
   * Calcule les données fiscales pour une année
   */
  static async calculateFiscalData(ownerId: string, year: number) {
    const fiscalData = await this.getFiscalData(ownerId, year)
    return FiscalCalculator.calculateFiscalData(fiscalData)
  }

  /**
   * Récupère les années disponibles pour un propriétaire
   */
  static async getAvailableYears(ownerId: string): Promise<number[]> {
    try {
      const { data: receipts, error } = await supabase
        .from("rent_receipts")
        .select("year")
        .eq("status", "paid")
        .in("lease_id", 
          supabase
            .from("leases")
            .select("id")
            .eq("owner_id", ownerId)
        )

      if (error) throw error

      const years = [...new Set(receipts?.map(r => r.year) || [])]
      return years.sort((a, b) => b - a) // Plus récent en premier
    } catch (error) {
      console.error("Erreur récupération années:", error)
      return []
    }
  }

  /**
   * Récupère les statistiques fiscales globales
   */
  static async getFiscalStats(ownerId: string) {
    try {
      const currentYear = new Date().getFullYear()
      const previousYear = currentYear - 1

      // Récupérer les revenus des 2 dernières années
      const [currentYearData, previousYearData] = await Promise.all([
        this.calculateFiscalData(ownerId, currentYear),
        this.calculateFiscalData(ownerId, previousYear)
      ])

      return {
        currentYear: {
          revenue: currentYearData.totalRentCollected,
          deductibleExpenses: currentYearData.totalDeductibleExpenses,
          netIncome: currentYearData.totalRentCollected - currentYearData.totalDeductibleExpenses,
          recommendedRegime: currentYearData.recommendation.regime
        },
        previousYear: {
          revenue: previousYearData.totalRentCollected,
          deductibleExpenses: previousYearData.totalDeductibleExpenses,
          netIncome: previousYearData.totalRentCollected - previousYearData.totalDeductibleExpenses,
          recommendedRegime: previousYearData.recommendation.regime
        },
        evolution: {
          revenue: currentYearData.totalRentCollected - previousYearData.totalRentCollected,
          revenuePercentage: previousYearData.totalRentCollected > 0 
            ? ((currentYearData.totalRentCollected - previousYearData.totalRentCollected) / previousYearData.totalRentCollected) * 100
            : 0
        }
      }
    } catch (error) {
      console.error("Erreur calcul statistiques fiscales:", error)
      throw error
    }
  }

  /**
   * Exporte les données fiscales en CSV
   */
  static async exportFiscalDataCSV(ownerId: string, year: number): Promise<string> {
    const fiscalData = await this.getFiscalData(ownerId, year)
    const calculation = FiscalCalculator.calculateFiscalData(fiscalData)

    const csvData = [
      // En-têtes
      ["Année", "Revenus bruts", "Charges récupérables", "Dépenses déductibles", "Revenu net"],
      // Données
      [
        year.toString(),
        calculation.totalRentCollected.toString(),
        calculation.totalRecoverableCharges.toString(),
        calculation.totalDeductibleExpenses.toString(),
        (calculation.totalRentCollected - calculation.totalDeductibleExpenses).toString()
      ],
      [],
      // Détail des simulations
      ["Régime", "Revenu imposable", "Recommandé"],
      ["Micro-foncier", calculation.microFoncier.taxableIncome.toString(), calculation.recommendation.regime === "micro-foncier" ? "Oui" : "Non"],
      ["Micro-BIC", calculation.microBIC.taxableIncome.toString(), calculation.recommendation.regime === "micro-bic" ? "Oui" : "Non"],
      ["Régime réel", calculation.realRegime.taxableIncome.toString(), calculation.recommendation.regime === "real" ? "Oui" : "Non"]
    ]

    return csvData.map(row => row.join(",")).join("\n")
  }

  /**
   * Génère un récapitulatif fiscal pour impression
   */
  static async generateFiscalSummary(ownerId: string, year: number) {
    const fiscalData = await this.getFiscalData(ownerId, year)
    const calculation = FiscalCalculator.calculateFiscalData(fiscalData)
    const expenseBreakdown = FiscalCalculator.categorizeExpenses(fiscalData.expenses, year)

    return {
      year,
      summary: {
        totalRentCollected: calculation.totalRentCollected,
        totalRecoverableCharges: calculation.totalRecoverableCharges,
        totalDeductibleExpenses: calculation.totalDeductibleExpenses,
        netRentalIncome: calculation.totalRentCollected - calculation.totalDeductibleExpenses
      },
      simulations: {
        microFoncier: calculation.microFoncier,
        microBIC: calculation.microBIC,
        realRegime: calculation.realRegime,
        recommendation: calculation.recommendation
      },
      expenses: expenseBreakdown,
      properties: fiscalData.leases.map(lease => ({
        title: lease.property_title,
        address: lease.property_address,
        type: lease.type === "furnished" ? "Meublé" : "Non meublé",
        monthlyRent: lease.monthly_rent,
        charges: lease.charges
      }))
    }
  }
}

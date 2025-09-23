import { supabase } from "./supabase"
import { FiscalCalculator, FiscalData, LeaseData, RentReceipt, Expense } from "./fiscal-calculator"

export class FiscalService {
  /**
   * Récupère toutes les données fiscales pour une année donnée
   */
  static async getFiscalData(ownerId: string, year: number, propertyId?: string): Promise<FiscalData> {
    try {
      // 1. Récupérer les baux du propriétaire
      let leasesQuery = supabase
        .from("leases")
        .select(`
          id,
          lease_type,
          monthly_rent,
          charges,
          status,
          property:properties(
            title,
            address
          )
        `)
        .eq("owner_id", ownerId)
        .in("status", ["active", "signed", "expired"])

      if (propertyId) {
        leasesQuery = leasesQuery.eq("property_id", propertyId)
      }

      const { data: leases, error: leasesError } = await leasesQuery
      if (leasesError) throw leasesError

      console.log(`FiscalService: ${leases?.length || 0} baux trouvés pour l'owner ${ownerId}`)

      const leaseData: LeaseData[] = (leases || []).map(lease => ({
        id: lease.id,
        type: lease.lease_type as "unfurnished" | "furnished",
        monthly_rent: lease.monthly_rent || 0,
        charges: lease.charges || 0,
        property_title: lease.property?.title || "Bien sans titre",
        property_address: lease.property?.address || "Adresse non renseignée"
      }))

      // 2. Récupérer les quittances
      const leaseIds = leases?.map(l => l.id) || []
      let rentReceiptData: RentReceipt[] = []
      
      console.log(`FiscalService: IDs des baux pour la recherche de quittances:`, leaseIds)

      if (leaseIds.length > 0) {
        console.log(`FiscalService: Exécution de la requête pour les quittances avec year=${year} et leaseIds=${JSON.stringify(leaseIds)}`)
        
        // Utiliser la fonction SQL sécurisée pour contourner RLS
        console.log(`FiscalService: Utilisation de la fonction SQL sécurisée get_fiscal_receipts_secure`)
        
        const { data: receipts, error: receiptsError } = await supabase
          .rpc('get_fiscal_receipts_secure', {
            owner_id_param: ownerId,
            year_param: year
          })

        if (receiptsError) {
          console.error(`FiscalService: Erreur récupération quittances:`, receiptsError)
          throw receiptsError
        }
        
        console.log(`FiscalService: Résultat de la requête - receipts:`, receipts)
        console.log(`FiscalService: Nombre de quittances trouvées:`, receipts?.length || 0)

        console.log(`FiscalService: ${receipts?.length || 0} quittances trouvées pour l'année ${year}`)
        if (receipts && receipts.length > 0) {
          console.log(`FiscalService: Détails des quittances:`, receipts.map(r => ({
            id: r.id,
            lease_id: r.lease_id,
            year: r.year,
            month: r.month,
            rent_amount: r.rent_amount,
            charges_amount: r.charges_amount,
            total_amount: r.total_amount
          })))
        }

        rentReceiptData = (receipts || []).map(receipt => {
          let monthNumber: number

          if (typeof receipt.month === "string") {
            const parts = receipt.month.split("-") // ex: "2025-01"
            monthNumber = parts.length === 2 ? parseInt(parts[1], 10) : parseInt(receipt.month, 10)
          } else {
            monthNumber = receipt.month
          }

          if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
            console.warn(`FiscalService: Mois invalide trouvé pour receipt ${receipt.id}:`, receipt.month)
            monthNumber = 1 // Valeur par défaut
          }

          return {
            id: receipt.id,
            lease_id: receipt.lease_id,
            year: receipt.year,
            month: monthNumber,
            rent_amount: receipt.rent_amount || 0,
            charges_amount: receipt.charges_amount || 0,
            total_amount: receipt.total_amount || 0,
            status: "paid" as const
          }
        })
        
        console.log(`FiscalService: ${rentReceiptData.length} quittances transformées pour le calculateur`)
      }

      // 3. Récupérer les dépenses
      let expensesQuery = supabase
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

      if (propertyId) {
        expensesQuery = expensesQuery.eq("property_id", propertyId)
      }

      const { data: expenses, error: expensesError } = await expensesQuery
      if (expensesError) throw expensesError

      const expenseData: Expense[] = (expenses || []).map(expense => ({
        id: expense.id,
        lease_id: expense.lease_id,
        property_id: expense.property_id,
        type: expense.type as "incident" | "maintenance" | "annual_charge",
        category: expense.category as
          | "repair"
          | "maintenance"
          | "improvement"
          | "tax"
          | "insurance"
          | "interest"
          | "management",
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
  static async calculateFiscalData(ownerId: string, year: number, propertyId?: string) {
    const fiscalData = await this.getFiscalData(ownerId, year, propertyId)
    return FiscalCalculator.calculateFiscalData(fiscalData)
  }

  /**
   * Récupère les années disponibles pour un propriétaire
   */
  static async getAvailableYears(ownerId: string): Promise<number[]> {
    try {
      console.log(`FiscalService: Récupération des années disponibles pour owner ${ownerId}`)
      
      // Utiliser la fonction SQL sécurisée pour récupérer les années
      console.log(`FiscalService: Utilisation de la fonction SQL sécurisée get_fiscal_years_secure`)
      
      const { data: years, error: yearsError } = await supabase
        .rpc('get_fiscal_years_secure', {
          owner_id_param: ownerId
        })

      if (yearsError) {
        console.error(`FiscalService: Erreur récupération années:`, yearsError)
        throw yearsError
      }

      const yearList = years?.map(y => y.year) || []
      console.log(`FiscalService: Années trouvées:`, yearList)
      
      return yearList.sort((a, b) => b - a)
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

    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ]

    const csvData: string[][] = [
      ["Année", "Revenus bruts", "Charges récupérables", "Dépenses déductibles", "Revenu net"],
      [
        year.toString(),
        calculation.totalRentCollected.toString(),
        calculation.totalRecoverableCharges.toString(),
        calculation.totalDeductibleExpenses.toString(),
        (calculation.totalRentCollected - calculation.totalDeductibleExpenses).toString()
      ],
      [],
      ["Mois", "Loyer", "Charges", "Total"]
    ]

    fiscalData.rentReceipts.forEach(r => {
      const monthLabel = r.month && r.month >= 1 && r.month <= 12
        ? monthNames[r.month - 1]
        : `Mois ${r.month || "?"}`

      csvData.push([
        monthLabel,
        r.rent_amount.toString(),
        r.charges_amount.toString(),
        r.total_amount.toString()
      ])
    })

    csvData.push([])
    csvData.push(["Régime", "Revenu imposable", "Recommandé"])
    csvData.push([
      "Micro-foncier",
      calculation.microFoncier.taxableIncome.toString(),
      calculation.recommendation.regime === "micro-foncier" ? "Oui" : "Non"
    ])
    csvData.push([
      "Micro-BIC",
      calculation.microBIC.taxableIncome.toString(),
      calculation.recommendation.regime === "micro-bic" ? "Oui" : "Non"
    ])
    csvData.push([
      "Régime réel",
      calculation.realRegime.taxableIncome.toString(),
      calculation.recommendation.regime === "real" ? "Oui" : "Non"
    ])

    return csvData.map(row => row.join(",")).join("\n")
  }

  /**
   * Génère un récapitulatif fiscal pour impression
   */
  static async generateFiscalSummary(ownerId: string, year: number) {
    const fiscalData = await this.getFiscalData(ownerId, year)
    const calculation = FiscalCalculator.calculateFiscalData(fiscalData)
    const expenseBreakdown = FiscalCalculator.categorizeExpenses(fiscalData.expenses, year)

    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ]

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
      })),
      rentReceipts: fiscalData.rentReceipts.map(r => ({
        id: r.id,
        lease_id: r.lease_id,
        month: (r.month && r.month >= 1 && r.month <= 12)
          ? monthNames[r.month - 1]
          : `Mois ${r.month || "?"}`,
        year: r.year,
        rent_amount: r.rent_amount,
        charges_amount: r.charges_amount,
        total_amount: r.total_amount
      }))
    }
  }
}

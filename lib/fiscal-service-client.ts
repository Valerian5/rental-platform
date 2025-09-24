/**
 * Service fiscal côté client qui respecte RLS
 * Utilise l'authentification utilisateur pour les requêtes frontend
 */

import { supabase } from "./supabase"
import { FiscalCalculator, FiscalData, LeaseData, RentReceipt, Expense } from "./fiscal-calculator"

export class FiscalServiceClient {
  /**
   * Récupère toutes les données fiscales pour une année donnée (côté client)
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

      // Filtrer par propriété si spécifiée
      if (propertyId) {
        leasesQuery = leasesQuery.eq("property_id", propertyId)
      }

      const { data: leases, error: leasesError } = await leasesQuery

      if (leasesError) throw leasesError
      
      console.log(`FiscalServiceClient: ${leases?.length || 0} baux trouvés pour l'owner ${ownerId}`)

      // 2. Récupérer les quittances pour l'année depuis la table receipts
      const leaseIds = leases?.map(l => l.id) || []
      let rentReceiptData: RentReceipt[] = []
      
      console.log(`FiscalServiceClient: IDs des baux pour la recherche de quittances:`, leaseIds)

      if (leaseIds.length > 0) {
        const { data: receipts, error: receiptsError } = await supabase
          .from("receipts")
          .select(`
            id,
            lease_id,
            year,
            month,
            rent_amount,
            charges_amount,
            total_amount,
            generated_at
          `)
          .eq("year", year)
          .in("lease_id", leaseIds)

        if (receiptsError) {
          console.error(`FiscalServiceClient: Erreur récupération quittances:`, receiptsError)
          throw receiptsError
        }
        
        console.log(`FiscalServiceClient: ${receipts?.length || 0} quittances trouvées pour l'année ${year}`)

        // Transformer les données
        rentReceiptData = (receipts || []).map(receipt => {
          let monthNumber: number

          if (typeof receipt.month === "string") {
            const parts = receipt.month.split("-") // ex: "2025-01"
            monthNumber = parts.length === 2 ? parseInt(parts[1], 10) : parseInt(receipt.month, 10)
          } else {
            monthNumber = receipt.month
          }

          if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
            console.warn(`FiscalServiceClient: Mois invalide trouvé pour receipt ${receipt.id}:`, receipt.month)
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
      }

      // 3. Récupérer les dépenses pour l'année
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

      // Filtrer par propriété si spécifiée
      if (propertyId) {
        expensesQuery = expensesQuery.eq("property_id", propertyId)
      }

      const { data: expenses, error: expensesError } = await expensesQuery

      if (expensesError) throw expensesError

      // Transformer les données
      const leaseData: LeaseData[] = (leases || []).map(lease => ({
        id: lease.id,
        type: lease.lease_type as "unfurnished" | "furnished",
        monthly_rent: lease.monthly_rent || 0,
        charges: lease.charges || 0,
        property_title: lease.property?.title || "Bien sans titre",
        property_address: lease.property?.address || "Adresse non renseignée"
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
   * Calcule les données fiscales pour une année (côté client)
   */
  static async calculateFiscalData(ownerId: string, year: number, propertyId?: string) {
    const fiscalData = await this.getFiscalData(ownerId, year, propertyId)
    return FiscalCalculator.calculateFiscalData(fiscalData)
  }

  /**
   * Récupère les années disponibles pour un propriétaire (côté client)
   */
  static async getAvailableYears(ownerId: string): Promise<number[]> {
    try {
      console.log(`FiscalServiceClient: Récupération des années disponibles pour owner ${ownerId}`)
      
      // Récupérer d'abord les IDs des baux du propriétaire
      const { data: leases, error: leasesError } = await supabase
        .from("leases")
        .select("id")
        .eq("owner_id", ownerId)

      if (leasesError) throw leasesError
      if (!leases || leases.length === 0) return []

      const leaseIds = leases.map(l => l.id)

      // Récupérer les années des quittances
      const { data: receipts, error: receiptsError } = await supabase
        .from("receipts")
        .select("year")
        .in("lease_id", leaseIds)

      if (receiptsError) throw receiptsError

      const yearList = [...new Set(receipts?.map(r => r.year) || [])]
      console.log(`FiscalServiceClient: Années trouvées:`, yearList)
      
      return yearList.sort((a, b) => b - a)
    } catch (error) {
      console.error("Erreur récupération années:", error)
      return []
    }
  }

  /**
   * Récupère les statistiques fiscales (côté client)
   */
  static async getFiscalStats(ownerId: string): Promise<any> {
    try {
      const currentYear = new Date().getFullYear()
      const fiscalData = await this.getFiscalData(ownerId, currentYear)
      const calculation = FiscalCalculator.calculateFiscalData(fiscalData)
      
      return {
        totalRentCollected: calculation.totalRentCollected,
        totalRecoverableCharges: calculation.totalRecoverableCharges,
        totalDeductibleExpenses: calculation.totalDeductibleExpenses,
        netRentalIncome: calculation.netRentalIncome,
        taxableProfit: calculation.taxableProfit,
        year: currentYear
      }
    } catch (error) {
      console.error("Erreur récupération statistiques fiscales:", error)
      throw error
    }
  }

  /**
   * Exporte les données fiscales en CSV (côté client)
   */
  static async exportFiscalDataCSV(ownerId: string, year: number): Promise<string> {
    try {
      const fiscalData = await this.getFiscalData(ownerId, year)
      const calculation = FiscalCalculator.calculateFiscalData(fiscalData)
      
      // Créer le CSV
      let csv = "Type,Description,Montant\n"
      csv += `Revenus locatifs bruts,Total loyers encaissés,${calculation.totalRentCollected}\n`
      csv += `Charges récupérables,Total charges récupérables,${calculation.totalRecoverableCharges}\n`
      csv += `Revenus locatifs nets,Revenus nets,${calculation.netRentalIncome}\n`
      csv += `Dépenses déductibles,Total dépenses,${calculation.totalDeductibleExpenses}\n`
      csv += `Bénéfice imposable,Bénéfice,${calculation.taxableProfit}\n`
      
      return csv
    } catch (error) {
      console.error("Erreur export CSV:", error)
      throw error
    }
  }

  /**
   * Génère un récapitulatif fiscal (côté client)
   */
  static async generateFiscalSummary(ownerId: string, year: number): Promise<any> {
    try {
      const fiscalData = await this.getFiscalData(ownerId, year)
      const calculation = FiscalCalculator.calculateFiscalData(fiscalData)
      
      // Récupérer les informations du propriétaire
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("first_name, last_name, email")
        .eq("id", ownerId)
        .single()

      if (userError) throw userError

      return {
        year,
        owner: {
          name: `${user.first_name} ${user.last_name}`,
          email: user.email
        },
        summary: {
          totalRentCollected: calculation.totalRentCollected,
          totalRecoverableCharges: calculation.totalRecoverableCharges,
          netRentalIncome: calculation.netRentalIncome,
          totalDeductibleExpenses: calculation.totalDeductibleExpenses,
          taxableProfit: calculation.taxableProfit
        },
        simulations: {
          microFoncier: {
            taxableIncome: calculation.totalRentCollected,
            applicable: calculation.totalRentCollected > 0
          },
          microBIC: {
            taxableIncome: calculation.totalRentCollected,
            applicable: false
          },
          realRegime: {
            taxableIncome: calculation.taxableProfit,
            applicable: true
          },
          recommendation: {
            regime: 'real' as const,
            savings: 0
          }
        },
        expenses: {
          deductible: fiscalData.expenses.filter(e => e.deductible).map(e => ({
            category: e.category,
            amount: e.amount,
            count: 1
          })),
          nonDeductible: fiscalData.expenses.filter(e => !e.deductible).map(e => ({
            category: e.category,
            amount: e.amount,
            count: 1
          }))
        },
        properties: fiscalData.leases.map(lease => ({
          title: lease.property_title,
          address: lease.property_address,
          type: lease.type,
          monthlyRent: lease.monthly_rent,
          charges: lease.charges
        })),
        leases: fiscalData.leases,
        receipts: fiscalData.rentReceipts
      }
    } catch (error) {
      console.error("Erreur génération récapitulatif:", error)
      throw error
    }
  }
}

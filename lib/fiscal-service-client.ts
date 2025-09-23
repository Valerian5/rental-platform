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
}

/**
 * Service des dépenses côté client qui respecte RLS
 * Utilise l'authentification utilisateur pour les requêtes frontend
 */

import { supabase } from "./supabase"
import { Expense } from "./fiscal-calculator"

export interface ExpenseInput {
  property_id: string
  lease_id?: string
  type: "incident" | "maintenance" | "annual_charge"
  category: "repair" | "maintenance" | "improvement" | "tax" | "insurance" | "interest" | "management"
  amount: number
  date: string
  description: string
  deductible?: boolean
  receipt_url?: string
}

export interface ExpenseUpdate {
  id: string
  property_id?: string
  lease_id?: string
  type?: "incident" | "maintenance" | "annual_charge"
  category?: "repair" | "maintenance" | "improvement" | "tax" | "insurance" | "interest" | "management"
  amount?: number
  date?: string
  description?: string
  deductible?: boolean
  receipt_url?: string
}

export class ExpenseServiceClient {
  /**
   * Récupère toutes les dépenses pour un propriétaire (côté client)
   */
  static async getExpenses(
    ownerId: string, 
    year?: number, 
    propertyId?: string
  ): Promise<Expense[]> {
    try {
      console.log(`ExpenseServiceClient: Récupération des dépenses pour owner ${ownerId}`)
      
      let query = supabase
        .from("expenses")
        .select(`
          id,
          property_id,
          lease_id,
          type,
          category,
          amount,
          date,
          description,
          deductible,
          receipt_url,
          created_at,
          updated_at
        `)
        .eq("owner_id", ownerId)
        .order("date", { ascending: false })

      // Filtrer par année si spécifiée
      if (year) {
        query = query
          .gte("date", `${year}-01-01`)
          .lte("date", `${year}-12-31`)
      }

      // Filtrer par propriété si spécifiée
      if (propertyId) {
        query = query.eq("property_id", propertyId)
      }

      const { data: expenses, error } = await query

      if (error) {
        console.error(`ExpenseServiceClient: Erreur récupération dépenses:`, error)
        throw error
      }

      console.log(`ExpenseServiceClient: ${expenses?.length || 0} dépenses trouvées`)
      return expenses || []
    } catch (error) {
      console.error("Erreur récupération dépenses:", error)
      throw error
    }
  }

  /**
   * Récupère une dépense par ID (côté client)
   */
  static async getExpenseById(expenseId: string): Promise<Expense | null> {
    try {
      const { data: expense, error } = await supabase
        .from("expenses")
        .select(`
          id,
          property_id,
          lease_id,
          type,
          category,
          amount,
          date,
          description,
          deductible,
          receipt_url,
          created_at,
          updated_at
        `)
        .eq("id", expenseId)
        .single()

      if (error) {
        console.error(`ExpenseServiceClient: Erreur récupération dépense ${expenseId}:`, error)
        throw error
      }

      return expense
    } catch (error) {
      console.error("Erreur récupération dépense:", error)
      return null
    }
  }

  /**
   * Récupère les statistiques des dépenses (côté client)
   */
  static async getExpenseStats(
    ownerId: string, 
    year?: number, 
    propertyId?: string
  ): Promise<{
    totalAmount: number
    deductibleAmount: number
    nonDeductibleAmount: number
    count: number
    byCategory: Record<string, { amount: number; count: number }>
    byType: Record<string, { amount: number; count: number }>
  }> {
    try {
      const expenses = await this.getExpenses(ownerId, year, propertyId)
      
      const stats = {
        totalAmount: 0,
        deductibleAmount: 0,
        nonDeductibleAmount: 0,
        count: expenses.length,
        byCategory: {} as Record<string, { amount: number; count: number }>,
        byType: {} as Record<string, { amount: number; count: number }>
      }

      expenses.forEach(expense => {
        stats.totalAmount += expense.amount
        
        if (expense.deductible) {
          stats.deductibleAmount += expense.amount
        } else {
          stats.nonDeductibleAmount += expense.amount
        }

        // Statistiques par catégorie
        if (!stats.byCategory[expense.category]) {
          stats.byCategory[expense.category] = { amount: 0, count: 0 }
        }
        stats.byCategory[expense.category].amount += expense.amount
        stats.byCategory[expense.category].count += 1

        // Statistiques par type
        if (!stats.byType[expense.type]) {
          stats.byType[expense.type] = { amount: 0, count: 0 }
        }
        stats.byType[expense.type].amount += expense.amount
        stats.byType[expense.type].count += 1
      })

      return stats
    } catch (error) {
      console.error("Erreur calcul statistiques dépenses:", error)
      throw error
    }
  }

  /**
   * Récupère les années disponibles pour les dépenses (côté client)
   */
  static async getAvailableYears(ownerId: string): Promise<number[]> {
    try {
      console.log(`ExpenseServiceClient: Récupération des années disponibles pour owner ${ownerId}`)
      
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("date")
        .eq("owner_id", ownerId)

      if (error) throw error

      const yearList = [...new Set(expenses?.map(e => new Date(e.date).getFullYear()) || [])]
      console.log(`ExpenseServiceClient: Années trouvées:`, yearList)
      
      return yearList.sort((a, b) => b - a)
    } catch (error) {
      console.error("Erreur récupération années dépenses:", error)
      return []
    }
  }
}

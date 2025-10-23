"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar,
  Euro,
  Wrench,
  Home,
  Receipt,
  Shield,
  CreditCard,
  Settings,
  AlertTriangle
} from "lucide-react"
import { Expense } from "@/lib/fiscal-calculator"

interface ExpenseVisualizationProps {
  expenses: Expense[]
  year: number
}

const categoryIcons = {
  repair: Wrench,
  maintenance: Home,
  tax: Receipt,
  insurance: Shield,
  interest: CreditCard,
  management: Settings,
  improvement: AlertTriangle
}

const categoryLabels = {
  repair: "Réparations",
  maintenance: "Entretien",
  tax: "Taxes",
  insurance: "Assurance",
  interest: "Intérêts",
  management: "Gestion",
  improvement: "Améliorations"
}

const categoryColors = {
  repair: "#ef4444",
  maintenance: "#3b82f6",
  tax: "#10b981",
  insurance: "#8b5cf6",
  interest: "#f59e0b",
  management: "#6b7280",
  improvement: "#eab308"
}

export function ExpenseVisualization({ expenses, year }: ExpenseVisualizationProps) {
  const yearExpenses = expenses.filter(expense => {
    const expenseYear = new Date(expense.date).getFullYear()
    return expenseYear === year
  })

  const deductibleExpenses = yearExpenses.filter(e => e.deductible)
  const nonDeductibleExpenses = yearExpenses.filter(e => !e.deductible)

  // Statistiques par catégorie
  const categoryStats = deductibleExpenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = { amount: 0, count: 0 }
    }
    acc[expense.category].amount += expense.amount
    acc[expense.category].count += 1
    return acc
  }, {} as Record<string, { amount: number; count: number }>)

  // Statistiques par mois
  const monthlyStats = yearExpenses.reduce((acc, expense) => {
    const month = new Date(expense.date).getMonth()
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
    if (!acc[monthKey]) {
      acc[monthKey] = { deductible: 0, nonDeductible: 0, total: 0 }
    }
    if (expense.deductible) {
      acc[monthKey].deductible += expense.amount
    } else {
      acc[monthKey].nonDeductible += expense.amount
    }
    acc[monthKey].total += expense.amount
    return acc
  }, {} as Record<string, { deductible: number; nonDeductible: number; total: number }>)

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]

  const totalDeductible = deductibleExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalNonDeductible = nonDeductibleExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalExpenses = totalDeductible + totalNonDeductible

  // Données pour le graphique en barres par catégorie
  const categoryChartData = Object.entries(categoryStats).map(([category, stats]) => ({
    category: categoryLabels[category as keyof typeof categoryLabels] || category,
    amount: stats.amount,
    count: stats.count,
    color: categoryColors[category as keyof typeof categoryColors] || "#6b7280"
  })).sort((a, b) => b.amount - a.amount)

  // Données pour le graphique en barres par mois
  const monthlyChartData = Object.entries(monthlyStats)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, stats]) => {
      const month = parseInt(monthKey.split('-')[1]) - 1
      return {
        month: monthNames[month],
        deductible: stats.deductible,
        nonDeductible: stats.nonDeductible,
        total: stats.total
      }
    })

  // Données pour le graphique en secteurs
  const pieChartData = [
    ...categoryChartData.map(item => ({
      name: item.category,
      value: item.amount,
      color: item.color
    })),
    ...(totalNonDeductible > 0 ? [{
      name: "Non déductibles",
      value: totalNonDeductible,
      color: "#f59e0b"
    }] : [])
  ]

  return (
    <div className="space-y-6">
      {/* Résumé des statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total dépenses</p>
                <p className="text-2xl font-bold">{totalExpenses.toLocaleString('fr-FR')} €</p>
              </div>
              <Euro className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Déductibles</p>
                <p className="text-2xl font-bold text-green-600">{totalDeductible.toLocaleString('fr-FR')} €</p>
                <p className="text-xs text-muted-foreground">
                  {totalExpenses > 0 ? Math.round((totalDeductible / totalExpenses) * 100) : 0}% du total
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Non déductibles</p>
                <p className="text-2xl font-bold text-orange-600">{totalNonDeductible.toLocaleString('fr-FR')} €</p>
                <p className="text-xs text-muted-foreground">
                  {totalExpenses > 0 ? Math.round((totalNonDeductible / totalExpenses) * 100) : 0}% du total
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Par catégorie</TabsTrigger>
          <TabsTrigger value="timeline">Évolution mensuelle</TabsTrigger>
          <TabsTrigger value="breakdown">Répartition</TabsTrigger>
        </TabsList>

        {/* Graphique par catégorie */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dépenses par catégorie
              </CardTitle>
              <CardDescription>
                Répartition des dépenses déductibles par type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryChartData.map((item, index) => {
                  const percentage = totalDeductible > 0 ? (item.amount / totalDeductible) * 100 : 0
                  const Icon = categoryIcons[Object.keys(categoryLabels).find(key => 
                    categoryLabels[key as keyof typeof categoryLabels] === item.category
                  ) as keyof typeof categoryIcons] || Home

                  return (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color: item.color }} />
                          <span className="font-medium">{item.category}</span>
                          <Badge variant="outline">{item.count} dépense{item.count > 1 ? 's' : ''}</Badge>
                        </div>
                        <span className="font-semibold">{item.amount.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% du total déductible
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graphique d'évolution mensuelle */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Évolution mensuelle
              </CardTitle>
              <CardDescription>
                Dépenses par mois en {year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyChartData.map((item, index) => (
                  <div key={item.month} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.month}</span>
                      <span className="font-semibold">{item.total.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600">Déductibles</span>
                          <span>{item.deductible.toLocaleString('fr-FR')} €</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="h-1 rounded-full bg-green-500"
                            style={{ 
                              width: item.total > 0 ? `${(item.deductible / item.total) * 100}%` : '0%'
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-orange-600">Non déductibles</span>
                          <span>{item.nonDeductible.toLocaleString('fr-FR')} €</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="h-1 rounded-full bg-orange-500"
                            style={{ 
                              width: item.total > 0 ? `${(item.nonDeductible / item.total) * 100}%` : '0%'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graphique en secteurs */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Répartition des dépenses
              </CardTitle>
              <CardDescription>
                Visualisation de la répartition par catégorie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {pieChartData.map((item, index) => {
                    const percentage = totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.name}</span>
                            <span className="text-sm font-semibold">{item.value.toLocaleString('fr-FR')} €</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {percentage.toFixed(1)}% du total
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold">{totalExpenses.toLocaleString('fr-FR')} €</div>
                    <div className="text-sm text-muted-foreground">Total des dépenses</div>
                    <div className="text-xs text-muted-foreground">
                      {yearExpenses.length} dépense{yearExpenses.length > 1 ? 's' : ''} en {year}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

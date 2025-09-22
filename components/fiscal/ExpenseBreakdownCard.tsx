"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Wrench, 
  Home, 
  Receipt, 
  Shield, 
  CreditCard, 
  Settings, 
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  Upload,
  FileText
} from "lucide-react"
import { Expense } from "@/lib/fiscal-calculator"

interface ExpenseBreakdownCardProps {
  expenses: Expense[]
  year: number
  onAddExpense?: () => void
  onViewExpense?: (expenseId: string) => void
  onEditExpense?: (expenseId: string) => void
  onAddReceipt?: (expenseId: string) => void
  addExpenseDialogRef?: React.RefObject<{ openDialog: () => void }>
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
  repair: "bg-red-100 text-red-800 border-red-200",
  maintenance: "bg-blue-100 text-blue-800 border-blue-200",
  tax: "bg-green-100 text-green-800 border-green-200",
  insurance: "bg-purple-100 text-purple-800 border-purple-200",
  interest: "bg-orange-100 text-orange-800 border-orange-200",
  management: "bg-gray-100 text-gray-800 border-gray-200",
  improvement: "bg-yellow-100 text-yellow-800 border-yellow-200"
}

export function ExpenseBreakdownCard({ 
  expenses, 
  year, 
  onAddExpense, 
  onViewExpense,
  onEditExpense,
  onAddReceipt,
  addExpenseDialogRef
}: ExpenseBreakdownCardProps) {
  const yearExpenses = expenses.filter(expense => {
    const expenseYear = new Date(expense.date).getFullYear()
    return expenseYear === year
  })

  const deductibleExpenses = yearExpenses.filter(e => e.deductible)
  const nonDeductibleExpenses = yearExpenses.filter(e => !e.deductible)

  const totalDeductible = deductibleExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalNonDeductible = nonDeductibleExpenses.reduce((sum, e) => sum + e.amount, 0)

  // Grouper par catégorie
  const expensesByCategory = deductibleExpenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = []
    }
    acc[expense.category].push(expense)
    return acc
  }, {} as Record<string, Expense[]>)

  const getCategoryTotal = (category: string) => {
    return expensesByCategory[category]?.reduce((sum, e) => sum + e.amount, 0) || 0
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Dépenses {year}
          </CardTitle>
          <CardDescription>
            Répartition des dépenses par catégorie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h4 className="font-semibold text-green-900">Déductibles</h4>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {totalDeductible.toLocaleString('fr-FR')} €
              </p>
              <p className="text-sm text-green-600">
                {deductibleExpenses.length} dépense{deductibleExpenses.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <h4 className="font-semibold text-orange-900">Non déductibles</h4>
              </div>
              <p className="text-2xl font-bold text-orange-700">
                {totalNonDeductible.toLocaleString('fr-FR')} €
              </p>
              <p className="text-sm text-orange-600">
                {nonDeductibleExpenses.length} dépense{nonDeductibleExpenses.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <h4 className="font-semibold text-gray-900">Total</h4>
              </div>
              <p className="text-2xl font-bold text-gray-700">
                {(totalDeductible + totalNonDeductible).toLocaleString('fr-FR')} €
              </p>
              <p className="text-sm text-gray-600">
                {yearExpenses.length} dépense{yearExpenses.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détail par catégorie */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Détail par catégorie</CardTitle>
              <CardDescription>Dépenses déductibles uniquement</CardDescription>
            </div>
            <Button 
              onClick={() => addExpenseDialogRef?.current?.openDialog() || onAddExpense?.()} 
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(expensesByCategory).map(([category, categoryExpenses]) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons]
              const total = getCategoryTotal(category)
              
              return (
                <div key={category} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <h4 className="font-semibold">
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </h4>
                      <Badge className={categoryColors[category as keyof typeof categoryColors]}>
                        {total.toLocaleString('fr-FR')} €
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {categoryExpenses.length} dépense{categoryExpenses.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Propriété</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {categoryExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                  <TableCell className="font-medium">
                                    {formatDate(expense.date)}
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{expense.description}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {expense.type === "incident" && "Incident locataire"}
                                        {expense.type === "maintenance" && "Travaux propriétaire"}
                                        {expense.type === "annual_charge" && "Charge annuelle"}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <p className="font-medium">{(expense as any).property?.title || "Propriété inconnue"}</p>
                                      <p className="text-muted-foreground">{(expense as any).property?.address || ""}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    {expense.amount.toLocaleString('fr-FR')} €
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => onViewExpense?.(expense.id)}
                                        title="Voir les détails"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => onEditExpense?.(expense.id)}
                                        title="Modifier"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => onAddReceipt?.(expense.id)}
                                        title="Ajouter un justificatif"
                                      >
                                        {(expense as any).receipt_url ? (
                                          <FileText className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <Upload className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                </div>
              )
            })}

            {Object.keys(expensesByCategory).length === 0 && (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune dépense déductible</h3>
                <p className="text-muted-foreground mb-4">
                  Ajoutez vos dépenses pour optimiser votre déclaration fiscale
                </p>
                <Button 
                  onClick={() => addExpenseDialogRef?.current?.openDialog() || onAddExpense?.()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une dépense
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dépenses non déductibles */}
      {nonDeductibleExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Dépenses non déductibles
            </CardTitle>
            <CardDescription>
              Ces dépenses ne peuvent pas être déduites de vos revenus locatifs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonDeductibleExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {formatDate(expense.date)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.type === "incident" && "Incident locataire"}
                          {expense.type === "maintenance" && "Travaux propriétaire"}
                          {expense.type === "annual_charge" && "Charge annuelle"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabels[expense.category as keyof typeof categoryLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {expense.amount.toLocaleString('fr-FR')} €
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onViewExpense?.(expense.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

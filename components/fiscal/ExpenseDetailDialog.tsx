"use client"

import { useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Euro, 
  Calendar, 
  Building, 
  User, 
  FileText, 
  Download,
  ExternalLink,
  Wrench,
  Home,
  Receipt,
  Shield,
  CreditCard,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface ExpenseDetailDialogProps {
  onExpenseUpdated?: () => void
}

export interface ExpenseDetailDialogRef {
  openDialog: (expenseId: string) => void
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

const typeLabels = {
  incident: "Incident locataire",
  maintenance: "Travaux propriétaire",
  annual_charge: "Charge annuelle"
}

export const ExpenseDetailDialog = forwardRef<ExpenseDetailDialogRef, ExpenseDetailDialogProps>(
  ({ onExpenseUpdated }, ref) => {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [expense, setExpense] = useState<any>(null)

  // Exposer la méthode openDialog via la ref
  useImperativeHandle(ref, () => ({
    openDialog: (expenseId: string) => {
      setOpen(true)
      loadExpenseDetails(expenseId)
    }
  }))

  const loadExpenseDetails = async (expenseId: string) => {
    try {
      setIsLoading(true)
      
      // Récupérer le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        toast.error("Session expirée, veuillez vous reconnecter")
        return
      }

      const response = await fetch(`/api/expenses/${expenseId}`, {
        headers: { 
          "Authorization": `Bearer ${sessionData.session.access_token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setExpense(data.expense)
      } else {
        toast.error(data.error || "Erreur lors du chargement de la dépense")
      }
    } catch (error) {
      console.error("Erreur chargement dépense:", error)
      toast.error("Erreur lors du chargement de la dépense")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' €'
  }

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category as keyof typeof categoryIcons] || Home
    return <Icon className="h-4 w-4" />
  }

  const getDeductibleBadge = (deductible: boolean) => {
    return deductible ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Déductible
      </Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
        <XCircle className="h-3 w-3 mr-1" />
        Non déductible
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la dépense</DialogTitle>
            <DialogDescription>Chargement des informations...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!expense) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la dépense</DialogTitle>
            <DialogDescription>Dépense non trouvée</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Impossible de charger les détails de cette dépense</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getCategoryIcon(expense.category)}
            {expense.description}
          </DialogTitle>
          <DialogDescription>
            Détails de la dépense du {formatDate(expense.date)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Montant
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{formatAmount(expense.amount)}</div>
                {getDeductibleBadge(expense.deductible)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg font-semibold">{formatDate(expense.date)}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(expense.date).toLocaleDateString('fr-FR', { weekday: 'long' })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Catégorie et type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getCategoryIcon(expense.category)}
                  Catégorie
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="font-semibold">
                  {categoryLabels[expense.category as keyof typeof categoryLabels] || expense.category}
                </div>
                <div className="text-sm text-muted-foreground">
                  {expense.deductible ? "Déductible fiscalement" : "Non déductible fiscalement"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Type
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="font-semibold">
                  {typeLabels[expense.type as keyof typeof typeLabels] || expense.type}
                </div>
                <div className="text-sm text-muted-foreground">
                  {expense.type === "incident" && "Dépense causée par le locataire"}
                  {expense.type === "maintenance" && "Travaux d'entretien ou de réparation"}
                  {expense.type === "annual_charge" && "Taxes, assurances, intérêts..."}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Propriété et locataire */}
          {expense.property && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Propriété
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="font-semibold">{expense.property.title}</div>
                  <div className="text-sm text-muted-foreground">{expense.property.address}</div>
                  {expense.lease?.tenant && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4" />
                      <span>Locataire: {expense.lease.tenant.first_name} {expense.lease.tenant.last_name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Justificatif */}
          {expense.receipt_url && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Justificatif
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(expense.receipt_url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(expense.receipt_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Impact fiscal */}
          <Card className={expense.deductible ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {expense.deductible ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-orange-600" />
                )}
                Impact fiscal
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className={`font-semibold ${expense.deductible ? "text-green-900" : "text-orange-900"}`}>
                  {expense.deductible ? "Dépense déductible" : "Dépense non déductible"}
                </div>
                <div className={`text-sm ${expense.deductible ? "text-green-700" : "text-orange-700"}`}>
                  {expense.deductible 
                    ? `Cette dépense de ${formatAmount(expense.amount)} réduira votre revenu imposable`
                    : `Cette dépense de ${formatAmount(expense.amount)} ne peut pas être déduite de vos revenus`
                  }
                </div>
                {expense.deductible && (
                  <div className="text-xs text-green-600">
                    Économie d'impôt estimée: {formatAmount(expense.amount * 0.3)} (taux marginal de 30%)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
})

"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  Calculator,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Euro,
  Calendar,
  Receipt,
  RefreshCw,
  Plus,
} from "lucide-react"

import { FiscalSummaryCard } from "@/components/fiscal/FiscalSummaryCard"
import { FiscalSimulationCard } from "@/components/fiscal/FiscalSimulationCard"
import { ExpenseBreakdownCard } from "@/components/fiscal/ExpenseBreakdownCard"
import { AddExpenseDialog, AddExpenseDialogRef } from "@/components/fiscal/AddExpenseDialog"
import { EditExpenseDialog, EditExpenseDialogRef } from "@/components/fiscal/EditExpenseDialog"
import { AddReceiptDialog, AddReceiptDialogRef } from "@/components/fiscal/AddReceiptDialog"
import { FiscalCalculation, Expense } from "@/lib/fiscal-calculator"
import { supabase } from "@/lib/supabase"
import { FiscalServiceClient } from "@/lib/fiscal-service-client"
import { ExpenseServiceClient } from "@/lib/expense-service-client"
import { toast } from "sonner"

export default function FiscalPage() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all")
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [fiscalCalculation, setFiscalCalculation] = useState<FiscalCalculation | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const addExpenseDialogRef = useRef<AddExpenseDialogRef>(null)
  const editExpenseDialogRef = useRef<EditExpenseDialogRef>(null)
  const addReceiptDialogRef = useRef<AddReceiptDialogRef>(null)

  useEffect(() => {
    loadFiscalData()
  }, [currentYear, selectedPropertyId])

  const loadFiscalData = async () => {
    try {
      setIsLoading(true)
      
      // Récupérer le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        toast.error("Session expirée, veuillez vous reconnecter")
        return
      }

      const headers = {
        'Authorization': `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json'
      }
      
      // Charger les propriétés du propriétaire
      const propertiesResponse = await fetch(`/api/properties`, { headers })
      const propertiesData = await propertiesResponse.json()
      if (propertiesData.success) {
        setProperties(propertiesData.properties || [])
      }
      
      // Charger les années disponibles (côté client)
      const years = await FiscalServiceClient.getAvailableYears(user.id)
      setAvailableYears(years)

      // Charger les données fiscales (côté client)
      console.log(`FiscalPage: Chargement des données fiscales pour l'année ${currentYear}`)
      const fiscalData = await FiscalServiceClient.calculateFiscalData(
        user.id, 
        currentYear, 
        selectedPropertyId !== "all" ? selectedPropertyId : undefined
      )
      
      console.log(`FiscalPage: Données fiscales chargées:`, fiscalData)
      setFiscalCalculation(fiscalData)

      // Charger les dépenses (côté client)
      const expenses = await ExpenseServiceClient.getExpenses(
        user.id, 
        currentYear, 
        selectedPropertyId !== "all" ? selectedPropertyId : undefined
      )
      setExpenses(expenses)

    } catch (error) {
      console.error("Erreur chargement données fiscales:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadFiscalData()
    setIsRefreshing(false)
    toast.success("Données mises à jour")
  }

  const handleExportCSV = async () => {
    try {
      // Récupérer le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        toast.error("Session expirée, veuillez vous reconnecter")
        return
      }

      const response = await fetch("/api/fiscal", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ action: "export-csv", year: currentYear })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `declaration-fiscale-${currentYear}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Export CSV généré")
      } else {
        toast.error("Erreur lors de l'export")
      }
    } catch (error) {
      console.error("Erreur export CSV:", error)
      toast.error("Erreur lors de l'export")
    }
  }

  const handleExportPDF = async () => {
    try {
      // Récupérer le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        toast.error("Session expirée, veuillez vous reconnecter")
        return
      }

      const response = await fetch("/api/fiscal", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ action: "export-pdf", year: currentYear })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `declaration-fiscale-${currentYear}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Export PDF généré")
      } else {
        toast.error("Erreur lors de l'export PDF")
    }
  } catch (error) {
      console.error("Erreur export PDF:", error)
      toast.error("Erreur lors de l'export PDF")
    }
  }

  const handleGenerateForm = async (formType: "2044" | "2042-C-PRO") => {
    try {
      // Récupérer le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        toast.error("Session expirée, veuillez vous reconnecter")
        return
      }

      const response = await fetch("/api/fiscal/forms", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ formType, year: currentYear })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `formulaire-${formType}-${currentYear}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`Formulaire ${formType} généré`)
      } else {
        toast.error("Erreur lors de la génération du formulaire")
      }
    } catch (error) {
      console.error("Erreur génération formulaire:", error)
      toast.error("Erreur lors de la génération du formulaire")
    }
  }

  const handleAddExpense = () => {
    addExpenseDialogRef.current?.openDialog()
  }

  const handleViewExpense = (expenseId: string) => {
    toast.info(`Visualisation de la dépense ${expenseId} en cours de développement`)
  }

  const handleEditExpense = (expenseId: string) => {
    editExpenseDialogRef.current?.openDialog(expenseId)
  }

  const handleAddReceipt = (expenseId: string) => {
    addReceiptDialogRef.current?.openDialog(expenseId)
  }

  if (isLoading) {
  return (
      <div className="space-y-6">
          <div>
          <h1 className="text-3xl font-bold">Déclaration fiscale</h1>
          <p className="text-muted-foreground">Calculs fiscaux et génération de documents</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Chargement des données fiscales...</p>
          </div>
          </div>
        </div>
  )
}

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Déclaration fiscale</h1>
          <p className="text-muted-foreground">Calculs fiscaux et génération de documents</p>
        </div>
              <div className="flex items-center gap-4">
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sélectionner un logement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les logements</SelectItem>
                    {properties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title} - {property.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={currentYear.toString()} onValueChange={(value) => setCurrentYear(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
      </div>

      {/* Contenu principal */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Résumé fiscal</TabsTrigger>
          <TabsTrigger value="simulations">Simulations</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Résumé fiscal */}
        <TabsContent value="summary" className="space-y-6">
          {fiscalCalculation ? (
            <FiscalSummaryCard
              year={currentYear}
              totalRentCollected={fiscalCalculation.totalRentCollected}
              totalRecoverableCharges={fiscalCalculation.totalRecoverableCharges}
              totalDeductibleExpenses={fiscalCalculation.totalDeductibleExpenses}
              onGenerateDocuments={() => {}}
              onViewDetails={() => {}}
            />
          ) : (
              <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune donnée fiscale</h3>
                <p className="text-muted-foreground">
                  Aucune donnée fiscale trouvée pour l'année {currentYear}
                </p>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        {/* Simulations fiscales */}
        <TabsContent value="simulations" className="space-y-6">
          {fiscalCalculation ? (
            <FiscalSimulationCard
              calculation={fiscalCalculation}
              onGenerateForm={handleGenerateForm}
              onExportData={(format) => format === "csv" ? handleExportCSV() : handleExportPDF()}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune simulation disponible</h3>
                <p className="text-muted-foreground">
                  Les simulations fiscales nécessitent des données de revenus
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Dépenses */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Dépenses {currentYear}</h2>
              <p className="text-muted-foreground">Gérez vos dépenses déductibles et non déductibles</p>
            </div>
            <AddExpenseDialog 
              ref={addExpenseDialogRef} 
              properties={properties}
              propertyId={selectedPropertyId !== "all" ? selectedPropertyId : undefined}
              onExpenseAdded={loadFiscalData} 
            />
            <EditExpenseDialog 
              ref={editExpenseDialogRef} 
              properties={properties}
              onExpenseUpdated={loadFiscalData} 
            />
            <AddReceiptDialog 
              ref={addReceiptDialogRef} 
              onReceiptAdded={loadFiscalData} 
            />
          </div>
          <ExpenseBreakdownCard
            expenses={expenses}
            year={currentYear}
            onAddExpense={handleAddExpense}
            onViewExpense={handleViewExpense}
            onEditExpense={handleEditExpense}
            onAddReceipt={handleAddReceipt}
            addExpenseDialogRef={addExpenseDialogRef}
          />
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Export des données
                </CardTitle>
                <CardDescription>
                  Téléchargez vos données fiscales dans différents formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleExportCSV}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV - Données complètes
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleExportPDF}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF - Récapitulatif
                </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Formulaires fiscaux
                </CardTitle>
                <CardDescription>
                  Générez les formulaires préremplis pour votre déclaration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleGenerateForm("2044")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Formulaire 2044 - Revenus fonciers
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleGenerateForm("2042-C-PRO")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Formulaire 2042-C-PRO - BIC/LMNP
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Outils supplémentaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Outils de calcul
              </CardTitle>
              <CardDescription>
                Calculateurs et outils pour optimiser votre fiscalité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Calculator className="h-6 w-6 mb-2" />
                  Calculateur de régularisation
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Optimisation fiscale
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Receipt className="h-6 w-6 mb-2" />
                  Récapitulatif annuel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


export const dynamic = "force-dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"

import { createServerClient } from "@/lib/supabase-server"

async function getFiscalData() {
  try {
    const supabase = createServerClient()

    // Récupérer les régularisations de charges
    const { data: regularizations } = await supabase
      .from("charge_regularizations")
      .select(`
        *,
        lease:leases(
          property:properties(title, address),
          tenant:users!leases_tenant_id_fkey(first_name, last_name)
        )
      `)
      .order("year", { ascending: false })

    // Récupérer les revenus locatifs par année
    const { data: receipts } = await supabase
      .from("rent_receipts")
      .select(`
        year,
        total_amount,
        lease:leases(property:properties(title))
      `)
      .eq("status", "paid")

    // Calculer les statistiques fiscales
    const currentYear = new Date().getFullYear()
    const currentYearReceipts = receipts?.filter((r) => r.year === currentYear) || []
    const previousYearReceipts = receipts?.filter((r) => r.year === currentYear - 1) || []

    const stats = {
      currentYearRevenue: currentYearReceipts.reduce((sum, r) => sum + r.total_amount, 0),
      previousYearRevenue: previousYearReceipts.reduce((sum, r) => sum + r.total_amount, 0),
      totalRegularizations: regularizations?.length || 0,
      pendingRegularizations: regularizations?.filter((r) => r.status === "calculated").length || 0,
    }

    return {
      regularizations: regularizations || [],
      receipts: receipts || [],
      stats,
    }
  } catch (error) {
    console.error("Error fetching fiscal data:", error)
    return {
      regularizations: [],
      receipts: [],
      stats: {
        currentYearRevenue: 0,
        previousYearRevenue: 0,
        totalRegularizations: 0,
        pendingRegularizations: 0,
      },
    }
  }
}

function RegularizationCard({ regularization }: { regularization: any }) {
  const isRefund = regularization.type === "refund"
  const isAdditional = regularization.type === "additional"

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{regularization.lease?.property?.title}</CardTitle>
            <CardDescription>{regularization.lease?.property?.address}</CardDescription>
          </div>
          <Badge variant={regularization.status === "paid" ? "default" : "secondary"}>
            {regularization.status === "paid"
              ? "Réglée"
              : regularization.status === "calculated"
                ? "Calculée"
                : "En attente"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Locataire</p>
            <p className="font-medium">
              {regularization.lease?.tenant?.first_name} {regularization.lease?.tenant?.last_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Année</p>
            <p className="font-medium">{regularization.year}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Charges payées</p>
            <p className="text-lg font-bold">{regularization.total_charges_paid}€</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Charges réelles</p>
            <p className="text-lg font-bold">{regularization.actual_charges}€</p>
          </div>
          <div className="text-center">
            {isRefund ? (
              <TrendingDown className="h-5 w-5 mx-auto text-green-600 mb-1" />
            ) : (
              <TrendingUp className="h-5 w-5 mx-auto text-red-600 mb-1" />
            )}
            <p className="text-sm text-muted-foreground">{isRefund ? "Remboursement" : "Complément"}</p>
            <p className={`text-lg font-bold ${isRefund ? "text-green-600" : "text-red-600"}`}>
              {isRefund ? "-" : "+"}
              {Math.abs(regularization.difference).toFixed(2)}€
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Régularisation {regularization.year}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-1" />
              Décompte
            </Button>
            {regularization.status === "calculated" && (
              <Button size="sm">{isRefund ? "Rembourser" : "Facturer"}</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FiscalSummaryCard({ year, revenue }: { year: number; revenue: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Revenus {year}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">{revenue.toFixed(2)}€</p>
          <p className="text-sm text-muted-foreground">Revenus locatifs déclarés</p>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export fiscal
          </Button>
          <Button variant="outline" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            Déclaration
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function FiscalPage() {
  const { regularizations, receipts, stats } = await getFiscalData()
  const currentYear = new Date().getFullYear()

  // Grouper les revenus par année
  const revenueByYear = receipts.reduce(
    (acc, receipt) => {
      acc[receipt.year] = (acc[receipt.year] || 0) + receipt.total_amount
      return acc
    },
    {} as Record<number, number>,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion fiscale</h1>
        <p className="text-muted-foreground">Régularisations de charges et déclarations fiscales</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.currentYearRevenue.toFixed(0)}€</p>
                <p className="text-sm text-muted-foreground">Revenus {currentYear}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {stats.previousYearRevenue > 0
                    ? (
                        ((stats.currentYearRevenue - stats.previousYearRevenue) / stats.previousYearRevenue) *
                        100
                      ).toFixed(1)
                    : "0"}
                  %
                </p>
                <p className="text-sm text-muted-foreground">Évolution</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalRegularizations}</p>
                <p className="text-sm text-muted-foreground">Régularisations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingRegularizations}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="regularizations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="regularizations">Régularisations</TabsTrigger>
          <TabsTrigger value="revenue">Revenus fiscaux</TabsTrigger>
          <TabsTrigger value="declarations">Déclarations</TabsTrigger>
          <TabsTrigger value="tools">Outils</TabsTrigger>
        </TabsList>

        <TabsContent value="regularizations" className="space-y-4">
          <div className="grid gap-4">
            {regularizations.map((regularization) => (
              <RegularizationCard key={regularization.id} regularization={regularization} />
            ))}
            {regularizations.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune régularisation</h3>
                  <p className="text-muted-foreground">Les régularisations de charges apparaîtront ici</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(revenueByYear)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([year, revenue]) => (
                <FiscalSummaryCard key={year} year={Number(year)} revenue={revenue} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="declarations" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Déclaration des revenus fonciers</CardTitle>
                <CardDescription>Préparez votre déclaration fiscale avec les données de l'année</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">📊 Revenus bruts</h4>
                    <p className="text-2xl font-bold text-green-700">{stats.currentYearRevenue.toFixed(2)}€</p>
                    <p className="text-sm text-green-600">Année {currentYear}</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">📋 Documents</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export revenus {currentYear}
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Formulaire 2044
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculateur de régularisation
                </CardTitle>
                <CardDescription>Calculez automatiquement les régularisations de charges</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Lancer le calcul
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Générateur de documents
                </CardTitle>
                <CardDescription>Générez vos documents fiscaux automatiquement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Décompte de charges
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Attestation fiscale
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Récapitulatif annuel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

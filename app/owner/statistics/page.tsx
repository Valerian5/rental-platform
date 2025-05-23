"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownRight, BarChart3, LineChart, PieChart, Download, Calendar } from "lucide-react"

// Composant pour simuler un graphique en barres
function BarChartPlaceholder() {
  return (
    <div className="w-full h-64 bg-gray-50 rounded-lg flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="flex items-end justify-between h-40">
          <div className="w-8 bg-blue-500 rounded-t-md" style={{ height: "60%" }}></div>
          <div className="w-8 bg-blue-500 rounded-t-md" style={{ height: "80%" }}></div>
          <div className="w-8 bg-blue-500 rounded-t-md" style={{ height: "40%" }}></div>
          <div className="w-8 bg-blue-500 rounded-t-md" style={{ height: "70%" }}></div>
          <div className="w-8 bg-blue-500 rounded-t-md" style={{ height: "50%" }}></div>
          <div className="w-8 bg-blue-500 rounded-t-md" style={{ height: "90%" }}></div>
          <div className="w-8 bg-blue-500 rounded-t-md" style={{ height: "30%" }}></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Jan</span>
          <span>Fév</span>
          <span>Mar</span>
          <span>Avr</span>
          <span>Mai</span>
          <span>Juin</span>
          <span>Juil</span>
        </div>
      </div>
    </div>
  )
}

// Composant pour simuler un graphique en ligne
function LineChartPlaceholder() {
  return (
    <div className="w-full h-64 bg-gray-50 rounded-lg flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="relative h-40">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gray-200"></div>
          </div>
          <div className="absolute inset-0 flex items-center" style={{ top: "25%" }}>
            <div className="w-full h-px bg-gray-200"></div>
          </div>
          <div className="absolute inset-0 flex items-center" style={{ top: "50%" }}>
            <div className="w-full h-px bg-gray-200"></div>
          </div>
          <div className="absolute inset-0 flex items-center" style={{ top: "75%" }}>
            <div className="w-full h-px bg-gray-200"></div>
          </div>
          <svg className="absolute inset-0" viewBox="0 0 100 40">
            <path
              d="M0,20 L14,18 L28,25 L42,15 L56,20 L70,10 L84,5 L100,15"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Jan</span>
          <span>Fév</span>
          <span>Mar</span>
          <span>Avr</span>
          <span>Mai</span>
          <span>Juin</span>
          <span>Juil</span>
        </div>
      </div>
    </div>
  )
}

// Composant pour simuler un graphique en camembert
function PieChartPlaceholder() {
  return (
    <div className="w-full h-64 bg-gray-50 rounded-lg flex items-center justify-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 32 32" className="w-full h-full">
          <circle r="16" cx="16" cy="16" fill="#3b82f6" />
          <circle r="16" cx="16" cy="16" fill="transparent" stroke="#f97316" strokeWidth="32" strokeDasharray="25 75" />
          <circle
            r="16"
            cx="16"
            cy="16"
            fill="transparent"
            stroke="#84cc16"
            strokeWidth="32"
            strokeDasharray="15 85"
            strokeDashoffset="-25"
          />
        </svg>
      </div>
      <div className="ml-4">
        <div className="flex items-center mb-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm">Disponibles (60%)</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
          <span className="text-sm">Loués (25%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm">En pause (15%)</span>
        </div>
      </div>
    </div>
  )
}

export default function StatisticsPage() {
  const [period, setPeriod] = useState("month")

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Statistiques et rapports</h1>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mois en cours</SelectItem>
              <SelectItem value="quarter">Trimestre en cours</SelectItem>
              <SelectItem value="year">Année en cours</SelectItem>
              <SelectItem value="all">Toutes les données</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Personnaliser
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenus locatifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">5 450 €</div>
              <div className="ml-2 flex items-center text-green-500 text-sm">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +8%
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Par rapport à la période précédente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux d'occupation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">85%</div>
              <div className="ml-2 flex items-center text-green-500 text-sm">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +5%
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Par rapport à la période précédente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rendement moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">4.8%</div>
              <div className="ml-2 flex items-center text-red-500 text-sm">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                -0.2%
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Par rapport à la période précédente</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="properties">Biens immobiliers</TabsTrigger>
          <TabsTrigger value="tenants">Locataires</TabsTrigger>
          <TabsTrigger value="financial">Finances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Revenus mensuels</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Évolution des revenus locatifs</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChartPlaceholder />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Taux d'occupation</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Pourcentage de biens loués</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChartPlaceholder />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Répartition des biens</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Par statut</CardDescription>
              </CardHeader>
              <CardContent>
                <PieChartPlaceholder />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Activité récente</CardTitle>
                </div>
                <CardDescription>Derniers événements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2"></div>
                    <div>
                      <p className="text-sm font-medium">Nouveau bail signé</p>
                      <p className="text-xs text-muted-foreground">Appartement moderne au centre-ville</p>
                      <p className="text-xs text-muted-foreground">Il y a 2 jours</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-2"></div>
                    <div>
                      <p className="text-sm font-medium">Paiement reçu</p>
                      <p className="text-xs text-muted-foreground">Studio étudiant rénové - 750€</p>
                      <p className="text-xs text-muted-foreground">Il y a 3 jours</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 mr-2"></div>
                    <div>
                      <p className="text-sm font-medium">Visite programmée</p>
                      <p className="text-xs text-muted-foreground">Loft industriel spacieux</p>
                      <p className="text-xs text-muted-foreground">Il y a 5 jours</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-2"></div>
                    <div>
                      <p className="text-sm font-medium">Fin de bail</p>
                      <p className="text-xs text-muted-foreground">Maison familiale avec jardin</p>
                      <p className="text-xs text-muted-foreground">Il y a 1 semaine</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Performance des biens</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Revenus par bien immobilier</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChartPlaceholder />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Taux de vacance</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Périodes sans locataire</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChartPlaceholder />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Types de biens</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Répartition par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                <PieChartPlaceholder />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Vues des annonces</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Intérêt pour vos biens</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChartPlaceholder />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Durée des baux</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Temps moyen d'occupation</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChartPlaceholder />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ponctualité des paiements</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Analyse des délais de paiement</CardDescription>
              </CardHeader>
              <CardContent>
                <PieChartPlaceholder />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Taux de renouvellement</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Renouvellements de bail</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChartPlaceholder />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Incidents signalés</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Problèmes et résolutions</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChartPlaceholder />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Revenus vs Dépenses</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Analyse comparative</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChartPlaceholder />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Rendement par bien</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Performance financière</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChartPlaceholder />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Évolution des loyers</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Tendance des prix</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChartPlaceholder />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Répartition des dépenses</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                <PieChartPlaceholder />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

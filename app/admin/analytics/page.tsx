"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Users, Home, FileText, TrendingUp, TrendingDown, Activity } from "lucide-react"
import {
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Données simulées pour les graphiques
const userGrowthData = [
  { month: "Jan", users: 120, active: 85 },
  { month: "Fév", users: 180, active: 125 },
  { month: "Mar", users: 240, active: 180 },
  { month: "Avr", users: 320, active: 240 },
  { month: "Mai", users: 450, active: 320 },
  { month: "Jun", users: 580, active: 420 },
]

const propertyData = [
  { area: "Paris Centre", properties: 45, avgRent: 1800 },
  { area: "Boulogne", properties: 32, avgRent: 1400 },
  { area: "Neuilly", properties: 28, avgRent: 2200 },
  { area: "Vincennes", properties: 25, avgRent: 1300 },
  { area: "Montreuil", properties: 22, avgRent: 1100 },
]

const applicationStatusData = [
  { name: "En attente", value: 45, color: "#fbbf24" },
  { name: "Acceptées", value: 32, color: "#10b981" },
  { name: "Refusées", value: 18, color: "#ef4444" },
  { name: "Annulées", value: 5, color: "#6b7280" },
]

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState({
    users: { total: 0, active: 0, new: 0, growth: 0 },
    properties: { total: 0, available: 0, avgRent: 0 },
    applications: { total: 0, accepted: 0, pending: 0, avgTime: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      // Charger les métriques depuis l'API
      const [usersRes, propertiesRes, applicationsRes] = await Promise.all([
        fetch("/api/analytics/users"),
        fetch("/api/analytics/properties"),
        fetch("/api/analytics/applications"),
      ])

      const users = await usersRes.json()
      const properties = await propertiesRes.json()
      const applications = await applicationsRes.json()

      setMetrics({ users, properties, applications })
    } catch (error) {
      console.error("Erreur chargement métriques:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("fr-FR").format(num)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <Badge variant="outline" className="text-sm">
          <Activity className="h-3 w-3 mr-1" />
          Temps réel
        </Badge>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.users.total)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.users.growth > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              )}
              {Math.abs(metrics.users.growth)}% ce mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propriétés actives</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.properties.available)}</div>
            <p className="text-xs text-muted-foreground">sur {formatNumber(metrics.properties.total)} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.applications.total)}</div>
            <p className="text-xs text-muted-foreground">{formatNumber(metrics.applications.pending)} en attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loyer moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.properties.avgRent)}</div>
            <p className="text-xs text-muted-foreground">par mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques détaillés */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="properties">Propriétés</TabsTrigger>
          <TabsTrigger value="applications">Candidatures</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Croissance des utilisateurs</CardTitle>
                <CardDescription>Évolution du nombre d'utilisateurs au fil du temps</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stackId="1"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="active"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs actifs</CardTitle>
                <CardDescription>Répartition des utilisateurs par activité</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Utilisateurs actifs</span>
                    <span className="font-semibold">{formatNumber(metrics.users.active)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(metrics.users.active / metrics.users.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Taux d'activité</span>
                    <span>{Math.round((metrics.users.active / metrics.users.total) * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Propriétés par zone</CardTitle>
              <CardDescription>Répartition géographique et loyers moyens</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={propertyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="properties" fill="#2563eb" name="Nombre de propriétés" />
                  <Line yAxisId="right" type="monotone" dataKey="avgRent" stroke="#ef4444" name="Loyer moyen (€)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Statut des candidatures</CardTitle>
                <CardDescription>Répartition par statut</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={applicationStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {applicationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Temps de traitement</CardTitle>
                <CardDescription>Métriques de performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Temps moyen</span>
                  <span className="font-semibold">{metrics.applications.avgTime} jours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Taux d'acceptation</span>
                  <span className="font-semibold">
                    {Math.round((metrics.applications.accepted / metrics.applications.total) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">En attente</span>
                  <span className="font-semibold">{formatNumber(metrics.applications.pending)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

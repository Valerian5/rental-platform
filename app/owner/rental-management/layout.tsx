"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Receipt, AlertTriangle, Wrench, Shield, TrendingUp, Calculator, Home, ArrowLeft } from "lucide-react"

const navigationItems = [
  {
    href: "/owner/rental-management",
    label: "Vue d'ensemble",
    icon: Home,
    description: "Tableau de bord général",
  },
  {
    href: "/owner/rental-management",
    label: "Paiements",
    icon: Receipt,
    description: "Gestion des paiements et quittances",
  },
  {
    href: "/owner/rental-management/incidents",
    label: "Incidents",
    icon: AlertTriangle,
    description: "Signalements et résolutions",
  },
  {
    href: "/owner/rental-management/maintenance",
    label: "Travaux",
    icon: Wrench,
    description: "Maintenance et réparations",
  },
  {
    href: "/owner/rental-management/documents",
    label: "Documents",
    icon: Shield,
    description: "Documents annuels obligatoires",
  },
  {
    href: "/owner/rental-management/rent-revision",
    label: "Révision loyer",
    icon: TrendingUp,
    description: "Calcul selon indice INSEE",
  },
  {
    href: "/owner/rental-management/revision",
    label: "Révision Charges",
    icon: Calculator,
    description: "Régularisation annuelle des charges",
  },
  {
    href: "/owner/rental-management/fiscal",
    label: "Bilan Fiscal",
    icon: Calculator,
    description: "Déclaration d'impôts",
  },
]

export default function RentalManagementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion Locative Complète</h1>
            <p className="text-gray-600">Espace numérique sécurisé pour la gestion post-signature des baux</p>
          </div>
          <Link href="/owner/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </Link>
        </div>

        {/* Badges des fonctionnalités */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="secondary">📄 Quittances automatiques</Badge>
          <Badge variant="secondary">🔧 Gestion incidents</Badge>
          <Badge variant="secondary">📈 Révision INSEE</Badge>
          <Badge variant="secondary">💰 Régularisation charges</Badge>
          <Badge variant="secondary">🛡️ Documents obligatoires</Badge>
          <Badge variant="secondary">📊 Bilan fiscal</Badge>
        </div>
      </div>

      {/* Navigation */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="w-full overflow-x-auto">
            <div className="flex gap-2 min-w-max md:grid md:grid-cols-4 lg:grid-cols-8 md:min-w-0">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                      className={`w-full h-auto p-3 flex flex-col items-center space-y-1 min-w-[140px] ${
                      isActive ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium text-center">{item.label}</span>
                  </Button>
                </Link>
              )
            })}
            </div>
          </div>
        </CardContent>
      </Card>

      {children}
    </div>
  )
}

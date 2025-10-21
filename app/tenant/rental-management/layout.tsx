"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import {
  Home,
  Euro,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  MessageSquare,
  Bell,
  TrendingUp,
  Receipt,
  Plus,
  Eye,
} from "lucide-react"

interface Lease {
  id: string
  property: {
    id: string
    title: string
    address: string
    city: string
  }
  owner: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  start_date: string
  end_date: string
  monthly_rent: number
  charges: number
  deposit: number
  status: string
}

export default function TenantRentalManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeLease, setActiveLease] = useState<Lease | null>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  const [rentReceipts, setRentReceipts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "tenant") {
          toast.error("Accès non autorisé")
          window.location.href = "/login"
          return
        }

        setCurrentUser(user)

        // Récupérer le bail actif
        try {
          const { LeaseServiceClient } = await import("@/lib/lease-service-client")
          const activeLease = await LeaseServiceClient.getActiveTenantLease(user.id)
          if (activeLease) {
            setActiveLease(activeLease)
          }
        } catch (error) {
          console.error("❌ Erreur récupération bail actif:", error)
        }

        // Récupérer les incidents
        try {
          const incidentsResponse = await fetch(`/api/incidents/tenant?tenantId=${user.id}`, { cache: 'no-store' })
          const incidentsData = await incidentsResponse.json()
          if (incidentsData.success) {
            setIncidents(incidentsData.incidents || [])
          }
        } catch (error) {
          console.error("❌ Erreur récupération incidents:", error)
        }

        // Récupérer les quittances
        try {
          const { ReceiptServiceClient } = await import("@/lib/receipt-service-client")
          if (activeLease) {
            const receipts = await ReceiptServiceClient.getLeaseReceipts(activeLease.id)
            setRentReceipts(receipts)
          }
        } catch (error) {
          console.error("❌ Erreur récupération quittances:", error)
        }
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Erreur lors du chargement")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de votre espace locataire...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!activeLease) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-12">
            <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun bail actif</h3>
            <p className="text-muted-foreground mb-4">Vous n'avez actuellement aucun bail de location actif.</p>
            <Button asChild>
              <Link href="/tenant/search">Rechercher un logement</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculs pour les métriques
  const overdueReceipts = rentReceipts.filter((r) => r.status === "overdue")
  const openIncidents = incidents.filter((i) => i.status !== "resolved" && i.status !== "closed")

  // Déterminer l'onglet actif basé sur l'URL
  const getActiveTab = () => {
    if (pathname.includes("/incidents")) return "incidents"
    if (pathname.includes("/payments")) return "payments"
    if (pathname.includes("/receipts")) return "receipts"
    if (pathname.includes("/maintenance")) return "maintenance"
    if (pathname.includes("/documents")) return "documents"
    return "overview"
  }

  const activeTab = getActiveTab()

  // Générer le fil d'arianne
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: "Mon espace locataire", href: "/tenant/rental-management" }
    ]

    if (pathname.includes("/incidents")) {
      breadcrumbs.push({ label: "Incidents", href: "/tenant/rental-management/incidents" })
      if (pathname.includes("/incidents/") && pathname !== "/tenant/rental-management/incidents") {
        breadcrumbs.push({ label: "Détail incident", href: pathname })
      }
    } else if (pathname.includes("/payments")) {
      breadcrumbs.push({ label: "Paiements", href: "/tenant/rental-management/payments" })
    } else if (pathname.includes("/receipts")) {
      breadcrumbs.push({ label: "Quittances", href: "/tenant/rental-management/receipts" })
    } else if (pathname.includes("/maintenance")) {
      breadcrumbs.push({ label: "Travaux", href: "/tenant/rental-management/maintenance" })
    } else if (pathname.includes("/documents")) {
      breadcrumbs.push({ label: "Documents", href: "/tenant/rental-management/documents" })
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="container mx-auto py-6">
      {/* Fil d'arianne */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mon espace locataire</h1>
        <p className="text-muted-foreground">Gérez votre location - {activeLease.property.title}</p>
      </div>

      {/* Navigation par onglets */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Link href="/tenant/rental-management">
            <Button variant={activeTab === "overview" ? "default" : "outline"}>
              Vue d'ensemble
            </Button>
          </Link>
          <Link href="/tenant/rental-management/payments">
            <Button variant={activeTab === "payments" ? "default" : "outline"} className="relative">
              Paiements
              {overdueReceipts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {overdueReceipts.length}
                </Badge>
              )}
            </Button>
          </Link>
          <Link href="/tenant/rental-management/receipts">
            <Button variant={activeTab === "receipts" ? "default" : "outline"}>
              Quittances
            </Button>
          </Link>
          <Link href="/tenant/rental-management/incidents">
            <Button variant={activeTab === "incidents" ? "default" : "outline"} className="relative">
              Incidents
              {openIncidents.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {openIncidents.length}
                </Badge>
              )}
            </Button>
          </Link>
          <Link href="/tenant/rental-management/maintenance">
            <Button variant={activeTab === "maintenance" ? "default" : "outline"}>
              Travaux
            </Button>
          </Link>
          <Link href="/tenant/rental-management/documents">
            <Button variant={activeTab === "documents" ? "default" : "outline"}>
              Documents
            </Button>
          </Link>
        </div>
      </div>

      {/* Contenu de la page */}
      {children}
    </div>
  )
}

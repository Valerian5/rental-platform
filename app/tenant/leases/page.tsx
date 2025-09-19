"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FileText, Calendar, Clock, CheckCircle, AlertTriangle, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import { Lease as LeaseType, LEASE_STATUS_CONFIG, leaseStatusUtils } from "@/lib/lease-types"

interface Lease {
  id: string
  property: {
    title: string
    address: string
    city: string
  }
  owner: {
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
  generated_document: string
  document_generated_at: string
  sent_to_tenant_at: string
  signed_by_tenant: boolean
  signed_by_owner: boolean
  tenant_signature_date: string
  owner_signature_date: string
}

export default function TenantLeasesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [leases, setLeases] = useState<Lease[]>([])
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

        // Récupérer les baux du locataire
        const response = await fetch(`/api/leases/tenant/${user.id}`)
        const data = await response.json()

        if (data.success) {
          setLeases(data.leases || [])
        } else {
          console.error("Erreur récupération baux:", data.error)
          setLeases([])
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

  const getStatusBadge = (lease: Lease) => {
    const config = LEASE_STATUS_CONFIG[lease.status as keyof typeof LEASE_STATUS_CONFIG]
    
    if (!config) {
      return <Badge variant="outline">{lease.status}</Badge>
    }

    // Vérifier si le bail est entièrement signé
    if (lease.signed_by_tenant && lease.signed_by_owner) {
      return <Badge className="bg-green-600">Signé</Badge>
    }

    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getStatusIcon = (lease: Lease) => {
    if (lease.signed_by_tenant && lease.signed_by_owner) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    }
    if (lease.status === "sent_to_tenant") {
      return <AlertTriangle className="h-5 w-5 text-blue-600" />
    }
    return <Clock className="h-5 w-5 text-gray-400" />
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement de vos baux...</p>
          </div>
        </div>
      </div>
    )
  }

  const activeLease = leases.find(
    (lease) => lease.status === "active" || (lease.signed_by_tenant && lease.signed_by_owner),
  )
  const pendingLeases = leases.filter(
    (lease) =>
      lease.status === "sent_to_tenant" &&
      !lease.signed_by_tenant
  )
  const draftLeases = leases.filter((lease) => lease.status === "draft")
  const historicalLeases = leases.filter((lease) => lease.status === "terminated" || lease.status === "expired")

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mes baux de location</h1>
        <p className="text-muted-foreground">Gérez vos contrats de location et documents associés</p>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Bail actuel</TabsTrigger>
          <TabsTrigger value="pending">
            À signer
            {pendingLeases.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingLeases.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {activeLease ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(activeLease)}
                    <div>
                      <CardTitle>{activeLease.property.title}</CardTitle>
                      <CardDescription>{activeLease.property.address}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(activeLease)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Loyer mensuel</p>
                    <p className="text-lg font-semibold">{activeLease.monthly_rent}€</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Charges</p>
                    <p className="text-lg font-semibold">{activeLease.charges}€</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total mensuel</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {activeLease.monthly_rent + activeLease.charges}€
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Période</p>
                    <p className="font-medium">
                      Du {new Date(activeLease.start_date).toLocaleDateString("fr-FR")} au{" "}
                      {new Date(activeLease.end_date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Propriétaire</p>
                    <p className="font-medium">
                      {activeLease.owner.first_name} {activeLease.owner.last_name}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button asChild>
                    <Link href={`/tenant/leases/${activeLease.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Consulter le bail
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/tenant/rental-management`}>
                      <FileText className="h-4 w-4 mr-2" />
                      Espace locataire
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucun bail actuel</h3>
                <p className="text-muted-foreground mb-4">Vous n'avez actuellement aucun bail de location actif.</p>
                <Button asChild>
                  <Link href="/tenant/search">Rechercher un logement</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          {pendingLeases.length > 0 ? (
            <div className="space-y-4">
              {pendingLeases.map((lease) => (
                <Card key={lease.id} className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-blue-600" />
                        <div>
                          <CardTitle className="text-blue-800">{lease.property.title}</CardTitle>
                          <CardDescription>{lease.property.address}</CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-blue-600">À signer</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-blue-700 mb-2">
                        <strong>Action requise :</strong> Ce bail est prêt à être signé
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Envoyé le {new Date(lease.sent_to_tenant_at).toLocaleDateString("fr-FR")} à{" "}
                        {new Date(lease.sent_to_tenant_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Loyer mensuel</p>
                        <p className="font-semibold">{lease.monthly_rent}€</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Charges</p>
                        <p className="font-semibold">{lease.charges}€</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dépôt de garantie</p>
                        <p className="font-semibold">{lease.deposit}€</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button asChild>
                        <Link href={`/tenant/leases/${lease.id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          Consulter et signer
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/tenant/messaging?property=${lease.property.title}`}>
                          Contacter le propriétaire
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold mb-2">Aucun bail en attente</h3>
                <p className="text-muted-foreground">Tous vos baux sont à jour.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {historicalLeases.length > 0 ? (
            <div className="space-y-4">
              {historicalLeases.map((lease) => (
                <Card key={lease.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{lease.property.title}</CardTitle>
                        <CardDescription>{lease.property.address}</CardDescription>
                      </div>
                      {getStatusBadge(lease)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Période</p>
                        <p className="font-medium">
                          Du {new Date(lease.start_date).toLocaleDateString("fr-FR")} au{" "}
                          {new Date(lease.end_date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Loyer mensuel</p>
                        <p className="font-medium">{lease.monthly_rent}€</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/tenant/leases/${lease.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Consulter
                        </Link>
                      </Button>
                      {lease.generated_document && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucun historique</h3>
                <p className="text-muted-foreground">Vous n'avez pas encore d'anciens baux.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

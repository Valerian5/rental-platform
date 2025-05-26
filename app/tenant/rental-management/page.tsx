"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Home,
  AlertTriangle,
  CreditCard,
  Shield,
  Download,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Données simulées - à remplacer par des appels API
const currentLease = {
  id: "1",
  property: {
    title: "Appartement 3 pièces",
    address: "123 Rue de la Paix, 75001 Paris",
    surface: 65,
    rooms: 3,
    bedrooms: 2,
  },
  owner: {
    name: "Marie Dupont",
    email: "marie.dupont@email.com",
    phone: "06 12 34 56 78",
  },
  startDate: "2023-01-01",
  endDate: "2024-12-31",
  monthlyRent: 1200,
  charges: 150,
  deposit: 2400,
  status: "active",
  leaseDocumentUrl: "/documents/bail-123.pdf",
}

const rentReceipts = [
  {
    id: "1",
    month: "décembre",
    year: 2023,
    rentAmount: 1200,
    chargesAmount: 150,
    totalAmount: 1350,
    status: "paid",
    paymentDate: "2023-12-05",
    receiptUrl: "/receipts/dec-2023.pdf",
  },
  {
    id: "2",
    month: "novembre",
    year: 2023,
    rentAmount: 1200,
    chargesAmount: 150,
    totalAmount: 1350,
    status: "paid",
    paymentDate: "2023-11-03",
    receiptUrl: "/receipts/nov-2023.pdf",
  },
  {
    id: "3",
    month: "janvier",
    year: 2024,
    rentAmount: 1200,
    chargesAmount: 150,
    totalAmount: 1350,
    status: "pending",
    paymentDate: null,
    receiptUrl: null,
  },
]

const myIncidents = [
  {
    id: "1",
    title: "Fuite d'eau dans la salle de bain",
    description: "Fuite au niveau du robinet de la douche",
    category: "plumbing",
    priority: "high",
    status: "in_progress",
    reportedDate: "2023-12-15",
    photos: ["/photos/fuite1.jpg"],
  },
  {
    id: "2",
    title: "Problème de chauffage",
    description: "Le radiateur de la chambre ne chauffe plus",
    category: "heating",
    priority: "medium",
    status: "resolved",
    reportedDate: "2023-11-20",
    resolvedDate: "2023-11-25",
    resolutionNotes: "Radiateur réparé par le plombier",
  },
]

const maintenanceWorks = [
  {
    id: "1",
    title: "Révision annuelle chaudière",
    description: "Entretien obligatoire de la chaudière gaz",
    type: "preventive",
    scheduledDate: "2024-01-15",
    status: "scheduled",
    providerName: "Chauffage Pro",
  },
  {
    id: "2",
    title: "Réparation fuite salle de bain",
    description: "Intervention suite au signalement d'incident",
    type: "corrective",
    scheduledDate: "2023-12-18",
    completedDate: "2023-12-18",
    status: "completed",
    providerName: "Plomberie Express",
    cost: 120,
  },
]

const annualDocuments = [
  {
    id: "1",
    documentType: "insurance",
    documentName: "Attestation assurance habitation 2024",
    expiryDate: "2024-12-31",
    status: "valid",
    documentUrl: "/documents/assurance-2024.pdf",
  },
  {
    id: "2",
    documentType: "boiler_maintenance",
    documentName: "Certificat entretien chaudière 2023",
    expiryDate: "2024-01-15",
    status: "expiring",
    documentUrl: "/documents/chaudiere-2023.pdf",
  },
]

export default function TenantRentalManagementPage() {
  const [activeTab, setActiveTab] = useState("overview")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-600">Payé</Badge>
      case "pending":
        return <Badge variant="secondary">En attente</Badge>
      case "overdue":
        return <Badge variant="destructive">En retard</Badge>
      case "active":
        return <Badge className="bg-blue-600">Actif</Badge>
      case "resolved":
        return <Badge className="bg-green-600">Résolu</Badge>
      case "in_progress":
        return <Badge className="bg-orange-600">En cours</Badge>
      case "reported":
        return <Badge variant="secondary">Signalé</Badge>
      case "scheduled":
        return <Badge className="bg-blue-600">Programmé</Badge>
      case "completed":
        return <Badge className="bg-green-600">Terminé</Badge>
      case "valid":
        return <Badge className="bg-green-600">Valide</Badge>
      case "expiring":
        return <Badge className="bg-orange-600">Expire bientôt</Badge>
      case "expired":
        return <Badge variant="destructive">Expiré</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "high":
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const expiringDocuments = annualDocuments.filter((doc) => doc.status === "expiring" || doc.status === "expired")

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mon espace locataire</h1>
        <p className="text-muted-foreground">Gérez votre location en toute simplicité</p>
      </div>

      {/* Alertes importantes */}
      {expiringDocuments.length > 0 && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Documents à renouveler :</strong> {expiringDocuments.length} document(s) expire(nt) bientôt.
            <Button variant="link" className="p-0 ml-2 text-orange-800" onClick={() => setActiveTab("documents")}>
              Voir les détails
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="lease">Mon bail</TabsTrigger>
          <TabsTrigger value="receipts">Quittances</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="maintenance">Travaux</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Informations du bail */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Mon logement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">{currentLease.property.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{currentLease.property.address}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Surface:</span>
                    <span className="ml-1 font-medium">{currentLease.property.surface} m²</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pièces:</span>
                    <span className="ml-1 font-medium">{currentLease.property.rooms}</span>
                  </div>
                </div>
                <div className="mt-3">{getStatusBadge(currentLease.status)}</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("lease")}>
                  Voir le bail
                </Button>
              </CardFooter>
            </Card>

            {/* Loyer du mois */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Loyer du mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Loyer:</span>
                    <span className="font-medium">{currentLease.monthlyRent} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Charges:</span>
                    <span className="font-medium">{currentLease.charges} €</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{currentLease.monthlyRent + currentLease.charges} €</span>
                  </div>
                </div>
                <div className="mt-3">{getStatusBadge(rentReceipts[0]?.status || "pending")}</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("receipts")}>
                  Voir les quittances
                </Button>
              </CardFooter>
            </Card>

            {/* Contact propriétaire */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Mon propriétaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">{currentLease.owner.name}</h3>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{currentLease.owner.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{currentLease.owner.phone}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/messaging">Envoyer un message</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Incidents récents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Incidents récents
                </span>
                <Badge>{myIncidents.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myIncidents.length > 0 ? (
                <div className="space-y-3">
                  {myIncidents.slice(0, 3).map((incident) => (
                    <div key={incident.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getPriorityIcon(incident.priority)}
                      <div className="flex-1">
                        <h4 className="font-medium">{incident.title}</h4>
                        <p className="text-sm text-muted-foreground">{incident.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(incident.reportedDate).toLocaleDateString("fr-FR")}
                          </span>
                          {getStatusBadge(incident.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-muted-foreground">Aucun incident signalé</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex gap-2 w-full">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setActiveTab("incidents")}>
                  Voir tous les incidents
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link href="/tenant/incidents/new">Signaler un incident</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="lease" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du bail</CardTitle>
              <CardDescription>Détails de votre contrat de location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Logement</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Adresse:</span>
                      <p className="font-medium">{currentLease.property.address}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">Surface:</span>
                        <p className="font-medium">{currentLease.property.surface} m²</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pièces:</span>
                        <p className="font-medium">{currentLease.property.rooms}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Propriétaire</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Nom:</span>
                      <p className="font-medium">{currentLease.owner.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{currentLease.owner.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Téléphone:</span>
                      <p className="font-medium">{currentLease.owner.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Durée du bail</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Début:</span>
                      <p className="font-medium">{new Date(currentLease.startDate).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fin:</span>
                      <p className="font-medium">{new Date(currentLease.endDate).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Statut:</span>
                      <div className="mt-1">{getStatusBadge(currentLease.status)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Conditions financières</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loyer mensuel:</span>
                      <span className="font-medium">{currentLease.monthlyRent} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Charges:</span>
                      <span className="font-medium">{currentLease.charges} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dépôt de garantie:</span>
                      <span className="font-medium">{currentLease.deposit} €</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-semibold">
                      <span>Total mensuel:</span>
                      <span>{currentLease.monthlyRent + currentLease.charges} €</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <a href={currentLease.leaseDocumentUrl} download>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le bail
                </a>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Mes quittances de loyer</h2>
            <Button variant="outline" size="sm">
              Télécharger toutes les quittances
            </Button>
          </div>

          <div className="grid gap-4">
            {rentReceipts.map((receipt) => (
              <Card key={receipt.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold capitalize">
                        Quittance {receipt.month} {receipt.year}
                      </h3>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Loyer:</span>
                          <span className="ml-1 font-medium">{receipt.rentAmount} €</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Charges:</span>
                          <span className="ml-1 font-medium">{receipt.chargesAmount} €</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <span className="ml-1 font-medium">{receipt.totalAmount} €</span>
                        </div>
                      </div>
                      {receipt.paymentDate && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Payé le {new Date(receipt.paymentDate).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(receipt.status)}
                      {receipt.receiptUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={receipt.receiptUrl} download>
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Mes incidents signalés</h2>
            <Button asChild>
              <Link href="/tenant/incidents/new">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Signaler un incident
              </Link>
            </Button>
          </div>

          <div className="grid gap-4">
            {myIncidents.map((incident) => (
              <Card key={incident.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {getPriorityIcon(incident.priority)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{incident.title}</h3>
                        {getStatusBadge(incident.status)}
                      </div>
                      <p className="text-muted-foreground mb-3">{incident.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Signalé le:</span>
                          <span className="ml-1 font-medium">
                            {new Date(incident.reportedDate).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Catégorie:</span>
                          <span className="ml-1 font-medium capitalize">{incident.category}</span>
                        </div>
                      </div>
                      {incident.resolvedDate && (
                        <div className="mt-2 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Résolu le {new Date(incident.resolvedDate).toLocaleDateString("fr-FR")}</strong>
                          </p>
                          {incident.resolutionNotes && (
                            <p className="text-sm text-green-700 mt-1">{incident.resolutionNotes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6 mt-6">
          <h2 className="text-2xl font-bold">Travaux et maintenance</h2>

          <div className="grid gap-4">
            {maintenanceWorks.map((work) => (
              <Card key={work.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{work.title}</h3>
                    {getStatusBadge(work.status)}
                  </div>
                  <p className="text-muted-foreground mb-3">{work.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-1 font-medium capitalize">{work.type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Programmé:</span>
                      <span className="ml-1 font-medium">
                        {new Date(work.scheduledDate).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    {work.providerName && (
                      <div>
                        <span className="text-muted-foreground">Prestataire:</span>
                        <span className="ml-1 font-medium">{work.providerName}</span>
                      </div>
                    )}
                    {work.cost && (
                      <div>
                        <span className="text-muted-foreground">Coût:</span>
                        <span className="ml-1 font-medium">{work.cost} €</span>
                      </div>
                    )}
                  </div>
                  {work.completedDate && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        Terminé le {new Date(work.completedDate).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6 mt-6">
          <h2 className="text-2xl font-bold">Documents obligatoires</h2>

          <div className="grid gap-4">
            {annualDocuments.map((document) => (
              <Card key={document.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{document.documentName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Expire le {new Date(document.expiryDate).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(document.status)}
                      <Button variant="outline" size="sm" asChild>
                        <a href={document.documentUrl} download>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </a>
                      </Button>
                    </div>
                  </div>
                  {document.status === "expiring" && (
                    <Alert className="mt-3 border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        Ce document expire bientôt. Pensez à le renouveler.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ajouter un document</CardTitle>
              <CardDescription>Téléchargez vos documents obligatoires</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/tenant/documents/upload">
                  <Shield className="h-4 w-4 mr-2" />
                  Ajouter un document
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

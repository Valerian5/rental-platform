"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { propertyService } from "@/lib/property-service"
import { toast } from "sonner"
import { User, FileText, CreditCard, MessageSquare, FileCheck, AlertTriangle } from "lucide-react"

export default function PropertyManagementPage() {
  const params = useParams()
  const propertyId = params.id as string
  const [property, setProperty] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await propertyService.getPropertyById(propertyId)

        // Enrichir avec des données de démo
        setProperty({
          ...data,
          status: "rented",
          tenant_name: "Valérian J.",
          tenant_full_name: "Valérian Joubert",
          tenant_email: "valerian.j@example.com",
          tenant_phone: "06 12 34 56 78",
          rental_start_date: "2024-06-10",
          rental_end_date: "2025-06-09",
          rent_amount: 550,
          deposit_amount: 1100,
          next_payment_date: "2024-07-10",
          payment_status: "paid",
          documents: [
            { id: 1, name: "Contrat de bail", status: "signed", date: "2024-06-05" },
            { id: 2, name: "État des lieux", status: "signed", date: "2024-06-10" },
            { id: 3, name: "Attestation d'assurance", status: "received", date: "2024-06-08" },
          ],
          payments: [
            { id: 1, date: "2024-06-10", amount: 550, status: "paid", type: "rent" },
            { id: 2, date: "2024-06-10", amount: 1100, status: "paid", type: "deposit" },
          ],
          issues: [{ id: 1, title: "Problème de chauffage", status: "resolved", date: "2024-06-15" }],
        })
      } catch (error) {
        console.error("Erreur lors du chargement du bien:", error)
        toast.error("Erreur lors du chargement du bien")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperty()
  }, [propertyId])

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>
  }

  if (!property) {
    return <div className="text-center py-8">Bien non trouvé</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{property.title}</h1>
          <p className="text-gray-600">
            {property.address}, {property.city}
          </p>
        </div>
        <Button variant="outline">Modifier</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Locataire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">{property.tenant_full_name}</p>
                <p className="text-sm text-gray-600">{property.tenant_email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Bail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">{property.rent_amount}€ / mois</p>
                <p className="text-sm text-gray-600">
                  Du {new Date(property.rental_start_date).toLocaleDateString()} au{" "}
                  {new Date(property.rental_end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Prochain paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">{property.rent_amount}€</p>
                <p className="text-sm text-gray-600">
                  Prévu le {new Date(property.next_payment_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="issues">Incidents</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileCheck className="h-5 w-5 mr-2" />
                  Documents récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {property.documents.map((doc: any) => (
                    <li key={doc.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-gray-500">{new Date(doc.date).toLocaleDateString()}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Voir
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Paiements récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {property.payments.map((payment: any) => (
                    <li key={payment.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{payment.type === "rent" ? "Loyer" : "Dépôt de garantie"}</p>
                        <p className="text-sm text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{payment.amount}€</p>
                        <p className="text-sm text-green-600">Payé</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Documents du bail</CardTitle>
                <Button size="sm">Ajouter un document</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {property.documents.map((doc: any) => (
                  <div key={doc.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-3 text-blue-600" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-gray-500">{new Date(doc.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Télécharger
                      </Button>
                      <Button variant="ghost" size="sm">
                        Voir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Historique des paiements</CardTitle>
                <Button size="sm">Enregistrer un paiement</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {property.payments.map((payment: any) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{payment.type === "rent" ? "Loyer" : "Dépôt de garantie"}</p>
                      <p className="text-sm text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{payment.amount}€</p>
                      <p className="text-sm text-green-600">Payé</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Incidents et problèmes</CardTitle>
                <Button size="sm">Signaler un incident</Button>
              </div>
            </CardHeader>
            <CardContent>
              {property.issues.length > 0 ? (
                <div className="space-y-4">
                  {property.issues.map((issue: any) => (
                    <div key={issue.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-3 text-amber-500" />
                        <div>
                          <p className="font-medium">{issue.title}</p>
                          <p className="text-sm text-gray-500">
                            Signalé le {new Date(issue.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Résolu</span>
                        <Button variant="ghost" size="sm" className="ml-2">
                          Détails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Aucun incident signalé</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Messages avec le locataire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Aucun message récent</p>
                <Button className="mt-4">Envoyer un message</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

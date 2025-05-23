"use client"

import { useState } from "react"
import {
  ArrowLeft,
  MapPin,
  BedDouble,
  Bath,
  SquareIcon as SquareFeet,
  Calendar,
  Heart,
  Share2,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"

// Exemple de données d'une propriété
const property = {
  id: 1,
  title: "Appartement moderne au centre-ville",
  description:
    "Magnifique appartement entièrement rénové situé en plein cœur de Paris. Cet espace lumineux offre une vue imprenable sur la ville et se trouve à proximité de tous les commerces, restaurants et transports en commun. L'appartement dispose d'une cuisine équipée moderne, d'un salon spacieux, de deux chambres confortables et d'une salle de bain avec douche à l'italienne.",
  address: "123 Rue Principale, 75001 Paris",
  surface: 65,
  rentAmount: 1200,
  charges: 150,
  propertyType: "Appartement",
  rentalType: "Non meublé",
  constructionYear: 2018,
  deposit: 2400,
  rooms: 3,
  bedrooms: 2,
  bathrooms: 1,
  exterior: ["Balcon"],
  equipment: ["Cuisine équipée", "Lave-vaisselle", "Fibre optique"],
  energyClass: "B",
  ges: "C",
  heating: "Individuel électrique",
  parking: true,
  status: "Disponible",
  availableFrom: "2023-06-01",
  minIncome: 3600,
  images: [
    "/placeholder.svg?height=400&width=600&text=Photo+principale",
    "/placeholder.svg?height=400&width=600&text=Salon",
    "/placeholder.svg?height=400&width=600&text=Cuisine",
    "/placeholder.svg?height=400&width=600&text=Chambre+1",
    "/placeholder.svg?height=400&width=600&text=Chambre+2",
    "/placeholder.svg?height=400&width=600&text=Salle+de+bain",
  ],
  owner: {
    name: "Jean Dupont",
    phone: "06 12 34 56 78",
    email: "jean.dupont@example.com",
  },
}

// Simulation des données utilisateur
const userProfile = {
  hasRentalFile: true,
  isComplete: true,
  monthlyIncome: 2800, // Revenus inférieurs au minimum requis
}

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)

  const canApplyDirectly =
    userProfile.hasRentalFile && userProfile.isComplete && userProfile.monthlyIncome >= property.minIncome
  const hasInsufficientIncome = userProfile.monthlyIncome < property.minIncome
  const isIncompleteFile = userProfile.hasRentalFile && !userProfile.isComplete

  const handleApply = () => {
    if (!userProfile.hasRentalFile) {
      // Rediriger vers la création du dossier
      window.location.href = "/tenant/profile/rental-file?return=/properties/1"
    } else {
      setShowApplicationDialog(true)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/properties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux résultats
          </Link>
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{property.title}</h1>
            <div className="flex items-center mt-1 text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              {property.address}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={property.status === "Disponible" ? "default" : "secondary"} className="text-sm">
              {property.status}
            </Badge>
            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Galerie d'images */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="md:col-span-2 aspect-video overflow-hidden rounded-lg">
          <img
            src={property.images[0] || "/placeholder.svg"}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {property.images.slice(1, 5).map((image, index) => (
            <div key={index} className="aspect-square overflow-hidden rounded-lg">
              <img src={image || "/placeholder.svg"} alt={`Vue ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informations principales */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="features">Caractéristiques</TabsTrigger>
              <TabsTrigger value="location">Emplacement</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">{property.description}</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Informations générales</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Type</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">{property.propertyType}</CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Location</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">{property.rentalType}</CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Pièces</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex items-center">
                      <BedDouble className="h-4 w-4 mr-2" />
                      {property.rooms}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Chambres</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex items-center">
                      <BedDouble className="h-4 w-4 mr-2" />
                      {property.bedrooms}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Salles de bain</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex items-center">
                      <Bath className="h-4 w-4 mr-2" />
                      {property.bathrooms}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Surface</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex items-center">
                      <SquareFeet className="h-4 w-4 mr-2" />
                      {property.surface} m²
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Année</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">{property.constructionYear}</CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Chauffage</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">{property.heating}</CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Disponibilité</h3>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Disponible à partir du {new Date(property.availableFrom).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features">
              <h2 className="text-2xl font-semibold mb-4">Caractéristiques</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Équipements</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2">
                    {property.equipment.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Extérieur</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2">
                    {property.exterior.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Parking</h3>
                  <div className="flex items-center">
                    {property.parking ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span>Parking disponible</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-600 mr-2" />
                        <span>Pas de parking</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Performance énergétique</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Classe énergétique</p>
                      <Badge variant="outline" className="text-lg font-bold">
                        {property.energyClass}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">GES</p>
                      <Badge variant="outline" className="text-lg font-bold">
                        {property.ges}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location">
              <h2 className="text-2xl font-semibold mb-4">Emplacement</h2>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center p-8">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Carte de l'emplacement</p>
                  <p className="font-medium mt-2">{property.address}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <h2 className="text-2xl font-semibold mb-4">Documents obligatoires</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Diagnostic de Performance Énergétique (DPE)</span>
                  <Button variant="outline" size="sm">
                    Télécharger
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Constat de Risque d'Exposition au Plomb (CREP)</span>
                  <Button variant="outline" size="sm">
                    Télécharger
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>État des Risques et Pollutions (ERP)</span>
                  <Button variant="outline" size="sm">
                    Télécharger
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Loyer hors charges</span>
                  <span className="text-2xl font-bold">{property.rentAmount} €</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Charges</span>
                  <span className="text-lg">+ {property.charges} €</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total mensuel</span>
                    <span className="text-2xl font-bold">{property.rentAmount + property.charges} €</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dépôt de garantie</span>
                  <span>{property.deposit} €</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Revenus minimum exigés</span>
                  <span>{property.minIncome} €/mois</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Contacter le propriétaire</h3>
                <div className="space-y-2">
                  <p className="font-medium">{property.owner.name}</p>
                  <p className="text-sm">{property.owner.phone}</p>
                  <p className="text-sm">{property.owner.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full" onClick={handleApply}>
                      Postuler pour ce logement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Postuler pour ce logement</DialogTitle>
                      <DialogDescription>{property.title}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {canApplyDirectly && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                            <span className="font-medium text-green-800">Votre dossier est complet !</span>
                          </div>
                          <p className="text-sm text-green-700 mt-1">
                            Votre dossier sera directement transmis au propriétaire.
                          </p>
                        </div>
                      )}

                      {hasInsufficientIncome && (
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                            <span className="font-medium text-orange-800">Revenus insuffisants</span>
                          </div>
                          <p className="text-sm text-orange-700 mt-1">
                            Vos revenus ({userProfile.monthlyIncome}€) sont inférieurs au minimum exigé (
                            {property.minIncome}€). Vous pouvez tout de même postuler.
                          </p>
                        </div>
                      )}

                      {isIncompleteFile && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
                            <span className="font-medium text-blue-800">Dossier incomplet</span>
                          </div>
                          <p className="text-sm text-blue-700 mt-1">
                            Votre dossier n'est pas complet. Vous pouvez compléter les informations manquantes ou
                            postuler en l'état.
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <Button className="w-full">Confirmer ma candidature</Button>
                        {(hasInsufficientIncome || isIncompleteFile) && (
                          <Button variant="outline" className="w-full" asChild>
                            <Link href="/tenant/profile/rental-file">Compléter mon dossier</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="w-full">
                  Contacter le propriétaire
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Biens similaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={`/placeholder.svg?height=80&width=80&text=Bien+${i}`}
                      alt={`Bien similaire ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Appartement {i + 1} pièces</h4>
                    <p className="text-xs text-muted-foreground">Paris</p>
                    <p className="text-sm font-bold mt-1">{900 + i * 200} €/mois</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

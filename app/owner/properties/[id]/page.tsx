"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Users, Plus, Zap, CheckIcon as Checkbox } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [visitSlots, setVisitSlots] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          toast.error("Vous devez être connecté en tant que propriétaire")
          router.push("/login")
          return
        }
        setCurrentUser(user)

        if (params.id) {
          const [propertyData, slotsData] = await Promise.all([
            propertyService.getPropertyById(params.id as string),
            propertyService.getPropertyVisitAvailabilities(params.id as string),
          ])

          // Vérifier que le bien appartient au propriétaire connecté
          if (propertyData.owner_id !== user.id) {
            toast.error("Vous n'avez pas accès à ce bien")
            router.push("/owner/dashboard")
            return
          }

          setProperty(propertyData)
          setVisitSlots(slotsData)
        }
      } catch (error) {
        console.error("Erreur lors du chargement du bien:", error)
        toast.error("Erreur lors du chargement du bien")
        router.push("/owner/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  const handleDelete = async () => {
    if (!property || !confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) {
      return
    }

    try {
      await propertyService.deleteProperty(property.id)
      toast.success("Bien supprimé avec succès")
      router.push("/owner/dashboard")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Erreur lors de la suppression du bien")
    }
  }

  const VisitManagement = ({ property, visitSlots, setVisitSlots }: any) => {
    const [isGenerating, setIsGenerating] = useState(false)
    const [newSlot, setNewSlot] = useState({
      date: "",
      start_time: "",
      end_time: "",
      max_capacity: 1,
      is_group_visit: false,
    })

    const handleGenerateSlots = async () => {
      setIsGenerating(true)
      try {
        await propertyService.generateDefaultVisitSlots(property.id, 14)
        const updatedSlots = await propertyService.getPropertyVisitAvailabilities(property.id)
        setVisitSlots(updatedSlots)
        toast.success(`${updatedSlots.length} créneaux générés automatiquement`)
      } catch (error) {
        console.error("Erreur lors de la génération des créneaux:", error)
        toast.error("Erreur lors de la génération des créneaux")
      } finally {
        setIsGenerating(false)
      }
    }

    const handleAddSlot = async () => {
      if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) {
        toast.error("Veuillez remplir tous les champs")
        return
      }

      try {
        await propertyService.addVisitAvailability(
          property.id,
          newSlot.date,
          newSlot.start_time,
          newSlot.end_time,
          newSlot.max_capacity,
          newSlot.is_group_visit,
        )

        const updatedSlots = await propertyService.getPropertyVisitAvailabilities(property.id)
        setVisitSlots(updatedSlots)

        setNewSlot({
          date: "",
          start_time: "",
          end_time: "",
          max_capacity: 1,
          is_group_visit: false,
        })

        toast.success("Créneau ajouté avec succès")
      } catch (error) {
        console.error("Erreur lors de l'ajout du créneau:", error)
        toast.error("Erreur lors de l'ajout du créneau")
      }
    }

    const handleDeleteSlot = async (slotId: string) => {
      try {
        await propertyService.deleteVisitAvailability(slotId)
        setVisitSlots((prev: any[]) => prev.filter((slot) => slot.id !== slotId))
        toast.success("Créneau supprimé")
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
        toast.error("Erreur lors de la suppression")
      }
    }

    const groupSlotsByDate = (slots: any[]) => {
      return slots.reduce(
        (groups, slot) => {
          const date = slot.date
          if (!groups[date]) {
            groups[date] = []
          }
          groups[date].push(slot)
          return groups
        },
        {} as Record<string, any[]>,
      )
    }

    const getStatusBadge = (slot: any) => {
      if (slot.current_bookings === 0) return <Badge variant="default">Disponible</Badge>
      if (slot.current_bookings < slot.max_capacity) return <Badge variant="secondary">Partiellement réservé</Badge>
      return <Badge variant="destructive">Complet</Badge>
    }

    const groupedSlots = groupSlotsByDate(visitSlots)

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gestion des visites</h2>
            <p className="text-gray-600">{visitSlots.length} créneaux configurés</p>
          </div>
          <Button onClick={handleGenerateSlots} disabled={isGenerating}>
            <Zap className="h-4 w-4 mr-2" />
            {isGenerating ? "Génération..." : "Générer des créneaux"}
          </Button>
        </div>

        {/* Formulaire d'ajout rapide */}
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un créneau</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newSlot.date}
                  onChange={(e) => setNewSlot((prev) => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label>Début</Label>
                <Input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot((prev) => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div>
                <Label>Fin</Label>
                <Input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot((prev) => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
              <div>
                <Label>Capacité</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={newSlot.max_capacity}
                  onChange={(e) => setNewSlot((prev) => ({ ...prev, max_capacity: Number.parseInt(e.target.value) }))}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddSlot} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="is_group_visit"
                checked={newSlot.is_group_visit}
                onCheckedChange={(checked) => setNewSlot((prev) => ({ ...prev, is_group_visit: checked as boolean }))}
              />
              <Label htmlFor="is_group_visit">Visite groupée</Label>
            </div>
          </CardContent>
        </Card>

        {/* Liste des créneaux */}
        {Object.keys(groupedSlots).length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Aucun créneau de visite</h3>
              <p className="text-gray-600 mb-4">
                Commencez par générer des créneaux automatiquement ou ajoutez-en manuellement
              </p>
              <Button onClick={handleGenerateSlots} disabled={isGenerating}>
                <Zap className="h-4 w-4 mr-2" />
                Générer automatiquement
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSlots)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, slots]) => (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        {new Date(date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <Badge variant="outline">{slots.length} créneaux</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {slots
                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                        .map((slot) => (
                          <div key={slot.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">
                                  {slot.start_time} - {slot.end_time}
                                </span>
                              </div>
                              {getStatusBadge(slot)}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span>
                                  {slot.current_bookings || 0}/{slot.max_capacity}
                                  {slot.is_group_visit && " (Groupe)"}
                                </span>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Êtes-vous sûr de vouloir supprimer ce créneau ?")) {
                                    handleDeleteSlot(slot.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Bien non trouvé</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Link href="/owner/dashboard" className="text-blue-600 hover:underline flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Retour au tableau de bord
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{property.title}</h1>
          <p className="text-gray-600">
            {property.address}, {property.city}
          </p>
        </div>
        <Badge variant={property.available ? "default" : "secondary"}>
          {property.available ? "Disponible" : "Loué"}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="visits">Gestion des visites</TabsTrigger>
          <TabsTrigger value="applications">Candidatures</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Contenu existant de la page */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informations principales */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{property.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Caractéristiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Surface</p>
                      <p className="font-medium">{property.surface} m²</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pièces</p>
                      <p className="font-medium">{property.rooms}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Chambres</p>
                      <p className="font-medium">{property.bedrooms || "Non spécifié"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Salles de bain</p>
                      <p className="font-medium">{property.bathrooms || "Non spécifié"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">
                        {property.property_type === "apartment" && "Appartement"}
                        {property.property_type === "house" && "Maison"}
                        {property.property_type === "studio" && "Studio"}
                        {property.property_type === "loft" && "Loft"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Meublé</p>
                      <p className="font-medium">{property.furnished ? "Oui" : "Non"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Code postal</p>
                      <p className="font-medium">{property.postal_code || "Non spécifié"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Photos du bien */}
              <Card>
                <CardHeader>
                  <CardTitle>Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  {property.property_images && property.property_images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {property.property_images.map((image: any, index: number) => (
                        <div key={image.id} className="aspect-video rounded-lg overflow-hidden">
                          <img
                            src={image.url || `/placeholder.svg?height=200&width=300&text=Photo ${index + 1}`}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Aucune photo ajoutée</p>
                      <Button variant="outline" className="mt-2">
                        Ajouter des photos
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Prix</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{property.price} €</p>
                    <p className="text-gray-500">par mois</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" asChild>
                    <Link href={`/properties/${property.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir l'annonce publique
                    </Link>
                  </Button>

                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/owner/properties/${property.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Link>
                  </Button>

                  <Button variant="destructive" className="w-full" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Visites</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Créneaux disponibles</span>
                      <span className="text-sm font-medium">{visitSlots.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Réservations</span>
                      <span className="text-sm font-medium">
                        {visitSlots.reduce((sum, slot) => sum + (slot.current_bookings || 0), 0)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => document.querySelector('[value="visits"]')?.click()}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Gérer les visites
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Créé le</span>
                      <span className="text-sm">{new Date(property.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Modifié le</span>
                      <span className="text-sm">{new Date(property.updated_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="visits">
          {/* Interface de gestion des visites intégrée */}
          <VisitManagement property={property} visitSlots={visitSlots} setVisitSlots={setVisitSlots} />
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Candidatures reçues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Fonctionnalité en cours de développement</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents du bien</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Fonctionnalité en cours de développement</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

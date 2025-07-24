"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { Search, Eye, Edit, Trash2, MapPin, Home, Euro } from "lucide-react"

interface Property {
  id: string
  title: string
  description: string
  address: string
  city: string
  postal_code: string
  price: number
  surface_area: number
  rooms: number
  bedrooms: number
  bathrooms: number
  property_type: string
  status: string
  created_at: string
  owner: {
    first_name: string
    last_name: string
    email: string
  }
}

interface Agency {
  id: string
  name: string
}

export default function AgencyPropertiesPage() {
  const params = useParams()
  const router = useRouter()
  const agencyId = params.id as string

  const [agency, setAgency] = useState<Agency | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchAgencyData()
    fetchProperties()
  }, [agencyId])

  useEffect(() => {
    filterProperties()
  }, [properties, searchTerm, statusFilter])

  const fetchAgencyData = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/agencies/${agencyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch agency")
      }

      const data = await response.json()
      setAgency(data.agency)
    } catch (error) {
      console.error("Error fetching agency:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations de l'agence",
        variant: "destructive",
      })
    }
  }

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/agencies/${agencyId}/properties`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch properties")
      }

      const data = await response.json()
      setProperties(data.properties || [])
    } catch (error) {
      console.error("Error fetching properties:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les propriétés",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterProperties = () => {
    let filtered = properties

    if (searchTerm) {
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.owner.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.owner.last_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((property) => property.status === statusFilter)
    }

    setFilteredProperties(filtered)
  }

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete property")
      }

      toast({
        title: "Succès",
        description: "Propriété supprimée avec succès",
      })

      fetchProperties()
    } catch (error) {
      console.error("Error deleting property:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la propriété",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: "Disponible", variant: "default" as const },
      rented: { label: "Loué", variant: "secondary" as const },
      maintenance: { label: "Maintenance", variant: "destructive" as const },
      draft: { label: "Brouillon", variant: "outline" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "outline" as const,
    }

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPropertyTypeLabel = (type: string) => {
    const types = {
      apartment: "Appartement",
      house: "Maison",
      studio: "Studio",
      loft: "Loft",
      duplex: "Duplex",
      villa: "Villa",
    }
    return types[type as keyof typeof types] || type
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Chargement des propriétés...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Propriétés de l'agence</h1>
          <p className="text-muted-foreground">{agency?.name}</p>
        </div>
        <Button onClick={() => router.push(`/admin/agencies/${agencyId}`)}>Retour à l'agence</Button>
      </div>

      <div className="grid gap-6">
        {/* Filtres et recherche */}
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par titre, adresse, ville ou propriétaire..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
                <TabsList>
                  <TabsTrigger value="all">Tous</TabsTrigger>
                  <TabsTrigger value="available">Disponible</TabsTrigger>
                  <TabsTrigger value="rented">Loué</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                  <TabsTrigger value="draft">Brouillon</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Home className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{properties.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Badge variant="default" className="h-8 w-8 rounded-full flex items-center justify-center p-0">
                  <span className="text-xs">D</span>
                </Badge>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Disponibles</p>
                  <p className="text-2xl font-bold">{properties.filter((p) => p.status === "available").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Badge variant="secondary" className="h-8 w-8 rounded-full flex items-center justify-center p-0">
                  <span className="text-xs">L</span>
                </Badge>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Loués</p>
                  <p className="text-2xl font-bold">{properties.filter((p) => p.status === "rented").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Euro className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Loyer moyen</p>
                  <p className="text-2xl font-bold">
                    {properties.length > 0
                      ? Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length)
                      : 0}
                    €
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des propriétés */}
        <Card>
          <CardHeader>
            <CardTitle>Propriétés ({filteredProperties.length})</CardTitle>
            <CardDescription>Gérez les propriétés de cette agence</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProperties.length === 0 ? (
              <div className="text-center py-8">
                <Home className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">Aucune propriété</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Aucune propriété ne correspond aux critères de recherche."
                    : "Cette agence n'a pas encore de propriétés."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{property.title}</h3>
                        {getStatusBadge(property.status)}
                        <Badge variant="outline">{getPropertyTypeLabel(property.property_type)}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {property.address}, {property.city} {property.postal_code}
                        </div>
                        <div>{property.surface_area}m²</div>
                        <div>{property.rooms} pièces</div>
                        <div className="font-semibold text-foreground">{property.price}€/mois</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Propriétaire: {property.owner.first_name} {property.owner.last_name} ({property.owner.email})
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/properties/${property.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/owner/properties/${property.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer la propriété</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer cette propriété ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteProperty(property.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

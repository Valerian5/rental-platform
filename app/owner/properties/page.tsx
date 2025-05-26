"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Eye } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { useToast } from "@/hooks/use-toast"

export default function PropertiesListPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<any[]>([])
  const [filteredProperties, setFilteredProperties] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "owner") {
          toast({
            title: "Erreur",
            description: "Vous devez être connecté en tant que propriétaire",
            variant: "destructive",
          })
          router.push("/login")
          return
        }
        setCurrentUser(user)

        const userProperties = await propertyService.getOwnerProperties(user.id)
        setProperties(userProperties)
        setFilteredProperties(userProperties)
      } catch (error) {
        console.error("Erreur lors du chargement des biens:", error)
        toast({ title: "Erreur", description: "Erreur lors du chargement des biens", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  useEffect(() => {
    const filtered = properties.filter(
      (property) =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredProperties(filtered)
  }, [searchTerm, properties])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mes biens</h1>
        <Button asChild>
          <Link href="/owner/properties/new">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un bien
          </Link>
        </Button>
      </div>

      {properties.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher un bien..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            {properties.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-2">Aucun bien ajouté</h3>
                <p className="text-gray-500 mb-4">Commencez par ajouter votre premier bien immobilier</p>
                <Button asChild>
                  <Link href="/owner/properties/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un bien
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
                <p className="text-gray-500">Aucun bien ne correspond à votre recherche</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{property.title}</CardTitle>
                  <Badge variant={property.available ? "default" : "secondary"}>
                    {property.available ? "Disponible" : "Loué"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {property.address}, {property.city}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">{property.price} €</span>
                    <span className="text-sm text-gray-500">par mois</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Surface</p>
                      <p className="font-medium">{property.surface} m²</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pièces</p>
                      <p className="font-medium">{property.rooms}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-medium">
                        {property.property_type === "apartment" && "Appt"}
                        {property.property_type === "house" && "Maison"}
                        {property.property_type === "studio" && "Studio"}
                        {property.property_type === "loft" && "Loft"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/owner/properties/${property.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Gérer
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/properties/${property.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredProperties.length > 0 && (
        <div className="mt-8 text-center text-gray-500">
          {filteredProperties.length} bien(s) affiché(s) sur {properties.length} total
        </div>
      )}
    </div>
  )
}

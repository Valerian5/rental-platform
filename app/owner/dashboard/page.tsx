"use client"

import { authService } from "@/lib/auth-service"
import { propertyService } from "@/lib/property-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const OwnerDashboard = () => {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        if (!currentUser || currentUser.user_type !== "owner") {
          router.push("/login")
          return
        }

        setUser(currentUser)

        const userProperties = await propertyService.getOwnerProperties(currentUser.id)
        setProperties(userProperties)
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord Propriétaire</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mes biens</CardTitle>
          <Button asChild>
            <Link href="/owner/properties/new">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un bien
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Chargement...</div>
          ) : properties.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Vous n'avez pas encore ajouté de bien</p>
              <Button asChild>
                <Link href="/owner/properties/new">Ajouter votre premier bien</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.slice(0, 3).map((property) => (
                <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{property.title}</h3>
                    <p className="text-sm text-gray-500">{property.city}</p>
                    <p className="text-sm font-medium">{property.price}€/mois</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        property.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {property.available ? "Disponible" : "Loué"}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/owner/properties/${property.id}`}>Voir</Link>
                    </Button>
                  </div>
                </div>
              ))}
              {properties.length > 3 && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/owner/properties">Voir tous mes biens ({properties.length})</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default OwnerDashboard

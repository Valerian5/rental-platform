"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import { propertyService } from "@/lib/property-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import HorizontalPropertyCard from "@/components/horizontal-property-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"

export default function PropertiesListPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<any[]>([])
  const [filteredProperties, setFilteredProperties] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

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

        // Version simplifiée sans compteurs
        const userProperties = await propertyService.getOwnerProperties(user.id)

        // Logique de statut simplifiée
        const enhancedProperties = userProperties.map((prop: any) => {
          let status = "paused"
          if (prop.available && prop.is_published !== false) {
            status = "active"
          }

          return {
            ...prop,
            status,
          }
        })

        setProperties(enhancedProperties)
        setFilteredProperties(enhancedProperties)
      } catch (error) {
        console.error("Erreur lors du chargement des biens:", error)
        toast.error("Erreur lors du chargement des biens")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  useEffect(() => {
    let filtered = properties.filter(
      (property) =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Filtrer par statut si un onglet spécifique est sélectionné
    if (activeTab !== "all") {
      filtered = filtered.filter((property) => property.status === activeTab)
    }

    setFilteredProperties(filtered)
  }, [searchTerm, properties, activeTab])

  if (isLoading) {
    return <div className="text-center">Chargement...</div>
  }

  return (
    <>
      <PageHeader title="Mes biens" description="Gérez vos annonces immobilières">
        <Button asChild>
          <Link href="/owner/properties/new">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un bien
          </Link>
        </Button>
      </PageHeader>

      {properties.length > 0 && (
        <div className="mb-6 space-y-4">
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

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="active">En diffusion</TabsTrigger>
              <TabsTrigger value="rented">En location</TabsTrigger>
              <TabsTrigger value="paused">En pause</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
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
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProperties.map((property) => (
            <HorizontalPropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {filteredProperties.length > 0 && (
        <div className="mt-8 text-center text-gray-500">
          {filteredProperties.length} bien(s) affiché(s) sur {properties.length} total
        </div>
      )}
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import HorizontalPropertyCard from "@/components/horizontal-property-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { authService } from "@/lib/auth-service"

export default function AgencyPropertiesPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<any[]>([])
  const [filteredProperties, setFilteredProperties] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [agency, setAgency] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user || user.user_type !== "agency") {
          toast.error("Accès non autorisé")
          router.push("/login")
          return
        }
        setCurrentUser(user)

        // Récupérer les informations de l'agence
        const agencyResponse = await fetch(`/api/agencies/${user.agency_id}`)
        const agencyData = await agencyResponse.json()
        if (agencyData.success) {
          setAgency(agencyData.agency)
        }

        // Récupérer les biens de l'agence - RÉUTILISE la logique propriétaire
        const propertiesResponse = await fetch(`/api/agencies/${user.agency_id}/properties`)
        const propertiesData = await propertiesResponse.json()

        if (propertiesData.success) {
          // Adapter le format pour réutiliser HorizontalPropertyCard
          const enhancedProperties = propertiesData.properties.map((prop: any) => ({
            ...prop,
            status: prop.available ? "active" : "paused",
            applications_count: 0, // À implémenter
          }))

          setProperties(enhancedProperties)
          setFilteredProperties(enhancedProperties)
        }
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

    if (activeTab !== "all") {
      filtered = filtered.filter((property) => property.status === activeTab)
    }

    setFilteredProperties(filtered)
  }, [searchTerm, properties, activeTab])

  if (isLoading) {
    return <div className="text-center">Chargement...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Gestion des biens"
        description={`${properties.length} bien(s) dans le portefeuille de ${agency?.name || "votre agence"}`}
      >
        <Button asChild>
          <Link href="/agency/properties/new">
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
              <TabsTrigger value="all">Tous ({properties.length})</TabsTrigger>
              <TabsTrigger value="active">
                En diffusion ({properties.filter((p) => p.status === "active").length})
              </TabsTrigger>
              <TabsTrigger value="rented">
                En location ({properties.filter((p) => p.status === "rented").length})
              </TabsTrigger>
              <TabsTrigger value="paused">
                En pause ({properties.filter((p) => p.status === "paused").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          {properties.length === 0 ? (
            <>
              <h3 className="text-lg font-semibold mb-2">Aucun bien dans le portefeuille</h3>
              <p className="text-gray-500 mb-4">Commencez par ajouter votre premier bien immobilier</p>
              <Button asChild>
                <Link href="/agency/properties/new">
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
          {/* RÉUTILISE le composant HorizontalPropertyCard existant */}
          {filteredProperties.map((property) => (
            <HorizontalPropertyCard
              key={property.id}
              property={property}
              // Adapter les liens pour l'agence
              viewUrl={`/agency/properties/${property.id}`}
              editUrl={`/agency/properties/${property.id}/edit`}
            />
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

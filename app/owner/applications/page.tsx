"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, SlidersHorizontal } from "lucide-react"
import { applicationService } from "@/lib/application-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import ModernApplicationCard from "@/components/modern-application-card"
import { PageHeader } from "@/components/page-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { propertyService } from "@/lib/property-service"

export default function ApplicationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const propertyIdFilter = searchParams.get("propertyId")

  const [applications, setApplications] = useState<any[]>([])
  const [filteredApplications, setFilteredApplications] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [properties, setProperties] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>(propertyIdFilter || "all")

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

        // Charger les propriétés de l'utilisateur
        const userProperties = await propertyService.getOwnerProperties(user.id)
        setProperties(userProperties)

        // Charger les candidatures
        const userApplications = await applicationService.getOwnerApplications(user.id)
        setApplications(userApplications)
      } catch (error) {
        console.error("Erreur lors du chargement des candidatures:", error)
        toast.error("Erreur lors du chargement des candidatures")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  useEffect(() => {
    let filtered = applications

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrer par statut si un onglet spécifique est sélectionné
    if (activeTab !== "all") {
      filtered = filtered.filter((app) => app.status === activeTab)
    }

    // Filtrer par propriété si une propriété spécifique est sélectionnée
    if (selectedProperty && selectedProperty !== "all") {
      filtered = filtered.filter((app) => app.property_id === selectedProperty)
    }

    setFilteredApplications(filtered)
  }, [searchTerm, applications, activeTab, selectedProperty])

  // Définir l'onglet actif et la propriété sélectionnée au chargement si un propertyId est fourni
  useEffect(() => {
    if (propertyIdFilter) {
      setSelectedProperty(propertyIdFilter)
    }
  }, [propertyIdFilter])

  if (isLoading) {
    return <div className="text-center">Chargement...</div>
  }

  return (
    <>
      <PageHeader title="Candidatures" description="Gérez les candidatures pour vos biens">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtres avancés
          </Button>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Trier
          </Button>
        </div>
      </PageHeader>

      {applications.length > 0 && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Rechercher une candidature..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="w-full md:w-64">
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les biens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les biens</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="new">Nouvelles</TabsTrigger>
              <TabsTrigger value="reviewing">En analyse</TabsTrigger>
              <TabsTrigger value="visit_proposed">Visite proposée</TabsTrigger>
              <TabsTrigger value="visit_scheduled">Visite programmée</TabsTrigger>
              <TabsTrigger value="accepted">Acceptées</TabsTrigger>
              <TabsTrigger value="rejected">Refusées</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          {applications.length === 0 ? (
            <>
              <h3 className="text-lg font-semibold mb-2">Aucune candidature reçue</h3>
              <p className="text-gray-500">
                Les candidatures pour vos biens apparaîtront ici une fois que des locataires auront postulé
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
              <p className="text-gray-500">Aucune candidature ne correspond à votre recherche</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <ModernApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}

      {filteredApplications.length > 0 && (
        <div className="mt-8 text-center text-gray-500">
          {filteredApplications.length} candidature(s) affichée(s) sur {applications.length} total
        </div>
      )}
    </>
  )
}

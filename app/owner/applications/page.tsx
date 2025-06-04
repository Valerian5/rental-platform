"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { PageHeader } from "@/components/page-header"
import { ModernApplicationCard } from "@/components/modern-application-card"
import { Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Search, SlidersHorizontal } from "lucide-react"
import { applicationService } from "@/lib/application-service"
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
  const [selectedApplications, setSelectedApplications] = useState(new Set())

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

  const handleSelectApplication = (applicationId, selected) => {
    const newSelectedApplications = new Set(selectedApplications)
    if (selected) {
      newSelectedApplications.add(applicationId)
    } else {
      newSelectedApplications.delete(applicationId)
    }
    setSelectedApplications(newSelectedApplications)
  }

  const handleApplicationAction = async (action, applicationId) => {
    try {
      // Logique pour gérer l'action sur la candidature (ex: accepter, refuser)
      console.log(`Action ${action} sur la candidature ${applicationId}`)
      toast.success(`Candidature ${applicationId} ${action}`)
    } catch (error) {
      console.error("Erreur lors de l'action sur la candidature:", error)
      toast.error("Erreur lors de l'action sur la candidature")
    }
  }

  const getFilteredApplications = () => {
    if (activeTab === "all") return applications

    // Mapper les statuts de l'interface vers les statuts en base de données
    const statusMap = {
      pending: ["pending", "analyzing", "visit_scheduled", "waiting_tenant_confirmation"],
      accepted: ["accepted", "approved"],
      rejected: ["rejected"],
    }

    return applications.filter((app) => {
      const status = app.status || "pending"
      return statusMap[activeTab]?.includes(status)
    })
  }

  // Fonction pour calculer le score de matching de manière sécurisée
  const calculateMatchScore = (application) => {
    try {
      if (!application || !application.property) return 50 // Score par défaut

      const property = application.property
      let score = 0

      // Ratio revenus/loyer (40 points max)
      if (application.income && property.price) {
        const rentRatio = application.income / property.price
        if (rentRatio >= 3) score += 40
        else if (rentRatio >= 2.5) score += 30
        else if (rentRatio >= 2) score += 20
        else score += 10
      } else {
        score += 10
      }

      // Stabilité professionnelle (20 points max)
      if (application.contract_type === "CDI" || application.contract_type === "cdi") score += 20
      else if (application.contract_type === "CDD" || application.contract_type === "cdd") score += 15
      else score += 10

      // Présence d'un garant (20 points max)
      if (application.has_guarantor) score += 20

      // Documents et présentation (20 points max)
      if (application.presentation && application.presentation.length > 50) score += 10
      if (application.profession && application.company) score += 10

      return Math.min(score, 100)
    } catch (error) {
      console.error("Erreur calcul score:", error)
      return 50
    }
  }

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
              <TabsTrigger value="pending">En attente</TabsTrigger>
              <TabsTrigger value="accepted">Acceptées</TabsTrigger>
              <TabsTrigger value="rejected">Refusées</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <>
            <h3 className="text-lg font-semibold mb-2">Aucune candidature reçue</h3>
            <p className="text-gray-500">
              Les candidatures pour vos biens apparaîtront ici une fois que des locataires auront postulé
            </p>
          </>
        </div>
      ) : (
        <>
          {getFilteredApplications().map((application) => {
            try {
              // Gestion sécurisée des données du tenant
              const tenant = application.tenant || {}
              const property = application.property || {}

              // Calcul du score de matching
              const matchScore = calculateMatchScore(application)

              // Préparation des données pour le composant ModernApplicationCard
              const applicationData = {
                id: application.id,
                tenant: {
                  first_name: tenant.first_name || "Prénom",
                  last_name: tenant.last_name || "Nom",
                  email: tenant.email || "email@example.com",
                  phone: tenant.phone || "Non renseigné",
                },
                property: {
                  title: property.title || "Propriété inconnue",
                  address: property.address || "Adresse inconnue",
                },
                profession: application.profession || "Non spécifié",
                income: application.income || 0,
                has_guarantor: application.has_guarantor || false,
                documents_complete: true,
                status: application.status || "pending",
                match_score: matchScore,
                created_at: application.created_at || new Date().toISOString(),
              }

              return (
                <ModernApplicationCard
                  key={application.id}
                  application={applicationData}
                  isSelected={selectedApplications.has(application.id)}
                  onSelect={(selected) => handleSelectApplication(application.id, selected)}
                  onAction={(action) => handleApplicationAction(action, application.id)}
                />
              )
            } catch (error) {
              console.error("Erreur rendu candidature:", error)
              return (
                <Card key={application.id}>
                  <CardContent className="p-4">
                    <p className="text-red-500">Erreur lors de l'affichage de cette candidature</p>
                  </CardContent>
                </Card>
              )
            }
          })}
        </>
      )}

      {getFilteredApplications().length > 0 && (
        <div className="mt-8 text-center text-gray-500">
          {getFilteredApplications().length} candidature(s) affichée(s) sur {applications.length} total
        </div>
      )}
    </>
  )
}

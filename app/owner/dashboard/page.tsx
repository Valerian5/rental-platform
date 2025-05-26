"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import PropertyCard from "@/components/PropertyCard"
import ApplicationCard from "@/components/ApplicationCard"
import VisitCard from "@/components/VisitCard"
import ConversationCard from "@/components/ConversationCard"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"

const OwnerDashboard = () => {
  const router = useRouter()
  const [properties, setProperties] = useState([])
  const [applications, setApplications] = useState([])
  const [visits, setVisits] = useState([])
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        console.log("🔍 Dashboard - Vérification auth...")

        // Vérifier l'authentification avec Supabase
        const currentUser = await authService.getCurrentUser()
        console.log("👤 Dashboard - Utilisateur:", currentUser)

        if (!currentUser) {
          console.log("❌ Dashboard - Pas d'utilisateur, redirection login")
          router.push("/login")
          return
        }

        if (currentUser.user_type !== "owner") {
          console.log("❌ Dashboard - Pas propriétaire, redirection")
          router.push("/unauthorized")
          return
        }

        console.log("✅ Dashboard - Utilisateur propriétaire validé")
        setUser(currentUser)

        // Charger les données du dashboard
        await loadDashboardData(currentUser.id)
      } catch (error) {
        console.error("❌ Dashboard - Erreur auth:", error)
        router.push("/login")
      }
    }

    checkAuthAndLoadData()
  }, [router])

  const loadDashboardData = async (userId) => {
    try {
      setLoading(true)
      console.log("📊 Dashboard - Chargement données pour:", userId)

      // Charger les propriétés
      try {
        const propertiesResponse = await fetch(`/api/properties?owner_id=${userId}`)
        if (propertiesResponse.ok) {
          const propertiesData = await propertiesResponse.json()
          setProperties(propertiesData.properties || [])
          console.log("🏠 Propriétés chargées:", propertiesData.properties?.length || 0)
        }
      } catch (error) {
        console.log("⚠️ Erreur chargement propriétés:", error)
      }

      // Charger les candidatures
      try {
        const applicationsResponse = await fetch(`/api/applications?owner_id=${userId}`)
        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json()
          setApplications(applicationsData.applications || [])
          console.log("📋 Candidatures chargées:", applicationsData.applications?.length || 0)
        }
      } catch (error) {
        console.log("⚠️ Erreur chargement candidatures:", error)
      }

      // Charger les visites
      try {
        const visitsResponse = await fetch(`/api/visits?owner_id=${userId}`)
        if (visitsResponse.ok) {
          const visitsData = await visitsResponse.json()
          setVisits(visitsData.visits || [])
          console.log("📅 Visites chargées:", visitsData.visits?.length || 0)
        }
      } catch (error) {
        console.log("⚠️ Erreur chargement visites:", error)
      }

      // Charger les conversations
      try {
        const conversationsResponse = await fetch(`/api/conversations?user_id=${userId}`)
        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json()
          setConversations(conversationsData.conversations || [])
          console.log("💬 Conversations chargées:", conversationsData.conversations?.length || 0)
        }
      } catch (error) {
        console.log("⚠️ Erreur chargement conversations:", error)
      }
    } catch (error) {
      console.error("❌ Erreur chargement dashboard:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  // Afficher un loader pendant la vérification auth
  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Vérification de l'authentification...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Tableau de bord Propriétaire</h1>
        <p className="text-muted-foreground">
          Bienvenue {user.first_name} {user.last_name}
        </p>
      </div>

      {loading ? (
        <div>
          <h2 className="text-xl font-semibold mb-3">Mes propriétés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-full">
                <Skeleton className="w-full h-40" />
                <Skeleton className="w-3/4 h-5 mt-2" />
                <Skeleton className="w-1/2 h-5 mt-1" />
              </div>
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-3">Candidatures récentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-full">
                <Skeleton className="w-full h-32" />
                <Skeleton className="w-3/4 h-5 mt-2" />
                <Skeleton className="w-1/2 h-5 mt-1" />
              </div>
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-3">Visites planifiées</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-full">
                <Skeleton className="w-full h-32" />
                <Skeleton className="w-3/4 h-5 mt-2" />
                <Skeleton className="w-1/2 h-5 mt-1" />
              </div>
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-3">Conversations récentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-full">
                <Skeleton className="w-full h-24" />
                <Skeleton className="w-3/4 h-5 mt-2" />
                <Skeleton className="w-1/2 h-5 mt-1" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-3">Mes propriétés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {properties.length > 0 ? (
              properties.map((property) => <PropertyCard key={property.id} property={property} />)
            ) : (
              <p className="text-muted-foreground col-span-full">Aucune propriété trouvée</p>
            )}
          </div>

          <h2 className="text-xl font-semibold mb-3">Candidatures récentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {applications.length > 0 ? (
              applications.map((application) => <ApplicationCard key={application.id} application={application} />)
            ) : (
              <p className="text-muted-foreground col-span-full">Aucune candidature trouvée</p>
            )}
          </div>

          <h2 className="text-xl font-semibold mb-3">Visites planifiées</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {visits.length > 0 ? (
              visits.map((visit) => <VisitCard key={visit.id} visit={visit} />)
            ) : (
              <p className="text-muted-foreground col-span-full">Aucune visite planifiée</p>
            )}
          </div>

          <h2 className="text-xl font-semibold mb-3">Conversations récentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <ConversationCard key={conversation.id} conversation={conversation} />
              ))
            ) : (
              <p className="text-muted-foreground col-span-full">Aucune conversation trouvée</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default OwnerDashboard

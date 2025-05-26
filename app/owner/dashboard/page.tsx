"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import PropertyCard from "@/components/PropertyCard"
import ApplicationCard from "@/components/ApplicationCard"
import VisitCard from "@/components/VisitCard"
import ConversationCard from "@/components/ConversationCard"
import { Skeleton } from "@/components/ui/skeleton"

const OwnerDashboard = () => {
  const router = useRouter()
  const [properties, setProperties] = useState([])
  const [applications, setApplications] = useState([])
  const [visits, setVisits] = useState([])
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
    } else {
      loadDashboardData()
    }
  }, [router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) return

      // Charger les propriétés
      const propertiesResponse = await fetch(`/api/properties?owner_id=${user.id}`)
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json()
        setProperties(propertiesData.properties || [])
      }

      // Charger les candidatures
      const applicationsResponse = await fetch(`/api/applications?owner_id=${user.id}`)
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json()
        setApplications(applicationsData.applications || [])
      }

      // Charger les visites
      const visitsResponse = await fetch(`/api/visits?owner_id=${user.id}`)
      if (visitsResponse.ok) {
        const visitsData = await visitsResponse.json()
        setVisits(visitsData.visits || [])
      }

      // Charger les conversations
      const conversationsResponse = await fetch(`/api/conversations?user_id=${user.id}`)
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json()
        setConversations(conversationsData.conversations || [])
      }
    } catch (error) {
      console.error("Erreur chargement dashboard:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-5">Tableau de bord Propriétaire</h1>

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
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-3">Candidatures récentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-3">Visites planifiées</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {visits.map((visit) => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-3">Conversations récentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {conversations.map((conversation) => (
              <ConversationCard key={conversation.id} conversation={conversation} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default OwnerDashboard

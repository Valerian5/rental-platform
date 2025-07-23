"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import ModernApplicationCard from "@/components/modern-application-card"

interface Application {
  id: string
  tenant_name: string
  tenant_email: string
  tenant_phone?: string
  status: string
  created_at: string
  updated_at: string
  property_title?: string
  property_address?: string
  income?: number
  profession?: string
  has_guarantor?: boolean
  matching_score?: number
  message?: string
  visit_requested?: boolean
  property?: {
    id: string
    title: string
    address: string
    price: number
  }
  tenant?: {
    name: string
    email: string
    phone?: string
  }
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/applications")

        if (!response.ok) {
          throw new Error("Erreur lors du chargement")
        }

        const data = await response.json()
        setApplications(data.applications || [])
      } catch (error: any) {
        console.error("Erreur chargement candidatures:", error)
        toast.error("Erreur lors du chargement des candidatures")
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  const handleAccept = async (id: string) => {
    try {
      const response = await fetch(`/api/applications/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      })

      if (!response.ok) {
        toast.error("Erreur lors de l'acceptation")
        return
      }

      toast.success("Candidature acceptée")
      // Recharger les candidatures
      const updatedResponse = await fetch("/api/applications")
      if (updatedResponse.ok) {
        const data = await updatedResponse.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de l'acceptation")
    }
  }

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/applications/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })

      if (!response.ok) {
        toast.error("Erreur lors du refus")
        return
      }

      toast.success("Candidature refusée")
      // Recharger les candidatures
      const updatedResponse = await fetch("/api/applications")
      if (updatedResponse.ok) {
        const data = await updatedResponse.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du refus")
    }
  }

  const handleContact = (id: string) => {
    router.push(`/owner/messaging?application=${id}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidatures reçues"
        description={`${applications.length} candidature${applications.length > 1 ? "s" : ""} en attente d'analyse`}
      />

      {applications.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune candidature</h3>
            <p className="text-gray-600 text-sm mb-6">
              Vous n'avez pas encore reçu de candidatures pour vos biens. Les candidatures apparaîtront ici dès qu'elles
              seront soumises.
            </p>
            <Button asChild>
              <Link href="/owner/properties">Voir mes biens</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {applications.map((application) => (
            <div key={application.id} className="relative">
              <ModernApplicationCard
                application={{
                  ...application,
                  tenant: {
                    name: application.tenant_name,
                    email: application.tenant_email,
                    phone: application.tenant_phone,
                  },
                  score: application.matching_score,
                }}
                onAccept={handleAccept}
                onReject={handleReject}
                onContact={handleContact}
                showActions={true}
              />

              {/* Nom du candidat cliquable - overlay invisible */}
              <Link
                href={`/owner/applications/${application.id}`}
                className="absolute top-6 left-6 right-20 h-16 z-10 cursor-pointer"
                title="Voir le détail de la candidature"
              >
                <span className="sr-only">Voir la candidature de {application.tenant_name}</span>
              </Link>

              {/* Bouton "Voir" après analyse */}
              {application.status !== "pending" && (
                <div className="absolute top-4 right-4 z-20">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/owner/applications/${application.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

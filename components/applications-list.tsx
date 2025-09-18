"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ApplicationStatusBadge } from "@/components/application-badge"
import { Button } from "@/components/ui/button"
import { Eye, User, Calendar, Star } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Application {
  id: string
  tenant_id: string
  status: string
  created_at: string
  tenant: {
    first_name: string
    last_name: string
    email: string
  }
  matching_score?: number
}

interface ApplicationsListProps {
  propertyId: string
}

export function ApplicationsList({ propertyId }: ApplicationsListProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/applications?propertyId=${propertyId}`)

        if (!response.ok) {
          throw new Error("Erreur lors du chargement")
        }

        const data = await response.json()
        setApplications(data)
      } catch (error: any) {
        console.error("Erreur chargement candidatures:", error)
        toast.error("Erreur lors du chargement des candidatures")
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      fetchApplications()
    }
  }, [propertyId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement des candidatures...</p>
        </div>
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium">Aucune candidature reçue</p>
        <p className="text-sm">Les candidatures pour ce bien apparaîtront ici</p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    return <ApplicationStatusBadge hasApplied={true} status={status} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {applications.length} candidature{applications.length > 1 ? "s" : ""} reçue
          {applications.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-3">
        {applications.map((application) => (
          <Card key={application.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>

                  <div>
                    <h4 className="font-medium">
                      {application.tenant.first_name} {application.tenant.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">{application.tenant.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Candidature du {new Date(application.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {application.matching_score && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{application.matching_score}%</span>
                    </div>
                  )}

                  {getStatusBadge(application.status)}

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/owner/applications/${application.id}`}>
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

      {applications.length > 3 && (
        <div className="text-center pt-4">
          <Button variant="outline" asChild>
            <Link href={`/owner/applications?propertyId=${propertyId}`}>
              Voir toutes les candidatures ({applications.length})
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

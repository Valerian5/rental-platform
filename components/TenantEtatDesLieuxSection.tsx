"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  FileText,
  Home,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

interface PropertyData {
  id: string
  rooms: number
  bedrooms: number
  surface: number
  address: string
  city: string
  postal_code: string
}

interface LeaseData {
  locataire_nom_prenom: string
  bailleur_nom_prenom: string
  adresse_logement: string
  date_prise_effet: string
}

interface TenantEtatDesLieuxSectionProps {
  leaseId: string
  propertyId: string
  propertyData?: PropertyData
  leaseData: LeaseData
}

interface EtatDesLieuxDocument {
  id: string
  type: "entree" | "sortie"
  status: "draft" | "completed" | "signed"
  created_at: string
  updated_at: string
  file_url?: string
  digital_data?: any
}

export function TenantEtatDesLieuxSection({ 
  leaseId, 
  propertyId, 
  propertyData, 
  leaseData 
}: TenantEtatDesLieuxSectionProps) {
  const [documents, setDocuments] = useState<EtatDesLieuxDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocuments()
  }, [leaseId])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leases/${leaseId}/etat-des-lieux`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error("Erreur chargement documents:", error)
      toast.error("Erreur lors du chargement des documents")
    } finally {
      setLoading(false)
    }
  }

  const downloadDocument = async (document: EtatDesLieuxDocument) => {
    try {
      if (document.file_url) {
        // Ouvrir le document dans un nouvel onglet
        window.open(document.file_url, '_blank')
      } else {
        toast.error("Document non disponible")
      }
    } catch (error) {
      console.error("Erreur téléchargement:", error)
      toast.error("Erreur lors du téléchargement")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Terminé</Badge>
      case "signed":
        return <Badge className="bg-blue-600">Signé</Badge>
      default:
        return <Badge variant="outline">Brouillon</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "signed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des états des lieux...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            État des lieux - {propertyData?.address || "Propriété"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Propriétaire</span>
              <p className="text-gray-600">{leaseData.bailleur_nom_prenom}</p>
            </div>
            <div>
              <span className="font-medium">Locataire</span>
              <p className="text-gray-600">{leaseData.locataire_nom_prenom}</p>
            </div>
            <div>
              <span className="font-medium">Nombre de pièces</span>
              <p className="text-gray-600">{propertyData?.rooms || "N/A"} pièce{(propertyData?.rooms || 0) > 1 ? "s" : ""}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents d'état des lieux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents d'état des lieux
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Aucun document d'état des lieux disponible</p>
              <p className="text-sm text-gray-500">
                Les documents d'état des lieux seront disponibles une fois créés par le propriétaire.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(doc.status)}
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        État des lieux {doc.type === "entree" ? "d'entrée" : "de sortie"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(doc.created_at).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      {doc.digital_data && (
                        <p className="text-xs text-blue-600 mt-1">
                          État des lieux numérique
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.status)}
                    {doc.file_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadDocument(doc)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                    )}
                    {doc.file_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadDocument(doc)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations sur l'état des lieux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            À propos de l'état des lieux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">État des lieux d'entrée</h4>
            <p className="text-sm text-blue-800">
              L'état des lieux d'entrée est établi lors de la remise des clés. 
              Il décrit l'état du logement et de ses équipements au moment de l'installation du locataire.
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">État des lieux de sortie</h4>
            <p className="text-sm text-green-800">
              L'état des lieux de sortie est établi lors de la restitution des clés. 
              Il permet de comparer l'état du logement avec celui de l'entrée pour déterminer d'éventuelles dégradations.
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Important</h4>
            <p className="text-sm text-yellow-800">
              En l'absence d'état des lieux d'entrée, le logement est considéré comme ayant été 
              remis en bon état. Il est donc important de bien vérifier l'état des lieux d'entrée.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

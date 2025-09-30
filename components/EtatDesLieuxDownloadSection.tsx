"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Download,
  FileText,
  Home,
  Eye,
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

interface EtatDesLieuxDownloadSectionProps {
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

export function EtatDesLieuxDownloadSection({ leaseId, propertyId, propertyData, leaseData }: EtatDesLieuxDownloadSectionProps) {
  const [documents, setDocuments] = useState<EtatDesLieuxDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const roomCount = propertyData?.rooms || 1

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

  const downloadTemplate = async (type: "entree" | "sortie") => {
    try {
      const response = await fetch(`/api/etat-des-lieux/template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          room_count: roomCount,
          property_data: propertyData,
          lease_data: leaseData,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `etat-des-lieux-${type}-${roomCount}pieces.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Modèle téléchargé avec succès")
    } catch (error) {
      console.error("Erreur téléchargement:", error)
      toast.error("Erreur lors du téléchargement du modèle")
    }
  }

  const uploadDocument = async (file: File, type: "entree" | "sortie") => {
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const response = await fetch(`/api/leases/${leaseId}/etat-des-lieux/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload")
      }

      toast.success("Document uploadé avec succès")
      await loadDocuments()
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors de l'upload du document")
    } finally {
      setUploading(false)
    }
  }

  const downloadDocument = async (edlDoc: EtatDesLieuxDocument) => {
    try {
      if (edlDoc.file_url) {
        // Télécharger le document
        const response = await fetch(edlDoc.file_url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = window.document.createElement("a")
        a.href = url
        a.download = `etat-des-lieux-${edlDoc.type}-${edlDoc.id}.pdf`
        window.document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        window.document.body.removeChild(a)
        toast.success("Document téléchargé avec succès")
      } else {
        toast.error("Document non disponible")
      }
    } catch (error) {
      console.error("Erreur téléchargement:", error)
      toast.error("Erreur lors du téléchargement")
    }
  }

  const viewDocument = async (edlDoc: EtatDesLieuxDocument) => {
    try {
      if (edlDoc.file_url) {
        // Ouvrir le document dans un nouvel onglet
        window.open(edlDoc.file_url, '_blank')
      } else {
        toast.error("Document non disponible")
      }
    } catch (error) {
      console.error("Erreur visualisation:", error)
      toast.error("Erreur lors de l'ouverture du document")
    }
  }

  const generatePDF = async (edlDoc: EtatDesLieuxDocument) => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/etat-des-lieux/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: edlDoc.type }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la génération")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement("a")
      a.href = url
      a.download = `etat-des-lieux-${edlDoc.type}-${edlDoc.id}.pdf`
      window.document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      window.document.body.removeChild(a)
      toast.success("PDF généré avec succès")
    } catch (error) {
      console.error("Erreur génération PDF:", error)
      toast.error("Erreur lors de la génération du PDF")
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
      {/* Actions principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Télécharger un modèle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Téléchargez un modèle PDF adapté à votre logement ({roomCount} pièce{roomCount > 1 ? "s" : ""})
            </p>
            <div className="flex gap-2">
              <Button onClick={() => downloadTemplate("entree")} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Entrée
              </Button>
              <Button onClick={() => downloadTemplate("sortie")} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Sortie
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploader un document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Uploadez un état des lieux complété et signé
            </p>
            <div className="space-y-2">
              <Label htmlFor="entree-upload">État des lieux d'entrée</Label>
              <Input
                id="entree-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadDocument(file, "entree")
                }}
                disabled={uploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortie-upload">État des lieux de sortie</Label>
              <Input
                id="sortie-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadDocument(file, "sortie")
                }}
                disabled={uploading}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents d'état des lieux</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun document d'état des lieux</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">
                        État des lieux {doc.type === "entree" ? "d'entrée" : "de sortie"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.status)}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generatePDF(doc)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Générer PDF
                    </Button>
                    {doc.file_url && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewDocument(doc)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadDocument(doc)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

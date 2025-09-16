"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  User,
  Shield,
  Euro,
  Home
} from "lucide-react"

interface DossierFacileDocumentsViewerProps {
  dossierData: any
  onDocumentClick?: (document: any) => void
}

export function DossierFacileDocumentsViewer({ 
  dossierData, 
  onDocumentClick 
}: DossierFacileDocumentsViewerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  if (!dossierData?.dossierfacile_data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Aucune donnée DossierFacile disponible</p>
        </CardContent>
      </Card>
    )
  }

  const data = dossierData.dossierfacile_data
  const documents = data.dossier_documents || []
  const guarantorDocs = data.guarantor_documents || []

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "identity":
        return <User className="h-4 w-4" />
      case "income":
        return <Euro className="h-4 w-4" />
      case "housing":
        return <Home className="h-4 w-4" />
      case "guarantor":
        return <Shield className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getDocumentCategory = (type: string) => {
    switch (type) {
      case "identity":
        return "Identité"
      case "income":
        return "Revenus"
      case "housing":
        return "Logement"
      case "guarantor":
        return "Garant"
      default:
        return "Autres"
    }
  }

  const getStatusBadge = (verified: boolean) => {
    return verified ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Vérifié
      </Badge>
    ) : (
      <Badge variant="outline" className="text-orange-600">
        <AlertCircle className="h-3 w-3 mr-1" />
        En attente
      </Badge>
    )
  }

  const categories = [
    { id: "all", label: "Tous les documents", count: documents.length + guarantorDocs.length },
    { id: "identity", label: "Identité", count: documents.filter((d: any) => d.type === "identity").length },
    { id: "income", label: "Revenus", count: documents.filter((d: any) => d.type === "income").length },
    { id: "housing", label: "Logement", count: documents.filter((d: any) => d.type === "housing").length },
    { id: "guarantor", label: "Garant", count: guarantorDocs.length },
  ]

  const filteredDocuments = selectedCategory === "all" 
    ? [...documents, ...guarantorDocs.map((doc: any) => ({ ...doc, type: "guarantor" }))]
    : selectedCategory === "guarantor"
    ? guarantorDocs.map((doc: any) => ({ ...doc, type: "guarantor" }))
    : documents.filter((doc: any) => doc.type === selectedCategory)

  const handleDocumentClick = (document: any) => {
    if (onDocumentClick) {
      onDocumentClick(document)
    } else {
      // Ouvrir le document dans un nouvel onglet
      window.open(document.url, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statut du dossier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Dossier DossierFacile</span>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Certifié
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Statut</div>
              <div className="font-medium">
                {data.dossier_status?.status === "validated" ? "Validé" : 
                 data.dossier_status?.status === "rejected" ? "Rejeté" : 
                 data.dossier_status?.status === "pending" ? "En attente" : "Inconnu"}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
              <div className="text-sm text-gray-600">Documents principaux</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{guarantorDocs.length}</div>
              <div className="text-sm text-gray-600">Documents garant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {documents.filter((d: any) => d.verified).length + guarantorDocs.filter((d: any) => d.verified).length}
              </div>
              <div className="text-sm text-gray-600">Documents vérifiés</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pièces justificatives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
                <Badge variant="secondary" className="ml-2">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Liste des documents */}
          <div className="space-y-3">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun document dans cette catégorie</p>
              </div>
            ) : (
              filteredDocuments.map((document: any, index: number) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getDocumentIcon(document.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{document.name}</h4>
                          <p className="text-sm text-gray-600">
                            {getDocumentCategory(document.type)}
                            {document.size && ` • ${(document.size / 1024).toFixed(1)} KB`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(document.verified)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDocumentClick(document)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(document.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ouvrir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations du dossier */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations du dossier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Locataire principal</h4>
              <p className="text-sm text-gray-600">
                {data.personal_info?.first_name} {data.personal_info?.last_name}
              </p>
              <p className="text-sm text-gray-600">
                {data.professional_info?.profession} chez {data.professional_info?.company}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Revenus</h4>
              <p className="text-sm text-gray-600">
                {data.professional_info?.monthly_income}€/mois
              </p>
              <p className="text-sm text-gray-600">
                Type de contrat: {data.professional_info?.contract_type}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

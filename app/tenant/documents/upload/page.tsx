"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentUploadWithValidation } from "@/components/document-upload-with-validation"
import { FileText, User, Euro, Building, CheckCircle, AlertTriangle, Calendar } from "lucide-react"

interface DocumentCategory {
  id: string
  name: string
  icon: React.ReactNode
  documents: DocumentType[]
  required: boolean
}

interface DocumentType {
  id: string
  name: string
  description: string
  required: boolean
  completed: boolean
  documentCount: number
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: "identity",
    name: "Identité",
    icon: <User className="h-5 w-5" />,
    required: true,
    documents: [
      {
        id: "identity",
        name: "Pièce d'identité",
        description: "Carte d'identité, passeport ou titre de séjour (recto + verso)",
        required: true,
        completed: false,
        documentCount: 2,
      },
    ],
  },
  {
    id: "income",
    name: "Revenus",
    icon: <Euro className="h-5 w-5" />,
    required: true,
    documents: [
      {
        id: "payslip",
        name: "Fiches de paie",
        description: "3 dernières fiches de paie consécutives",
        required: true,
        completed: false,
        documentCount: 3,
      },
      {
        id: "tax_notice",
        name: "Avis d'imposition",
        description: "Dernier avis d'imposition sur le revenu",
        required: true,
        completed: false,
        documentCount: 1,
      },
      {
        id: "employment_contract",
        name: "Contrat de travail",
        description: "Contrat de travail en cours",
        required: false,
        completed: false,
        documentCount: 1,
      },
    ],
  },
  {
    id: "banking",
    name: "Banque",
    icon: <Building className="h-5 w-5" />,
    required: true,
    documents: [
      {
        id: "bank_statement",
        name: "Relevés bancaires",
        description: "3 derniers relevés bancaires",
        required: true,
        completed: false,
        documentCount: 3,
      },
    ],
  },
]

export default function DocumentUploadPage() {
  const [completedDocuments, setCompletedDocuments] = useState<Record<string, any>>({})
  const [activeCategory, setActiveCategory] = useState("identity")

  const handleDocumentValidated = (documentId: string, documentData: any) => {
    console.log("✅ Document validé:", documentId, documentData)

    setCompletedDocuments((prev) => ({
      ...prev,
      [documentId]: {
        ...documentData,
        completedAt: new Date().toISOString(),
      },
    }))

    // Passer automatiquement à la catégorie suivante si tous les documents requis sont complétés
    const currentCategory = DOCUMENT_CATEGORIES.find((cat) => cat.documents.some((doc) => doc.id === documentId))

    if (currentCategory) {
      const allRequiredCompleted = currentCategory.documents
        .filter((doc) => doc.required)
        .every((doc) => completedDocuments[doc.id] || doc.id === documentId)

      if (allRequiredCompleted) {
        const currentIndex = DOCUMENT_CATEGORIES.findIndex((cat) => cat.id === currentCategory.id)
        const nextCategory = DOCUMENT_CATEGORIES[currentIndex + 1]
        if (nextCategory) {
          setTimeout(() => setActiveCategory(nextCategory.id), 1500)
        }
      }
    }
  }

  const getDocumentStatus = (documentId: string) => {
    return completedDocuments[documentId] ? "completed" : "pending"
  }

  const getCategoryProgress = (category: DocumentCategory) => {
    const requiredDocs = category.documents.filter((doc) => doc.required)
    const completedRequiredDocs = requiredDocs.filter((doc) => completedDocuments[doc.id])
    return {
      completed: completedRequiredDocs.length,
      total: requiredDocs.length,
      percentage: (completedRequiredDocs.length / requiredDocs.length) * 100,
    }
  }

  const getTotalProgress = () => {
    const allRequiredDocs = DOCUMENT_CATEGORIES.flatMap((cat) => cat.documents.filter((doc) => doc.required))
    const completedRequiredDocs = allRequiredDocs.filter((doc) => completedDocuments[doc.id])
    return {
      completed: completedRequiredDocs.length,
      total: allRequiredDocs.length,
      percentage: (completedRequiredDocs.length / allRequiredDocs.length) * 100,
    }
  }

  const totalProgress = getTotalProgress()

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Téléchargement de documents</h1>
          <p className="text-gray-600 mt-2">Complétez votre dossier de location en téléchargeant vos documents</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {totalProgress.completed}/{totalProgress.total}
          </div>
          <div className="text-sm text-gray-600">Documents requis</div>
        </div>
      </div>

      {/* Progression globale */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Progression du dossier</h3>
            <Badge variant={totalProgress.percentage === 100 ? "default" : "secondary"}>
              {Math.round(totalProgress.percentage)}% complété
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${totalProgress.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Début</span>
            <span>Dossier complet</span>
          </div>
        </CardContent>
      </Card>

      {/* Navigation par catégories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-3">
          {DOCUMENT_CATEGORIES.map((category) => {
            const progress = getCategoryProgress(category)
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                {category.icon}
                <span>{category.name}</span>
                {progress.percentage === 100 && <CheckCircle className="h-4 w-4 text-green-600" />}
                {progress.percentage > 0 && progress.percentage < 100 && (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {DOCUMENT_CATEGORIES.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-6">
            {/* En-tête de catégorie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category.icon}
                  {category.name}
                  {category.required && <Badge variant="destructive">Obligatoire</Badge>}
                </CardTitle>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">Téléchargez vos documents d'{category.name.toLowerCase()}</p>
                  <div className="text-sm text-gray-600">
                    {getCategoryProgress(category).completed} / {getCategoryProgress(category).total} requis
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Documents de la catégorie */}
            <div className="space-y-6">
              {category.documents.map((document) => (
                <Card
                  key={document.id}
                  className={`${
                    getDocumentStatus(document.id) === "completed"
                      ? "border-green-500 bg-green-50"
                      : document.required
                        ? "border-orange-500"
                        : "border-gray-200"
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {document.name}
                        {document.required && <Badge variant="destructive">Requis</Badge>}
                        {getDocumentStatus(document.id) === "completed" && (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complété
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="text-sm text-gray-600">
                        {document.documentCount} fichier{document.documentCount > 1 ? "s" : ""}
                      </div>
                    </div>
                    <p className="text-gray-600">{document.description}</p>
                  </CardHeader>

                  <CardContent>
                    {getDocumentStatus(document.id) === "completed" ? (
                      <div className="bg-green-100 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-800">Document validé</span>
                        </div>
                        <div className="text-sm text-green-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Complété le{" "}
                            {new Date(completedDocuments[document.id].completedAt).toLocaleDateString("fr-FR")}
                          </div>
                          {completedDocuments[document.id].autoValidated && (
                            <div className="mt-1">✅ Validation automatique réussie</div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 bg-transparent"
                          onClick={() => {
                            setCompletedDocuments((prev) => {
                              const updated = { ...prev }
                              delete updated[document.id]
                              return updated
                            })
                          }}
                        >
                          Modifier ce document
                        </Button>
                      </div>
                    ) : (
                      <DocumentUploadWithValidation
                        documentType={document.id}
                        documentName={document.name}
                        onDocumentValidated={(data) => handleDocumentValidated(document.id, data)}
                        maxFiles={document.documentCount}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Résumé final */}
      {totalProgress.percentage === 100 && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-800 mb-2">🎉 Dossier complet !</h3>
            <p className="text-green-700 mb-4">Tous vos documents requis ont été téléchargés et validés avec succès.</p>
            <Button className="bg-green-600 hover:bg-green-700">Soumettre mon dossier de location</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

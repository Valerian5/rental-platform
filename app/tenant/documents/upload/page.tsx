"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { IdentityDocumentUpload } from "@/components/document-upload/IdentityDocumentUpload"
import { MonthlyDocumentUpload } from "@/components/document-upload/MonthlyDocumentUpload"
import { FileText, User, Euro, Building, CheckCircle, AlertTriangle, Calendar, ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"

interface DocumentCategory {
  id: string
  name: string
  icon: React.ReactNode
  required: boolean
  description: string
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: "identity",
    name: "Identité",
    icon: <User className="h-5 w-5" />,
    required: true,
    description: "Pièce d'identité (recto et verso)",
  },
  {
    id: "income",
    name: "Revenus",
    icon: <Euro className="h-5 w-5" />,
    required: true,
    description: "Fiches de paie et avis d'imposition",
  },
  {
    id: "housing",
    name: "Logement",
    icon: <Building className="h-5 w-5" />,
    required: true,
    description: "Quittances de loyer actuelles",
  },
]

export default function DocumentUploadPage() {
  const [activeCategory, setActiveCategory] = useState("identity")

  // États pour les documents d'identité
  const [identityDocuments, setIdentityDocuments] = useState<Record<"recto" | "verso", any>>({
    recto: null,
    verso: null,
  })

  // États pour les fiches de paie
  const [payslipDocuments, setPayslipDocuments] = useState<Record<string, any>>({})

  // États pour les quittances de loyer
  const [rentReceiptDocuments, setRentReceiptDocuments] = useState<Record<string, any>>({})

  // États pour l'avis d'imposition
  const [taxNoticeDocument, setTaxNoticeDocument] = useState<any>(null)

  const handleIdentityDocumentValidated = (side: "recto" | "verso", documentData: any) => {
    setIdentityDocuments((prev) => ({
      ...prev,
      [side]: documentData,
    }))

    // Si les deux côtés sont complétés, passer à la catégorie suivante
    if (documentData && identityDocuments[side === "recto" ? "verso" : "recto"]) {
      setTimeout(() => setActiveCategory("income"), 1500)
    }
  }

  const handlePayslipDocumentValidated = (monthKey: string, documentData: any) => {
    if (documentData === null) {
      // Supprimer le document
      setPayslipDocuments((prev) => {
        const updated = { ...prev }
        delete updated[monthKey]
        return updated
      })
    } else {
      setPayslipDocuments((prev) => ({
        ...prev,
        [monthKey]: documentData,
      }))
    }
  }

  const handleRentReceiptDocumentValidated = (monthKey: string, documentData: any) => {
    if (documentData === null) {
      // Supprimer le document
      setRentReceiptDocuments((prev) => {
        const updated = { ...prev }
        delete updated[monthKey]
        return updated
      })
    } else {
      setRentReceiptDocuments((prev) => ({
        ...prev,
        [monthKey]: documentData,
      }))
    }
  }

  const getCategoryProgress = (categoryId: string) => {
    switch (categoryId) {
      case "identity":
        const identityCompleted = Object.values(identityDocuments).filter(Boolean).length
        return { completed: identityCompleted, total: 2, percentage: (identityCompleted / 2) * 100 }

      case "income":
        const payslipCompleted = Object.keys(payslipDocuments).length
        const taxNoticeCompleted = taxNoticeDocument ? 1 : 0
        const incomeTotal = 4 // 3 fiches de paie + 1 avis d'imposition
        const incomeCompletedTotal = payslipCompleted + taxNoticeCompleted
        return {
          completed: incomeCompletedTotal,
          total: incomeTotal,
          percentage: (incomeCompletedTotal / incomeTotal) * 100,
        }

      case "housing":
        const rentCompleted = Object.keys(rentReceiptDocuments).length
        return { completed: rentCompleted, total: 3, percentage: (rentCompleted / 3) * 100 }

      default:
        return { completed: 0, total: 1, percentage: 0 }
    }
  }

  const getTotalProgress = () => {
    const categories = ["identity", "income", "housing"]
    let totalCompleted = 0
    let totalRequired = 0

    categories.forEach((categoryId) => {
      const progress = getCategoryProgress(categoryId)
      totalCompleted += progress.completed
      totalRequired += progress.total
    })

    return {
      completed: totalCompleted,
      total: totalRequired,
      percentage: totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0,
    }
  }

  const totalProgress = getTotalProgress()

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/tenant/rental-management" className="text-blue-600 hover:underline flex items-center mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à mon espace locataire
          </Link>
          <h1 className="text-3xl font-bold">Constitution de votre dossier</h1>
          <p className="text-gray-600 mt-2">Téléchargez vos documents pour compléter votre dossier de location</p>
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
          <Progress value={totalProgress.percentage} className="h-3" />
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
            const progress = getCategoryProgress(category.id)
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

        {/* Onglet Identité */}
        <TabsContent value="identity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Documents d'identité
                <Badge variant="destructive">Obligatoire</Badge>
              </CardTitle>
              <div className="flex items-center justify-between">
                <p className="text-gray-600">Téléchargez le recto et le verso de votre pièce d'identité</p>
                <div className="text-sm text-gray-600">
                  {getCategoryProgress("identity").completed} / {getCategoryProgress("identity").total} requis
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <IdentityDocumentUpload
                onDocumentValidated={handleIdentityDocumentValidated}
                completedSides={identityDocuments}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Revenus */}
        <TabsContent value="income" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Justificatifs de revenus
                <Badge variant="destructive">Obligatoire</Badge>
              </CardTitle>
              <div className="flex items-center justify-between">
                <p className="text-gray-600">Téléchargez vos fiches de paie et votre avis d'imposition</p>
                <div className="text-sm text-gray-600">
                  {getCategoryProgress("income").completed} / {getCategoryProgress("income").total} requis
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Fiches de paie */}
              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Fiches de paie (3 derniers mois)
                </h4>
                <MonthlyDocumentUpload
                  documentType="payslip"
                  documentName="Fiche de paie"
                  onDocumentValidated={handlePayslipDocumentValidated}
                  completedMonths={payslipDocuments}
                />
              </div>

              {/* Avis d'imposition */}
              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Avis d'imposition (année N-1)
                </h4>
                <Card className={taxNoticeDocument ? "border-green-500 bg-green-50" : "border-gray-200"}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Avis d'imposition 2023
                        {taxNoticeDocument && (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complété
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <p className="text-gray-600">Dernier avis d'imposition avec QR Code 2DDoc</p>
                  </CardHeader>
                  <CardContent>
                    {taxNoticeDocument ? (
                      <div className="bg-green-100 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-800">Document validé</span>
                        </div>
                        <div className="text-sm text-green-700">
                          QR Code 2DDoc vérifié - RFR: {taxNoticeDocument.analysis?.extractedData?.rfr}€
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 bg-transparent"
                          onClick={() => setTaxNoticeDocument(null)}
                        >
                          Remplacer ce document
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-3">Sélectionnez votre avis d'imposition 2023</p>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Choisir le fichier
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">Le QR Code 2DDoc sera vérifié automatiquement</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Logement */}
        <TabsContent value="housing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Justificatifs de logement
                <Badge variant="destructive">Obligatoire</Badge>
              </CardTitle>
              <div className="flex items-center justify-between">
                <p className="text-gray-600">Téléchargez vos quittances de loyer actuelles</p>
                <div className="text-sm text-gray-600">
                  {getCategoryProgress("housing").completed} / {getCategoryProgress("housing").total} requis
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MonthlyDocumentUpload
                documentType="rent_receipt"
                documentName="Quittance de loyer"
                onDocumentValidated={handleRentReceiptDocumentValidated}
                completedMonths={rentReceiptDocuments}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Résumé final */}
      {totalProgress.percentage === 100 && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-800 mb-2">🎉 Dossier complet !</h3>
            <p className="text-green-700 mb-4">
              Tous vos documents requis ont été téléchargés et validés automatiquement.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium">Identité</div>
                <div className="text-green-600">✓ Recto + Verso</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium">Revenus</div>
                <div className="text-green-600">✓ 3 fiches + Avis</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium">Logement</div>
                <div className="text-green-600">✓ 3 quittances</div>
              </div>
            </div>
            <Button className="bg-green-600 hover:bg-green-700" size="lg">
              Soumettre mon dossier de location
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

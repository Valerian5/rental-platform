"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, CheckCircle, User, Euro, Home, FileText } from "lucide-react"
import { IdentityDocumentUpload } from "@/components/document-upload/IdentityDocumentUpload"
import { MonthlyDocumentUpload } from "@/components/document-upload/MonthlyDocumentUpload"
import Link from "next/link"
import { toast } from "sonner"

export default function DocumentUploadPage() {
  const [currentTab, setCurrentTab] = useState("identity")
  const [completedDocuments, setCompletedDocuments] = useState({
    identity: { recto: null, verso: null },
    payslips: {},
    rentReceipts: {},
    taxNotice: null,
  })

  const handleIdentityDocumentValidated = (side: "recto" | "verso", documentData: any) => {
    if (documentData === null) {
      // Suppression du document
      setCompletedDocuments((prev) => ({
        ...prev,
        identity: {
          ...prev.identity,
          [side]: null,
        },
      }))
    } else {
      setCompletedDocuments((prev) => ({
        ...prev,
        identity: {
          ...prev.identity,
          [side]: documentData,
        },
      }))
      toast.success(`${side === "recto" ? "Recto" : "Verso"} de la CNI validé avec succès !`)
    }
  }

  const handlePayslipValidated = (monthKey: string, documentData: any) => {
    if (documentData === null) {
      // Suppression du document
      setCompletedDocuments((prev) => {
        const newPayslips = { ...prev.payslips }
        delete newPayslips[monthKey]
        return { ...prev, payslips: newPayslips }
      })
    } else {
      setCompletedDocuments((prev) => ({
        ...prev,
        payslips: {
          ...prev.payslips,
          [monthKey]: documentData,
        },
      }))
      toast.success(`Fiche de paie de ${documentData.monthInfo.label} validée !`)
    }
  }

  const handleRentReceiptValidated = (monthKey: string, documentData: any) => {
    if (documentData === null) {
      // Suppression du document
      setCompletedDocuments((prev) => {
        const newRentReceipts = { ...prev.rentReceipts }
        delete newRentReceipts[monthKey]
        return { ...prev, rentReceipts: newRentReceipts }
      })
    } else {
      setCompletedDocuments((prev) => ({
        ...prev,
        rentReceipts: {
          ...prev.rentReceipts,
          [monthKey]: documentData,
        },
      }))
      toast.success(`Quittance de loyer de ${documentData.monthInfo.label} validée !`)
    }
  }

  const handleTaxNoticeValidated = (documentData: any) => {
    setCompletedDocuments((prev) => ({
      ...prev,
      taxNotice: documentData,
    }))
    toast.success("Avis d'imposition validé avec succès !")
  }

  // Calculer la progression
  const getTabProgress = (tabName: string) => {
    switch (tabName) {
      case "identity":
        const identityCompleted =
          (completedDocuments.identity.recto ? 1 : 0) + (completedDocuments.identity.verso ? 1 : 0)
        return { completed: identityCompleted, total: 2, percentage: (identityCompleted / 2) * 100 }

      case "income":
        const payslipsCompleted = Object.keys(completedDocuments.payslips).length
        const taxNoticeCompleted = completedDocuments.taxNotice ? 1 : 0
        const incomeCompleted = payslipsCompleted + taxNoticeCompleted
        return { completed: incomeCompleted, total: 4, percentage: (incomeCompleted / 4) * 100 }

      case "housing":
        const rentReceiptsCompleted = Object.keys(completedDocuments.rentReceipts).length
        return { completed: rentReceiptsCompleted, total: 3, percentage: (rentReceiptsCompleted / 3) * 100 }

      default:
        return { completed: 0, total: 1, percentage: 0 }
    }
  }

  const getTotalProgress = () => {
    const identity = getTabProgress("identity")
    const income = getTabProgress("income")
    const housing = getTabProgress("housing")

    const totalCompleted = identity.completed + income.completed + housing.completed
    const totalRequired = identity.total + income.total + housing.total

    return { completed: totalCompleted, total: totalRequired, percentage: (totalCompleted / totalRequired) * 100 }
  }

  const totalProgress = getTotalProgress()

  const getTabIcon = (tabName: string) => {
    switch (tabName) {
      case "identity":
        return <User className="h-4 w-4" />
      case "income":
        return <Euro className="h-4 w-4" />
      case "housing":
        return <Home className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const isTabCompleted = (tabName: string) => {
    const progress = getTabProgress(tabName)
    return progress.completed === progress.total
  }

  const canProceedToNext = () => {
    if (currentTab === "identity") {
      return completedDocuments.identity.recto && completedDocuments.identity.verso
    }
    if (currentTab === "income") {
      return Object.keys(completedDocuments.payslips).length === 3 && completedDocuments.taxNotice
    }
    if (currentTab === "housing") {
      return Object.keys(completedDocuments.rentReceipts).length === 3
    }
    return false
  }

  const getNextTab = () => {
    if (currentTab === "identity") return "income"
    if (currentTab === "income") return "housing"
    return null
  }

  const getPrevTab = () => {
    if (currentTab === "housing") return "income"
    if (currentTab === "income") return "identity"
    return null
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/tenant/dashboard" className="text-blue-600 hover:underline flex items-center mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour au tableau de bord
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload de documents</h1>
            <p className="text-gray-600">Téléchargez vos documents avec validation automatique</p>
          </div>
          <div className="text-right space-y-2">
            <Badge variant={totalProgress.percentage >= 80 ? "default" : "secondary"} className="text-lg px-4 py-2">
              {Math.round(totalProgress.percentage)}% complété
            </Badge>
            <p className="text-sm text-gray-600">
              {totalProgress.completed} / {totalProgress.total} documents
            </p>
          </div>
        </div>

        {/* Progression globale */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <Progress value={totalProgress.percentage} className="h-3" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {["identity", "income", "housing"].map((tab) => {
                const progress = getTabProgress(tab)
                const isCompleted = isTabCompleted(tab)
                const isCurrent = currentTab === tab

                return (
                  <div
                    key={tab}
                    className={`flex flex-col items-center space-y-2 p-3 rounded-lg cursor-pointer transition-all ${
                      isCurrent
                        ? "bg-blue-50 border-2 border-blue-200"
                        : isCompleted
                          ? "bg-green-50 border-2 border-green-200"
                          : "bg-gray-50 border-2 border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setCurrentTab(tab)}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        isCompleted
                          ? "bg-green-100 text-green-600"
                          : isCurrent
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {getTabIcon(tab)}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isCompleted ? "text-green-600" : isCurrent ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      {tab === "identity" ? "Identité" : tab === "income" ? "Revenus" : "Logement"}
                    </span>
                    <div className="flex items-center space-x-1">
                      {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                      <span className="text-xs text-gray-600">
                        {progress.completed}/{progress.total}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Contenu des onglets */}
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="identity" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Identité</span>
              {isTabCompleted("identity") && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="income" className="flex items-center space-x-2">
              <Euro className="h-4 w-4" />
              <span>Revenus</span>
              {isTabCompleted("income") && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="housing" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Logement</span>
              {isTabCompleted("housing") && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Pièce d'identité
                </CardTitle>
                <p className="text-gray-600">
                  Téléchargez le recto ET le verso de votre carte d'identité, passeport ou titre de séjour
                </p>
              </CardHeader>
              <CardContent>
                <IdentityDocumentUpload
                  onDocumentValidated={handleIdentityDocumentValidated}
                  completedSides={completedDocuments.identity}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Fiches de paie
                </CardTitle>
                <p className="text-gray-600">Téléchargez vos 3 dernières fiches de paie (mois les plus récents)</p>
              </CardHeader>
              <CardContent>
                <MonthlyDocumentUpload
                  documentType="payslip"
                  documentName="Fiche de paie"
                  onDocumentValidated={handlePayslipValidated}
                  completedMonths={completedDocuments.payslips}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Avis d'imposition
                </CardTitle>
                <p className="text-gray-600">
                  Téléchargez votre dernier avis d'imposition complet (année fiscale 2023)
                </p>
              </CardHeader>
              <CardContent>
                {/* Composant pour l'avis d'imposition - à implémenter */}
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Upload avis d'imposition - À implémenter</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="housing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Quittances de loyer
                </CardTitle>
                <p className="text-gray-600">Téléchargez vos 3 dernières quittances de loyer (obligatoires)</p>
              </CardHeader>
              <CardContent>
                <MonthlyDocumentUpload
                  documentType="rent_receipt"
                  documentName="Quittance de loyer"
                  onDocumentValidated={handleRentReceiptValidated}
                  completedMonths={completedDocuments.rentReceipts}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const prevTab = getPrevTab()
              if (prevTab) setCurrentTab(prevTab)
            }}
            disabled={!getPrevTab()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>

          <div className="space-x-2">
            {totalProgress.percentage === 100 ? (
              <Button asChild>
                <Link href="/tenant/profile/rental-file">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finaliser le dossier
                </Link>
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const nextTab = getNextTab()
                  if (nextTab) setCurrentTab(nextTab)
                }}
                disabled={!canProceedToNext() || !getNextTab()}
              >
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

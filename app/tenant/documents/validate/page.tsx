"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentValidationWorkflow } from "@/components/document-validation-workflow"
import { FileText, History, BarChart3, Shield } from "lucide-react"
import { toast } from "sonner"

interface ValidationHistory {
  documentId: string
  documentType: string
  isValid: boolean
  confidence: number
  timestamp: string
  processingTime: number
}

interface ValidationStats {
  totalDocuments: number
  validDocuments: number
  averageConfidence: number
  errorsByType: Record<string, number>
  processingTimeAvg: number
}

export default function DocumentValidationPage() {
  const [tenantId, setTenantId] = useState<string>("")
  const [validationHistory, setValidationHistory] = useState<ValidationHistory[]>([])
  const [validationStats, setValidationStats] = useState<ValidationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Récupérer l'ID du tenant depuis le localStorage ou l'auth
  useEffect(() => {
    // Simulation - en production, récupérer depuis le contexte d'auth
    const mockTenantId = "tenant-123"
    setTenantId(mockTenantId)
    loadValidationData(mockTenantId)
  }, [])

  const loadValidationData = async (tenantId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/documents/validate?tenantId=${tenantId}`)
      const result = await response.json()

      if (result.success) {
        setValidationHistory(result.data.history)
        setValidationStats(result.data.stats)
      } else {
        toast.error("Erreur lors du chargement des données")
      }
    } catch (error) {
      console.error("Erreur chargement données:", error)
      toast.error("Erreur de connexion")
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidationComplete = (result: any) => {
    // Recharger les données après une nouvelle validation
    loadValidationData(tenantId)
    toast.success("Validation terminée!")
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      identity: "Pièce d'identité",
      tax_notice: "Avis d'imposition",
      payslip: "Fiche de paie",
      bank_statement: "Relevé bancaire",
    }
    return labels[type] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Validation de documents</h1>
          <p className="text-gray-600 mt-2">
            Validez automatiquement vos documents locatifs avec notre système OCR avancé
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-600 font-medium">Sécurisé & Conforme RGPD</span>
        </div>
      </div>

      <Tabs defaultValue="validate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="validate" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Valider un document
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        {/* Onglet Validation */}
        <TabsContent value="validate" className="space-y-6">
          <DocumentValidationWorkflow tenantId={tenantId} onValidationComplete={handleValidationComplete} />
        </TabsContent>

        {/* Onglet Historique */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des validations</CardTitle>
              <CardDescription>Consultez l'historique de vos validations de documents</CardDescription>
            </CardHeader>
            <CardContent>
              {validationHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Aucune validation effectuée pour le moment</p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      const tabsList = document.querySelector('[role="tablist"]')
                      const validateTab = tabsList?.querySelector('[value="validate"]') as HTMLElement
                      validateTab?.click()
                    }}
                  >
                    Valider votre premier document
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {validationHistory.map((validation) => (
                    <div
                      key={validation.documentId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${validation.isValid ? "bg-green-500" : "bg-red-500"}`} />
                        <div>
                          <div className="font-medium">{getDocumentTypeLabel(validation.documentType)}</div>
                          <div className="text-sm text-gray-500">{formatDate(validation.timestamp)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={validation.isValid ? "default" : "destructive"}>
                          {validation.isValid ? "Valide" : "Invalide"}
                        </Badge>
                        <Badge variant="secondary">{Math.round(validation.confidence * 100)}%</Badge>
                        <div className="text-sm text-gray-500">{validation.processingTime}ms</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Statistiques */}
        <TabsContent value="stats" className="space-y-6">
          {validationStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{validationStats.totalDocuments}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Documents valides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{validationStats.validDocuments}</div>
                  <div className="text-sm text-gray-500">
                    {validationStats.totalDocuments > 0
                      ? Math.round((validationStats.validDocuments / validationStats.totalDocuments) * 100)
                      : 0}
                    % de réussite
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Confiance moyenne</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(validationStats.averageConfidence * 100)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Temps moyen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(validationStats.processingTimeAvg)}ms
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucune statistique disponible</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

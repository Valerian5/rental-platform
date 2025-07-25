"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DocumentValidationWorkflow } from "@/components/document-validation-workflow"
import { DocumentValidationDashboard } from "@/components/document-validation-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { FileCheck, Upload, BarChart3, AlertCircle, CheckCircle, Clock, ArrowRight } from "lucide-react"
import type { DocumentValidationResult } from "@/lib/document-validation-service"

export default function DocumentValidationPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [validationResults, setValidationResults] = useState<DocumentValidationResult[]>([])
  const [activeTab, setActiveTab] = useState("upload")

  useEffect(() => {
    // Récupérer les informations utilisateur
    const fetchUser = async () => {
      try {
        // Simuler la récupération de l'utilisateur connecté
        // En production, ceci viendrait de votre système d'auth
        const mockUser = {
          id: "tenant-123",
          email: "tenant@example.com",
          user_type: "tenant",
          full_name: "Jean Dupont",
        }
        setUser(mockUser)
      } catch (error) {
        console.error("Erreur récupération utilisateur:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleValidationComplete = (results: DocumentValidationResult[]) => {
    setValidationResults(results)
    setActiveTab("dashboard")

    // Afficher une notification de succès
    console.log("Validation terminée:", results)
  }

  const handleViewDocument = (documentId: string) => {
    // Ouvrir le document dans un modal ou une nouvelle page
    console.log("Voir document:", documentId)
  }

  const handleRetryValidation = (documentId: string) => {
    // Relancer la validation pour ce document
    console.log("Relancer validation:", documentId)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Vous devez être connecté pour accéder à cette page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* En-tête */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Validation de Documents</h1>
            <p className="text-muted-foreground">Téléchargez et validez automatiquement vos documents locatifs</p>
          </div>
          <Badge variant="outline" className="text-sm">
            Tenant: {user.full_name}
          </Badge>
        </div>

        {/* Informations importantes */}
        <Alert>
          <FileCheck className="h-4 w-4" />
          <AlertDescription>
            <strong>Validation automatique avec OCR</strong> - Vos documents sont analysés automatiquement pour extraire
            et vérifier les informations importantes. Le processus est sécurisé et conforme RGPD.
          </AlertDescription>
        </Alert>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Upload className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents requis</p>
                <p className="text-lg font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Validés</p>
                <p className="text-lg font-bold">{validationResults.filter((r) => r.isValid).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Temps moyen</p>
                <p className="text-lg font-bold">
                  {validationResults.length > 0
                    ? Math.round(
                        validationResults.reduce((sum, r) => sum + r.processingTime, 0) /
                          validationResults.length /
                          1000,
                      )
                    : 0}
                  s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confiance</p>
                <p className="text-lg font-bold">
                  {validationResults.length > 0
                    ? Math.round(
                        (validationResults.reduce((sum, r) => sum + r.confidence, 0) / validationResults.length) * 100,
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Télécharger & Valider
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tableau de Bord
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Workflow de Validation
              </CardTitle>
              <CardDescription>
                Suivez les étapes pour télécharger et valider vos documents automatiquement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentValidationWorkflow
                tenantId={user.id}
                onComplete={handleValidationComplete}
                requiredDocuments={["identity", "tax_notice", "payslip"]}
                optionalDocuments={["bank_statement"]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <DocumentValidationDashboard
            tenantId={user.id}
            onViewDocument={handleViewDocument}
            onRetryValidation={handleRetryValidation}
          />
        </TabsContent>
      </Tabs>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>Raccourcis pour gérer vos documents et votre dossier locatif</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2 bg-transparent">
              <FileCheck className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Télécharger un rapport</p>
                <p className="text-sm text-muted-foreground">Export PDF de vos validations</p>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2 bg-transparent">
              <Upload className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Ajouter des documents</p>
                <p className="text-sm text-muted-foreground">Compléter votre dossier</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 bg-transparent"
              onClick={() => router.push("/tenant/applications")}
            >
              <ArrowRight className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Voir mes candidatures</p>
                <p className="text-sm text-muted-foreground">Gérer vos demandes de location</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

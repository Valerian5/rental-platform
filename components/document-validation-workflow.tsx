"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader2, ArrowRight, Eye } from "lucide-react"
import { toast } from "sonner"
import { DocumentValidationDashboard } from "./document-validation-dashboard"

interface DocumentStep {
  id: string
  type: string
  label: string
  description: string
  required: boolean
  status: "pending" | "uploading" | "validating" | "valid" | "invalid" | "error"
  documentUrl?: string
  validationResult?: any
}

interface DocumentValidationWorkflowProps {
  tenantId: string
  onComplete?: (results: any[]) => void
}

const DOCUMENT_STEPS: DocumentStep[] = [
  {
    id: "identity",
    type: "identity",
    label: "Pièce d'identité",
    description: "Carte d'identité, passeport ou titre de séjour en cours de validité",
    required: true,
    status: "pending",
  },
  {
    id: "tax_notice",
    type: "tax_notice",
    label: "Avis d'imposition",
    description: "Dernier avis d'imposition ou de non-imposition",
    required: true,
    status: "pending",
  },
  {
    id: "payslip",
    type: "payslip",
    label: "Fiches de paie",
    description: "3 dernières fiches de paie",
    required: true,
    status: "pending",
  },
  {
    id: "bank_statement",
    type: "bank_statement",
    label: "Relevés bancaires",
    description: "3 derniers relevés bancaires",
    required: false,
    status: "pending",
  },
  {
    id: "employment_certificate",
    type: "employment_certificate",
    label: "Attestation employeur",
    description: "Attestation d'emploi de moins de 3 mois",
    required: false,
    status: "pending",
  },
]

export function DocumentValidationWorkflow({ tenantId, onComplete }: DocumentValidationWorkflowProps) {
  const [steps, setSteps] = useState<DocumentStep[]>(DOCUMENT_STEPS)
  const [currentStep, setCurrentStep] = useState(0)
  const [showDashboard, setShowDashboard] = useState(false)

  const updateStepStatus = useCallback((stepId: string, updates: Partial<DocumentStep>) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, ...updates } : step)))
  }, [])

  const handleFileUpload = async (stepId: string, file: File) => {
    try {
      updateStepStatus(stepId, { status: "uploading" })

      // Upload du fichier
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "documents")

      const uploadResponse = await fetch("/api/upload-blob", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Erreur lors de l'upload")
      }

      const uploadResult = await uploadResponse.json()
      const documentUrl = uploadResult.url

      updateStepStatus(stepId, {
        status: "validating",
        documentUrl,
      })

      // Validation du document
      const step = steps.find((s) => s.id === stepId)
      if (!step) return

      const validationResponse = await fetch("/api/documents/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentUrl,
          documentType: step.type,
          tenantId,
        }),
      })

      const validationResult = await validationResponse.json()

      if (validationResult.success) {
        const validation = validationResult.validation
        updateStepStatus(stepId, {
          status: validation.isValid ? "valid" : "invalid",
          validationResult: validation,
        })

        if (validation.isValid) {
          toast.success(`${step.label} validé avec succès`)
        } else {
          toast.warning(`${step.label} contient des erreurs`)
        }
      } else {
        throw new Error(validationResult.error || "Erreur de validation")
      }
    } catch (error) {
      console.error("Erreur traitement document:", error)
      updateStepStatus(stepId, { status: "error" })
      toast.error(`Erreur lors du traitement de ${steps.find((s) => s.id === stepId)?.label}`)
    }
  }

  const getStepIcon = (status: DocumentStep["status"]) => {
    switch (status) {
      case "pending":
        return <FileText className="h-5 w-5 text-muted-foreground" />
      case "uploading":
      case "validating":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      case "valid":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "invalid":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "error":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStepBadge = (step: DocumentStep) => {
    switch (step.status) {
      case "pending":
        return <Badge variant="outline">En attente</Badge>
      case "uploading":
        return <Badge className="bg-blue-100 text-blue-800">Upload...</Badge>
      case "validating":
        return <Badge className="bg-purple-100 text-purple-800">Validation...</Badge>
      case "valid":
        return <Badge className="bg-green-100 text-green-800">Valide</Badge>
      case "invalid":
        return <Badge variant="destructive">Invalide</Badge>
      case "error":
        return <Badge className="bg-orange-100 text-orange-800">Erreur</Badge>
      default:
        return <Badge variant="outline">En attente</Badge>
    }
  }

  const getCompletionStats = () => {
    const requiredSteps = steps.filter((s) => s.required)
    const completedRequired = requiredSteps.filter((s) => s.status === "valid").length
    const totalRequired = requiredSteps.length

    const optionalSteps = steps.filter((s) => !s.required)
    const completedOptional = optionalSteps.filter((s) => s.status === "valid").length
    const totalOptional = optionalSteps.length

    const overallProgress = ((completedRequired + completedOptional) / steps.length) * 100

    return {
      requiredComplete: completedRequired === totalRequired,
      requiredProgress: (completedRequired / totalRequired) * 100,
      optionalProgress: totalOptional > 0 ? (completedOptional / totalOptional) * 100 : 0,
      overallProgress,
      completedRequired,
      totalRequired,
      completedOptional,
      totalOptional,
    }
  }

  const stats = getCompletionStats()

  if (showDashboard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Tableau de Bord de Validation</h2>
            <p className="text-muted-foreground">Suivi détaillé des validations de documents</p>
          </div>
          <Button onClick={() => setShowDashboard(false)} variant="outline">
            Retour au workflow
          </Button>
        </div>

        <DocumentValidationDashboard
          tenantId={tenantId}
          onValidationComplete={(result) => {
            // Mettre à jour le workflow si nécessaire
            const step = steps.find((s) => s.type === result.documentType)
            if (step) {
              updateStepStatus(step.id, {
                status: result.isValid ? "valid" : "invalid",
                validationResult: result,
              })
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec progression */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Validation Automatisée des Documents</CardTitle>
              <CardDescription>Uploadez vos documents pour une validation automatique et sécurisée</CardDescription>
            </div>
            <Button onClick={() => setShowDashboard(true)} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Tableau de bord
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progression globale</span>
              <span>{Math.round(stats.overallProgress)}%</span>
            </div>
            <Progress value={stats.overallProgress} className="h-2" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Documents obligatoires:</span>
                <span className="ml-2 font-medium">
                  {stats.completedRequired}/{stats.totalRequired}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Documents optionnels:</span>
                <span className="ml-2 font-medium">
                  {stats.completedOptional}/{stats.totalOptional}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des étapes */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card
            key={step.id}
            className={`transition-all ${
              step.status === "valid"
                ? "border-green-200 bg-green-50/50"
                : step.status === "invalid"
                  ? "border-red-200 bg-red-50/50"
                  : step.status === "error"
                    ? "border-orange-200 bg-orange-50/50"
                    : "border-border"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">{getStepIcon(step.status)}</div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold">{step.label}</h3>
                      {getStepBadge(step)}
                      {step.required && (
                        <Badge variant="outline" className="text-xs">
                          Obligatoire
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">{step.description}</p>

                    {/* Résultats de validation */}
                    {step.validationResult && (
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            Confiance: {Math.round(step.validationResult.confidence * 100)}%
                          </Badge>
                          <Badge variant="outline">Traité en {step.validationResult.processingTime}ms</Badge>
                        </div>

                        {step.validationResult.errors?.length > 0 && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {step.validationResult.errors.length} erreur(s) détectée(s):
                                </p>
                                {step.validationResult.errors.slice(0, 2).map((error: any, i: number) => (
                                  <p key={i} className="text-sm">
                                    • {error.message}
                                  </p>
                                ))}
                                {step.validationResult.errors.length > 2 && (
                                  <p className="text-sm text-muted-foreground">
                                    +{step.validationResult.errors.length - 2} autres erreurs
                                  </p>
                                )}
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}

                        {step.validationResult.warnings?.length > 0 && (
                          <Alert className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <p className="font-medium">{step.validationResult.warnings.length} avertissement(s)</p>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {step.status === "pending" && (
                    <div>
                      <input
                        type="file"
                        id={`file-${step.id}`}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleFileUpload(step.id, file)
                          }
                        }}
                      />
                      <Button onClick={() => document.getElementById(`file-${step.id}`)?.click()} size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Uploader
                      </Button>
                    </div>
                  )}

                  {step.documentUrl && (
                    <Button variant="outline" size="sm" onClick={() => window.open(step.documentUrl, "_blank")}>
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                  )}

                  {step.status === "invalid" && (
                    <div>
                      <input
                        type="file"
                        id={`refile-${step.id}`}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleFileUpload(step.id, file)
                          }
                        }}
                      />
                      <Button
                        onClick={() => document.getElementById(`refile-${step.id}`)?.click()}
                        size="sm"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Remplacer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Résumé et actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-2">Résumé de la Validation</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Documents obligatoires: {stats.completedRequired}/{stats.totalRequired}
                  {stats.requiredComplete && <CheckCircle className="inline h-4 w-4 ml-2 text-green-600" />}
                </p>
                <p>
                  Documents optionnels: {stats.completedOptional}/{stats.totalOptional}
                </p>
                <p>Progression globale: {Math.round(stats.overallProgress)}%</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {stats.requiredComplete && (
                <Button
                  onClick={() => {
                    const results = steps.filter((s) => s.validationResult)
                    onComplete?.(results)
                    toast.success("Validation terminée avec succès!")
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Terminer la validation
                </Button>
              )}

              <Button onClick={() => setShowDashboard(true)} variant="outline">
                <ArrowRight className="h-4 w-4 mr-2" />
                Voir le tableau de bord
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

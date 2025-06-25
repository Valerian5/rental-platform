"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { FileText, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { leaseDataAnalyzer, type LeaseAnalysis, type FieldMapping } from "@/lib/lease-data-analyzer"

export default function CompleteLeaseDataPage() {
  const params = useParams()
  const router = useRouter()
  const [analysis, setAnalysis] = useState<LeaseAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [activeCategory, setActiveCategory] = useState<string>("parties")

  useEffect(() => {
    loadAnalysis()
  }, [params.id])

  const loadAnalysis = async () => {
    try {
      setLoading(true)
      const result = await leaseDataAnalyzer.analyze(params.id as string)
      setAnalysis(result)

      // Initialiser le formulaire avec les données existantes
      const initialData: Record<string, any> = {}
      for (const [key, field] of Object.entries(result.availableData)) {
        initialData[key] = field.value
      }
      setFormData(initialData)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = async (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))

    // Sauvegarde automatique
    try {
      await leaseDataAnalyzer.saveCompletedData(params.id as string, fieldName, value)

      // Mettre à jour l'analyse
      if (analysis) {
        const updatedAnalysis = { ...analysis }
        updatedAnalysis.availableData[fieldName].value = value
        updatedAnalysis.availableData[fieldName].source = "manual"

        // Recalculer les champs manquants
        const missingRequired = Object.entries(updatedAnalysis.availableData)
          .filter(([_, field]) => field.required && !field.value)
          .map(([key]) => key)

        updatedAnalysis.missingRequired = missingRequired
        updatedAnalysis.completionRate = Math.round(
          ((Object.keys(updatedAnalysis.availableData).length - missingRequired.length) /
            Object.keys(updatedAnalysis.availableData).length) *
            100,
        )
        updatedAnalysis.canGenerate = missingRequired.length === 0

        setAnalysis(updatedAnalysis)
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde")
    }
  }

  const handleGenerateDocument = () => {
    if (analysis?.canGenerate) {
      router.push(`/owner/leases/${params.id}`)
      toast.success("Données complétées ! Vous pouvez maintenant générer le document.")
    } else {
      toast.error("Veuillez compléter tous les champs obligatoires")
    }
  }

  const renderField = (field: FieldMapping) => {
    const value = formData[field.key] || ""
    const isRequired = field.required
    const isMissing = field.source === "missing"

    const fieldProps = {
      id: field.key,
      value,
      onChange: (e: any) => handleFieldChange(field.key, e.target.value),
      className: `${isMissing ? "border-red-300 bg-red-50" : field.source === "auto" ? "border-green-300 bg-green-50" : ""}`,
    }

    return (
      <div key={field.key} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Badge
            variant={field.source === "auto" ? "default" : field.source === "manual" ? "secondary" : "destructive"}
            className="text-xs"
          >
            {field.source === "auto" ? "Auto" : field.source === "manual" ? "Manuel" : "Manquant"}
          </Badge>
        </div>

        {field.type === "textarea" ? (
          <Textarea {...fieldProps} rows={3} placeholder={`Saisir ${field.label.toLowerCase()}`} />
        ) : field.type === "select" ? (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.key, val)}>
            <SelectTrigger className={fieldProps.className}>
              <SelectValue placeholder={`Sélectionner ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            {...fieldProps}
            type={
              field.type === "number"
                ? "number"
                : field.type === "date"
                  ? "date"
                  : field.type === "email"
                    ? "email"
                    : "text"
            }
            placeholder={`Saisir ${field.label.toLowerCase()}`}
          />
        )}

        {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Analyse des données en cours...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Erreur</h1>
          <p className="text-gray-600 mt-2">Impossible de charger les données du bail.</p>
          <Button className="mt-4" onClick={() => router.push(`/owner/leases/${params.id}`)}>
            Retour au bail
          </Button>
        </div>
      </div>
    )
  }

  const categories = leaseDataAnalyzer.getFieldsByCategory(analysis.availableData)
  const categoryLabels = {
    parties: "Parties contractantes",
    logement: "Logement",
    financier: "Conditions financières",
    duree: "Durée du bail",
    annexes: "Signature et annexes",
  }

  return (
    <div className="container mx-auto py-6">
      <BreadcrumbNav
        items={[
          { label: "Tableau de bord", href: "/owner/dashboard" },
          { label: "Baux", href: "/owner/leases" },
          { label: "Bail", href: `/owner/leases/${params.id}` },
          { label: "Compléter les données", href: `/owner/leases/${params.id}/complete-data` },
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Compléter les données du bail"
          description="Renseignez toutes les informations nécessaires pour générer le contrat"
        />
        <Button variant="outline" onClick={() => router.push(`/owner/leases/${params.id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au bail
        </Button>
      </div>

      {/* Barre de progression */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression</span>
            <span className="text-sm text-muted-foreground">{analysis.completionRate}% complété</span>
          </div>
          <Progress value={analysis.completionRate} className="mb-4" />
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>
                {Object.keys(analysis.availableData).length - analysis.missingRequired.length} champs complétés
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>{analysis.missingRequired.length} champs manquants</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation des catégories */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Catégories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(categoryLabels).map(([key, label]) => {
                const fieldsInCategory = categories[key as keyof typeof categories]
                const missingInCategory = fieldsInCategory.filter((f) => f.source === "missing").length

                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeCategory === key ? "bg-blue-100 text-blue-900 border border-blue-200" : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{label}</span>
                      {missingInCategory > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {missingInCategory}
                        </Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Formulaire */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {categoryLabels[activeCategory as keyof typeof categoryLabels]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {categories[activeCategory as keyof typeof categories].map(renderField)}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex gap-4">
            <Button onClick={handleGenerateDocument} disabled={!analysis.canGenerate} className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              {analysis.canGenerate ? "Générer le document" : `${analysis.missingRequired.length} champs manquants`}
            </Button>
            <Button variant="outline" onClick={() => router.push(`/owner/leases/${params.id}`)}>
              Sauvegarder et continuer plus tard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

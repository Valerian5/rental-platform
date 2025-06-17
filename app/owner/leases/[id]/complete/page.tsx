"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Save, AlertTriangle, CheckCircle, FileText, ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { leaseDataMapper, type LeaseDataMapping } from "@/lib/lease-data-mapper"

export default function LeaseCompletePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mappedData, setMappedData] = useState<LeaseDataMapping>({})
  const [lease, setLease] = useState<any>(null)

  useEffect(() => {
    loadLeaseData()
  }, [params.id])

  const loadLeaseData = async () => {
    try {
      setLoading(true)

      // Charger les données mappées
      const data = await leaseDataMapper.mapLeaseData(params.id as string)
      setMappedData(data)

      // Charger les infos de base du bail
      const response = await fetch(`/api/leases/${params.id}`)
      const result = await response.json()
      if (result.success) {
        setLease(result.lease)
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const updateFieldValue = (fieldName: string, value: any) => {
    setMappedData((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        source: "manual",
      },
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Préparer les données pour la sauvegarde
      const dataToSave: { [key: string]: any } = {}
      for (const [fieldName, field] of Object.entries(mappedData)) {
        dataToSave[fieldName] = field.value
      }

      // Sauvegarder les données complétées
      const response = await fetch(`/api/leases/${params.id}/complete-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedData: dataToSave }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Données sauvegardées avec succès")
        router.push(`/owner/leases/${params.id}`)
      } else {
        toast.error(result.error || "Erreur lors de la sauvegarde")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const generateDocument = async () => {
    try {
      const response = await fetch(`/api/leases/${params.id}/generate-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedData: mappedData }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Document généré avec succès")
        router.push(`/owner/leases/${params.id}`)
      } else {
        toast.error(result.error || "Erreur lors de la génération")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la génération")
    }
  }

  const renderField = (fieldName: string, field: any) => {
    const commonProps = {
      value: field.value || "",
      onChange: (e: any) => updateFieldValue(fieldName, e.target.value),
    }

    switch (field.type) {
      case "select":
        return (
          <Select value={field.value || ""} onValueChange={(value) => updateFieldValue(fieldName, value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {mappedData[fieldName]?.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "textarea":
        return <Textarea {...commonProps} rows={3} />

      case "boolean":
        return (
          <Switch checked={field.value || false} onCheckedChange={(checked) => updateFieldValue(fieldName, checked)} />
        )

      case "number":
        return <Input {...commonProps} type="number" step="0.01" />

      case "date":
        return <Input {...commonProps} type="date" />

      case "email":
        return <Input {...commonProps} type="email" />

      default:
        return <Input {...commonProps} />
    }
  }

  const getFieldsByCategory = () => {
    const categories = {
      parties: [
        "bailleur_nom_prenom",
        "bailleur_domicile",
        "bailleur_qualite",
        "bailleur_email",
        "locataire_nom_prenom",
        "locataire_email",
      ],
      logement: [
        "localisation_logement",
        "identifiant_fiscal",
        "type_habitat",
        "regime_juridique",
        "periode_construction",
        "surface_habitable",
        "nombre_pieces",
        "niveau_performance_dpe",
      ],
      financier: [
        "montant_loyer_mensuel",
        "montant_provisions_charges",
        "montant_depot_garantie",
        "periodicite_paiement",
        "date_paiement",
      ],
      duree: ["date_prise_effet", "duree_contrat", "evenement_duree_reduite"],
      annexes: ["annexe_dpe", "annexe_risques", "annexe_notice", "annexe_etat_lieux", "annexe_reglement"],
      autres: [],
    }

    // Ajouter les champs non catégorisés dans "autres"
    const categorizedFields = new Set(Object.values(categories).flat())
    for (const fieldName of Object.keys(mappedData)) {
      if (!categorizedFields.has(fieldName)) {
        categories.autres.push(fieldName)
      }
    }

    return categories
  }

  const getStats = () => {
    const fields = Object.values(mappedData)
    const total = fields.length
    const completed = fields.filter((f) => f.source !== "missing").length
    const required = fields.filter((f) => f.required).length
    const requiredCompleted = fields.filter((f) => f.required && f.source !== "missing").length

    return { total, completed, required, requiredCompleted }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      </div>
    )
  }

  const stats = getStats()
  const categories = getFieldsByCategory()
  const missingRequired = Object.entries(mappedData).filter(
    ([_, field]) => field.required && field.source === "missing",
  )

  return (
    <div className="container mx-auto py-6">
      <BreadcrumbNav
        items={[
          { label: "Tableau de bord", href: "/owner/dashboard" },
          { label: "Baux", href: "/owner/leases" },
          { label: `Bail ${lease?.property?.title || ""}`, href: `/owner/leases/${params.id}` },
          { label: "Compléter", href: `/owner/leases/${params.id}/complete` },
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Compléter les données du bail"
          description="Vérifiez et complétez les informations nécessaires pour générer le contrat"
        />
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Champs complétés</div>
            <div className="text-xs text-muted-foreground">sur {stats.total} total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.requiredCompleted}</div>
            <div className="text-sm text-muted-foreground">Obligatoires OK</div>
            <div className="text-xs text-muted-foreground">sur {stats.required} requis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{missingRequired.length}</div>
            <div className="text-sm text-muted-foreground">Manquants</div>
            <div className="text-xs text-muted-foreground">obligatoires</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((stats.completed / stats.total) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Progression</div>
            <div className="text-xs text-muted-foreground">globale</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {missingRequired.length > 0 && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{missingRequired.length} champs obligatoires</strong> doivent être renseignés avant de pouvoir
            générer le contrat.
          </AlertDescription>
        </Alert>
      )}

      {/* Formulaire par onglets */}
      <Tabs defaultValue="parties" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="logement">Logement</TabsTrigger>
          <TabsTrigger value="financier">Financier</TabsTrigger>
          <TabsTrigger value="duree">Durée</TabsTrigger>
          <TabsTrigger value="annexes">Annexes</TabsTrigger>
          <TabsTrigger value="autres">Autres</TabsTrigger>
        </TabsList>

        {Object.entries(categories).map(([categoryName, fieldNames]) => (
          <TabsContent key={categoryName} value={categoryName}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{categoryName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fieldNames.map((fieldName) => {
                    const field = mappedData[fieldName]
                    if (!field) return null

                    return (
                      <div key={fieldName} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={fieldName}>{field.label}</Label>
                          {field.required && (
                            <Badge variant="destructive" className="text-xs">
                              Obligatoire
                            </Badge>
                          )}
                          {field.source === "auto" && (
                            <Badge variant="outline" className="text-xs">
                              Auto
                            </Badge>
                          )}
                          {field.source === "missing" && (
                            <Badge variant="secondary" className="text-xs">
                              Manquant
                            </Badge>
                          )}
                        </div>
                        {renderField(fieldName, field)}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between items-center mt-8">
        <div className="text-sm text-muted-foreground">
          {missingRequired.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              Toutes les données obligatoires sont renseignées
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              {missingRequired.length} champs obligatoires manquants
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
          <Button onClick={generateDocument} disabled={missingRequired.length > 0 || saving}>
            <FileText className="h-4 w-4 mr-2" />
            Générer le contrat
          </Button>
        </div>
      </div>
    </div>
  )
}

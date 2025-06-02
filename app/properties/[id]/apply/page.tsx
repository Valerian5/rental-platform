"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Upload, FileText, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface Property {
  id: string
  title: string
  address: string
  city: string
  price: number
  surface: number
  rooms: number
  bedrooms: number
  owner_id: string
  property_images: Array<{ id: string; url: string; is_primary: boolean }>
}

interface ApplicationForm {
  message: string
  income: number
  profession: string
  company: string
  contract_type: string
  has_guarantor: boolean
  guarantor_name: string
  guarantor_relationship: string
  guarantor_profession: string
  guarantor_income: number
  move_in_date: string
  duration_preference: string
  presentation: string
}

const REQUIRED_DOCUMENTS = [
  { type: "identity", label: "Pièce d'identité", required: true },
  { type: "income_proof", label: "Justificatifs de revenus (3 derniers mois)", required: true },
  { type: "employment_certificate", label: "Attestation employeur", required: true },
  { type: "tax_notice", label: "Avis d'imposition", required: true },
  { type: "rent_receipts", label: "Quittances de loyer actuelles", required: false },
  { type: "bank_statements", label: "Relevés bancaires (3 derniers mois)", required: true },
]

export default function PropertyApplicationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<Set<string>>(new Set())

  const [form, setForm] = useState<ApplicationForm>({
    message: "",
    income: 0,
    profession: "",
    company: "",
    contract_type: "",
    has_guarantor: false,
    guarantor_name: "",
    guarantor_relationship: "",
    guarantor_profession: "",
    guarantor_income: 0,
    move_in_date: "",
    duration_preference: "",
    presentation: "",
  })

  useEffect(() => {
    loadProperty()
  }, [params.id])

  const loadProperty = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/properties/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProperty(data.property)
      } else {
        toast.error("Propriété non trouvée")
        router.push("/tenant/search")
      }
    } catch (error) {
      console.error("Erreur chargement propriété:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (documentType: string, file: File) => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", documentType)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setUploadedDocuments((prev) => new Set([...prev, documentType]))
        toast.success("Document uploadé avec succès")
        return data.url
      } else {
        throw new Error("Erreur upload")
      }
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors de l'upload du document")
      return null
    }
  }

  const calculateCompatibilityScore = () => {
    if (!property) return 0

    // Récupérer les données du dossier de location de l'utilisateur
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const rentalFileData = JSON.parse(localStorage.getItem(`rental_file_${user.id}`) || "{}")

    // Utiliser les revenus du travail du dossier de location
    const workIncome = rentalFileData.main_tenant?.income_sources?.work_income?.amount || 0
    const income = workIncome || form.income || 0

    let score = 0
    const rentRatio = income / property.price

    // Ratio revenus/loyer (40 points)
    if (rentRatio >= 3) score += 40
    else if (rentRatio >= 2.5) score += 30
    else if (rentRatio >= 2) score += 20
    else score += 10

    // Stabilité professionnelle (20 points)
    const professionalSituation = rentalFileData.main_tenant?.main_activity || form.contract_type
    if (professionalSituation === "cdi") score += 20
    else if (professionalSituation === "cdd") score += 15
    else score += 10

    // Garant (20 points)
    const hasGuarantor = rentalFileData.guarantors?.length > 0 || form.has_guarantor
    if (hasGuarantor) score += 20

    // Documents (15 points)
    const requiredDocs = REQUIRED_DOCUMENTS.filter((doc) => doc.required)
    const uploadedRequiredDocs = requiredDocs.filter((doc) => uploadedDocuments.has(doc.type))
    score += (uploadedRequiredDocs.length / requiredDocs.length) * 15

    // Présentation (5 points)
    const presentationMessage = rentalFileData.presentation_message || form.presentation
    if (presentationMessage && presentationMessage.length > 100) score += 5

    return Math.min(Math.round(score), 100)
  }

  const isFormValid = () => {
    const requiredFields = [
      form.income > 0,
      form.profession.trim() !== "",
      form.contract_type !== "",
      form.move_in_date !== "",
      form.presentation.trim() !== "",
    ]

    const requiredDocs = REQUIRED_DOCUMENTS.filter((doc) => doc.required)
    const hasAllRequiredDocs = requiredDocs.every((doc) => uploadedDocuments.has(doc.type))

    const guarantorValid =
      !form.has_guarantor ||
      (form.guarantor_name.trim() !== "" && form.guarantor_relationship !== "" && form.guarantor_income > 0)

    return requiredFields.every(Boolean) && hasAllRequiredDocs && guarantorValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid()) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    if (!property) return

    try {
      setSubmitting(true)

      // Récupérer l'utilisateur connecté
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) {
        toast.error("Vous devez être connecté pour postuler")
        return
      }

      // Récupérer les données du dossier de location
      const rentalFileData = JSON.parse(localStorage.getItem(`rental_file_${user.id}`) || "{}")

      const applicationData = {
        property_id: property.id,
        tenant_id: user.id,
        owner_id: property.owner_id,
        message: form.message,
        // Utiliser les données du dossier de location en priorité
        income: rentalFileData.main_tenant?.income_sources?.work_income?.amount || form.income,
        profession: rentalFileData.main_tenant?.profession || form.profession,
        company: rentalFileData.main_tenant?.company || form.company,
        contract_type: rentalFileData.main_tenant?.main_activity || form.contract_type,
        has_guarantor: rentalFileData.guarantors?.length > 0 || form.has_guarantor,
        // Autres champs du formulaire
        guarantor_name: form.guarantor_name,
        guarantor_relationship: form.guarantor_relationship,
        guarantor_profession: form.guarantor_profession,
        guarantor_income: form.guarantor_income,
        move_in_date: form.move_in_date,
        duration_preference: form.duration_preference,
        presentation: form.presentation,
      }

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicationData),
      })

      if (response.ok) {
        toast.success("Candidature envoyée avec succès !")
        router.push("/tenant/applications")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erreur lors de l'envoi de la candidature")
      }
    } catch (error) {
      console.error("Erreur soumission:", error)
      toast.error("Erreur lors de l'envoi de la candidature")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Propriété non trouvée</div>
      </div>
    )
  }

  const compatibilityScore = calculateCompatibilityScore()
  const primaryImage = property.property_images?.find((img) => img.is_primary) || property.property_images?.[0]

  return (
    <div className="container mx-auto py-6">
      <Button asChild variant="ghost" className="mb-4">
        <Link href={`/properties/${property.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'annonce
        </Link>
      </Button>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sidebar - Informations du bien */}
        <div className="xl:col-span-1 order-2 xl:order-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bien concerné</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-md">
                <img
                  src={primaryImage?.url || "/placeholder.svg?height=200&width=300"}
                  alt={property.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold">{property.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {property.address}, {property.city}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Loyer</p>
                  <p className="font-medium">{property.price} €/mois</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Surface</p>
                  <p className="font-medium">{property.surface} m²</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pièces</p>
                  <p className="font-medium">{property.rooms}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Chambres</p>
                  <p className="font-medium">{property.bedrooms}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score de compatibilité */}
          <Card>
            <CardHeader>
              <CardTitle>Score de compatibilité</CardTitle>
              <CardDescription>Basé sur vos revenus et les critères du propriétaire</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{compatibilityScore}%</span>
                <Badge
                  variant={
                    compatibilityScore >= 80 ? "default" : compatibilityScore >= 60 ? "secondary" : "destructive"
                  }
                >
                  {compatibilityScore >= 80 ? "Excellent" : compatibilityScore >= 60 ? "Bon" : "À améliorer"}
                </Badge>
              </div>
              <Progress value={compatibilityScore} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">Complétez votre dossier pour améliorer votre score</p>
            </CardContent>
          </Card>
        </div>

        {/* Formulaire principal */}
        <div className="xl:col-span-2 order-1 xl:order-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Candidature pour {property.title}</CardTitle>
                <CardDescription>Remplissez ce formulaire pour postuler à ce logement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Message de motivation */}
                <div className="space-y-2">
                  <Label htmlFor="message">Message au propriétaire (optionnel)</Label>
                  <Textarea
                    id="message"
                    placeholder="Présentez-vous brièvement au propriétaire..."
                    value={form.message}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Situation professionnelle */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Situation professionnelle</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profession">Profession *</Label>
                      <Input
                        id="profession"
                        value={form.profession}
                        onChange={(e) => setForm((prev) => ({ ...prev, profession: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Entreprise</Label>
                      <Input
                        id="company"
                        value={form.company}
                        onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contract_type">Type de contrat *</Label>
                      <Select
                        value={form.contract_type}
                        onValueChange={(value) => setForm((prev) => ({ ...prev, contract_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CDI">CDI</SelectItem>
                          <SelectItem value="CDD">CDD</SelectItem>
                          <SelectItem value="Freelance">Freelance</SelectItem>
                          <SelectItem value="Fonctionnaire">Fonctionnaire</SelectItem>
                          <SelectItem value="Étudiant">Étudiant</SelectItem>
                          <SelectItem value="Retraité">Retraité</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="income">Revenus mensuels nets (€) *</Label>
                      <Input
                        id="income"
                        type="number"
                        value={form.income || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, income: Number(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Garant */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={form.has_guarantor}
                      onCheckedChange={(checked) => setForm((prev) => ({ ...prev, has_guarantor: checked }))}
                    />
                    <Label>J'ai un garant</Label>
                  </div>

                  {form.has_guarantor && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="guarantor_name">Nom du garant *</Label>
                        <Input
                          id="guarantor_name"
                          value={form.guarantor_name}
                          onChange={(e) => setForm((prev) => ({ ...prev, guarantor_name: e.target.value }))}
                          required={form.has_guarantor}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guarantor_relationship">Lien de parenté *</Label>
                        <Select
                          value={form.guarantor_relationship}
                          onValueChange={(value) => setForm((prev) => ({ ...prev, guarantor_relationship: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Parent">Parent</SelectItem>
                            <SelectItem value="Conjoint">Conjoint</SelectItem>
                            <SelectItem value="Frère/Sœur">Frère/Sœur</SelectItem>
                            <SelectItem value="Ami">Ami</SelectItem>
                            <SelectItem value="Autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guarantor_profession">Profession du garant</Label>
                        <Input
                          id="guarantor_profession"
                          value={form.guarantor_profession}
                          onChange={(e) => setForm((prev) => ({ ...prev, guarantor_profession: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guarantor_income">Revenus du garant (€) *</Label>
                        <Input
                          id="guarantor_income"
                          type="number"
                          value={form.guarantor_income || ""}
                          onChange={(e) => setForm((prev) => ({ ...prev, guarantor_income: Number(e.target.value) }))}
                          required={form.has_guarantor}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Projet de location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Projet de location</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="move_in_date">Date d'emménagement souhaitée *</Label>
                      <Input
                        id="move_in_date"
                        type="date"
                        value={form.move_in_date}
                        onChange={(e) => setForm((prev) => ({ ...prev, move_in_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration_preference">Durée souhaitée</Label>
                      <Select
                        value={form.duration_preference}
                        onValueChange={(value) => setForm((prev) => ({ ...prev, duration_preference: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Court terme (6 mois)">Court terme (6 mois)</SelectItem>
                          <SelectItem value="Moyen terme (1-2 ans)">Moyen terme (1-2 ans)</SelectItem>
                          <SelectItem value="Long terme (3+ ans)">Long terme (3+ ans)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Présentation personnelle */}
                <div className="space-y-2">
                  <Label htmlFor="presentation">Présentation personnelle *</Label>
                  <Textarea
                    id="presentation"
                    placeholder="Parlez de vous, de vos habitudes, de votre mode de vie..."
                    value={form.presentation}
                    onChange={(e) => setForm((prev) => ({ ...prev, presentation: e.target.value }))}
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground">{form.presentation.length}/500 caractères</p>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documents justificatifs</CardTitle>
                <CardDescription>Uploadez les documents nécessaires pour votre candidature</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {REQUIRED_DOCUMENTS.map((doc) => {
                    const isUploaded = uploadedDocuments.has(doc.type)

                    return (
                      <div key={doc.type} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${isUploaded ? "bg-green-100" : "bg-gray-100"}`}>
                            {isUploaded ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{doc.label}</p>
                            {doc.required && (
                              <Badge variant="destructive" className="text-xs">
                                Obligatoire
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {isUploaded ? (
                            <Badge variant="default">Uploadé</Badge>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const input = document.createElement("input")
                                input.type = "file"
                                input.accept = ".pdf,.jpg,.jpeg,.png"
                                input.onchange = async (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0]
                                  if (file) {
                                    await handleFileUpload(doc.type, file)
                                  }
                                }
                                input.click()
                              }}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Upload
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Formats acceptés</p>
                      <p>PDF, JPG, JPEG, PNG - Taille max: 10MB par fichier</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/properties/${property.id}`}>Annuler</Link>
              </Button>
              <Button type="submit" disabled={!isFormValid() || submitting} className="min-w-[120px]">
                {submitting ? "Envoi..." : "Envoyer ma candidature"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { FileText, User, MapPin, Euro, Download } from "lucide-react"
import { toast } from "sonner"

interface CautionnementGeneratorProps {
  leaseId: string
  leaseData: {
    locataire_nom_prenom: string
    bailleur_nom_prenom: string
    bailleur_adresse: string
    adresse_logement: string
    montant_loyer_mensuel: number
    date_prise_effet: string
    duree_contrat: string
  }
}

export function CautionnementGenerator({ leaseId, leaseData }: CautionnementGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // Informations de la caution
    prenom: "",
    nom: "",
    dateNaissance: "",
    lieuNaissance: "",
    adresse: "",

    // Type de cautionnement
    typeCaution: "solidaire", // 'simple' | 'solidaire'
    dureeEngagement: "indeterminee", // 'indeterminee' | 'determinee'
    dureeEngagementPrecision: "",

    // Informations loyer (pré-remplies)
    montantLoyerLettres: "",
    dateRevision: "",
    trimestreIRL: "1er",
    anneeIRL: new Date().getFullYear().toString(),

    // Montant engagement
    montantEngagementLettres: "",
    montantEngagementChiffres: "",

    // Signature
    lieuSignature: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const convertNumberToWords = (num: number): string => {
    // Fonction simplifiée pour convertir un nombre en lettres
    // Dans un vrai projet, utiliser une bibliothèque comme 'number-to-words'
    const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"]
    const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"]
    const tens = [
      "",
      "",
      "vingt",
      "trente",
      "quarante",
      "cinquante",
      "soixante",
      "soixante-dix",
      "quatre-vingt",
      "quatre-vingt-dix",
    ]
    const hundreds = [
      "",
      "cent",
      "deux cents",
      "trois cents",
      "quatre cents",
      "cinq cents",
      "six cents",
      "sept cents",
      "huit cents",
      "neuf cents",
    ]

    if (num === 0) return "zéro"
    if (num < 10) return units[num]
    if (num < 20) return teens[num - 10]
    if (num < 100) {
      const ten = Math.floor(num / 10)
      const unit = num % 10
      return tens[ten] + (unit > 0 ? "-" + units[unit] : "")
    }

    // Simplification pour les nombres plus grands
    return num.toString() + " euros"
  }

  const autoFillAmounts = () => {
    const monthlyRent = leaseData.montant_loyer_mensuel
    const yearlyRent = monthlyRent * 12
    const engagementAmount = yearlyRent * 3 // 3 ans par défaut

    setFormData((prev) => ({
      ...prev,
      montantLoyerLettres: convertNumberToWords(monthlyRent),
      montantEngagementChiffres: engagementAmount.toString(),
      montantEngagementLettres: convertNumberToWords(engagementAmount),
    }))
  }

  const generateCautionnement = async () => {
    try {
      setGenerating(true)

      // Validation des champs obligatoires
      if (!formData.prenom || !formData.nom || !formData.dateNaissance || !formData.adresse) {
        toast.error("Veuillez remplir tous les champs obligatoires de la caution")
        return
      }

      const response = await fetch(`/api/leases/${leaseId}/generate-cautionnement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cautionData: formData }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la génération")
      }

      setGeneratedDocument(result.document)
      toast.success("Acte de cautionnement généré avec succès")
    } catch (error) {
      console.error("Erreur génération cautionnement:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la génération")
    } finally {
      setGenerating(false)
    }
  }

  const downloadDocument = () => {
    if (!generatedDocument) return

    const blob = new Blob([generatedDocument], { type: "text/plain;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `acte-cautionnement-${leaseId}.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Générateur d'acte de cautionnement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations de la caution */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4" />
              <h3 className="font-medium">Informations de la caution</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => handleInputChange("prenom", e.target.value)}
                  placeholder="Prénom de la caution"
                />
              </div>
              <div>
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => handleInputChange("nom", e.target.value)}
                  placeholder="Nom de la caution"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateNaissance">Date de naissance *</Label>
                <Input
                  id="dateNaissance"
                  type="date"
                  value={formData.dateNaissance}
                  onChange={(e) => handleInputChange("dateNaissance", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lieuNaissance">Lieu de naissance</Label>
                <Input
                  id="lieuNaissance"
                  value={formData.lieuNaissance}
                  onChange={(e) => handleInputChange("lieuNaissance", e.target.value)}
                  placeholder="Ville de naissance"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="adresse">Adresse complète *</Label>
              <Textarea
                id="adresse"
                value={formData.adresse}
                onChange={(e) => handleInputChange("adresse", e.target.value)}
                placeholder="Adresse complète de la caution"
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Type de cautionnement */}
          <div className="space-y-4">
            <h3 className="font-medium">Type de cautionnement</h3>

            <div>
              <Label>Type de caution</Label>
              <RadioGroup
                value={formData.typeCaution}
                onValueChange={(value) => handleInputChange("typeCaution", value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="solidaire" id="solidaire" />
                  <Label htmlFor="solidaire">
                    <strong>Caution solidaire</strong> - Le bailleur peut réclamer directement à la caution
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="simple" id="simple" />
                  <Label htmlFor="simple">
                    <strong>Caution simple</strong> - Le bailleur doit d'abord réclamer au locataire
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Durée de l'engagement</Label>
              <RadioGroup
                value={formData.dureeEngagement}
                onValueChange={(value) => handleInputChange("dureeEngagement", value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="indeterminee" id="indeterminee" />
                  <Label htmlFor="indeterminee">Durée indéterminée</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="determinee" id="determinee" />
                  <Label htmlFor="determinee">Durée déterminée</Label>
                </div>
              </RadioGroup>

              {formData.dureeEngagement === "determinee" && (
                <Input
                  className="mt-2"
                  value={formData.dureeEngagementPrecision}
                  onChange={(e) => handleInputChange("dureeEngagementPrecision", e.target.value)}
                  placeholder="Ex: Durée du bail et d'un renouvellement"
                />
              )}
            </div>
          </div>

          <Separator />

          {/* Informations financières */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Euro className="h-4 w-4" />
              <h3 className="font-medium">Informations financières</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoFillAmounts}
                className="ml-auto bg-transparent"
              >
                Remplir automatiquement
              </Button>
            </div>

            <div>
              <Label htmlFor="montantLoyerLettres">Montant du loyer en lettres</Label>
              <Input
                id="montantLoyerLettres"
                value={formData.montantLoyerLettres}
                onChange={(e) => handleInputChange("montantLoyerLettres", e.target.value)}
                placeholder="Ex: six cents euros"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dateRevision">Date de révision du loyer</Label>
                <Input
                  id="dateRevision"
                  value={formData.dateRevision}
                  onChange={(e) => handleInputChange("dateRevision", e.target.value)}
                  placeholder="Ex: 1er janvier"
                />
              </div>
              <div>
                <Label htmlFor="trimestreIRL">Trimestre IRL</Label>
                <Select
                  value={formData.trimestreIRL}
                  onValueChange={(value) => handleInputChange("trimestreIRL", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1er">1er trimestre</SelectItem>
                    <SelectItem value="2e">2e trimestre</SelectItem>
                    <SelectItem value="3e">3e trimestre</SelectItem>
                    <SelectItem value="4e">4e trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="anneeIRL">Année IRL</Label>
                <Input
                  id="anneeIRL"
                  value={formData.anneeIRL}
                  onChange={(e) => handleInputChange("anneeIRL", e.target.value)}
                  placeholder="2024"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="montantEngagementLettres">Montant engagement en lettres</Label>
                <Input
                  id="montantEngagementLettres"
                  value={formData.montantEngagementLettres}
                  onChange={(e) => handleInputChange("montantEngagementLettres", e.target.value)}
                  placeholder="Ex: vingt-deux mille euros"
                />
              </div>
              <div>
                <Label htmlFor="montantEngagementChiffres">Montant engagement en chiffres</Label>
                <Input
                  id="montantEngagementChiffres"
                  value={formData.montantEngagementChiffres}
                  onChange={(e) => handleInputChange("montantEngagementChiffres", e.target.value)}
                  placeholder="22000"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Lieu de signature */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4" />
              <h3 className="font-medium">Signature</h3>
            </div>

            <div>
              <Label htmlFor="lieuSignature">Lieu de signature</Label>
              <Input
                id="lieuSignature"
                value={formData.lieuSignature}
                onChange={(e) => handleInputChange("lieuSignature", e.target.value)}
                placeholder="Ex: Paris"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateCautionnement} disabled={generating} className="flex-1">
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Génération...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Générer l'acte de cautionnement
                </>
              )}
            </Button>

            {generatedDocument && (
              <Button onClick={downloadDocument} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Aperçu du document généré */}
      {generatedDocument && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu de l'acte de cautionnement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">{generatedDocument}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Briefcase, FileText } from "lucide-react"

interface ProfessionalInfoFormProps {
  data: any
  onUpdate: (data: any) => void
}

const PROFESSIONAL_SITUATIONS = [
  { value: "cdi", label: "CDI", description: "Contrat à durée indéterminée" },
  { value: "cdd", label: "CDD", description: "Contrat à durée déterminée" },
  { value: "interim", label: "Intérimaire", description: "Travail temporaire" },
  { value: "independant", label: "Indépendant", description: "Travailleur indépendant" },
  { value: "retraite", label: "Retraité", description: "Pension de retraite" },
  { value: "etudes", label: "Étudiant", description: "Avec ou sans bourse" },
  { value: "chomage", label: "Demandeur d'emploi", description: "Avec ou sans allocations" },
]

const CONTRACT_TYPES = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "interim", label: "Intérim" },
  { value: "stage", label: "Stage" },
  { value: "apprentissage", label: "Apprentissage" },
  { value: "freelance", label: "Freelance" },
]

export function ProfessionalInfoForm({ data, onUpdate }: ProfessionalInfoFormProps) {
  const handleChange = (field: string, value: any) => {
    onUpdate({ ...data, [field]: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Briefcase className="h-5 w-5 mr-2" />
          Informations professionnelles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Situation professionnelle principale */}
        <div className="space-y-2">
          <Label htmlFor="professional_situation">Situation professionnelle *</Label>
          <Select
            value={data.professional_situation || ""}
            onValueChange={(value) => handleChange("professional_situation", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez votre situation" />
            </SelectTrigger>
            <SelectContent>
              {PROFESSIONAL_SITUATIONS.map((situation) => (
                <SelectItem key={situation.value} value={situation.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{situation.label}</span>
                    <span className="text-sm text-gray-500">{situation.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Revenus mensuels */}
        <div className="space-y-2">
          <Label htmlFor="monthly_income">Revenus mensuels nets (€) *</Label>
          <Input
            id="monthly_income"
            type="number"
            value={data.monthly_income || ""}
            onChange={(e) => handleChange("monthly_income", Number(e.target.value))}
            placeholder="3000"
          />
          <p className="text-sm text-gray-500">Revenus nets après impôts et cotisations sociales</p>
        </div>

        {/* Détails professionnels (optionnels) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="profession">Profession</Label>
            <Input
              id="profession"
              value={data.profession || ""}
              onChange={(e) => handleChange("profession", e.target.value)}
              placeholder="Ex: Développeur, Comptable..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Entreprise</Label>
            <Input
              id="company"
              value={data.company || ""}
              onChange={(e) => handleChange("company", e.target.value)}
              placeholder="Nom de l'entreprise"
            />
          </div>
        </div>

        {/* Type de contrat (si salarié) */}
        {(data.professional_situation === "cdi" ||
          data.professional_situation === "cdd" ||
          data.professional_situation === "interim") && (
          <div className="space-y-2">
            <Label htmlFor="contract_type">Type de contrat</Label>
            <Select value={data.contract_type || ""} onValueChange={(value) => handleChange("contract_type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date de début d'emploi */}
        {data.professional_situation !== "retraite" && data.professional_situation !== "etudes" && (
          <div className="space-y-2">
            <Label htmlFor="employment_start_date">Date de début d'emploi</Label>
            <Input
              id="employment_start_date"
              type="date"
              value={data.employment_start_date || ""}
              onChange={(e) => handleChange("employment_start_date", e.target.value)}
            />
          </div>
        )}

        {/* Message de présentation */}
        <div className="space-y-2">
          <Label htmlFor="presentation_message">Message de présentation *</Label>
          <Textarea
            id="presentation_message"
            value={data.presentation_message || ""}
            onChange={(e) => handleChange("presentation_message", e.target.value)}
            placeholder="Présentez-vous en quelques lignes : votre situation, vos habitudes, pourquoi vous recherchez ce type de logement..."
            rows={4}
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Minimum 50 caractères pour un message complet</p>
            <Badge variant={data.presentation_message?.length >= 50 ? "default" : "secondary"}>
              {data.presentation_message?.length || 0}/500
            </Badge>
          </div>
        </div>

        {/* Informations sur le garant */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Informations sur le garant (optionnel)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guarantor_income">Revenus du garant (€)</Label>
              <Input
                id="guarantor_income"
                type="number"
                value={data.guarantor_income || ""}
                onChange={(e) => handleChange("guarantor_income", Number(e.target.value))}
                placeholder="4000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guarantor_profession">Profession du garant</Label>
              <Input
                id="guarantor_profession"
                value={data.guarantor_profession || ""}
                onChange={(e) => handleChange("guarantor_profession", e.target.value)}
                placeholder="Profession du garant"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="has_guarantor"
              checked={data.has_guarantor || false}
              onChange={(e) => handleChange("has_guarantor", e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="has_guarantor">J'ai un garant</Label>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">💡 Conseils pour votre dossier</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Soyez précis sur vos revenus nets (après impôts)</li>
            <li>• Un message de présentation personnalisé améliore vos chances</li>
            <li>• Un garant renforce considérablement votre dossier</li>
            <li>• Ces informations seront utilisées pour calculer votre compatibilité avec les logements</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

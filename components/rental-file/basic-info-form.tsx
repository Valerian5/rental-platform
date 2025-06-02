"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MAIN_ACTIVITIES } from "@/lib/rental-file-service"

interface BasicInfoFormProps {
  data: {
    monthly_income?: number
    profession?: string
    company?: string
    presentation_message?: string
    professional_situation?: string
    contract_type?: string
    employment_start_date?: string
  }
  onUpdate: (data: any) => void
}

export function BasicInfoForm({ data, onUpdate }: BasicInfoFormProps) {
  const [formData, setFormData] = useState({
    monthly_income: data.monthly_income?.toString() || "",
    profession: data.profession || "",
    company: data.company || "",
    presentation_message: data.presentation_message || "",
    professional_situation: data.professional_situation || "",
    contract_type: data.contract_type || "",
    employment_start_date: data.employment_start_date || "",
  })

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)

    // Convertir les données pour la sauvegarde
    const updateData = {
      ...newData,
      monthly_income: newData.monthly_income ? Number.parseFloat(newData.monthly_income) : undefined,
    }

    onUpdate(updateData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations de base</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenus mensuels */}
        <div className="space-y-2">
          <Label htmlFor="monthly_income">Revenus mensuels nets (€) *</Label>
          <Input
            id="monthly_income"
            type="number"
            placeholder="3000"
            value={formData.monthly_income}
            onChange={(e) => handleChange("monthly_income", e.target.value)}
          />
          <p className="text-sm text-gray-500">Indiquez vos revenus nets mensuels (salaire, pensions, aides, etc.)</p>
        </div>

        {/* Situation professionnelle */}
        <div className="space-y-2">
          <Label htmlFor="professional_situation">Situation professionnelle *</Label>
          <Select
            value={formData.professional_situation}
            onValueChange={(value) => handleChange("professional_situation", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez votre situation" />
            </SelectTrigger>
            <SelectContent>
              {MAIN_ACTIVITIES.map((activity) => (
                <SelectItem key={activity.value} value={activity.value}>
                  {activity.label} - {activity.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Profession */}
        <div className="space-y-2">
          <Label htmlFor="profession">Profession *</Label>
          <Input
            id="profession"
            placeholder="Ex: Ingénieur informatique, Professeur, Comptable..."
            value={formData.profession}
            onChange={(e) => handleChange("profession", e.target.value)}
          />
        </div>

        {/* Entreprise */}
        <div className="space-y-2">
          <Label htmlFor="company">Entreprise/Employeur</Label>
          <Input
            id="company"
            placeholder="Nom de votre entreprise ou employeur"
            value={formData.company}
            onChange={(e) => handleChange("company", e.target.value)}
          />
        </div>

        {/* Type de contrat */}
        {(formData.professional_situation === "cdi" || formData.professional_situation === "cdd") && (
          <div className="space-y-2">
            <Label htmlFor="contract_type">Type de contrat</Label>
            <Select value={formData.contract_type} onValueChange={(value) => handleChange("contract_type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le type de contrat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cdi">CDI - Contrat à durée indéterminée</SelectItem>
                <SelectItem value="cdd">CDD - Contrat à durée déterminée</SelectItem>
                <SelectItem value="interim">Intérim</SelectItem>
                <SelectItem value="stage">Stage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date de début d'emploi */}
        {(formData.professional_situation === "cdi" || formData.professional_situation === "cdd") && (
          <div className="space-y-2">
            <Label htmlFor="employment_start_date">Date de début d'emploi</Label>
            <Input
              id="employment_start_date"
              type="date"
              value={formData.employment_start_date}
              onChange={(e) => handleChange("employment_start_date", e.target.value)}
            />
          </div>
        )}

        {/* Message de présentation */}
        <div className="space-y-2">
          <Label htmlFor="presentation_message">Message de présentation *</Label>
          <Textarea
            id="presentation_message"
            placeholder="Présentez-vous en quelques lignes : qui vous êtes, votre situation, pourquoi vous cherchez un logement, vos qualités en tant que locataire..."
            rows={4}
            value={formData.presentation_message}
            onChange={(e) => handleChange("presentation_message", e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Ce message sera visible par les propriétaires. Soyez authentique et rassurant.
          </p>
        </div>

        {/* Indicateur de progression */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Pourquoi ces informations ?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Les revenus permettent de vérifier votre capacité à payer le loyer</li>
            <li>• La situation professionnelle rassure sur la stabilité de vos revenus</li>
            <li>• Le message de présentation vous permet de vous démarquer</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

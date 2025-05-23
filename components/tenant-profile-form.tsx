"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export function TenantProfileForm() {
  const [formData, setFormData] = useState({
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie.dupont@email.com",
    phone: "06 12 34 56 78",
    dateOfBirth: "1990-05-15",
    nationality: "française",
    address: "123 rue de la Paix",
    city: "Paris",
    postalCode: "75001",
    employmentStatus: "cdi",
    employer: "Tech Company",
    position: "Développeuse",
    monthlyIncome: "3500",
    additionalIncome: "200",
    hasGuarantor: true,
    guarantorName: "Jean Dupont",
    guarantorRelation: "parent",
    presentation: "Jeune professionnelle sérieuse et responsable, à la recherche d'un logement dans Paris.",
    smokingAllowed: false,
    petsAllowed: false,
    profilePublic: true,
  })

  const [completionPercentage, setCompletionPercentage] = useState(75)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Profile updated:", formData)
    // Here you would typically send the data to your API
  }

  const getFieldStatus = (value: string | boolean) => {
    if (typeof value === "boolean") return value
    return value && value.toString().trim() !== ""
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Profile completion */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-green-900">Complétude du profil</h3>
            <Badge variant="outline" className="text-green-700 border-green-700">
              {completionPercentage}%
            </Badge>
          </div>
          <Progress value={completionPercentage} className="w-full" />
          <p className="text-sm text-green-700 mt-2">
            Un profil complet augmente vos chances d'être sélectionné par les propriétaires
          </p>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Vos informations de base et de contact</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date de naissance *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationalité *</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => handleInputChange("nationality", e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Address */}
      <Card>
        <CardHeader>
          <CardTitle>Adresse actuelle</CardTitle>
          <CardDescription>Votre adresse de résidence actuelle</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Adresse *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal *</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => handleInputChange("postalCode", e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Situation professionnelle</CardTitle>
          <CardDescription>Informations sur votre emploi et vos revenus</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employmentStatus">Statut professionnel *</Label>
            <Select
              value={formData.employmentStatus}
              onValueChange={(value) => handleInputChange("employmentStatus", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cdi">CDI</SelectItem>
                <SelectItem value="cdd">CDD</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
                <SelectItem value="student">Étudiant</SelectItem>
                <SelectItem value="unemployed">Sans emploi</SelectItem>
                <SelectItem value="retired">Retraité</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employer">Employeur</Label>
              <Input
                id="employer"
                value={formData.employer}
                onChange={(e) => handleInputChange("employer", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Poste</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyIncome">Revenus mensuels nets (€) *</Label>
              <Input
                id="monthlyIncome"
                type="number"
                value={formData.monthlyIncome}
                onChange={(e) => handleInputChange("monthlyIncome", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalIncome">Revenus complémentaires (€)</Label>
              <Input
                id="additionalIncome"
                type="number"
                value={formData.additionalIncome}
                onChange={(e) => handleInputChange("additionalIncome", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guarantor Information */}
      <Card>
        <CardHeader>
          <CardTitle>Garant</CardTitle>
          <CardDescription>Informations sur votre garant (si applicable)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hasGuarantor">J'ai un garant</Label>
              <p className="text-sm text-muted-foreground">Un garant peut renforcer votre dossier</p>
            </div>
            <Switch
              id="hasGuarantor"
              checked={formData.hasGuarantor}
              onCheckedChange={(checked) => handleInputChange("hasGuarantor", checked)}
            />
          </div>

          {formData.hasGuarantor && (
            <>
              <div className="space-y-2">
                <Label htmlFor="guarantorName">Nom du garant</Label>
                <Input
                  id="guarantorName"
                  value={formData.guarantorName}
                  onChange={(e) => handleInputChange("guarantorName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guarantorRelation">Relation avec le garant</Label>
                <Select
                  value={formData.guarantorRelation}
                  onValueChange={(value) => handleInputChange("guarantorRelation", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez la relation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="family">Famille</SelectItem>
                    <SelectItem value="friend">Ami</SelectItem>
                    <SelectItem value="employer">Employeur</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Presentation */}
      <Card>
        <CardHeader>
          <CardTitle>Présentation</CardTitle>
          <CardDescription>Présentez-vous aux propriétaires</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="presentation">Message de présentation</Label>
            <Textarea
              id="presentation"
              value={formData.presentation}
              onChange={(e) => handleInputChange("presentation", e.target.value)}
              rows={4}
              placeholder="Présentez-vous en quelques mots..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="smokingAllowed">Fumeur</Label>
                <p className="text-sm text-muted-foreground">Indiquez si vous fumez</p>
              </div>
              <Switch
                id="smokingAllowed"
                checked={formData.smokingAllowed}
                onCheckedChange={(checked) => handleInputChange("smokingAllowed", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="petsAllowed">Animaux de compagnie</Label>
                <p className="text-sm text-muted-foreground">Avez-vous des animaux ?</p>
              </div>
              <Switch
                id="petsAllowed"
                checked={formData.petsAllowed}
                onCheckedChange={(checked) => handleInputChange("petsAllowed", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de confidentialité</CardTitle>
          <CardDescription>Contrôlez la visibilité de votre profil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="profilePublic">Profil public</Label>
              <p className="text-sm text-muted-foreground">Permettre aux propriétaires de voir votre profil</p>
            </div>
            <Switch
              id="profilePublic"
              checked={formData.profilePublic}
              onCheckedChange={(checked) => handleInputChange("profilePublic", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">
          Annuler
        </Button>
        <Button type="submit">Enregistrer les modifications</Button>
      </div>
    </form>
  )
}

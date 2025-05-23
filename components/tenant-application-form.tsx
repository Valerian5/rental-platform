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
import { Separator } from "@/components/ui/separator"
import { CheckCircleIcon, AlertCircleIcon, UploadIcon } from "lucide-react"

export function TenantApplicationForm() {
  const [applicationData, setApplicationData] = useState({
    occupants: 1,
    employmentStatus: "cdi",
    netIncome: "3500",
    additionalIncome: "200",
    hasGuarantor: true,
    guarantorInfo: {
      name: "Jean Dupont",
      relation: "parent",
      income: "4500",
    },
    presentation: "Jeune professionnelle sérieuse et responsable, à la recherche d'un logement stable.",
    desiredMoveIn: "2025-07-01",
    desiredDuration: "12",
    pets: false,
    smoking: false,
  })

  const [documents, setDocuments] = useState({
    idCard: { uploaded: true, required: true },
    proofOfIncome: { uploaded: true, required: true },
    employmentContract: { uploaded: false, required: true },
    bankStatements: { uploaded: true, required: true },
    previousRentReceipts: { uploaded: false, required: false },
    guarantorDocuments: { uploaded: false, required: true },
    insuranceProof: { uploaded: false, required: true },
  })

  const [completionPercentage, setCompletionPercentage] = useState(65)

  const handleInputChange = (field: string, value: any) => {
    setApplicationData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleGuarantorChange = (field: string, value: string) => {
    setApplicationData((prev) => ({
      ...prev,
      guarantorInfo: {
        ...prev.guarantorInfo,
        [field]: value,
      },
    }))
  }

  const handleDocumentUpload = (documentType: string) => {
    setDocuments((prev) => ({
      ...prev,
      [documentType]: {
        ...prev[documentType as keyof typeof prev],
        uploaded: true,
      },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Application submitted:", applicationData)
  }

  const getDocumentIcon = (document: { uploaded: boolean; required: boolean }) => {
    if (document.uploaded) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />
    } else if (document.required) {
      return <AlertCircleIcon className="h-4 w-4 text-red-500" />
    } else {
      return <AlertCircleIcon className="h-4 w-4 text-orange-500" />
    }
  }

  const getDocumentStatus = (document: { uploaded: boolean; required: boolean }) => {
    if (document.uploaded) {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          Téléchargé
        </Badge>
      )
    } else if (document.required) {
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          Requis
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-600">
          Optionnel
        </Badge>
      )
    }
  }

  return (
    <div className="space-y-8">
      {/* Application completion */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-blue-900">Complétude du dossier</h3>
            <Badge variant="outline" className="text-blue-700 border-blue-700">
              {completionPercentage}%
            </Badge>
          </div>
          <Progress value={completionPercentage} className="w-full" />
          <p className="text-sm text-blue-700 mt-2">
            Un dossier complet augmente considérablement vos chances d'être sélectionné
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>Détails sur votre candidature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occupants">Nombre d'occupants *</Label>
                <Select
                  value={applicationData.occupants.toString()}
                  onValueChange={(value) => handleInputChange("occupants", Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le nombre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 personne</SelectItem>
                    <SelectItem value="2">2 personnes</SelectItem>
                    <SelectItem value="3">3 personnes</SelectItem>
                    <SelectItem value="4">4 personnes</SelectItem>
                    <SelectItem value="5">5+ personnes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentStatus">Statut professionnel *</Label>
                <Select
                  value={applicationData.employmentStatus}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="netIncome">Revenus nets mensuels (€) *</Label>
                <Input
                  id="netIncome"
                  type="number"
                  value={applicationData.netIncome}
                  onChange={(e) => handleInputChange("netIncome", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalIncome">Revenus complémentaires (€)</Label>
                <Input
                  id="additionalIncome"
                  type="number"
                  value={applicationData.additionalIncome}
                  onChange={(e) => handleInputChange("additionalIncome", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="desiredMoveIn">Date d'emménagement souhaitée *</Label>
                <Input
                  id="desiredMoveIn"
                  type="date"
                  value={applicationData.desiredMoveIn}
                  onChange={(e) => handleInputChange("desiredMoveIn", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desiredDuration">Durée de location souhaitée (mois)</Label>
                <Select
                  value={applicationData.desiredDuration}
                  onValueChange={(value) => handleInputChange("desiredDuration", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez la durée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 mois</SelectItem>
                    <SelectItem value="12">1 an</SelectItem>
                    <SelectItem value="24">2 ans</SelectItem>
                    <SelectItem value="36">3 ans</SelectItem>
                    <SelectItem value="indefinite">Indéterminée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guarantor Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations sur le garant</CardTitle>
            <CardDescription>Détails sur votre garant (si applicable)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="hasGuarantor">J'ai un garant</Label>
                <p className="text-sm text-muted-foreground">Un garant renforce considérablement votre dossier</p>
              </div>
              <Switch
                id="hasGuarantor"
                checked={applicationData.hasGuarantor}
                onCheckedChange={(checked) => handleInputChange("hasGuarantor", checked)}
              />
            </div>

            {applicationData.hasGuarantor && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guarantorName">Nom complet du garant *</Label>
                    <Input
                      id="guarantorName"
                      value={applicationData.guarantorInfo.name}
                      onChange={(e) => handleGuarantorChange("name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guarantorRelation">Relation avec le garant *</Label>
                    <Select
                      value={applicationData.guarantorInfo.relation}
                      onValueChange={(value) => handleGuarantorChange("relation", value)}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guarantorIncome">Revenus nets mensuels du garant (€) *</Label>
                  <Input
                    id="guarantorIncome"
                    type="number"
                    value={applicationData.guarantorInfo.income}
                    onChange={(e) => handleGuarantorChange("income", e.target.value)}
                    required
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Presentation */}
        <Card>
          <CardHeader>
            <CardTitle>Présentation personnelle</CardTitle>
            <CardDescription>Présentez-vous aux propriétaires pour vous démarquer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="presentation">Message de présentation *</Label>
              <Textarea
                id="presentation"
                value={applicationData.presentation}
                onChange={(e) => handleInputChange("presentation", e.target.value)}
                rows={4}
                placeholder="Présentez-vous en quelques mots, parlez de votre situation, vos motivations..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Conseil : Soyez authentique et mettez en avant vos qualités de locataire
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pets">Animaux de compagnie</Label>
                  <p className="text-sm text-muted-foreground">Avez-vous des animaux ?</p>
                </div>
                <Switch
                  id="pets"
                  checked={applicationData.pets}
                  onCheckedChange={(checked) => handleInputChange("pets", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smoking">Fumeur</Label>
                  <p className="text-sm text-muted-foreground">Fumez-vous ?</p>
                </div>
                <Switch
                  id="smoking"
                  checked={applicationData.smoking}
                  onCheckedChange={(checked) => handleInputChange("smoking", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documents requis</CardTitle>
            <CardDescription>Téléchargez les documents nécessaires pour votre dossier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(documents).map(([key, document]) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getDocumentIcon(document)}
                    <div>
                      <h4 className="font-medium">
                        {key === "idCard" && "Pièce d'identité"}
                        {key === "proofOfIncome" && "Justificatifs de revenus"}
                        {key === "employmentContract" && "Contrat de travail"}
                        {key === "bankStatements" && "Relevés bancaires"}
                        {key === "previousRentReceipts" && "Quittances de loyer précédentes"}
                        {key === "guarantorDocuments" && "Documents du garant"}
                        {key === "insuranceProof" && "Attestation d'assurance"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {key === "idCard" && "Carte d'identité ou passeport"}
                        {key === "proofOfIncome" && "3 derniers bulletins de salaire"}
                        {key === "employmentContract" && "Contrat de travail en cours"}
                        {key === "bankStatements" && "3 derniers relevés bancaires"}
                        {key === "previousRentReceipts" && "3 dernières quittances de loyer"}
                        {key === "guarantorDocuments" && "Pièce d'identité et justificatifs du garant"}
                        {key === "insuranceProof" && "Attestation d'assurance habitation"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getDocumentStatus(document)}
                    {!document.uploaded && (
                      <Button type="button" variant="outline" size="sm" onClick={() => handleDocumentUpload(key)}>
                        <UploadIcon className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Enregistrer le brouillon
          </Button>
          <Button type="submit">Soumettre le dossier</Button>
        </div>
      </form>
    </div>
  )
}

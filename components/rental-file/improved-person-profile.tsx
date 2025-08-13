"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, FileText, CheckCircle, Home, X, Briefcase, Euro } from "lucide-react"
import { toast } from "sonner"
import { SupabaseFileUpload } from "@/components/supabase-file-upload"
import { ImprovedIncomeSection } from "./improved-income-section"

interface ImprovedPersonProfileProps {
  profile: any
  onUpdate: (profile: any) => void
  isMainTenant?: boolean
  onRemove?: () => void
}

const ImprovedPersonProfile: React.FC<ImprovedPersonProfileProps> = ({
  profile,
  onUpdate,
  isMainTenant = false,
  onRemove,
}) => {
  const [activeSection, setActiveSection] = useState<string>("personal")

  const handleInputChange = (field: string, value: any) => {
    const updatedProfile = { ...profile, [field]: value }
    onUpdate(updatedProfile)
  }

  const handleNestedInputChange = (section: string, field: string, value: any) => {
    const updatedProfile = {
      ...profile,
      [section]: {
        ...profile[section],
        [field]: value,
      },
    }
    onUpdate(updatedProfile)
  }

  const handleFileUpload = async (category: string, urls: string[]) => {
    console.log("📁 Upload documents - Catégorie:", category, "URLs:", urls)

    const updatedProfile = { ...profile }

    // Gestion des documents d'identité
    if (category === "identity_documents") {
      if (!updatedProfile.identity_documents) updatedProfile.identity_documents = {}
      updatedProfile.identity_documents.documents = [...(updatedProfile.identity_documents.documents || []), ...urls]
    }
    // Gestion des documents d'activité (contrat de travail, etc.)
    else if (category === "activity_documents") {
      if (!updatedProfile.activity_documents) updatedProfile.activity_documents = []
      updatedProfile.activity_documents = [...updatedProfile.activity_documents, ...urls]
    }
    // Gestion des documents de logement
    else if (category === "housing_documents") {
      if (!updatedProfile.housing_documents) updatedProfile.housing_documents = {}
      updatedProfile.housing_documents.documents = [...(updatedProfile.housing_documents.documents || []), ...urls]
    }
    // Gestion des documents de logement pour "hébergé"
    else if (category === "housing_documents_heberge") {
      if (!updatedProfile.housing_documents) updatedProfile.housing_documents = {}
      updatedProfile.housing_documents.heberge_documents = [
        ...(updatedProfile.housing_documents.heberge_documents || []),
        ...urls,
      ]
    }
    // Gestion des documents de logement pour "propriétaire"
    else if (category === "housing_documents_proprietaire") {
      if (!updatedProfile.housing_documents) updatedProfile.housing_documents = {}
      updatedProfile.housing_documents.proprietaire_documents = [
        ...(updatedProfile.housing_documents.proprietaire_documents || []),
        ...urls,
      ]
    }

    console.log("📁 Profil mis à jour avec URLs Supabase:", updatedProfile)
    onUpdate(updatedProfile)
    toast.success(`${urls.length} document(s) ajouté(s) avec succès`)
  }

  const getCompletionStatus = () => {
    const sections = {
      personal: !!(profile.first_name && profile.last_name && profile.email && profile.phone),
      identity: !!(profile.identity_documents?.documents?.length > 0),
      activity: !!(profile.activity_documents?.length > 0),
      housing: !!(
        profile.housing_documents?.situation &&
        (profile.housing_documents.situation === "locataire"
          ? profile.housing_documents.documents?.length > 0
          : profile.housing_documents.situation === "heberge"
            ? profile.housing_documents.heberge_documents?.length > 0
            : profile.housing_documents.proprietaire_documents?.length > 0)
      ),
      income: !!(profile.income_sources && Object.keys(profile.income_sources).length > 0),
    }

    const completed = Object.values(sections).filter(Boolean).length
    const total = Object.keys(sections).length

    return { completed, total, sections }
  }

  const { completed, total, sections } = getCompletionStatus()

  const SectionCard = ({
    id,
    title,
    description,
    icon: Icon,
    isCompleted,
    isActive,
    onClick,
  }: {
    id: string
    title: string
    description: string
    icon: any
    isCompleted: boolean
    isActive: boolean
    onClick: () => void
  }) => (
    <Card
      className={`cursor-pointer transition-all duration-200 ${
        isActive
          ? "border-blue-500 bg-blue-50 shadow-md"
          : isCompleted
            ? "border-green-500 bg-green-50 hover:shadow-sm"
            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg ${isActive ? "bg-blue-100" : isCompleted ? "bg-green-100" : "bg-gray-100"}`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-600"}`}
              />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{title}</h4>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isCompleted && (
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                Complété
              </Badge>
            )}
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                isCompleted
                  ? "bg-green-500 border-green-500"
                  : isActive
                    ? "bg-blue-500 border-blue-500"
                    : "border-gray-300"
              }`}
            >
              {isCompleted && <CheckCircle className="h-3 w-3 text-white" />}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* En-tête avec progression */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {isMainTenant ? "Locataire principal" : "Co-locataire / Conjoint"}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {profile.first_name && profile.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : "Profil non complété"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Progression: {completed}/{total}
                </p>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(completed / total) * 100}%` }}
                  />
                </div>
              </div>
              {!isMainTenant && onRemove && (
                <Button onClick={onRemove} variant="outline" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation par sections */}
      <div className="grid gap-4">
        <SectionCard
          id="personal"
          title="Informations personnelles"
          description="Nom, prénom, contact..."
          icon={User}
          isCompleted={sections.personal}
          isActive={activeSection === "personal"}
          onClick={() => setActiveSection("personal")}
        />

        <SectionCard
          id="identity"
          title="Pièce d'identité"
          description="CNI, passeport, titre de séjour..."
          icon={FileText}
          isCompleted={sections.identity}
          isActive={activeSection === "identity"}
          onClick={() => setActiveSection("identity")}
        />

        <SectionCard
          id="activity"
          title="Justificatifs d'activité"
          description="Contrat de travail, attestation..."
          icon={Briefcase}
          isCompleted={sections.activity}
          isActive={activeSection === "activity"}
          onClick={() => setActiveSection("activity")}
        />

        <SectionCard
          id="housing"
          title="Situation de logement"
          description="Locataire, propriétaire, hébergé..."
          icon={Home}
          isCompleted={sections.housing}
          isActive={activeSection === "housing"}
          onClick={() => setActiveSection("housing")}
        />

        <SectionCard
          id="income"
          title="Justificatifs de ressources"
          description="Revenus, aides, bourses..."
          icon={Euro}
          isCompleted={sections.income}
          isActive={activeSection === "income"}
          onClick={() => setActiveSection("income")}
        />
      </div>

      {/* Contenu des sections */}
      {activeSection === "personal" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Informations personnelles</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  placeholder="Jean"
                  value={profile.first_name || ""}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  placeholder="Dupont"
                  value={profile.last_name || ""}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean.dupont@email.com"
                  value={profile.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  placeholder="06 12 34 56 78"
                  value={profile.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="birth_date">Date de naissance</Label>
              <Input
                id="birth_date"
                type="date"
                value={profile.birth_date || ""}
                onChange={(e) => handleInputChange("birth_date", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="birth_place">Lieu de naissance</Label>
              <Input
                id="birth_place"
                placeholder="Paris, France"
                value={profile.birth_place || ""}
                onChange={(e) => handleInputChange("birth_place", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="nationality">Nationalité</Label>
              <Input
                id="nationality"
                placeholder="Française"
                value={profile.nationality || ""}
                onChange={(e) => handleInputChange("nationality", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === "identity" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Pièce d'identité</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Type de document</Label>
              <Select
                value={profile.identity_documents?.type || "cni"}
                onValueChange={(value) => handleNestedInputChange("identity_documents", "type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cni">Carte nationale d'identité</SelectItem>
                  <SelectItem value="passport">Passeport</SelectItem>
                  <SelectItem value="titre_sejour">Titre de séjour</SelectItem>
                  <SelectItem value="permis_conduire">Permis de conduire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Documents d'identité *</Label>
              <p className="text-xs text-gray-600 mb-2">Recto et verso de votre pièce d'identité</p>
              <SupabaseFileUpload
                onFilesUploaded={(urls) => handleFileUpload("identity_documents", urls)}
                maxFiles={2}
                bucket="documents"
                folder="identity"
                existingFiles={profile.identity_documents?.documents || []}
                acceptedTypes={["image/*", "application/pdf"]}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === "activity" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <span>Justificatifs d'activité</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Situation professionnelle</Label>
              <Select
                value={profile.activity_documents?.situation || "salarie"}
                onValueChange={(value) => handleNestedInputChange("activity_documents", "situation", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salarie">Salarié</SelectItem>
                  <SelectItem value="fonctionnaire">Fonctionnaire</SelectItem>
                  <SelectItem value="independant">Indépendant</SelectItem>
                  <SelectItem value="etudiant">Étudiant</SelectItem>
                  <SelectItem value="retraite">Retraité</SelectItem>
                  <SelectItem value="chomage">Demandeur d'emploi</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Justificatifs d'activité *</Label>
              <p className="text-xs text-gray-600 mb-2">Contrat de travail, attestation employeur, carte étudiant...</p>
              <SupabaseFileUpload
                onFilesUploaded={(urls) => handleFileUpload("activity_documents", urls)}
                maxFiles={10}
                bucket="documents"
                folder="activity"
                existingFiles={profile.activity_documents || []}
                acceptedTypes={["image/*", "application/pdf"]}
                showPreview={true}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === "housing" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Home className="h-5 w-5 text-blue-600" />
              <span>Situation de logement</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Situation actuelle</Label>
              <Select
                value={profile.housing_documents?.situation || "locataire"}
                onValueChange={(value) => handleNestedInputChange("housing_documents", "situation", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="locataire">Locataire</SelectItem>
                  <SelectItem value="proprietaire">Propriétaire</SelectItem>
                  <SelectItem value="heberge">Hébergé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {profile.housing_documents?.situation === "locataire" && (
              <div>
                <Label className="text-sm font-medium">Justificatifs de logement *</Label>
                <p className="text-xs text-gray-600 mb-2">Bail, quittances de loyer, attestation de logement...</p>
                <SupabaseFileUpload
                  onFilesUploaded={(urls) => handleFileUpload("housing_documents", urls)}
                  maxFiles={3}
                  bucket="documents"
                  folder="housing/locataire"
                  existingFiles={profile.housing_documents?.documents || []}
                  acceptedTypes={["image/*", "application/pdf"]}
                />
              </div>
            )}

            {profile.housing_documents?.situation === "heberge" && (
              <div>
                <Label className="text-sm font-medium">Justificatifs d'hébergement *</Label>
                <p className="text-xs text-gray-600 mb-2">
                  Attestation d'hébergement, pièce d'identité de l'hébergeant...
                </p>
                <SupabaseFileUpload
                  onFilesUploaded={(urls) => handleFileUpload("housing_documents_heberge", urls)}
                  maxFiles={3}
                  bucket="documents"
                  folder="housing/heberge"
                  existingFiles={profile.housing_documents?.heberge_documents || []}
                  acceptedTypes={["image/*", "application/pdf"]}
                />
              </div>
            )}

            {profile.housing_documents?.situation === "proprietaire" && (
              <div>
                <Label className="text-sm font-medium">Justificatifs de propriété *</Label>
                <p className="text-xs text-gray-600 mb-2">Titre de propriété, taxe foncière...</p>
                <SupabaseFileUpload
                  onFilesUploaded={(urls) => handleFileUpload("housing_documents_proprietaire", urls)}
                  maxFiles={3}
                  bucket="documents"
                  folder="housing/proprietaire"
                  existingFiles={profile.housing_documents?.proprietaire_documents || []}
                  acceptedTypes={["image/*", "application/pdf"]}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeSection === "income" && <ImprovedIncomeSection profile={profile} onUpdate={onUpdate} />}
    </div>
  )
}

export default ImprovedPersonProfile

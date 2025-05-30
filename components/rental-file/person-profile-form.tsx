"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Upload, X, User, Briefcase, FileText, ChevronDown, ChevronRight } from "lucide-react"
import { SITUATION_OPTIONS } from "@/lib/rental-file-service"
import { toast } from "sonner"

interface PersonProfileFormProps {
  profile: any
  onUpdate: (profile: any) => void
  onRemove?: () => void
  title: string
  canRemove?: boolean
}

export function PersonProfileForm({ profile, onUpdate, onRemove, title, canRemove = false }: PersonProfileFormProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["personal"])
  const [uploadingItem, setUploadingItem] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const handleFileUpload = async (category: string, files: FileList | null) => {
    if (!files) return

    setUploadingItem(category)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const fileUrls = Array.from(files).map((file) => URL.createObjectURL(file))

      const updatedProfile = { ...profile }

      // Assurer que documents existe
      if (!updatedProfile.documents) {
        updatedProfile.documents = {
          identity: [],
          income_proof: [],
          tax_notice: "",
          other: [],
        }
      }

      if (category === "identity") {
        updatedProfile.documents.identity = [...(updatedProfile.documents.identity || []), ...fileUrls]
      } else if (category === "income_proof") {
        updatedProfile.documents.income_proof = [...(updatedProfile.documents.income_proof || []), ...fileUrls]
      } else if (category === "tax_notice") {
        updatedProfile.documents.tax_notice = fileUrls[0]
      } else if (category === "domicile_proof") {
        updatedProfile.documents.domicile_proof = fileUrls[0]
      } else {
        updatedProfile.documents.other = [...(updatedProfile.documents.other || []), ...fileUrls]
      }

      onUpdate(updatedProfile)
      toast.success("Document ajouté avec succès")
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors de l'upload du fichier")
    } finally {
      setUploadingItem(null)
    }
  }

  const FileUploadZone = ({
    category,
    label,
    multiple = false,
  }: { category: string; label: string; multiple?: boolean }) => {
    const isUploading = uploadingItem === category

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="relative">
          <input
            type="file"
            multiple={multiple}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileUpload(category, e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isUploading ? "border-blue-300 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            {isUploading ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-blue-600">Upload en cours...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-6 w-6 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">Ajouter {multiple ? "les documents" : "le document"}</p>
                <p className="text-xs text-gray-500">PDF, JPG, PNG (max 10MB)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            {title}
          </span>
          {canRemove && (
            <Button onClick={onRemove} size="sm" variant="outline">
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Informations personnelles */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection("personal")}
            className="w-full justify-between p-0 h-auto"
          >
            <span className="flex items-center font-medium">
              <User className="h-4 w-4 mr-2" />
              Informations personnelles
            </span>
            {expandedSections.includes("personal") ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {expandedSections.includes("personal") && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name || ""}
                    onChange={(e) => onUpdate({ ...profile, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name || ""}
                    onChange={(e) => onUpdate({ ...profile, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birth_date">Date de naissance *</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={profile.birth_date || ""}
                    onChange={(e) => onUpdate({ ...profile, birth_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="birth_place">Lieu de naissance *</Label>
                  <Input
                    id="birth_place"
                    placeholder="Ville, Pays"
                    value={profile.birth_place || ""}
                    onChange={(e) => onUpdate({ ...profile, birth_place: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="nationality">Nationalité</Label>
                <Input
                  id="nationality"
                  value={profile.nationality || "française"}
                  onChange={(e) => onUpdate({ ...profile, nationality: e.target.value })}
                />
              </div>

              <FileUploadZone category="identity" label="Pièce d'identité *" multiple />

              {profile.type === "main" && <FileUploadZone category="domicile_proof" label="Justificatif de domicile" />}
            </div>
          )}
        </div>

        {/* Section Situation professionnelle */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection("situation")}
            className="w-full justify-between p-0 h-auto"
          >
            <span className="flex items-center font-medium">
              <Briefcase className="h-4 w-4 mr-2" />
              Situation professionnelle
            </span>
            {expandedSections.includes("situation") ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {expandedSections.includes("situation") && (
            <div className="mt-4 space-y-4">
              <div>
                <Label>Quelle est votre situation ? *</Label>
                <RadioGroup
                  value={profile.situation || "employee"}
                  onValueChange={(value) => onUpdate({ ...profile, situation: value })}
                  className="mt-2"
                >
                  {SITUATION_OPTIONS.map((option) => (
                    <div key={option.value} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="font-medium">
                          {option.label}
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">{option.description}</p>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="monthly_income">Revenus nets mensuels (€) *</Label>
                <Input
                  id="monthly_income"
                  type="number"
                  placeholder="2500"
                  value={profile.monthly_income || ""}
                  onChange={(e) => onUpdate({ ...profile, monthly_income: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section Documents */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection("documents")}
            className="w-full justify-between p-0 h-auto"
          >
            <span className="flex items-center font-medium">
              <FileText className="h-4 w-4 mr-2" />
              Documents justificatifs
            </span>
            {expandedSections.includes("documents") ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {expandedSections.includes("documents") && (
            <div className="mt-4 space-y-4">
              <FileUploadZone category="income_proof" label="Justificatifs de revenus *" multiple />

              <FileUploadZone category="tax_notice" label="Avis d'imposition *" />

              {/* Documents spécifiques selon la situation */}
              {profile.situation === "student" && (
                <FileUploadZone category="student_card" label="Carte d'étudiant ou certificat de scolarité *" />
              )}

              {profile.situation === "employee" && (
                <FileUploadZone category="employment_contract" label="Contrat de travail *" />
              )}

              {profile.situation === "self_employed" && (
                <FileUploadZone category="business_registration" label="Extrait Kbis ou justificatif d'activité *" />
              )}

              {profile.situation === "unemployed" && (
                <FileUploadZone category="unemployment_proof" label="Attestation Pôle emploi *" />
              )}

              {profile.situation === "retired" && (
                <FileUploadZone category="pension_proof" label="Justificatif de pension *" />
              )}

              <FileUploadZone category="other" label="Autres documents (optionnel)" multiple />
            </div>
          )}
        </div>

        {/* Affichage des documents uploadés */}
        {profile.documents && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Documents ajoutés :</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {profile.documents.identity?.length > 0 && (
                <div className="flex items-center text-green-600">
                  <FileText className="h-4 w-4 mr-2" />
                  Pièce d'identité ({profile.documents.identity.length} fichier
                  {profile.documents.identity.length > 1 ? "s" : ""})
                </div>
              )}
              {profile.documents.income_proof?.length > 0 && (
                <div className="flex items-center text-green-600">
                  <FileText className="h-4 w-4 mr-2" />
                  Justificatifs de revenus ({profile.documents.income_proof.length} fichier
                  {profile.documents.income_proof.length > 1 ? "s" : ""})
                </div>
              )}
              {profile.documents.tax_notice && (
                <div className="flex items-center text-green-600">
                  <FileText className="h-4 w-4 mr-2" />
                  Avis d'imposition
                </div>
              )}
              {profile.documents.domicile_proof && (
                <div className="flex items-center text-green-600">
                  <FileText className="h-4 w-4 mr-2" />
                  Justificatif de domicile
                </div>
              )}
              {profile.documents.other?.length > 0 && (
                <div className="flex items-center text-green-600">
                  <FileText className="h-4 w-4 mr-2" />
                  Autres documents ({profile.documents.other.length} fichier
                  {profile.documents.other.length > 1 ? "s" : ""})
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

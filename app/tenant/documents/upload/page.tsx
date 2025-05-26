"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Upload, FileText, Calendar, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UploadDocumentPage() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    documentType: "",
    documentName: "",
    expiryDate: "",
    file: null as File | null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    try {
      // Simuler l'upload
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Rediriger vers la page de gestion locative
      router.push("/tenant/rental-management?tab=documents&success=document-uploaded")
    } catch (error) {
      console.error("Erreur lors de l'upload:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, file: e.target.files![0] }))
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "insurance":
        return "Attestation d'assurance habitation"
      case "boiler_maintenance":
        return "Certificat d'entretien chaudière"
      case "energy_certificate":
        return "Certificat énergétique"
      case "other":
        return "Autre document"
      default:
        return ""
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/tenant/rental-management" className="text-blue-600 hover:underline flex items-center mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à mon espace locataire
        </Link>
        <h1 className="text-3xl font-bold mb-2">Ajouter un document</h1>
        <p className="text-muted-foreground">Téléchargez vos documents obligatoires</p>
      </div>

      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Sécurité :</strong> Vos documents sont stockés de manière sécurisée et ne sont accessibles qu'à vous
          et votre propriétaire.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Informations du document</CardTitle>
          <CardDescription>Renseignez les détails de votre document</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="documentType">Type de document *</Label>
              <Select
                value={formData.documentType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, documentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type de document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insurance">Attestation d'assurance habitation</SelectItem>
                  <SelectItem value="boiler_maintenance">Certificat d'entretien chaudière</SelectItem>
                  <SelectItem value="energy_certificate">Certificat énergétique</SelectItem>
                  <SelectItem value="other">Autre document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentName">Nom du document *</Label>
              <Input
                id="documentName"
                placeholder="Ex: Attestation assurance habitation 2024"
                value={formData.documentName}
                onChange={(e) => setFormData((prev) => ({ ...prev, documentName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Date d'expiration *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                required
              />
              <p className="text-sm text-muted-foreground">Nous vous enverrons un rappel avant l'expiration</p>
            </div>

            <div className="space-y-3">
              <Label>Fichier du document *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-muted-foreground mb-3">Sélectionnez le fichier à télécharger</p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  required
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choisir un fichier
                  </label>
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Formats acceptés : PDF, JPG, PNG (max 10 MB)</p>
              </div>

              {formData.file && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">{formData.file.name}</p>
                    <p className="text-sm text-green-600">{(formData.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
            </div>

            {formData.documentType && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />À propos de ce document
                </h4>
                <p className="text-sm">
                  {formData.documentType === "insurance" &&
                    "L'attestation d'assurance habitation est obligatoire et doit être renouvelée chaque année. Elle couvre votre responsabilité locative."}
                  {formData.documentType === "boiler_maintenance" &&
                    "L'entretien annuel de la chaudière est obligatoire pour les logements équipés d'une chaudière gaz ou fioul."}
                  {formData.documentType === "energy_certificate" &&
                    "Le certificat énergétique indique la performance énergétique de votre logement."}
                  {formData.documentType === "other" &&
                    "Autres documents liés à votre location (état des lieux, inventaire, etc.)."}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1" asChild>
                <Link href="/tenant/rental-management">Annuler</Link>
              </Button>
              <Button type="submit" className="flex-1" disabled={isUploading || !formData.file}>
                {isUploading ? "Téléchargement..." : "Ajouter le document"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

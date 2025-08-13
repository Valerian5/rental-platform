"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"
import { SupabaseFileUpload } from "@/components/supabase-file-upload"
import { toast } from "sonner"

interface GuarantorVisaleUploadProps {
  guarantor: any
  onUpdate: (updatedGuarantor: any) => void
}

export function GuarantorVisaleUpload({ guarantor, onUpdate }: GuarantorVisaleUploadProps) {
  const [visaleData, setVisaleData] = useState({
    visale_number: guarantor.visale_number || "",
    visale_documents: guarantor.visale_documents || [],
    visale_status: guarantor.visale_status || "pending", // pending, approved, rejected
  })

  const handleVisaleDataUpdate = (field: string, value: any) => {
    const updatedData = { ...visaleData, [field]: value }
    setVisaleData(updatedData)
    onUpdate({ ...guarantor, ...updatedData })
  }

  const handleDocumentUpload = (urls: string[]) => {
    const updatedDocuments = [...visaleData.visale_documents, ...urls]
    handleVisaleDataUpdate("visale_documents", updatedDocuments)
    toast.success(`${urls.length} document(s) Visale ajouté(s)`)
  }

  const getVisaleStatusBadge = () => {
    switch (visaleData.visale_status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Visale approuvé
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Visale refusé
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            En attente Visale
          </Badge>
        )
    }
  }

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Garantie Visale</span>
          </div>
          {getVisaleStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Garantie Visale d'Action Logement</strong>
            <br />
            La garantie Visale est gratuite et couvre les loyers impayés jusqu'à 36 mois. Elle est acceptée par la
            plupart des propriétaires et renforce considérablement votre dossier.
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <a href="https://www.visale.fr" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Faire ma demande Visale
            </a>
          </Button>
        </div>

        <div>
          <Label htmlFor="visale_number">Numéro de dossier Visale</Label>
          <p className="text-xs text-gray-600 mb-2">Numéro fourni par Visale lors de votre demande</p>
          <Input
            id="visale_number"
            value={visaleData.visale_number}
            onChange={(e) => handleVisaleDataUpdate("visale_number", e.target.value)}
            placeholder="Ex: VIS-2024-123456"
          />
        </div>

        <div>
          <Label>Statut de votre demande Visale</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <Card
              className={`cursor-pointer transition-all ${
                visaleData.visale_status === "pending"
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleVisaleDataUpdate("visale_status", "pending")}
            >
              <CardContent className="p-3 text-center">
                <AlertCircle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                <span className="text-sm font-medium">En attente</span>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${
                visaleData.visale_status === "approved"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleVisaleDataUpdate("visale_status", "approved")}
            >
              <CardContent className="p-3 text-center">
                <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <span className="text-sm font-medium">Approuvé</span>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${
                visaleData.visale_status === "rejected"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleVisaleDataUpdate("visale_status", "rejected")}
            >
              <CardContent className="p-3 text-center">
                <AlertCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                <span className="text-sm font-medium">Refusé</span>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Documents Visale</Label>
          <p className="text-xs text-gray-600 mb-2">Attestation Visale, courriers de correspondance, etc.</p>
          <SupabaseFileUpload
            onFilesUploaded={handleDocumentUpload}
            maxFiles={5}
            bucket="documents"
            folder="guarantors/visale"
            existingFiles={visaleData.visale_documents}
            acceptedTypes={["image/*", "application/pdf"]}
            showPreview={true}
          />
        </div>

        {visaleData.visale_status === "approved" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Garantie Visale active</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Votre garantie Visale est approuvée. Cela renforce considérablement votre dossier de candidature.
            </p>
          </div>
        )}

        {visaleData.visale_status === "rejected" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Demande Visale refusée</strong>
              <br />
              Vous pouvez faire une nouvelle demande ou choisir un autre type de garant. Contactez Action Logement pour
              connaître les raisons du refus.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Avantages de la garantie Visale :</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Gratuite et sans frais cachés</li>
            <li>• Couvre les loyers impayés jusqu'à 36 mois</li>
            <li>• Acceptée par la plupart des propriétaires</li>
            <li>• Traitement rapide des demandes</li>
            <li>• Pas besoin de revenus du garant</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Building, AlertCircle } from "lucide-react"
import { SupabaseFileUpload } from "@/components/supabase-file-upload"
import { GuarantorVisaleUpload } from "./guarantor-visale-upload"
import { toast } from "sonner"

interface GuarantorUploadSectionProps {
  guarantor: any
  onUpdate: (updatedGuarantor: any) => void
}

export function GuarantorUploadSection({ guarantor, onUpdate }: GuarantorUploadSectionProps) {
  const handleDocumentUpload = (category: string, urls: string[]) => {
    const updatedGuarantor = { ...guarantor }

    if (!updatedGuarantor.documents) updatedGuarantor.documents = {}
    updatedGuarantor.documents[category] = [...(updatedGuarantor.documents[category] || []), ...urls]

    onUpdate(updatedGuarantor)
    toast.success(`${urls.length} document(s) ajouté(s)`)
  }

  if (guarantor.type === "organism") {
    if (guarantor.organism_type === "visale") {
      return <GuarantorVisaleUpload guarantor={guarantor} onUpdate={onUpdate} />
    }

    // Autre organisme
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Organisme de cautionnement</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="organism_name">Nom de l'organisme</Label>
            <Input
              id="organism_name"
              value={guarantor.organism_name || ""}
              onChange={(e) => onUpdate({ ...guarantor, organism_name: e.target.value })}
              placeholder="Nom de l'organisme de cautionnement"
            />
          </div>

          <div>
            <Label htmlFor="guarantee_number">Numéro de garantie</Label>
            <Input
              id="guarantee_number"
              value={guarantor.guarantee_number || ""}
              onChange={(e) => onUpdate({ ...guarantor, guarantee_number: e.target.value })}
              placeholder="Numéro de dossier ou de garantie"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Documents de l'organisme</Label>
            <p className="text-xs text-gray-600 mb-2">Attestation de cautionnement, contrat de garantie, etc.</p>
            <SupabaseFileUpload
              onFilesUploaded={(urls) => handleDocumentUpload("organism_documents", urls)}
              maxFiles={5}
              bucket="documents"
              folder="guarantors/organism"
              existingFiles={guarantor.documents?.organism_documents || []}
              acceptedTypes={["image/*", "application/pdf"]}
              showPreview={true}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Documents généralement requis :</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Attestation de cautionnement</li>
              <li>• Contrat de garantie signé</li>
              <li>• Conditions générales de la garantie</li>
              <li>• Justificatifs de solvabilité de l'organisme</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (guarantor.type === "moral_person") {
    return (
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-purple-600" />
            <span>Personne morale</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="company_name">Nom de la personne morale *</Label>
            <Input
              id="company_name"
              value={guarantor.company_name || ""}
              onChange={(e) => onUpdate({ ...guarantor, company_name: e.target.value })}
              placeholder="Nom de l'entreprise ou de l'organisation"
            />
          </div>

          <div>
            <Label htmlFor="siret">Numéro SIRET</Label>
            <Input
              id="siret"
              value={guarantor.siret || ""}
              onChange={(e) => onUpdate({ ...guarantor, siret: e.target.value })}
              placeholder="Numéro SIRET de l'entreprise"
            />
          </div>

          <div>
            <Label htmlFor="legal_representative">Représentant légal</Label>
            <Input
              id="legal_representative"
              value={guarantor.legal_representative || ""}
              onChange={(e) => onUpdate({ ...guarantor, legal_representative: e.target.value })}
              placeholder="Nom du représentant légal"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Documents de la personne morale *</Label>
            <p className="text-xs text-gray-600 mb-2">Extrait K-bis, statuts, justificatifs de solvabilité</p>
            <SupabaseFileUpload
              onFilesUploaded={(urls) => handleDocumentUpload("legal_documents", urls)}
              maxFiles={10}
              bucket="documents"
              folder="guarantors/legal"
              existingFiles={guarantor.documents?.legal_documents || []}
              acceptedTypes={["image/*", "application/pdf"]}
              showPreview={true}
            />
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">Documents requis :</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Extrait K-bis de moins de 3 mois</li>
              <li>• Statuts de l'entreprise</li>
              <li>• Derniers bilans comptables</li>
              <li>• Attestation d'engagement de caution</li>
              <li>• Pièce d'identité du représentant légal</li>
            </ul>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important :</strong> La personne morale doit justifier de sa capacité financière à honorer la
              garantie. Les documents comptables récents sont indispensables.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return null
}

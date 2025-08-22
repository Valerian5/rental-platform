"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, Check, AlertTriangle, X } from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface LeaseAnnex {
  id: string
  name: string
  type: string
  required: boolean
  description: string
  uploaded: boolean
  url?: string
}

interface LeaseAnnexesUploadProps {
  propertyId: string
  onAnnexesChange?: (documents: any[]) => void
  showRequiredOnly?: boolean
}

const REQUIRED_ANNEXES: LeaseAnnex[] = [
  {
    id: "dpe",
    name: "Diagnostic de Performance Énergétique (DPE)",
    type: "dpe",
    required: true,
    description: "Obligatoire pour toute mise en location",
    uploaded: false,
  },
  {
    id: "erp",
    name: "État des Risques et Pollutions (ERP)",
    type: "erp",
    required: true,
    description: "Obligatoire si la commune est concernée par un plan de prévention des risques",
    uploaded: false,
  },
  {
    id: "assurance_pno",
    name: "Assurance Propriétaire Non Occupant (PNO)",
    type: "assurance",
    required: true,
    description: "Attestation d'assurance obligatoire",
    uploaded: false,
  },
  {
    id: "diagnostic_plomb",
    name: "Diagnostic Plomb (CREP)",
    type: "diagnostic",
    required: true,
    description: "Obligatoire pour les logements construits avant 1949",
    uploaded: false,
  },
  {
    id: "diagnostic_amiante",
    name: "Diagnostic Amiante",
    type: "diagnostic",
    required: true,
    description: "Obligatoire pour les logements construits avant 1997",
    uploaded: false,
  },
  {
    id: "diagnostic_gaz",
    name: "Diagnostic Gaz",
    type: "diagnostic",
    required: true,
    description: "Obligatoire si installation gaz de plus de 15 ans",
    uploaded: false,
  },
  {
    id: "diagnostic_electricite",
    name: "Diagnostic Électricité",
    type: "diagnostic",
    required: true,
    description: "Obligatoire si installation électrique de plus de 15 ans",
    uploaded: false,
  },
]

const OPTIONAL_ANNEXES: LeaseAnnex[] = [
  {
    id: "reglement_copropriete",
    name: "Règlement de Copropriété",
    type: "copropriete",
    required: false,
    description: "Pour les biens en copropriété",
    uploaded: false,
  },
  {
    id: "charges_copropriete",
    name: "Relevé des Charges de Copropriété",
    type: "copropriete",
    required: false,
    description: "Détail des charges de copropriété",
    uploaded: false,
  },
  {
    id: "audit_energetique",
    name: "Audit Énergétique",
    type: "energie",
    required: false,
    description: "Obligatoire pour les passoires thermiques (F et G) depuis 2023",
    uploaded: false,
  },
  {
    id: "carnet_entretien",
    name: "Carnet d'Entretien",
    type: "entretien",
    required: false,
    description: "Historique des travaux et entretiens",
    uploaded: false,
  },
]

export function LeaseAnnexesUpload({
  propertyId,
  onAnnexesChange,
  showRequiredOnly = false,
}: LeaseAnnexesUploadProps) {
  const [annexes, setAnnexes] = useState<LeaseAnnex[]>([])
  const [uploadingAnnexes, setUploadingAnnexes] = useState<Set<string>>(new Set())

  useEffect(() => {
    const all = showRequiredOnly ? REQUIRED_ANNEXES : [...REQUIRED_ANNEXES, ...OPTIONAL_ANNEXES]
    setAnnexes(all.map((doc) => ({ ...doc })))
  }, [showRequiredOnly])

  const handleAnnexUpload = async (annexId: string, files: string[]) => {
    if (files.length === 0) return
    const fileUrl = files[0]

    setUploadingAnnexes((prev) => new Set([...prev, annexId]))

    try {
      const urlParts = fileUrl.split("/")
      const fileName = urlParts[urlParts.length - 1]

      const annexData = {
        lease_id: propertyId, // ⚡ on mappe propertyId → lease_id
        annex_type: annexId,
        annex_name: fileName,
        file_url: fileUrl,
        uploaded_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("lease_annexes").insert(annexData)

      if (error) {
        console.error("❌ Erreur sauvegarde annexe:", error)
        throw new Error(error.message)
      }

      setAnnexes((prev) =>
        prev.map((doc) => (doc.id === annexId ? { ...doc, uploaded: true, url: fileUrl } : doc)),
      )

      toast.success("Annexe uploadée avec succès")

      if (onAnnexesChange) {
        const updated = annexes.map((doc) =>
          doc.id === annexId ? { ...doc, uploaded: true, url: fileUrl } : doc,
        )
        onAnnexesChange(updated.filter((doc) => doc.uploaded))
      }
    } catch (error: any) {
      toast.error(`Erreur upload: ${error.message}`)
    } finally {
      setUploadingAnnexes((prev) => {
        const newSet = new Set(prev)
        newSet.delete(annexId)
        return newSet
      })
    }
  }

  const handleAnnexRemove = async (annexId: string) => {
    try {
      const annex = annexes.find((doc) => doc.id === annexId)
      if (!annex || !annex.uploaded) return

      if (annex.url) {
        await supabase.from("lease_annexes").delete().eq("lease_id", propertyId).eq("annex_type", annexId)
      }

      setAnnexes((prev) =>
        prev.map((doc) => (doc.id === annexId ? { ...doc, uploaded: false, url: undefined } : doc)),
      )

      if (onAnnexesChange) {
        const updated = annexes
          .map((doc) => (doc.id === annexId ? { ...doc, uploaded: false, url: undefined } : doc))
          .filter((doc) => doc.uploaded)
        onAnnexesChange(updated)
      }

      toast.success("Annexe supprimée")
    } catch (error: any) {
      toast.error(`Erreur suppression: ${error.message}`)
    }
  }

  const required = annexes.filter((doc) => doc.required)
  const optional = annexes.filter((doc) => !doc.required)
  const uploadedRequired = required.filter((doc) => doc.uploaded).length
  const totalRequired = required.length
  const completionPercentage = (uploadedRequired / totalRequired) * 100

  return (
    <div className="space-y-6">
      {/* Progression */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Annexes du bail
            </span>
            <Badge variant="outline">Optionnel</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-amber-800 text-sm">
              <strong>💡 Info :</strong> Ces annexes sont requises pour la signature du bail avec votre locataire.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Annexes obligatoires uploadées</span>
              <span>
                {uploadedRequired}/{totalRequired}
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Annexes obligatoires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-orange-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Annexes obligatoires
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {required.map((doc) => (
            <div key={doc.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium flex items-center">
                    {doc.name}
                    {doc.uploaded && <Check className="h-4 w-4 ml-2 text-green-600" />}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {doc.uploaded && (
                    <Button variant="outline" size="sm" onClick={() => handleAnnexRemove(doc.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Badge variant={doc.uploaded ? "default" : "secondary"}>
                    {doc.uploaded ? "Uploadé" : "Requis"}
                  </Badge>
                </div>
              </div>

              {!doc.uploaded && (
                <div className="mt-3">
                  <FileUpload
                    onFilesUploaded={(files) => handleAnnexUpload(doc.id, files)}
                    maxFiles={1}
                    acceptedTypes={["application/pdf", "image/*"]}
                    folder={`leases/${propertyId}/annexes`}
                    bucket="lease-annexes"
                    disabled={uploadingAnnexes.has(doc.id)}
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Annexes optionnelles */}
      {!showRequiredOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-600">
              <FileText className="h-5 w-5 mr-2" />
              Annexes optionnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {optional.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center">
                      {doc.name}
                      {doc.uploaded && <Check className="h-4 w-4 ml-2 text-green-600" />}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.uploaded && (
                      <Button variant="outline" size="sm" onClick={() => handleAnnexRemove(doc.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Badge variant={doc.uploaded ? "default" : "outline"}>
                      {doc.uploaded ? "Uploadé" : "Optionnel"}
                    </Badge>
                  </div>
                </div>

                {!doc.uploaded && (
                  <div className="mt-3">
                    <FileUpload
                      onFilesUploaded={(files) => handleAnnexUpload(doc.id, files)}
                      maxFiles={1}
                      acceptedTypes={["application/pdf", "image/*"]}
                      folder={`leases/${propertyId}/annexes`}
                      bucket="lease-annexes"
                      disabled={uploadingAnnexes.has(doc.id)}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, Check, AlertTriangle, X, Loader2 } from "lucide-react"
import { FileUpload, UploadedFile } from "@/components/file-upload" // NOTE: On suppose que FileUpload exporte le type UploadedFile { url: string, name: string, size: number }
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface PropertyDocument {
  id: string
  name: string
  type: string
  required: boolean
  description: string
  uploaded: boolean
  url?: string
}

interface PropertyDocumentsUploadProps {
  leaseId: string
  propertyId: string // Gardé pour le chemin de stockage
  onDocumentsChange?: (documents: any[]) => void
  showRequiredOnly?: boolean
}

const ALL_DOCUMENTS_TEMPLATE: PropertyDocument[] = [
    { id: "dpe", name: "Diagnostic de Performance Énergétique (DPE)", type: "dpe", required: true, description: "Obligatoire pour toute mise en location", uploaded: false },
    { id: "erp", name: "État des Risques et Pollutions (ERP)", type: "erp", required: true, description: "Obligatoire si la commune est concernée par un plan de prévention des risques", uploaded: false },
    { id: "assurance_pno", name: "Assurance Propriétaire Non Occupant (PNO)", type: "assurance", required: true, description: "Attestation d'assurance obligatoire", uploaded: false },
    { id: "diagnostic_plomb", name: "Diagnostic Plomb (CREP)", type: "diagnostic", required: true, description: "Obligatoire pour les logements construits avant 1949", uploaded: false },
    { id: "diagnostic_amiante", name: "Diagnostic Amiante", type: "diagnostic", required: true, description: "Obligatoire pour les logements construits avant 1997", uploaded: false },
    { id: "diagnostic_gaz", name: "Diagnostic Gaz", type: "diagnostic", required: true, description: "Obligatoire si installation gaz de plus de 15 ans", uploaded: false },
    { id: "diagnostic_electricite", name: "Diagnostic Électricité", type: "diagnostic", required: true, description: "Obligatoire si installation électrique de plus de 15 ans", uploaded: false },
    { id: "reglement_copropriete", name: "Règlement de Copropriété", type: "copropriete", required: false, description: "Pour les biens en copropriété", uploaded: false },
    { id: "charges_copropriete", name: "Relevé des Charges de Copropriété", type: "copropriete", required: false, description: "Détail des charges de copropriété", uploaded: false },
    { id: "audit_energetique", name: "Audit Énergétique", type: "energie", required: false, description: "Obligatoire pour les passoires thermiques (F et G) depuis 2023", uploaded: false },
    { id: "carnet_entretien", name: "Carnet d'Entretien", type: "entretien", required: false, description: "Historique des travaux et entretiens", uploaded: false },
];


export function PropertyDocumentsUpload({
  leaseId,
  propertyId,
  onDocumentsChange,
  showRequiredOnly = false,
}: PropertyDocumentsUploadProps) {
  const [documents, setDocuments] = useState<PropertyDocument[]>([])
  const [uploadingDocuments, setUploadingDocuments] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true);

  const fetchExistingAnnexes = useCallback(async () => {
    setLoading(true);
    try {
      const { data: existingAnnexes, error } = await supabase
        .from('lease_annexes')
        .select('annex_type, file_url')
        .eq('lease_id', leaseId);

      if (error) {
        throw error;
      }
      
      const uploadedTypes = new Map(existingAnnexes.map(annex => [annex.annex_type, annex.file_url]));

      const allDocs = showRequiredOnly 
        ? ALL_DOCUMENTS_TEMPLATE.filter(d => d.required) 
        : ALL_DOCUMENTS_TEMPLATE;

      const updatedDocuments = allDocs.map(doc => ({
        ...doc,
        uploaded: uploadedTypes.has(doc.id),
        url: uploadedTypes.get(doc.id) || undefined,
      }));

      setDocuments(updatedDocuments);

    } catch (error: any) {
      toast.error(`Erreur lors du chargement des annexes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [leaseId, showRequiredOnly]);

  useEffect(() => {
    if (leaseId) {
      fetchExistingAnnexes();
    }
  }, [leaseId, fetchExistingAnnexes]);

  const handleDocumentUpload = async (documentId: string, uploadedFiles: UploadedFile[]) => {
    if (uploadedFiles.length === 0) return;

    const uploadedFile = uploadedFiles[0];
    setUploadingDocuments((prev) => new Set(prev).add(documentId));

    try {
      const annexData = {
        lease_id: leaseId,
        annex_type: documentId,
        file_name: uploadedFile.name,
        file_url: uploadedFile.url,
        file_size: uploadedFile.size,
      };

      const { data, error } = await supabase.from("lease_annexes").insert(annexData).select().single();

      if (error) throw error;

      await fetchExistingAnnexes(); // Re-fetch to ensure consistency
      toast.success("Document téléversé avec succès");

      if (onDocumentsChange) {
        onDocumentsChange(documents.filter(d => d.uploaded));
      }

    } catch (error: any) {
      toast.error(`Erreur lors du téléversement: ${error.message}`);
    } finally {
      setUploadingDocuments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleDocumentRemove = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from("lease_annexes")
        .delete()
        .eq("lease_id", leaseId)
        .eq("annex_type", documentId);

      if (error) throw error;
      
      await fetchExistingAnnexes(); // Re-fetch to update the list
      toast.success("Document supprimé");

       if (onDocumentsChange) {
        onDocumentsChange(documents.filter(d => d.uploaded));
      }

    } catch (error: any) {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  };
  
  if (loading) {
    return (
        <Card>
            <CardContent className="flex justify-center items-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <p className="ml-4 text-gray-600">Chargement des annexes...</p>
            </CardContent>
        </Card>
    )
  }

  const requiredDocuments = documents.filter((doc) => doc.required);
  const optionalDocuments = documents.filter((doc) => !doc.required);
  const uploadedRequired = requiredDocuments.filter((doc) => doc.uploaded).length;
  const totalRequired = requiredDocuments.length;
  const completionPercentage = totalRequired > 0 ? (uploadedRequired / totalRequired) * 100 : 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Annexes au bail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Documents obligatoires fournis</span>
              <span>{uploadedRequired} / {totalRequired}</span>
            </div>
            <Progress value={completionPercentage} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-orange-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Documents requis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requiredDocuments.map((document) => (
            <div key={document.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{document.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                  {document.uploaded && (
                    <Button variant="ghost" size="icon" onClick={() => handleDocumentRemove(document.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Badge variant={document.uploaded ? "default" : "secondary"} className={document.uploaded ? "bg-green-600" : ""}>
                    {document.uploaded ? "Fourni" : "Requis"}
                  </Badge>
                </div>
              </div>

              {!document.uploaded && (
                <div className="mt-4">
                  <FileUpload
                    onFilesUploaded={(files) => handleDocumentUpload(document.id, files)}
                    maxFiles={1}
                    acceptedTypes={["application/pdf", "image/*"]}
                    folder={`properties/${propertyId}/annexes`}
                    bucket="lease-annexes"
                    disabled={uploadingDocuments.has(document.id)}
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {!showRequiredOnly && optionalDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-600">
              <FileText className="h-5 w-5 mr-2" />
              Documents optionnels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {optionalDocuments.map((document) => (
              <div key={document.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{document.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                  </div>
                   <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    {document.uploaded && (
                      <Button variant="ghost" size="icon" onClick={() => handleDocumentRemove(document.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Badge variant={document.uploaded ? "default" : "outline"}>
                      {document.uploaded ? "Fourni" : "Optionnel"}
                    </Badge>
                  </div>
                </div>

                {!document.uploaded && (
                  <div className="mt-4">
                    <FileUpload
                      onFilesUploaded={(files) => handleDocumentUpload(document.id, files)}
                      maxFiles={1}
                      acceptedTypes={["application/pdf", "image/*"]}
                      folder={`properties/${propertyId}/annexes`}
                      bucket="lease-annexes"
                      disabled={uploadingDocuments.has(document.id)}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

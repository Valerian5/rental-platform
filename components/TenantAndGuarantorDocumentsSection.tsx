"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DownloadIcon, CheckIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { generateRentalFilePDF } from "@/lib/pdf-generator-corrected"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ApplicationDocument {
  document_id: string
  label: string
  file_url: string
  category: string
  verified: boolean
  created_at: string
  guarantor_id?: string
  guarantor_name?: string
}

interface TenantAndGuarantorDocumentsSectionProps {
  applicationId: string
  mainTenant?: any
  guarantors?: any[]
  userId: string
  userName: string
  rentalFile: any
}

export function TenantAndGuarantorDocumentsSection({
  applicationId,
  mainTenant,
  guarantors = [],
  userId,
  userName,
  rentalFile
}: TenantAndGuarantorDocumentsSectionProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const flattenDocuments = () => {
    const now = new Date().toISOString()
    const docs: ApplicationDocument[] = []

    // Documents du locataire principal
    if (mainTenant) {
      // Pièces d'identité
      if (mainTenant.identity_documents) {
        mainTenant.identity_documents.forEach((url: string, index: number) => {
          if (url && typeof url === 'string') {
            docs.push({
              document_id: `identity-${index}`,
              label: 'Pièce d\'identité',
              file_url: url,
              category: 'identity',
              verified: false,
              created_at: now
            })
          }
        })
      }

      // Documents fiscaux
      if (mainTenant.tax_situation?.documents) {
        mainTenant.tax_situation.documents.forEach((url: string, index: number) => {
          if (url && typeof url === 'string') {
            docs.push({
              document_id: `tax-${index}`,
              label: 'Avis d\'imposition',
              file_url: url,
              category: 'tax',
              verified: false,
              created_at: now
            })
          }
        })
      }

      // Revenus
      if (mainTenant.income_sources?.work_income?.documents) {
        mainTenant.income_sources.work_income.documents.forEach((url: string, index: number) => {
          if (url && typeof url === 'string') {
            docs.push({
              document_id: `income-${index}`,
              label: 'Justificatif de revenus',
              file_url: url,
              category: 'income',
              verified: false,
              created_at: now
            })
          }
        })
      }

      // Activité professionnelle
      if (mainTenant.activity_documents) {
        mainTenant.activity_documents.forEach((url: string, index: number) => {
          if (url && typeof url === 'string') {
            docs.push({
              document_id: `activity-${index}`,
              label: 'Justificatif d\'activité',
              file_url: url,
              category: 'activity',
              verified: false,
              created_at: now
            })
          }
        })
      }

      // Justificatif de domicile
      if (mainTenant.current_housing_documents?.quittances_loyer) {
        mainTenant.current_housing_documents.quittances_loyer.forEach((url: string, index: number) => {
          if (url && typeof url === 'string') {
            docs.push({
              document_id: `housing-${index}`,
              label: 'Quittance de loyer',
              file_url: url,
              category: 'housing',
              verified: false,
              created_at: now
            })
          }
        })
      }
    }

    // Documents des garants
    guarantors.forEach((guarantor, guarantorIndex) => {
      const guarantorInfo = guarantor.personal_info || {}
      const guarantorName = `${guarantorInfo.first_name || ''} ${guarantorInfo.last_name || ''}`.trim()

      // Pièces d'identité
      if (guarantorInfo.identity_documents) {
        guarantorInfo.identity_documents.forEach((url: string, index: number) => {
          if (url && typeof url === 'string') {
            docs.push({
              document_id: `guarantor-${guarantorIndex}-identity-${index}`,
              label: 'Pièce d\'identité',
              file_url: url,
              category: 'identity',
              verified: false,
              created_at: now,
              guarantor_id: guarantorIndex.toString(),
              guarantor_name: guarantorName || `Garant ${guarantorIndex + 1}`
            })
          }
        })
      }

      // Documents fiscaux
      if (guarantorInfo.tax_situation?.documents) {
        guarantorInfo.tax_situation.documents.forEach((url: string, index: number) => {
          if (url && typeof url === 'string') {
            docs.push({
              document_id: `guarantor-${guarantorIndex}-tax-${index}`,
              label: 'Avis d\'imposition',
              file_url: url,
              category: 'tax',
              verified: false,
              created_at: now,
              guarantor_id: guarantorIndex.toString(),
              guarantor_name: guarantorName || `Garant ${guarantorIndex + 1}`
            })
          }
        })
      }

      // Revenus
      if (guarantorInfo.income_sources?.work_income?.documents) {
        guarantorInfo.income_sources.work_income.documents.forEach((url: string, index: number) => {
          if (url && typeof url === 'string') {
            docs.push({
              document_id: `guarantor-${guarantorIndex}-income-${index}`,
              label: 'Justificatif de revenus',
              file_url: url,
              category: 'income',
              verified: false,
              created_at: now,
              guarantor_id: guarantorIndex.toString(),
              guarantor_name: guarantorName || `Garant ${guarantorIndex + 1}`
            })
          }
        })
      }

      // Activité professionnelle
      if (guarantorInfo.activity_documents) {
        guarantorInfo.activity_documents.forEach((url: string, index: number) => {
          if (url && typeof url === 'string') {
            docs.push({
              document_id: `guarantor-${guarantorIndex}-activity-${index}`,
              label: 'Justificatif d\'activité',
              file_url: url,
              category: 'activity',
              verified: false,
              created_at: now,
              guarantor_id: guarantorIndex.toString(),
              guarantor_name: guarantorName || `Garant ${guarantorIndex + 1}`
            })
          }
        })
      }
    })

    return docs
  }

  const handleDownloadCompleteFile = async () => {
    if (!rentalFile) {
      toast.error("Aucun dossier de location disponible");
      return;
    }

    try {
      setIsDownloading(true);
      toast.info("Génération du PDF en cours...");

      // Préparer les données avec des valeurs par défaut
      const pdfData = {
        ...rentalFile,
        id: applicationId,
        main_tenant: {
          ...(rentalFile.main_tenant || {}),
          first_name: rentalFile.main_tenant?.first_name || 'Non spécifié',
          last_name: rentalFile.main_tenant?.last_name || 'Non spécifié',
          identity_documents: rentalFile.main_tenant?.identity_documents || [],
          activity_documents: rentalFile.main_tenant?.activity_documents || [],
          income_sources: {
            ...(rentalFile.main_tenant?.income_sources || {}),
            work_income: {
              ...(rentalFile.main_tenant?.income_sources?.work_income || {}),
              documents: rentalFile.main_tenant?.income_sources?.work_income?.documents || []
            }
          }
        },
        guarantors: (rentalFile.guarantors || []).map((guarantor: any) => ({
          ...guarantor,
          type: guarantor.type || 'physical',
          personal_info: {
            ...(guarantor.personal_info || {}),
            first_name: guarantor.personal_info?.first_name || 'Non spécifié',
            last_name: guarantor.personal_info?.last_name || 'Non spécifié',
            identity_documents: guarantor.personal_info?.identity_documents || [],
            income_sources: {
              ...(guarantor.personal_info?.income_sources || {}),
              work_income: {
                ...(guarantor.personal_info?.income_sources?.work_income || {}),
                documents: guarantor.personal_info?.income_sources?.work_income?.documents || []
              }
            }
          }
        }))
      };

      // Génération du PDF
      await generateRentalFilePDF({
        rentalFile,
        userId,
        userName
      })

      toast.success("PDF généré avec succès !");
  };

  const documents = flattenDocuments();

  if (!documents.length) {
    return <p className="text-muted-foreground">Aucun document transmis.</p>;
  }

  const tenantDocs = documents.filter((doc) => !doc.guarantor_id);
  const guarantorDocs = documents.filter((doc) => doc.guarantor_id);

  const groupByGuarantor = () => {
    const map = new Map<string, ApplicationDocument[]>();
    guarantorDocs.forEach((doc) => {
      const key = doc.guarantor_id || "unknown";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(doc);
    });
    return map;
  };

  return (
    <div className="space-y-8">
      {/* Locataire */}
      <div>
        <h3 className="text-lg font-semibold">Documents du locataire</h3>
        <DocumentsGroup documents={tenantDocs} />
      </div>

      <Separator />

      {/* Garants */}
      {[...groupByGuarantor().entries()].map(([guarantorId, docs], index) => (
        <div key={guarantorId}>
          <h4 className="text-md font-semibold mb-2">
            Garant {docs[0]?.guarantor_name || `#${index + 1}`}
          </h4>
          <DocumentsGroup documents={docs} />
        </div>
      ))}

      {/* Bouton téléchargement global */}
      <div className="pt-4">
        <Button 
          onClick={handleDownloadCompleteFile} 
          disabled={isDownloading || !rentalFile}
          className="w-full sm:w-auto"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Télécharger le dossier complet (PDF)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function DocumentsGroup({ documents }: { documents: ApplicationDocument[] }) {
  if (!documents?.length) {
    return <p className="text-muted-foreground">Aucun document transmis.</p>;
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div
          key={doc.document_id}
          className="flex justify-between items-center border rounded-lg p-4"
        >
          <div>
            <p className="font-medium">{doc.label}</p>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{doc.category}</Badge>
              {doc.verified && (
                <Badge variant="success">
                  <CheckIcon size={12} className="mr-1" />
                  Vérifié
                </Badge>
              )}
            </div>
          </div>
          <a 
            href={doc.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!doc.file_url) {
                e.preventDefault();
                toast.error("Aucun document disponible");
              }
            }}
          >
            <Button variant="secondary" size="sm" disabled={!doc.file_url}>
              <DownloadIcon className="mr-1 h-4 w-4" />
              Voir
            </Button>
          </a>
        </div>
      ))}
    </div>
  );
}
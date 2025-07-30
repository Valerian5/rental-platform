import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DownloadIcon, CheckIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"

type ApplicationDocument = {
  document_id: string
  label: string
  file_url: string
  category: string
  verified: boolean
  created_at: string
  guarantor_id?: string
  guarantor_name?: string
}

export function TenantAndGuarantorDocumentsSection({
  applicationId,
  documents,
}: {
  applicationId: string
  documents: ApplicationDocument[]
}) {
  const tenantDocs = documents.filter((doc) => !doc.guarantor_id)
  const guarantorDocs = documents.filter((doc) => doc.guarantor_id)

  const groupByGuarantor = () => {
    const map = new Map<string, ApplicationDocument[]>()
    guarantorDocs.forEach((doc) => {
      const key = doc.guarantor_id || "unknown"
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(doc)
    })
    return map
  }

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
        <a
          href={`/api/tenant/applications/${applicationId}/download`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Télécharger le dossier complet (PDF)
          </Button>
        </a>
      </div>
    </div>
  )
}

function DocumentsGroup({ documents }: { documents: ApplicationDocument[] }) {
  if (!documents?.length) return <p className="text-muted-foreground">Aucun document transmis.</p>

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
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">
              <DownloadIcon className="mr-1 h-4 w-4" />
              Voir
            </Button>
          </a>
        </div>
      ))}
    </div>
  )
}

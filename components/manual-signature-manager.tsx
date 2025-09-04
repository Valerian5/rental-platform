import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth"
import { toast } from "sonner"

interface ManualSignatureManagerProps {
  leaseId: string
  leaseStatus: string
  ownerSigned: boolean
  tenantSigned: boolean
  onStatusChange?: (newStatus: string) => void
}

export function ManualSignatureManager({
  leaseId,
  leaseStatus,
  ownerSigned,
  tenantSigned,
  onStatusChange,
}: ManualSignatureManagerProps) {
  const { user } = useSession()
  const userRole = user?.role

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier")
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append("document", selectedFile)
    formData.append("signerType", userRole)
    const response = await fetch(`/api/leases/${leaseId}/upload-signed-document`, {
      method: "POST",
      body: formData,
    })
    if (response.ok) {
      toast.success("Document signé uploadé avec succès")
      onStatusChange?.("manual_signature_uploaded")
      setSelectedFile(null)
    } else {
      toast.error("Erreur lors de l'upload")
    }
    setUploading(false)
  }

  // Téléchargement du document à signer
  const downloadUrl = `/api/leases/${leaseId}/download-document`

  // Téléchargement du document final signé par les deux
  const downloadFinalUrl = `/api/leases/${leaseId}/download-final-document`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signature manuelle du bail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Étape 1 : Owner */}
        {userRole === "owner" && !ownerSigned && (
          <>
            <Button asChild>
              <a href={downloadUrl} download>
                Télécharger le bail à signer
              </a>
            </Button>
            <input type="file" accept="application/pdf" onChange={handleFileSelect} />
            <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? "Upload en cours..." : "Uploader le bail signé"}
            </Button>
          </>
        )}
        {/* Étape 2 : Tenant */}
        {userRole === "tenant" && ownerSigned && !tenantSigned && (
          <>
            <Button asChild>
              <a href={downloadUrl} download>
                Télécharger le bail signé par le propriétaire
              </a>
            </Button>
            <input type="file" accept="application/pdf" onChange={handleFileSelect} />
            <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? "Upload en cours..." : "Uploader le bail signé"}
            </Button>
          </>
        )}
        {/* Étape 3 : Document final */}
        {ownerSigned && tenantSigned && (
          <Button asChild>
            <a href={downloadFinalUrl} download>
              Télécharger le bail signé par les deux parties
            </a>
          </Button>
        )}
        {/* Affichage de l'état */}
        <div>
          {userRole === "owner" && !ownerSigned && <span>Étape 1 : Signez et uploadez le bail.</span>}
          {userRole === "tenant" && ownerSigned && !tenantSigned && <span>Étape 2 : Signez et uploadez le bail.</span>}
          {ownerSigned && tenantSigned && <span>Le bail est signé par les deux parties.</span>}
        </div>
      </CardContent>
    </Card>
  )
}

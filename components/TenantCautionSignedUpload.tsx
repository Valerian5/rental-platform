// components/TenantCautionSignedUpload.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function TenantCautionSignedUpload({ leaseId }: { leaseId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f || null)
  }

  const onUpload = async () => {
    if (!file) {
      toast.error("Sélectionnez un fichier")
      return
    }
    try {
      setUploading(true)
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`/api/leases/${leaseId}/cautionnement/upload-signed`, { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Erreur upload")
      setUploadedUrl(data.url)
      toast.success("Document envoyé")
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Erreur upload")
    } finally {
      setUploading(false)
    }
  }

  const isPdf = file?.type === "application/pdf" || (uploadedUrl && uploadedUrl.toLowerCase().endsWith(".pdf"))

  return (
    <div className="space-y-3">
      <div>
        <input type="file" accept="application/pdf,image/*" onChange={onFileChange} />
      </div>
      <div className="flex gap-2">
        <Button onClick={onUpload} disabled={uploading || !file}>
          {uploading ? "Envoi..." : "Envoyer l'acte signé"}
        </Button>
        {uploadedUrl && (
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            Ouvrir le document envoyé
          </a>
        )}
      </div>
      {uploadedUrl && !isPdf && (
        <div className="border rounded-md p-2">
          {/* Preview image simple */}
          <img src={uploadedUrl} alt="Acte signé" className="max-h-96 object-contain" />
        </div>
      )}
      {uploadedUrl && isPdf && (
        <div className="border rounded-md p-2" style={{ height: 500 }}>
          <iframe src={uploadedUrl} className="w-full h-full" title="Aperçu PDF" />
        </div>
      )}
    </div>
  )
}
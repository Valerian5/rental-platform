"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Zap, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { DocuSignSignatureManager } from "@/components/docusign-signature-manager"

interface SignatureMethodSelectorProps {
  leaseId: string
  leaseStatus: string
  userType: "owner" | "tenant"
  onStatusChange?: (newStatus: string) => void
}

export function SignatureMethodSelector({ 
  leaseId, 
  leaseStatus, 
  userType, 
  onStatusChange 
}: SignatureMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<"electronic" | "manual" | null>(null)
  const [isElectronicEnabled] = useState(true) // Pour l'instant, toujours activé

  const handleMethodSelect = (method: "electronic" | "manual") => {
    setSelectedMethod(method)
  }

  const downloadDocument = async () => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/download-document`)
      if (!response.ok) throw new Error("Erreur téléchargement")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `bail-${leaseId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erreur téléchargement:", error)
      toast.error("Erreur lors du téléchargement")
    }
  }

  if (selectedMethod === "electronic") {
    return (
      <div className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Signature électronique</strong> - Signez en ligne via DocuSign
          </AlertDescription>
        </Alert>
        <DocuSignSignatureManager 
          leaseId={leaseId} 
          leaseStatus={leaseStatus} 
          onStatusChange={onStatusChange} 
        />
        <Button 
          variant="outline" 
          onClick={() => setSelectedMethod(null)}
          className="w-full"
        >
          Retour au choix
        </Button>
      </div>
    )
  }

  if (selectedMethod === "manual") {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <FileText className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Signature manuelle</strong> - Téléchargez, signez et uploadez le document
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <Button onClick={downloadDocument} className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Télécharger le document
          </Button>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Instructions :</strong>
            </p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Téléchargez le document PDF</li>
              <li>Imprimez-le et signez-le</li>
              <li>Scannez ou photographiez le document signé</li>
              <li>Uploadez le document signé ci-dessous</li>
            </ol>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Document signé</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full p-2 border rounded-md"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  toast.success("Fichier sélectionné")
                }
              }}
            />
            <Button className="w-full" disabled>
              <FileText className="h-4 w-4 mr-2" />
              Uploader le document signé
            </Button>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setSelectedMethod(null)}
          className="w-full"
        >
          Retour au choix
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Signature du bail
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Le bail est prêt à être signé. Choisissez la méthode de signature.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium mb-2">Signature électronique</h3>
              <p className="text-sm text-gray-600 mb-3">Signez en ligne via DocuSign</p>
              <Button 
                onClick={() => handleMethodSelect("electronic")} 
                disabled={!isElectronicEnabled}
                className="w-full"
              >
                {isElectronicEnabled ? "Choisir" : "Non disponible"}
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium mb-2">Signature manuelle</h3>
              <p className="text-sm text-gray-600 mb-3">Téléchargement et upload</p>
              <Button 
                onClick={() => handleMethodSelect("manual")} 
                variant="outline"
                className="w-full"
              >
                Choisir
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
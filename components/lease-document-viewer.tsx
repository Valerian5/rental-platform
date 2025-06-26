"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, Send, FileText, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

interface LeaseDocumentViewerProps {
  document: {
    content: string
    template: string
    generatedAt: string
  }
  analysis: {
    completionRate: number
    totalFields: number
  }
  leaseId: string
}

export function LeaseDocumentViewer({ document, analysis, leaseId }: LeaseDocumentViewerProps) {
  const [showPreview, setShowPreview] = useState(true)

  const handleDownload = () => {
    const blob = new Blob([document.content], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bail-${leaseId}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Document téléchargé")
  }

  const handleSendToTenant = () => {
    // TODO: Implémenter l'envoi par email
    toast.info("Fonctionnalité d'envoi en cours de développement")
  }

  const handleRequestSignature = () => {
    // TODO: Implémenter la signature électronique
    toast.info("Fonctionnalité de signature en cours de développement")
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document de bail généré
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Template: {document.template} • Généré le{" "}
                {new Date(document.generatedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={analysis.completionRate === 100 ? "default" : "secondary"}>
                {analysis.completionRate}% complet
              </Badge>
              <Badge variant="outline">{analysis.totalFields} champs</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button onClick={handleDownload} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Télécharger
            </Button>
            <Button onClick={handleSendToTenant} variant="outline" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Envoyer au locataire
            </Button>
            <Button onClick={handleRequestSignature} variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Demander signature
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? "Masquer" : "Afficher"} l'aperçu
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Aperçu du document */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu du document</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none bg-white p-6 border rounded-lg shadow-sm"
              style={{ minHeight: "600px" }}
              dangerouslySetInnerHTML={{ __html: document.content }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

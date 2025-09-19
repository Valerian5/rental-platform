"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Printer, Send, Eye, EyeOff } from "lucide-react"

interface LeaseDocumentDisplayProps {
  document: string
  leaseId: string
  generatedAt?: string
}

export function LeaseDocumentDisplay({ document, leaseId, generatedAt }: LeaseDocumentDisplayProps) {
  const [showFullDocument, setShowFullDocument] = useState(false)

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Contrat de bail</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                margin: 20px;
                color: #333;
              }
              h1, h2, h3 { 
                color: #2563eb; 
                margin-top: 20px;
                margin-bottom: 10px;
              }
              h1 { font-size: 24px; }
              h2 { font-size: 20px; }
              h3 { font-size: 16px; }
              p { margin-bottom: 10px; }
              .signature-section {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
              }
              .signature-box {
                border: 1px solid #ccc;
                padding: 20px;
                width: 200px;
                height: 100px;
                text-align: center;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${document}
            <div class="signature-section">
              <div class="signature-box">
                <p><strong>Signature du bailleur</strong></p>
                <p>Date et lieu :</p>
              </div>
              <div class="signature-box">
                <p><strong>Signature du locataire</strong></p>
                <p>Date et lieu :</p>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/download-document`)
      if (!response.ok) throw new Error("Erreur téléchargement")

      const htmlContent = await response.text()
      
      // Ouvrir dans une nouvelle fenêtre pour impression PDF
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Impossible d\'ouvrir une nouvelle fenêtre')
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bail ${leaseId.slice(0, 8)}</title>
          <style>
            @media print {
              @page { size: A4; margin: 1cm; }
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            }
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          </style>
        </head>
        <body>${htmlContent}</body>
        </html>
      `)

      printWindow.document.close()
      
      // Attendre le chargement et déclencher l'impression
      setTimeout(() => {
        printWindow.print()
        printWindow.addEventListener('afterprint', () => printWindow.close())
      }, 1000)

    } catch (error) {
      console.error("Erreur téléchargement:", error)
      // Fallback vers l'impression
      handlePrint()
    }
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span className="font-medium">Document de bail généré</span>
          {generatedAt && (
            <Badge variant="outline" className="text-xs">
              {new Date(generatedAt).toLocaleDateString("fr-FR")} à{" "}
              {new Date(generatedAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFullDocument(!showFullDocument)}>
            {showFullDocument ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Aperçu
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Document complet
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" />
            Envoyer
          </Button>
        </div>
      </div>

      {/* Contenu du document */}
      <Card>
        <CardContent className="p-6">
          <div className="prose max-w-none">
            {showFullDocument ? (
              // Affichage complet avec HTML interprété
              <div className="space-y-2" dangerouslySetInnerHTML={{ __html: document }} />
            ) : (
              // Aperçu en texte brut
              <div className="space-y-2">
                <div
                  className="text-gray-700 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: document.substring(0, 1000) + (document.length > 1000 ? "..." : ""),
                  }}
                />
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-500 italic">
                    Aperçu du document. Cliquez sur "Document complet" pour voir l'intégralité.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section signatures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Signatures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <h4 className="font-medium mb-2">Signature du bailleur</h4>
              <div className="h-20 flex items-center justify-center text-gray-400">
                <p className="text-sm">Espace réservé à la signature</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">Date et lieu :</p>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <h4 className="font-medium mb-2">Signature du locataire</h4>
              <div className="h-20 flex items-center justify-center text-gray-400">
                <p className="text-sm">Espace réservé à la signature</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">Date et lieu :</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
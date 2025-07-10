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
            ${formatDocumentForPrint(document)}
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
      const response = await fetch(`/api/leases/${leaseId}/generate-pdf`, {
        method: "POST",
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `contrat-bail-${leaseId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error("Erreur lors de la génération du PDF")
      }
    } catch (error) {
      console.error("Erreur PDF:", error)
      // Fallback vers l'impression
      handlePrint()
    }
  }

  const formatDocumentForDisplay = (content: string) => {
    return content.split("\n").map((line, index) => {
      if (line.trim() === "") return <br key={index} />

      // Titres principaux (tout en majuscules)
      if (line === line.toUpperCase() && line.length > 10 && !line.includes(":")) {
        return (
          <h2 key={index} className="text-xl font-bold mt-6 mb-4 text-blue-800">
            {line}
          </h2>
        )
      }

      // Sous-titres avec numéros romains
      if (/^[IVX]+\.\s/.test(line)) {
        return (
          <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-blue-600">
            {line}
          </h3>
        )
      }

      // Articles avec lettres
      if (/^[A-Z]\.\s/.test(line)) {
        return (
          <h4 key={index} className="text-base font-medium mt-3 mb-2 text-gray-800">
            {line}
          </h4>
        )
      }

      // Paragraphes normaux
      return (
        <p key={index} className="mb-3 text-gray-700">
          {line}
        </p>
      )
    })
  }

  const formatDocumentForPrint = (content: string) => {
    return content.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>").replace(/^/, "<p>").replace(/$/, "</p>")
  }

  const previewContent = document.split("\n").slice(0, 20).join("\n")

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
              <div className="space-y-2">{formatDocumentForDisplay(document)}</div>
            ) : (
              <div className="space-y-2">
                {formatDocumentForDisplay(previewContent)}
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-500 italic">
                    Aperçu des 20 premières lignes. Cliquez sur "Document complet" pour voir l'intégralité.
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

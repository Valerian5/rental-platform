"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RotateCw, ZoomIn, ZoomOut, Download, AlertTriangle } from "lucide-react"

interface DocumentPreviewProps {
  fileUrl: string
  fileName: string
  fileType?: string
  className?: string
}

export function DocumentPreview({ fileUrl, fileName, fileType, className = "" }: DocumentPreviewProps) {
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [imageError, setImageError] = useState(false)

  const isPDF = fileType?.includes("pdf") || fileName.toLowerCase().endsWith(".pdf")
  const isImage = fileType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {/* Contrôles */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {isImage && !imageError && (
              <>
                <Button variant="outline" size="sm" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 3}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
        </div>

        {/* Aperçu */}
        <div className="border rounded-lg overflow-hidden bg-gray-50 min-h-[300px] flex items-center justify-center">
          {isPDF ? (
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1&page=1&view=FitH`}
              className="w-full h-96 border-0"
              title={`Aperçu de ${fileName}`}
              onError={() => {
                console.error("Erreur chargement PDF")
              }}
            />
          ) : isImage && !imageError ? (
            <div className="overflow-auto max-h-96 w-full flex justify-center">
              <img
                src={fileUrl || "/placeholder.svg"}
                alt={fileName}
                className="max-w-full h-auto"
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  transition: "transform 0.3s ease",
                }}
                onError={() => {
                  console.error("Erreur chargement image")
                  setImageError(true)
                }}
                onLoad={() => setImageError(false)}
              />
            </div>
          ) : (
            <div className="text-center p-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Aperçu non disponible</p>
              <p className="text-sm text-gray-500 mb-4">
                {imageError ? "Erreur de chargement de l'image" : "Format non supporté pour l'aperçu"}
              </p>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger le fichier
              </Button>
            </div>
          )}
        </div>

        {/* Informations du fichier */}
        <div className="mt-4 text-sm text-gray-600">
          <p className="truncate">
            <strong>Fichier :</strong> {fileName}
          </p>
          {fileType && (
            <p>
              <strong>Type :</strong> {fileType}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

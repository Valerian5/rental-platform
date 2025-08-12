"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface DocumentPreviewProps {
  fileUrl: string
  fileName: string
  className?: string
}

export function DocumentPreview({ fileUrl, fileName, className = "" }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fileExtension = fileName.split(".").pop()?.toLowerCase()
  const isPDF = fileExtension === "pdf"
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension || "")

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    // Simuler le chargement
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [fileUrl])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <Card className={`h-96 ${className}`}>
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Chargement du document...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`h-96 ${className}`}>
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <FileText className="h-12 w-12 text-red-400 mx-auto" />
            <div>
              <p className="text-red-600 font-medium">Erreur de chargement</p>
              <p className="text-gray-600 text-sm">{error}</p>
            </div>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger quand même
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Barre d'outils */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium truncate max-w-48">{fileName}</span>
            <span className="text-xs text-gray-500 uppercase">{fileExtension}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-600 min-w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Zone de prévisualisation */}
        <div className="h-80 overflow-auto bg-gray-100 flex items-center justify-center">
          {isPDF ? (
            <div className="text-center space-y-4 p-8">
              <FileText className="h-16 w-16 text-blue-500 mx-auto" />
              <div>
                <p className="font-medium text-gray-800">Document PDF</p>
                <p className="text-sm text-gray-600">Cliquez pour télécharger et visualiser</p>
              </div>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Ouvrir le PDF
              </Button>
            </div>
          ) : isImage ? (
            <div
              className="max-w-full max-h-full p-4"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: "transform 0.2s ease",
              }}
            >
              <img
                src={fileUrl || "/placeholder.svg"}
                alt={fileName}
                className="max-w-full max-h-full object-contain shadow-lg rounded"
                onError={() => setError("Impossible de charger l'image")}
              />
            </div>
          ) : (
            <div className="text-center space-y-4 p-8">
              <FileText className="h-16 w-16 text-gray-400 mx-auto" />
              <div>
                <p className="font-medium text-gray-800">Aperçu non disponible</p>
                <p className="text-sm text-gray-600">Type de fichier : {fileExtension?.toUpperCase()}</p>
              </div>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger le fichier
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react"

interface DocumentPreviewProps {
  fileUrl: string
  fileName: string
  fileType: string
  className?: string
}

export function DocumentPreview({ fileUrl, fileName, fileType, className = "" }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  const isPdf = fileType === "application/pdf"
  const isImage = fileType.startsWith("image/")

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Contrôles */}
      <div className="bg-gray-50 p-2 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{zoom}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          {isImage && (
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </a>
        </Button>
      </div>

      {/* Aperçu */}
      <div className="bg-white p-4 flex justify-center items-center min-h-[300px] max-h-[500px] overflow-auto">
        {isPdf ? (
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-[400px] border-0"
            title={fileName}
            style={{ transform: `scale(${zoom / 100})` }}
          />
        ) : isImage ? (
          <img
            src={fileUrl || "/placeholder.svg"}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: "center",
            }}
          />
        ) : (
          <div className="text-center text-gray-500">
            <p>Aperçu non disponible pour ce type de fichier</p>
            <p className="text-sm">{fileName}</p>
          </div>
        )}
      </div>
    </div>
  )
}

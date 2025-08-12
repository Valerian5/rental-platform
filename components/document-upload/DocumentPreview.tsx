"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, FileText, ImageIcon, AlertTriangle } from "lucide-react"

interface DocumentPreviewProps {
  fileUrl: string
  fileName: string
  fileType: string
  className?: string
}

export function DocumentPreview({ fileUrl, fileName, fileType, className = "" }: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    // Simuler le chargement
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [fileUrl])

  const isPDF = fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")
  const isImage = fileType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)

  if (isLoading) {
    return (
      <Card className={`h-full ${className}`}>
        <CardContent className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Chargement de l'aperçu...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`h-full ${className}`}>
        <CardContent className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600">Impossible de charger l'aperçu</p>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`h-full ${className}`}>
      <CardContent className="p-0 h-full">
        {isPDF ? (
          <div className="h-full">
            <iframe
              src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0 rounded-lg"
              title={`Aperçu de ${fileName}`}
              onLoad={() => setIsLoading(false)}
              onError={() => setError("Impossible de charger le PDF")}
            />
          </div>
        ) : isImage ? (
          <div className="h-full flex items-center justify-center p-4">
            <ImageIcon
              src={fileUrl || "/placeholder.svg"}
              alt={`Aperçu de ${fileName}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onLoad={() => setIsLoading(false)}
              onError={() => setError("Impossible de charger l'image")}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium">{fileName}</p>
              <p className="text-sm text-gray-500 mt-2">Aperçu non disponible pour ce type de fichier</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

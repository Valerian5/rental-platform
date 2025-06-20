"use client"

import { useState, useRef, type ChangeEvent, type DragEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, ImageIcon } from "lucide-react"
import { SupabaseStorageService } from "@/lib/supabase-storage-service"
import { toast } from "sonner"

interface FileUploadProps {
  onFilesUploaded: (urls: string[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  folder?: string
  existingFiles?: string[]
}

export function FileUpload({
  onFilesUploaded,
  maxFiles = 10,
  acceptedTypes = ["image/*"],
  folder = "general",
  existingFiles = [],
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(existingFiles)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    if (uploadedFiles.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} fichiers autorisés`)
      return
    }

    setIsUploading(true)
    try {
      const newUrls: string[] = []

      for (const file of fileArray) {
        // Vérifier le type de fichier
        const isValidType = acceptedTypes.some((type) => {
          if (type === "image/*") return file.type.startsWith("image/")
          if (type === "application/pdf") return file.type === "application/pdf"
          return file.type === type
        })

        if (!isValidType) {
          toast.error(`Type de fichier non supporté: ${file.name}`)
          continue
        }

        console.log("📤 Upload fichier:", file.name)
        const result = await SupabaseStorageService.uploadFile(file, "property-images", folder)
        newUrls.push(result.url)
        console.log("✅ Fichier uploadé:", result.url)
      }

      const allFiles = [...uploadedFiles, ...newUrls]
      setUploadedFiles(allFiles)
      onFilesUploaded(allFiles)

      toast.success(`${newUrls.length} fichier(s) uploadé(s)`)
    } catch (error) {
      console.error("❌ Erreur upload:", error)
      toast.error("Erreur lors de l'upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Reset input pour permettre de sélectionner le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeFile = (indexToRemove: number) => {
    const newFiles = uploadedFiles.filter((_, index) => index !== indexToRemove)
    setUploadedFiles(newFiles)
    onFilesUploaded(newFiles)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const acceptString = acceptedTypes.join(",")

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <Card>
        <CardContent className="p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileDialog}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            } ${isUploading || uploadedFiles.length >= maxFiles ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptString}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading || uploadedFiles.length >= maxFiles}
            />

            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />

            {isUploading ? (
              <div>
                <p className="text-lg font-medium">Upload en cours...</p>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mt-2"></div>
              </div>
            ) : uploadedFiles.length >= maxFiles ? (
              <p className="text-gray-500">Limite de {maxFiles} fichiers atteinte</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  {isDragOver ? "Déposez les fichiers ici" : "Glissez-déposez vos fichiers ici"}
                </p>
                <p className="text-gray-500 mb-4">
                  ou cliquez pour sélectionner ({uploadedFiles.length}/{maxFiles})
                </p>
                <Button type="button" variant="outline">
                  Sélectionner des fichiers
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Aperçu des fichiers uploadés */}
      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadedFiles.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={url || "/placeholder.svg"}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback si l'image ne charge pas
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback) {
                      fallback.classList.remove("hidden")
                    }
                  }}
                />
                <div className="hidden w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

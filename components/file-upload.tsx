"use client"

import { useState, useRef, type ChangeEvent, type DragEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, ImageIcon, FileText } from "lucide-react"
import { SupabaseStorageService } from "@/lib/supabase-storage-service"
import { toast } from "sonner"

interface FileUploadProps {
  onFilesUploaded: (urls: string[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  folder?: string
  existingFiles?: string[]
  bucket?: string // Nouvelle prop pour forcer un bucket
}

export function FileUpload({
  onFilesUploaded,
  maxFiles = 10,
  acceptedTypes = ["image/*"],
  folder = "general",
  existingFiles = [],
  bucket, // Utiliser cette prop si fournie
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(existingFiles)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const currentFiles = Array.isArray(uploadedFiles) ? uploadedFiles : []

    if (currentFiles.length + fileArray.length > maxFiles) {
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
          if (type === "application/*") return file.type.startsWith("application/")
          return file.type === type
        })

        if (!isValidType) {
          toast.error(`Type de fichier non supporté: ${file.name}`)
          continue
        }

        // Déterminer le bucket à utiliser
        let targetBucket = bucket
        if (!targetBucket) {
          const isPdf = file.type === "application/pdf"
          const isDocument = isPdf || file.type.includes("word") || file.type === "text/plain"
          targetBucket = isDocument ? "property-documents" : "property-images"
        }

        console.log(`📤 Upload vers bucket: ${targetBucket}, fichier: ${file.name}, type: ${file.type}`)

        const result = await SupabaseStorageService.uploadFile(file, targetBucket, folder)
        newUrls.push(result.url)
        console.log("✅ Fichier uploadé:", result.url)
      }

      const allFiles = [...currentFiles, ...newUrls]
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
    const currentFiles = Array.isArray(uploadedFiles) ? uploadedFiles : []
    const newFiles = currentFiles.filter((_, index) => index !== indexToRemove)
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
                  ou cliquez pour sélectionner ({Array.isArray(uploadedFiles) ? uploadedFiles.length : 0}/{maxFiles})
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
      {Array.isArray(uploadedFiles) && uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadedFiles.map((url, index) => {
            const isImage =
              url.includes(".jpg") ||
              url.includes(".jpeg") ||
              url.includes(".png") ||
              url.includes(".gif") ||
              url.includes(".webp")

            return (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {isImage ? (
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) {
                          fallback.classList.remove("hidden")
                        }
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4">
                      <FileText className="h-12 w-12 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500 text-center truncate w-full">Document</span>
                    </div>
                  )}
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
            )
          })}
        </div>
      )}
    </div>
  )
}

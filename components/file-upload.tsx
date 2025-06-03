"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { X, Upload, File, Check } from "lucide-react"
import { BlobStorageService } from "@/lib/blob-storage-service"

interface FileUploadProps {
  onFilesUploaded: (urls: string[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  folder?: string
  existingFiles?: string[]
}

interface UploadedFile {
  file: File
  url?: string
  uploading: boolean
  error?: string
  progress: number
}

export function FileUpload({
  onFilesUploaded,
  maxFiles = 5,
  acceptedTypes = ["image/*", "application/pdf"],
  folder = "documents",
  existingFiles = [],
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).map((file) => ({
      file,
      uploading: false,
      progress: 0,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles))
  }

  const uploadFiles = async () => {
    const filesToUpload = uploadedFiles.filter((f) => !f.url && !f.uploading)

    for (let i = 0; i < filesToUpload.length; i++) {
      const fileData = filesToUpload[i]
      const fileIndex = uploadedFiles.findIndex((f) => f.file === fileData.file)

      // Marquer comme en cours d'upload
      setUploadedFiles((prev) => prev.map((f, idx) => (idx === fileIndex ? { ...f, uploading: true, progress: 0 } : f)))

      try {
        // Simuler le progrès
        for (let progress = 0; progress <= 90; progress += 10) {
          setUploadedFiles((prev) => prev.map((f, idx) => (idx === fileIndex ? { ...f, progress } : f)))
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        // Upload réel
        const result = await BlobStorageService.uploadFile(fileData.file, folder)

        // Marquer comme terminé
        setUploadedFiles((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex
              ? {
                  ...f,
                  url: result.url,
                  uploading: false,
                  progress: 100,
                }
              : f,
          ),
        )

        console.log("✅ Fichier uploadé:", result.url)
      } catch (error) {
        console.error("❌ Erreur upload:", error)
        setUploadedFiles((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex
              ? {
                  ...f,
                  uploading: false,
                  error: error.message,
                  progress: 0,
                }
              : f,
          ),
        )
      }
    }

    // Notifier les URLs uploadées
    const uploadedUrls = uploadedFiles.filter((f) => f.url).map((f) => f.url!)
    onFilesUploaded([...existingFiles, ...uploadedUrls])
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium">Glissez vos fichiers ici</p>
            <p className="text-sm text-gray-500">ou</p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadedFiles.length >= maxFiles}
            >
              Choisir des fichiers
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Maximum {maxFiles} fichiers • {acceptedTypes.join(", ")}
          </p>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Liste des fichiers */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Fichiers sélectionnés ({uploadedFiles.length})</h4>
            <Button onClick={uploadFiles} disabled={uploadedFiles.every((f) => f.url || f.uploading)} size="sm">
              Uploader tout
            </Button>
          </div>

          {uploadedFiles.map((fileData, index) => (
            <Card key={index}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                    <p className="text-xs text-gray-500">{Math.round(fileData.file.size / 1024)} KB</p>
                    {fileData.uploading && <Progress value={fileData.progress} className="mt-1 h-1" />}
                    {fileData.error && <p className="text-xs text-red-500 mt-1">{fileData.error}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {fileData.url && <Check className="h-4 w-4 text-green-500" />}
                    {fileData.uploading && (
                      <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Fichiers existants */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Fichiers existants ({existingFiles.length})</h4>
          {existingFiles.map((url, index) => (
            <Card key={index}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-green-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Document {index + 1}</p>
                    <p className="text-xs text-gray-500 truncate">{url}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => window.open(url, "_blank")}>
                    Voir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

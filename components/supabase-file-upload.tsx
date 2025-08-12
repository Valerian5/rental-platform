"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { X, Upload, File, Check, Trash2, Eye } from "lucide-react"

interface SupabaseFileUploadProps {
  onFilesUploaded: (urls: string[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  bucket?: string
  folder?: string
  existingFiles?: string[]
  documentType?: string
  category?: string
}

interface UploadedFile {
  file: File
  url?: string
  path?: string
  uploading: boolean
  error?: string
  progress: number
}

export function SupabaseFileUpload({
  onFilesUploaded,
  maxFiles = 5,
  acceptedTypes = ["image/*", "application/pdf"],
  bucket = "documents",
  folder = "general",
  existingFiles = [],
  documentType = "general",
  category = "general",
}: SupabaseFileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [existingFilesState, setExistingFilesState] = useState<Array<{ url: string; path?: string }>>(
    existingFiles.map((url) => ({ url, path: extractPathFromUrl(url) })),
  )
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

  const uploadFile = async (fileData: UploadedFile, fileIndex: number) => {
    try {
      // Marquer comme en cours d'upload
      setUploadedFiles((prev) =>
        prev.map((f, idx) => (idx === fileIndex ? { ...f, uploading: true, progress: 10 } : f)),
      )

      // Préparer les données
      const formData = new FormData()
      formData.append("file", fileData.file)
      formData.append("bucket", bucket)
      formData.append("folder", `${folder}/${category}`)

      // Simuler le progrès
      setUploadedFiles((prev) => prev.map((f, idx) => (idx === fileIndex ? { ...f, progress: 30 } : f)))

      // Upload via API Supabase
      const response = await fetch("/api/upload-supabase", {
        method: "POST",
        body: formData,
      })

      setUploadedFiles((prev) => prev.map((f, idx) => (idx === fileIndex ? { ...f, progress: 80 } : f)))

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      // Marquer comme terminé
      setUploadedFiles((prev) =>
        prev.map((f, idx) =>
          idx === fileIndex
            ? {
                ...f,
                url: result.url,
                path: result.path,
                uploading: false,
                progress: 100,
                error: undefined,
              }
            : f,
        ),
      )

      console.log("✅ Fichier uploadé:", result.url)
      return result.url
    } catch (error: any) {
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
      return null
    }
  }

  const uploadFiles = async () => {
    const filesToUpload = uploadedFiles
      .map((f, index) => ({ file: f, index }))
      .filter(({ file }) => !file.url && !file.uploading)

    if (filesToUpload.length === 0) {
      console.log("📤 Aucun fichier à uploader")
      return
    }

    const uploadedUrls = []

    for (const { file, index } of filesToUpload) {
      const url = await uploadFile(file, index)
      if (url) {
        uploadedUrls.push(url)
      }
    }

    // Notifier les URLs uploadées
    console.log("📤 SupabaseFileUpload - URLs nouvellement uploadées:", uploadedUrls)

    if (uploadedUrls.length > 0) {
      onFilesUploaded(uploadedUrls)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingFile = async (fileIndex: number) => {
    const fileToRemove = existingFilesState[fileIndex]
    if (!fileToRemove.path) {
      console.error("❌ Impossible de supprimer: chemin manquant")
      return
    }

    try {
      const response = await fetch(
        `/api/upload-supabase?path=${encodeURIComponent(fileToRemove.path)}&bucket=${bucket}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la suppression")
      }

      // Retirer de la liste locale
      setExistingFilesState((prev) => prev.filter((_, i) => i !== fileIndex))

      // Notifier le parent avec la nouvelle liste
      const remainingUrls = existingFilesState.filter((_, i) => i !== fileIndex).map((f) => f.url)
      onFilesUploaded(remainingUrls)

      console.log("✅ Fichier supprimé avec succès")
    } catch (error: any) {
      console.error("❌ Erreur suppression:", error)
    }
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

  // Calculer le nombre total de fichiers
  const totalFiles = existingFilesState.length + uploadedFiles.filter((f) => f.url).length
  const remainingSlots = maxFiles - totalFiles

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      {remainingSlots > 0 && (
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
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={remainingSlots <= 0}>
                Choisir des fichiers
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {remainingSlots} emplacements restants • {acceptedTypes.join(", ")} • Max 10MB par fichier
            </p>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Liste des nouveaux fichiers */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Nouveaux fichiers ({uploadedFiles.length})</h4>
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
      {existingFilesState.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Fichiers existants ({existingFilesState.length})</h4>
          {existingFilesState.map((fileData, index) => (
            <Card key={index}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-green-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Document {index + 1}</p>
                    <p className="text-xs text-gray-500 truncate">{fileData.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => window.open(fileData.url, "_blank")}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeExistingFile(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Fonction utilitaire pour extraire le chemin depuis l'URL
function extractPathFromUrl(url: string): string | undefined {
  try {
    // Pour les URLs Supabase Storage: https://xxx.supabase.co/storage/v1/object/public/bucket/path
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/")
    const publicIndex = pathParts.indexOf("public")
    if (publicIndex !== -1 && publicIndex < pathParts.length - 2) {
      // Retourner le chemin après /public/bucket/
      return pathParts.slice(publicIndex + 2).join("/")
    }
    return undefined
  } catch {
    return undefined
  }
}

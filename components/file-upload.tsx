"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "react-hot-toast"
import { SupabaseStorageService } from "@/services/supabase-storage.service"

interface FileUploadProps {
  onFilesUploaded: (files: string[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  folder?: string
  disabled?: boolean
  bucket?: string // Nouvelle prop
}

export function FileUpload({
  onFilesUploaded,
  maxFiles = 5,
  acceptedTypes = ["image/*"],
  folder = "general",
  disabled = false,
  bucket, // Utiliser cette prop si fournie
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        acceptedFiles.forEach((file) => {
          uploadFile(file)
        })
      }
    },
    [uploadedFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: maxFiles !== 1,
    accept: acceptedTypes ? acceptedTypes.join(",") : undefined,
    maxFiles: maxFiles,
    disabled: disabled,
  })

  const uploadFile = async (file: File) => {
    try {
      setUploading(true)

      // Utiliser le bucket fourni ou déterminer automatiquement
      let targetBucket = bucket
      if (!targetBucket) {
        const isPdf = file.type === "application/pdf"
        const isDocument = isPdf || file.type.includes("word") || file.type === "text/plain"
        targetBucket = isDocument ? "property-documents" : "property-images"
      }

      console.log(`📤 Upload vers bucket: ${targetBucket}, type: ${file.type}`)

      const result = await SupabaseStorageService.uploadFile(file, targetBucket, folder)

      const newFiles = [...uploadedFiles, result.url]
      setUploadedFiles(newFiles)
      onFilesUploaded(newFiles)

      toast.success("Fichier uploadé avec succès")
    } catch (error) {
      console.error("Erreur upload:", error)
      toast.error("Erreur lors de l'upload du fichier")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center w-full pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 dark:border-gray-600"
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div>Téléchargement...</div>
        ) : (
          <>
            <svg
              aria-hidden="true"
              className="w-10 h-10 mb-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6l-2.06-2.06a5 5 0 00-7.17 7.17m0 10a4.5 4.5 0 007.63-3.7A5.25 5.25 0 0121 15a6 6 0 00-6-6c-2.39 0-4.43.96-6.05 2.45m16 0a5.25 5.25 0 01-1.7-3.7c0-1.13-.9-2-2.2-2.02m0 0a5.25 5.25 0 01-1.7 3.7c0 1.13.9 2 2.2 2.02"
              ></path>
            </svg>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {acceptedTypes
                ? `Types de fichiers acceptés: ${acceptedTypes.join(", ")}`
                : "Tous types de fichiers acceptés"}
            </p>
          </>
        )}
      </div>
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-semibold">Fichiers téléchargés:</h4>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index} className="text-sm">
                <a href={file} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                  {file}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

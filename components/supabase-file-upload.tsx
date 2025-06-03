"use client"

import type React from "react"

import { useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"

interface Props {
  bucketName: string
  onFilesUploaded: (urls: string[]) => void
}

const SupabaseFileUpload: React.FC<Props> = ({ bucketName, onFilesUploaded }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const supabase = useSupabaseClient()
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files))
    }
  }

  const handleUpload = async () => {
    setUploading(true)
    try {
      const uploadedUrls: string[] = []
      for (const file of selectedFiles) {
        const filePath = `${Date.now()}-${file.name}`
        const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

        if (error) {
          console.error("Error uploading file:", error)
          alert(`Error uploading ${file.name}: ${error.message}`)
        } else {
          const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)
          uploadedUrls.push(data.publicUrl)
        }
      }

      onFilesUploaded(uploadedUrls)
      console.log("📤 Transmission des URLs:", uploadedUrls)

      onFilesUploaded(uploadedUrls)
      console.log("📤 URLs transmises au parent:", uploadedUrls)

      setSelectedFiles([])
      alert("Files uploaded successfully!")
    } catch (error) {
      console.error("Upload error:", error)
      alert("Failed to upload files.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input type="file" multiple onChange={handleFileSelect} />
      <button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {selectedFiles.length > 0 && (
        <div>
          <p>Selected files:</p>
          <ul>
            {selectedFiles.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SupabaseFileUpload

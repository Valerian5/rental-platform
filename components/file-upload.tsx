"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button, Typography, Box, CircularProgress } from "@mui/material"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import styled from "@emotion/styled"
import { SupabaseStorageService } from "@/lib/supabase-storage-service"

const getColor = (props: any) => {
  if (props.isDragAccept) {
    return "#00e676"
  }
  if (props.isDragReject) {
    return "#ff1744"
  }
  if (props.isFocused) {
    return "#2196f3"
  }
  return "#eeeeee"
}

const StyledDropzone = styled("div")({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: (props) => getColor(props),
  borderStyle: "dashed",
  backgroundColor: "#fafafa",
  color: "#bdbdbd",
  outline: "none",
  transition: "border .24s ease-in-out",
  cursor: "pointer",
})

interface FileUploadProps {
  onUpload: (url: string) => void
  folder?: string
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, folder }) => {
  const [isUploading, setIsUploading] = useState(false)

  const uploadFile = async (file: File): Promise<string> => {
    try {
      console.log("📤 Upload fichier:", file.name)

      // Utiliser le service Supabase Storage
      const result = await SupabaseStorageService.uploadFile(file, "property-images", folder || "general")

      console.log("✅ Fichier uploadé:", result.url)
      return result.url
    } catch (error) {
      console.error("❌ Erreur upload:", error)
      throw error
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true)
      try {
        const file = acceptedFiles[0]
        const url = await uploadFile(file)
        onUpload(url)
      } catch (error) {
        console.error("Error uploading file:", error)
        // Handle error appropriately, e.g., display an error message to the user
      } finally {
        setIsUploading(false)
      }
    },
    [onUpload, folder],
  )

  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject, open } = useDropzone({
    accept: { "image/*": [".jpeg", ".png", ".jpg"] },
    onDrop,
    multiple: false,
  })

  return (
    <Box>
      <StyledDropzone {...getRootProps({ isFocused, isDragAccept, isDragReject })}>
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 60, color: "#9e9e9e" }} />
        <Typography variant="body1" color="textSecondary">
          Drag 'n' drop some files here, or click to select files
        </Typography>
        <Typography variant="body2" color="textSecondary">
          (Only *.jpeg and *.png images will be accepted)
        </Typography>
        <Button type="button" onClick={open} variant="contained" sx={{ mt: 2 }}>
          Select files
        </Button>
      </StyledDropzone>
      {isUploading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Uploading...
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default FileUpload

"use client"

import { useState, useCallback } from "react"
import { advancedOCRService, type DocumentFieldsResult } from "@/lib/advanced-ocr-service"

interface OCRClientProps {
  onTextExtracted: (text: string, confidence: number, fields?: DocumentFieldsResult) => void
  onError: (error: string) => void
  documentType: string
  useAdvancedExtraction?: boolean
}

export function DocumentOCRClient({
  onTextExtracted,
  onError,
  documentType,
  useAdvancedExtraction = true,
}: OCRClientProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const processDocument = useCallback(
    async (file: File) => {
      if (!file) return

      setIsProcessing(true)
      setProgress(0)

      try {
        console.log(`🔧 Traitement du fichier: ${file.name} (${file.type})`)

        // Vérifier le type de fichier
        const isImage = file.type.startsWith("image/")
        const isPDF = file.type === "application/pdf"

        if (!isImage && !isPDF) {
          throw new Error(
            `Type de fichier non supporté: ${file.type}. Seuls les images (PNG, JPG) et PDF sont acceptés.`,
          )
        }

        if (useAdvancedExtraction) {
          // Utiliser l'extraction avancée de champs
          console.log("🧠 Utilisation de l'extraction avancée de champs...")

          const fieldsResult = await advancedOCRService.extractDocumentFields(file, documentType, (progressPercent) => {
            setProgress(progressPercent)
          })

          console.log(`✅ Extraction avancée terminée:`, fieldsResult)

          // Convertir les champs extraits en données structurées
          const extractedData = fieldsResult.fields.reduce(
            (acc, field) => {
              if (field.value) {
                acc[field.field] = field.value
              }
              return acc
            },
            {} as Record<string, any>,
          )

          // Ajouter les métadonnées
          extractedData.raw_text = fieldsResult.rawText
          extractedData.ocr_confidence = fieldsResult.overallConfidence
          extractedData.extraction_timestamp = new Date().toISOString()
          extractedData.extraction_method = "advanced_fields"
          extractedData.fields_extracted = fieldsResult.fields.length
          extractedData.processing_time = fieldsResult.processingTime

          onTextExtracted(fieldsResult.rawText, fieldsResult.overallConfidence, fieldsResult)
        } else {
          // Utiliser l'extraction basique (fallback)
          console.log("📝 Utilisation de l'extraction basique...")

          // Ici on pourrait implémenter l'ancienne méthode comme fallback
          // Pour l'instant, on utilise quand même l'extraction avancée
          const fieldsResult = await advancedOCRService.extractDocumentFields(file, documentType, (progressPercent) => {
            setProgress(progressPercent)
          })

          onTextExtracted(fieldsResult.rawText, fieldsResult.overallConfidence, fieldsResult)
        }
      } catch (error) {
        console.error("❌ Erreur OCR côté client:", error)
        onError(error instanceof Error ? error.message : "Erreur inconnue lors de l'OCR")
      } finally {
        setIsProcessing(false)
        setProgress(0)
      }
    },
    [onTextExtracted, onError, documentType, useAdvancedExtraction],
  )

  return {
    processDocument,
    isProcessing,
    progress,
  }
}

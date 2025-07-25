"use client"

import { useState, useCallback } from "react"
import { createWorker } from "tesseract.js"
import { documentValidationService } from "@/lib/document-validation-service"

interface OCRClientProps {
  onTextExtracted: (text: string, confidence: number) => void
  onError: (error: string) => void
  documentType: string
}

export function DocumentOCRClient({ onTextExtracted, onError, documentType }: OCRClientProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const processDocument = useCallback(
    async (file: File) => {
      if (!file) return

      setIsProcessing(true)
      setProgress(0)

      let worker: any = null

      try {
        console.log("🔧 Initialisation du worker OCR côté client...")

        // Créer le worker Tesseract.js côté client
        worker = await createWorker("fra+eng", 1, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              const progressPercent = Math.round(m.progress * 100)
              setProgress(progressPercent)
              console.log(`OCR Progress: ${progressPercent}%`)
            }
          },
        })

        // Configuration optimisée pour les documents administratifs
        await worker.setParameters({
          tessedit_char_whitelist:
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ .,;:!?()[]{}/-€$%",
          tessedit_pageseg_mode: "1", // Automatic page segmentation with OSD
          preserve_interword_spaces: "1",
        })

        console.log("🔍 Lancement de l'OCR...")

        // Reconnaissance OCR
        const {
          data: { text, confidence },
        } = await worker.recognize(file)

        console.log(`✅ OCR terminé avec confiance: ${Math.round(confidence)}%`)
        console.log(`📝 Texte extrait (${text.length} caractères):`, text.substring(0, 200) + "...")

        if (confidence < 50) {
          console.warn("⚠️ Confiance OCR faible, résultats potentiellement inexacts")
        }

        // Parser le texte selon le type de document
        const extractedData = documentValidationService.parseDocumentText(text, documentType, confidence)

        onTextExtracted(text, confidence)
      } catch (error) {
        console.error("❌ Erreur OCR côté client:", error)
        onError(error instanceof Error ? error.message : "Erreur inconnue lors de l'OCR")
      } finally {
        // Nettoyer le worker
        if (worker) {
          await worker.terminate()
        }
        setIsProcessing(false)
        setProgress(0)
      }
    },
    [onTextExtracted, onError, documentType],
  )

  return {
    processDocument,
    isProcessing,
    progress,
  }
}

"use client"

import { useState, useCallback } from "react"
import { advancedOCRService, type DocumentFieldsResult } from "@/lib/advanced-ocr-service"

interface DocumentOCRClientProps {
  onTextExtracted: (text: string, confidence: number, fieldsResult?: DocumentFieldsResult) => void
  onError: (error: string) => void
  documentType: string
  useAdvancedExtraction?: boolean
}

export function DocumentOCRClient({
  onTextExtracted,
  onError,
  documentType,
  useAdvancedExtraction = true,
}: DocumentOCRClientProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const processDocument = useCallback(
    async (file: File) => {
      if (isProcessing) return

      setIsProcessing(true)
      setProgress(0)

      try {
        console.log(`🔍 Traitement document: ${file.name} (${documentType})`)

        if (useAdvancedExtraction) {
          // Utiliser l'extraction avancée de champs
          const result = await advancedOCRService.extractDocumentFields(file, documentType, (progress) => {
            setProgress(progress)
          })

          console.log("✅ Extraction avancée terminée:", result)

          onTextExtracted(result.rawText, result.overallConfidence, result)
        } else {
          // Utiliser l'extraction basique (Tesseract simple)
          const { createWorker } = await import("tesseract.js")

          const worker = await createWorker("fra+eng", 1, {
            logger: (m) => {
              if (m.status === "recognizing text") {
                setProgress(Math.round(m.progress * 100))
              }
            },
          })

          let imageUrl: string

          if (file.type === "application/pdf") {
            // Convertir PDF en image pour l'OCR basique
            const pdfjsLib = await import("pdfjs-dist")
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

            const arrayBuffer = await file.arrayBuffer()
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
            const page = await pdf.getPage(1)
            const viewport = page.getViewport({ scale: 2.0 })

            const canvas = document.createElement("canvas")
            const context = canvas.getContext("2d")!
            canvas.height = viewport.height
            canvas.width = viewport.width

            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise

            imageUrl = canvas.toDataURL("image/png")
          } else {
            imageUrl = URL.createObjectURL(file)
          }

          const result = await worker.recognize(imageUrl)
          await worker.terminate()

          console.log("✅ OCR basique terminé:", result.data.confidence)

          onTextExtracted(result.data.text, result.data.confidence)
        }
      } catch (error) {
        console.error("❌ Erreur OCR:", error)
        onError(error instanceof Error ? error.message : "Erreur inconnue")
      } finally {
        setIsProcessing(false)
        setProgress(0)
      }
    },
    [isProcessing, onTextExtracted, onError, documentType, useAdvancedExtraction],
  )

  return {
    processDocument,
    isProcessing,
    progress,
  }
}

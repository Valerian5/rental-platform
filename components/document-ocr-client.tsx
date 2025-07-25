"use client"

import { useState, useCallback } from "react"
import { createWorker } from "tesseract.js"
import * as pdfjsLib from "pdfjs-dist"

// Configuration PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface OCRClientProps {
  onTextExtracted: (text: string, confidence: number) => void
  onError: (error: string) => void
  documentType: string
}

export function DocumentOCRClient({ onTextExtracted, onError, documentType }: OCRClientProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const convertPdfToImages = async (file: File): Promise<string[]> => {
    try {
      console.log("📄 Conversion PDF en images...")

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const images: string[] = []

      for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 3); pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 2.0 }) // Haute résolution pour OCR

        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")!
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise

        // Convertir en image base64
        const imageDataUrl = canvas.toDataURL("image/png", 0.95)
        images.push(imageDataUrl)

        console.log(`✅ Page ${pageNum}/${pdf.numPages} convertie`)
      }

      return images
    } catch (error) {
      console.error("❌ Erreur conversion PDF:", error)
      throw new Error("Impossible de convertir le PDF en images")
    }
  }

  const processImageWithOCR = async (
    imageSource: string | File,
    worker: any,
  ): Promise<{ text: string; confidence: number }> => {
    try {
      const result = await worker.recognize(imageSource)
      return {
        text: result.data.text,
        confidence: result.data.confidence,
      }
    } catch (error) {
      console.error("❌ Erreur OCR sur image:", error)
      throw error
    }
  }

  const processDocument = useCallback(
    async (file: File) => {
      if (!file) return

      setIsProcessing(true)
      setProgress(0)

      let worker: any = null

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

        let allText = ""
        let totalConfidence = 0
        let processedItems = 0

        if (isPDF) {
          // Traitement PDF
          console.log("📄 Traitement PDF détecté")
          const images = await convertPdfToImages(file)

          for (const [index, imageDataUrl] of images.entries()) {
            console.log(`🔍 OCR sur page ${index + 1}/${images.length}...`)

            const result = await processImageWithOCR(imageDataUrl, worker)
            allText += result.text + "\n\n"
            totalConfidence += result.confidence
            processedItems++

            // Mise à jour du progrès
            const overallProgress = Math.round(((index + 1) / images.length) * 100)
            setProgress(overallProgress)
          }
        } else {
          // Traitement image directe
          console.log("🖼️ Traitement image détecté")
          console.log("🔍 Lancement de l'OCR...")

          const result = await processImageWithOCR(file, worker)
          allText = result.text
          totalConfidence = result.confidence
          processedItems = 1
        }

        const averageConfidence = totalConfidence / processedItems

        console.log(`✅ OCR terminé avec confiance moyenne: ${Math.round(averageConfidence)}%`)
        console.log(`📝 Texte extrait (${allText.length} caractères):`, allText.substring(0, 200) + "...")

        if (averageConfidence < 50) {
          console.warn("⚠️ Confiance OCR faible, résultats potentiellement inexacts")
        }

        onTextExtracted(allText, averageConfidence)
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

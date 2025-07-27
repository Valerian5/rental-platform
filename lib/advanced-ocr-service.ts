import { createWorker } from "tesseract.js"
import * as pdfjsLib from "pdfjs-dist"

// Configuration PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export interface FieldExtractionResult {
  field: string
  value: string | null
  confidence: number
  position?: { x: number; y: number; width: number; height: number }
  alternatives?: string[]
}

export interface DocumentFieldsResult {
  documentType: string
  fields: FieldExtractionResult[]
  rawText: string
  overallConfidence: number
  processingTime: number
}

// Patterns de reconnaissance par type de document
const FIELD_PATTERNS = {
  identity: {
    lastName: {
      patterns: [
        /(?:NOM|SURNAME|FAMILY\s+NAME)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{2,30})/i,
        /^([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{2,30})\s*\n.*(?:PRÉNOM|PRENOM|GIVEN)/im,
        /CARTE\s+(?:D'IDENTITÉ|IDENTITE).*\n([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{2,30})/i,
      ],
      validation: (value: string) => /^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{2,30}$/i.test(value.trim()),
      priority: 1,
    },
    firstName: {
      patterns: [
        /(?:PRÉNOM|PRENOM|GIVEN\s+NAME)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{2,30})/i,
        /PRÉNOM[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{2,30})/i,
      ],
      validation: (value: string) => /^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{2,30}$/i.test(value.trim()),
      priority: 1,
    },
    birthDate: {
      patterns: [
        /(?:NÉ|NE|BORN)(?:\s+LE)?\s*[:\s]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i,
        /(?:DATE\s+DE\s+NAISSANCE|BIRTH\s+DATE)[:\s]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i,
        /(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/g,
      ],
      validation: (value: string) => {
        const dateRegex = /^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4}$/
        return dateRegex.test(value.trim())
      },
      priority: 2,
    },
    documentNumber: {
      patterns: [
        /(?:N°|NO|NUMBER|NUMÉRO)[:\s]*([A-Z0-9]{6,15})/i,
        /CARTE\s+N°[:\s]*([A-Z0-9]{6,15})/i,
        /([A-Z]{2}\d{6,12})/g,
      ],
      validation: (value: string) => /^[A-Z0-9]{6,15}$/i.test(value.trim()),
      priority: 2,
    },
    nationality: {
      patterns: [/(?:NATIONALITÉ|NATIONALITY)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s]{3,20})/i, /FRANÇAISE?/i, /FRENCH/i],
      validation: (value: string) => value.trim().length >= 3,
      priority: 3,
    },
  },
  tax_notice: {
    fiscalYear: {
      patterns: [
        /(?:REVENUS|ANNÉE|YEAR)\s+(\d{4})/i,
        /AVIS\s+D'IMPOSITION\s+(\d{4})/i,
        /IMPÔT\s+SUR\s+LE\s+REVENU\s+(\d{4})/i,
        /(\d{4})/g,
      ],
      validation: (value: string) => {
        const year = Number.parseInt(value)
        return year >= 2020 && year <= new Date().getFullYear()
      },
      priority: 1,
    },
    taxpayerName: {
      patterns: [
        /(?:M\.|MME|MR|MRS)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{3,50})/i,
        /CONTRIBUABLE[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{3,50})/i,
        /DÉCLARANT[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{3,50})/i,
      ],
      validation: (value: string) => value.trim().length >= 3,
      priority: 1,
    },
    fiscalNumber: {
      patterns: [
        /(?:NUMÉRO\s+FISCAL|FISCAL\s+NUMBER|N°\s+FISCAL)[:\s]*(\d{10,15})/i,
        /(\d{13})/g,
        /SPI[:\s]*(\d{10,15})/i,
      ],
      validation: (value: string) => /^\d{10,15}$/.test(value.trim()),
      priority: 1,
    },
    annualRevenue: {
      patterns: [
        /(?:REVENU\s+FISCAL\s+DE\s+RÉFÉRENCE|RFR)[:\s]*([0-9\s]{1,10})/i,
        /RÉFÉRENCE\s+FISCALE[:\s]*([0-9\s]{1,10})/i,
        /(\d{1,3}(?:\s\d{3})*)\s*€?/g,
      ],
      validation: (value: string) => /^\d+$/.test(value.replace(/\s/g, "")),
      priority: 2,
    },
    taxableIncome: {
      patterns: [/(?:REVENU\s+IMPOSABLE|TAXABLE\s+INCOME)[:\s]*([0-9\s]{1,10})/i, /IMPOSABLE[:\s]*([0-9\s]{1,10})/i],
      validation: (value: string) => /^\d+$/.test(value.replace(/\s/g, "")),
      priority: 2,
    },
  },
  payslip: {
    employeeName: {
      patterns: [
        /(?:SALARIÉ|EMPLOYEE|NOM)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{3,50})/i,
        /^([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{3,50})\s*\n.*(?:EMPLOYEUR|SOCIÉTÉ)/im,
      ],
      validation: (value: string) => value.trim().length >= 3,
      priority: 1,
    },
    employerName: {
      patterns: [
        /(?:EMPLOYEUR|EMPLOYER|SOCIÉTÉ|COMPANY)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{3,50})/i,
        /RAISON\s+SOCIALE[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{3,50})/i,
      ],
      validation: (value: string) => value.trim().length >= 3,
      priority: 1,
    },
    payPeriod: {
      patterns: [
        /(?:PÉRIODE|PERIOD|MOIS)[:\s]*(\d{1,2}[/\-.]\d{4})/i,
        /DU\s+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})\s+AU\s+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i,
        /(\d{1,2}[/\-.]\d{4})/g,
      ],
      validation: (value: string) => /^\d{1,2}[/\-.]\d{4}$/.test(value.trim()),
      priority: 2,
    },
    grossSalary: {
      patterns: [
        /(?:SALAIRE\s+BRUT|BRUT|GROSS\s+PAY)[:\s]*([0-9\s,.]{1,10})/i,
        /TOTAL\s+BRUT[:\s]*([0-9\s,.]{1,10})/i,
        /BRUT[:\s]*([0-9\s,.]{1,10})\s*€?/i,
      ],
      validation: (value: string) => /^[\d\s,.]+$/.test(value.trim()),
      priority: 1,
    },
    netSalary: {
      patterns: [
        /(?:NET\s+À\s+PAYER|SALAIRE\s+NET|NET\s+PAY)[:\s]*([0-9\s,.]{1,10})/i,
        /NET\s+IMPOSABLE[:\s]*([0-9\s,.]{1,10})/i,
        /NET[:\s]*([0-9\s,.]{1,10})\s*€?/i,
      ],
      validation: (value: string) => /^[\d\s,.]+$/.test(value.trim()),
      priority: 1,
    },
    socialSecurityNumber: {
      patterns: [
        /(?:SÉCURITÉ\s+SOCIALE|SS|N°\s+SS)[:\s]*(\d{1}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2})/i,
        /(\d{1}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2})/g,
      ],
      validation: (value: string) => {
        const cleaned = value.replace(/\s/g, "")
        return /^\d{15}$/.test(cleaned)
      },
      priority: 2,
    },
  },
  bank_statement: {
    accountHolder: {
      patterns: [
        /(?:TITULAIRE|HOLDER)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{3,50})/i,
        /^([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{3,50})\s*\n.*COMPTE/im,
      ],
      validation: (value: string) => value.trim().length >= 3,
      priority: 1,
    },
    accountNumber: {
      patterns: [
        /(?:COMPTE|ACCOUNT)[:\s]*([0-9\s-]{10,25})/i,
        /N°\s+COMPTE[:\s]*([0-9\s-]{10,25})/i,
        /IBAN[:\s]*([A-Z]{2}\d{2}[A-Z0-9\s]{15,30})/i,
      ],
      validation: (value: string) => {
        const cleaned = value.replace(/\s/g, "")
        return cleaned.length >= 10
      },
      priority: 1,
    },
    balance: {
      patterns: [
        /(?:SOLDE|BALANCE)[:\s]*(-?[0-9\s,.]+)/i,
        /NOUVEAU\s+SOLDE[:\s]*(-?[0-9\s,.]+)/i,
        /SOLDE\s+CRÉDITEUR[:\s]*([0-9\s,.]+)/i,
      ],
      validation: (value: string) => /^-?[\d\s,.]+$/.test(value.trim()),
      priority: 2,
    },
    bankName: {
      patterns: [
        /(?:BANQUE|BANK)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]{3,30})/i,
        /(CRÉDIT\s+AGRICOLE|BNP\s+PARIBAS|SOCIÉTÉ\s+GÉNÉRALE|LCL|CAISSE\s+D'ÉPARGNE)/i,
      ],
      validation: (value: string) => value.trim().length >= 3,
      priority: 3,
    },
  },
}

export class AdvancedOCRService {
  private worker: any = null
  private isInitialized = false

  async initialize() {
    if (this.isInitialized) return

    try {
      console.log("🔧 Initialisation OCR avancé...")

      this.worker = await createWorker("fra+eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        },
      })

      // Configuration optimisée pour l'extraction de champs
      await this.worker.setParameters({
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ .,;:!?()[]{}/-€$%°",
        tessedit_pageseg_mode: "6", // Uniform block of text
        preserve_interword_spaces: "1",
        tessedit_do_invert: "0",
      })

      this.isInitialized = true
      console.log("✅ OCR avancé initialisé")
    } catch (error) {
      console.error("❌ Erreur initialisation OCR avancé:", error)
      throw error
    }
  }

  async extractDocumentFields(
    file: File,
    documentType: string,
    onProgress?: (progress: number) => void,
  ): Promise<DocumentFieldsResult> {
    const startTime = Date.now()

    try {
      await this.initialize()

      console.log(`🔍 Extraction de champs pour ${documentType}`)

      // Convertir le fichier en images si nécessaire
      const images = await this.prepareImages(file)

      let allText = ""
      let totalConfidence = 0

      // Traiter chaque image
      for (const [index, image] of images.entries()) {
        onProgress?.(Math.round(((index + 1) / images.length) * 80)) // 80% pour l'OCR

        const result = await this.worker.recognize(image)
        allText += result.data.text + "\n\n"
        totalConfidence += result.data.confidence
      }

      const averageConfidence = totalConfidence / images.length

      // Extraction des champs spécifiques
      onProgress?.(90) // 90% pour l'extraction de champs
      const fields = await this.extractSpecificFields(allText, documentType)

      onProgress?.(100)

      const result: DocumentFieldsResult = {
        documentType,
        fields,
        rawText: allText,
        overallConfidence: averageConfidence,
        processingTime: Date.now() - startTime,
      }

      console.log(`✅ Extraction terminée: ${fields.length} champs extraits`)
      return result
    } catch (error) {
      console.error("❌ Erreur extraction de champs:", error)
      throw error
    }
  }

  private async prepareImages(file: File): Promise<string[]> {
    if (file.type === "application/pdf") {
      return await this.convertPdfToImages(file)
    } else if (file.type.startsWith("image/")) {
      return [URL.createObjectURL(file)]
    } else {
      throw new Error(`Type de fichier non supporté: ${file.type}`)
    }
  }

  private async convertPdfToImages(file: File): Promise<string[]> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const images: string[] = []

      for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 3); pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 2.5 }) // Très haute résolution

        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")!
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise

        const imageDataUrl = canvas.toDataURL("image/png", 1.0) // Qualité maximale
        images.push(imageDataUrl)
      }

      return images
    } catch (error) {
      console.error("❌ Erreur conversion PDF:", error)
      throw new Error("Impossible de convertir le PDF")
    }
  }

  private async extractSpecificFields(text: string, documentType: string): Promise<FieldExtractionResult[]> {
    const patterns = FIELD_PATTERNS[documentType as keyof typeof FIELD_PATTERNS]
    if (!patterns) {
      throw new Error(`Type de document non supporté: ${documentType}`)
    }

    const results: FieldExtractionResult[] = []
    const cleanText = text.replace(/\s+/g, " ").trim()

    for (const [fieldName, fieldConfig] of Object.entries(patterns)) {
      const fieldResult = await this.extractField(cleanText, fieldName, fieldConfig)
      if (fieldResult) {
        results.push(fieldResult)
      }
    }

    // Trier par priorité et confiance
    results.sort((a, b) => {
      const priorityA = patterns[a.field as keyof typeof patterns]?.priority || 999
      const priorityB = patterns[b.field as keyof typeof patterns]?.priority || 999

      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      return b.confidence - a.confidence
    })

    return results
  }

  private async extractField(text: string, fieldName: string, config: any): Promise<FieldExtractionResult | null> {
    const candidates: { value: string; confidence: number }[] = []

    // Tester chaque pattern
    for (const pattern of config.patterns) {
      try {
        // Créer une nouvelle RegExp avec les flags corrects pour éviter les doublons
        const flags = pattern.flags || ""
        const globalFlags = flags.includes("g") ? flags : flags + "g"
        const globalPattern = new RegExp(pattern.source, globalFlags)

        const matches = Array.from(text.matchAll(globalPattern))

        for (const match of matches) {
          const value = match[1]?.trim()
          if (!value) continue

          // Valider la valeur
          if (config.validation && !config.validation(value)) {
            continue
          }

          // Calculer la confiance basée sur la position et le contexte
          let confidence = 0.7 // Confiance de base

          // Bonus si le pattern est spécifique
          if (pattern.source.includes(fieldName.toUpperCase())) {
            confidence += 0.2
          }

          // Bonus si la valeur semble correcte
          if (value.length >= 3 && value.length <= 50) {
            confidence += 0.1
          }

          candidates.push({ value, confidence: Math.min(confidence, 1.0) })
        }
      } catch (error) {
        console.warn(`⚠️ Erreur pattern pour ${fieldName}:`, error)
        continue
      }
    }

    if (candidates.length === 0) {
      return {
        field: fieldName,
        value: null,
        confidence: 0,
        alternatives: [],
      }
    }

    // Sélectionner le meilleur candidat
    candidates.sort((a, b) => b.confidence - a.confidence)
    const best = candidates[0]
    const alternatives = candidates.slice(1, 3).map((c) => c.value)

    return {
      field: fieldName,
      value: best.value,
      confidence: best.confidence,
      alternatives,
    }
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.isInitialized = false
    }
  }
}

// Instance singleton
export const advancedOCRService = new AdvancedOCRService()

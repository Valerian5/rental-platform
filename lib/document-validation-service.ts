import { supabase } from "./supabase"
import { createWorker } from "tesseract.js"

export interface DocumentValidationResult {
  documentId: string
  documentType: string
  isValid: boolean
  confidence: number
  errors: ValidationError[]
  warnings: ValidationWarning[]
  extractedData: Record<string, any>
  processingTime: number
  timestamp: string
}

export interface ValidationError {
  code: string
  message: string
  severity: "critical" | "major" | "minor"
  field?: string
  suggestion?: string
}

export interface ValidationWarning {
  code: string
  message: string
  field?: string
}

export interface ValidationRule {
  id: string
  documentType: string
  field: string
  type: "required" | "format" | "date" | "consistency" | "api_check"
  pattern?: string
  minValue?: number
  maxValue?: number
  threshold: number
  enabled: boolean
}

export interface CrossValidationRule {
  id: string
  name: string
  documents: string[]
  fields: string[]
  rule: string
  threshold: number
  enabled: boolean
}

// Configuration des règles de validation par type de document
const VALIDATION_RULES: Record<string, ValidationRule[]> = {
  identity: [
    {
      id: "id_expiration",
      documentType: "identity",
      field: "expiration_date",
      type: "date",
      threshold: 0.95,
      enabled: true,
    },
    {
      id: "id_name_consistency",
      documentType: "identity",
      field: "full_name",
      type: "required",
      threshold: 0.99,
      enabled: true,
    },
    {
      id: "id_birth_date",
      documentType: "identity",
      field: "birth_date",
      type: "date",
      threshold: 0.95,
      enabled: true,
    },
  ],
  tax_notice: [
    {
      id: "tax_fiscal_year",
      documentType: "tax_notice",
      field: "fiscal_year",
      type: "date",
      minValue: new Date().getFullYear() - 2,
      maxValue: new Date().getFullYear(),
      threshold: 0.99,
      enabled: true,
    },
    {
      id: "tax_revenue_format",
      documentType: "tax_notice",
      field: "annual_revenue",
      type: "format",
      pattern: "^[0-9]+$",
      threshold: 0.95,
      enabled: true,
    },
  ],
  payslip: [
    {
      id: "payslip_date",
      documentType: "payslip",
      field: "pay_date",
      type: "date",
      threshold: 0.95,
      enabled: true,
    },
    {
      id: "payslip_employer",
      documentType: "payslip",
      field: "employer_name",
      type: "required",
      threshold: 0.9,
      enabled: true,
    },
    {
      id: "payslip_net_salary",
      documentType: "payslip",
      field: "net_salary",
      type: "format",
      pattern: "^[0-9]+([.,][0-9]{2})?$",
      threshold: 0.95,
      enabled: true,
    },
  ],
  bank_statement: [
    {
      id: "bank_period",
      documentType: "bank_statement",
      field: "statement_period",
      type: "date",
      threshold: 0.95,
      enabled: true,
    },
    {
      id: "bank_balance",
      documentType: "bank_statement",
      field: "balance",
      type: "format",
      pattern: "^-?[0-9]+([.,][0-9]{2})?$",
      threshold: 0.9,
      enabled: true,
    },
  ],
}

// Règles de validation croisée
const CROSS_VALIDATION_RULES: CrossValidationRule[] = [
  {
    id: "name_consistency",
    name: "Cohérence des noms",
    documents: ["identity", "tax_notice", "payslip"],
    fields: ["full_name", "taxpayer_name", "employee_name"],
    rule: "names_match",
    threshold: 0.85,
    enabled: true,
  },
  {
    id: "income_consistency",
    name: "Cohérence des revenus",
    documents: ["tax_notice", "payslip"],
    fields: ["annual_revenue", "net_salary"],
    rule: "income_coherence",
    threshold: 0.8,
    enabled: true,
  },
  {
    id: "temporal_consistency",
    name: "Cohérence temporelle",
    documents: ["payslip", "bank_statement"],
    fields: ["pay_date", "statement_period"],
    rule: "dates_coherent",
    threshold: 0.9,
    enabled: true,
  },
]

export class DocumentValidationService {
  private ocrWorker: any = null
  private cache = new Map<string, any>()

  constructor() {
    this.initializeOCR()
  }

  private async initializeOCR() {
    try {
      this.ocrWorker = await createWorker("fra")
      console.log("✅ OCR Worker initialisé")
    } catch (error) {
      console.error("❌ Erreur initialisation OCR:", error)
    }
  }

  /**
   * Point d'entrée principal pour la validation d'un document
   */
  async validateDocument(
    documentUrl: string,
    documentType: string,
    tenantId: string,
  ): Promise<DocumentValidationResult> {
    const startTime = Date.now()

    try {
      console.log(`🔍 Validation document ${documentType} pour tenant ${tenantId}`)

      // Vérifier le cache
      const cacheKey = `${documentUrl}_${documentType}`
      if (this.cache.has(cacheKey)) {
        console.log("📋 Résultat trouvé en cache")
        return this.cache.get(cacheKey)
      }

      // Étape 1: Extraction OCR
      const extractedData = await this.extractTextFromDocument(documentUrl, documentType)

      // Étape 2: Validation basique
      const basicValidation = await this.validateBasic(extractedData, documentType)

      // Étape 3: Validation sémantique
      const semanticValidation = await this.validateSemantic(extractedData, documentType)

      // Étape 4: Validation croisée (si d'autres documents existent)
      const crossValidation = await this.validateCross(extractedData, documentType, tenantId)

      // Compilation des résultats
      const result: DocumentValidationResult = {
        documentId: this.generateDocumentId(),
        documentType,
        isValid: basicValidation.isValid && semanticValidation.isValid && crossValidation.isValid,
        confidence: Math.min(basicValidation.confidence, semanticValidation.confidence, crossValidation.confidence),
        errors: [...basicValidation.errors, ...semanticValidation.errors, ...crossValidation.errors],
        warnings: [...basicValidation.warnings, ...semanticValidation.warnings, ...crossValidation.warnings],
        extractedData,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }

      // Sauvegarder en cache et base de données
      this.cache.set(cacheKey, result)
      await this.saveValidationResult(result, tenantId)

      console.log(`✅ Validation terminée en ${result.processingTime}ms`)
      return result
    } catch (error) {
      console.error("❌ Erreur validation document:", error)

      return {
        documentId: this.generateDocumentId(),
        documentType,
        isValid: false,
        confidence: 0,
        errors: [
          {
            code: "PROCESSING_ERROR",
            message: "Erreur lors du traitement du document",
            severity: "critical",
          },
        ],
        warnings: [],
        extractedData: {},
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Extraction de texte via OCR
   */
  private async extractTextFromDocument(documentUrl: string, documentType: string): Promise<Record<string, any>> {
    try {
      console.log("📄 Extraction OCR en cours...")

      if (!this.ocrWorker) {
        await this.initializeOCR()
      }

      // Télécharger le document
      const response = await fetch(documentUrl)
      const blob = await response.blob()

      // Extraction OCR
      const {
        data: { text },
      } = await this.ocrWorker.recognize(blob)

      // Parser selon le type de document
      const extractedData = await this.parseDocumentText(text, documentType)

      console.log("✅ Extraction OCR terminée")
      return extractedData
    } catch (error) {
      console.error("❌ Erreur extraction OCR:", error)
      throw new Error("Impossible d'extraire le texte du document")
    }
  }

  /**
   * Parser le texte selon le type de document
   */
  private async parseDocumentText(text: string, documentType: string): Promise<Record<string, any>> {
    const cleanText = text.replace(/\s+/g, " ").trim()

    switch (documentType) {
      case "identity":
        return this.parseIdentityDocument(cleanText)

      case "tax_notice":
        return this.parseTaxNotice(cleanText)

      case "payslip":
        return this.parsePayslip(cleanText)

      case "bank_statement":
        return this.parseBankStatement(cleanText)

      default:
        return { raw_text: cleanText }
    }
  }

  /**
   * Parser une pièce d'identité
   */
  private parseIdentityDocument(text: string): Record<string, any> {
    const data: Record<string, any> = { raw_text: text }

    // Extraction du nom complet
    const nameMatch = text.match(/(?:NOM|SURNAME)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+)/i)
    if (nameMatch) {
      data.last_name = nameMatch[1].trim()
    }

    // Extraction du prénom
    const firstNameMatch = text.match(/(?:PRÉNOM|PRENOM|GIVEN NAME)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+)/i)
    if (firstNameMatch) {
      data.first_name = firstNameMatch[1].trim()
    }

    // Nom complet
    if (data.last_name && data.first_name) {
      data.full_name = `${data.first_name} ${data.last_name}`
    }

    // Date de naissance
    const birthDateMatch = text.match(/(?:NÉ|NE|BORN)[:\s]+(?:LE\s+)?(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i)
    if (birthDateMatch) {
      data.birth_date = this.normalizeDate(birthDateMatch[1])
    }

    // Date d'expiration
    const expirationMatch = text.match(
      /(?:EXPIRE|EXPIRY|VALABLE JUSQU)[:\s]+(?:LE\s+)?(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i,
    )
    if (expirationMatch) {
      data.expiration_date = this.normalizeDate(expirationMatch[1])
    }

    // Numéro de document
    const docNumberMatch = text.match(/(?:N°|NO|NUMBER)[:\s]+([A-Z0-9]+)/i)
    if (docNumberMatch) {
      data.document_number = docNumberMatch[1]
    }

    return data
  }

  /**
   * Parser un avis d'imposition
   */
  private parseTaxNotice(text: string): Record<string, any> {
    const data: Record<string, any> = { raw_text: text }

    // Année fiscale
    const fiscalYearMatch = text.match(/(?:REVENUS|ANNÉE|YEAR)\s+(\d{4})/i)
    if (fiscalYearMatch) {
      data.fiscal_year = Number.parseInt(fiscalYearMatch[1])
    }

    // Nom du contribuable
    const taxpayerMatch = text.match(/(?:M\.|MME|MR|MRS)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+)/i)
    if (taxpayerMatch) {
      data.taxpayer_name = taxpayerMatch[1].trim()
    }

    // Revenu fiscal de référence
    const revenueMatch = text.match(/(?:REVENU FISCAL DE RÉFÉRENCE|RFR)[:\s]+([0-9\s]+)/i)
    if (revenueMatch) {
      data.annual_revenue = Number.parseInt(revenueMatch[1].replace(/\s/g, ""))
    }

    // Nombre de parts
    const partsMatch = text.match(/(?:NOMBRE DE PARTS|PARTS)[:\s]+([0-9,.]+)/i)
    if (partsMatch) {
      data.tax_parts = Number.parseFloat(partsMatch[1].replace(",", "."))
    }

    return data
  }

  /**
   * Parser une fiche de paie
   */
  private parsePayslip(text: string): Record<string, any> {
    const data: Record<string, any> = { raw_text: text }

    // Nom de l'employé
    const employeeMatch = text.match(/(?:SALARIÉ|EMPLOYEE|NOM)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+)/i)
    if (employeeMatch) {
      data.employee_name = employeeMatch[1].trim()
    }

    // Employeur
    const employerMatch = text.match(/(?:EMPLOYEUR|EMPLOYER|SOCIÉTÉ)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+)/i)
    if (employerMatch) {
      data.employer_name = employerMatch[1].trim()
    }

    // Période de paie
    const periodMatch = text.match(/(?:PÉRIODE|PERIOD|MOIS)[:\s]+(\d{1,2}[/\-.]\d{4})/i)
    if (periodMatch) {
      data.pay_period = periodMatch[1]
    }

    // Salaire net
    const netSalaryMatch = text.match(/(?:NET À PAYER|SALAIRE NET|NET PAY)[:\s]+([0-9\s,.]+)/i)
    if (netSalaryMatch) {
      data.net_salary = Number.parseFloat(netSalaryMatch[1].replace(/[\s,]/g, "").replace(".", "."))
    }

    // Salaire brut
    const grossSalaryMatch = text.match(/(?:SALAIRE BRUT|GROSS PAY)[:\s]+([0-9\s,.]+)/i)
    if (grossSalaryMatch) {
      data.gross_salary = Number.parseFloat(grossSalaryMatch[1].replace(/[\s,]/g, "").replace(".", "."))
    }

    return data
  }

  /**
   * Parser un relevé bancaire
   */
  private parseBankStatement(text: string): Record<string, any> {
    const data: Record<string, any> = { raw_text: text }

    // Période du relevé
    const periodMatch = text.match(
      /(?:PÉRIODE|PERIOD|DU\s+)(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})\s+(?:AU\s+)(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i,
    )
    if (periodMatch) {
      data.statement_period = {
        start: this.normalizeDate(periodMatch[1]),
        end: this.normalizeDate(periodMatch[2]),
      }
    }

    // Solde
    const balanceMatch = text.match(/(?:SOLDE|BALANCE)[:\s]+(-?[0-9\s,.]+)/i)
    if (balanceMatch) {
      data.balance = Number.parseFloat(balanceMatch[1].replace(/[\s,]/g, "").replace(".", "."))
    }

    // Titulaire du compte
    const holderMatch = text.match(/(?:TITULAIRE|HOLDER)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+)/i)
    if (holderMatch) {
      data.account_holder = holderMatch[1].trim()
    }

    return data
  }

  /**
   * Validation basique (format, champs requis)
   */
  private async validateBasic(
    data: Record<string, any>,
    documentType: string,
  ): Promise<{
    isValid: boolean
    confidence: number
    errors: ValidationError[]
    warnings: ValidationWarning[]
  }> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const rules = VALIDATION_RULES[documentType] || []

    let totalConfidence = 0
    let validRules = 0

    for (const rule of rules.filter((r) => r.enabled)) {
      const fieldValue = data[rule.field]
      let ruleValid = true
      let ruleConfidence = 1.0

      switch (rule.type) {
        case "required":
          if (!fieldValue || fieldValue.toString().trim() === "") {
            errors.push({
              code: `MISSING_${rule.field.toUpperCase()}`,
              message: `Le champ ${rule.field} est obligatoire`,
              severity: "critical",
              field: rule.field,
            })
            ruleValid = false
            ruleConfidence = 0
          }
          break

        case "format":
          if (fieldValue && rule.pattern) {
            const regex = new RegExp(rule.pattern)
            if (!regex.test(fieldValue.toString())) {
              errors.push({
                code: `INVALID_FORMAT_${rule.field.toUpperCase()}`,
                message: `Le format du champ ${rule.field} est invalide`,
                severity: "major",
                field: rule.field,
              })
              ruleValid = false
              ruleConfidence = 0.3
            }
          }
          break

        case "date":
          if (fieldValue) {
            const date = new Date(fieldValue)
            if (isNaN(date.getTime())) {
              errors.push({
                code: `INVALID_DATE_${rule.field.toUpperCase()}`,
                message: `La date ${rule.field} est invalide`,
                severity: "major",
                field: rule.field,
              })
              ruleValid = false
              ruleConfidence = 0.2
            } else {
              // Vérifier les limites de date
              if (rule.minValue && date.getFullYear() < rule.minValue) {
                warnings.push({
                  code: `OLD_DATE_${rule.field.toUpperCase()}`,
                  message: `La date ${rule.field} semble ancienne`,
                  field: rule.field,
                })
                ruleConfidence = 0.7
              }
              if (rule.maxValue && date.getFullYear() > rule.maxValue) {
                errors.push({
                  code: `FUTURE_DATE_${rule.field.toUpperCase()}`,
                  message: `La date ${rule.field} est dans le futur`,
                  severity: "major",
                  field: rule.field,
                })
                ruleValid = false
                ruleConfidence = 0.1
              }
            }
          }
          break
      }

      if (ruleValid && ruleConfidence >= rule.threshold) {
        validRules++
      }
      totalConfidence += ruleConfidence
    }

    const confidence = rules.length > 0 ? totalConfidence / rules.length : 1.0
    const isValid = errors.filter((e) => e.severity === "critical").length === 0

    return { isValid, confidence, errors, warnings }
  }

  /**
   * Validation sémantique (cohérence interne)
   */
  private async validateSemantic(
    data: Record<string, any>,
    documentType: string,
  ): Promise<{
    isValid: boolean
    confidence: number
    errors: ValidationError[]
    warnings: ValidationWarning[]
  }> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let confidence = 1.0

    switch (documentType) {
      case "identity":
        // Vérifier que la pièce d'identité n'est pas expirée
        if (data.expiration_date) {
          const expirationDate = new Date(data.expiration_date)
          const now = new Date()
          if (expirationDate < now) {
            errors.push({
              code: "EXPIRED_IDENTITY",
              message: "La pièce d'identité est expirée",
              severity: "critical",
              field: "expiration_date",
            })
            confidence = 0.1
          } else if (expirationDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
            warnings.push({
              code: "EXPIRING_SOON",
              message: "La pièce d'identité expire bientôt",
              field: "expiration_date",
            })
            confidence = 0.8
          }
        }
        break

      case "payslip":
        // Vérifier la cohérence salaire brut/net
        if (data.gross_salary && data.net_salary) {
          const ratio = data.net_salary / data.gross_salary
          if (ratio > 0.9 || ratio < 0.5) {
            warnings.push({
              code: "UNUSUAL_SALARY_RATIO",
              message: "Le ratio salaire net/brut semble inhabituel",
              field: "net_salary",
            })
            confidence = 0.7
          }
        }
        break

      case "tax_notice":
        // Vérifier que l'année fiscale est récente
        if (data.fiscal_year) {
          const currentYear = new Date().getFullYear()
          if (data.fiscal_year < currentYear - 2) {
            warnings.push({
              code: "OLD_TAX_NOTICE",
              message: "L'avis d'imposition est ancien",
              field: "fiscal_year",
            })
            confidence = 0.6
          }
        }
        break
    }

    const isValid = errors.filter((e) => e.severity === "critical").length === 0

    return { isValid, confidence, errors, warnings }
  }

  /**
   * Validation croisée entre documents
   */
  private async validateCross(
    data: Record<string, any>,
    documentType: string,
    tenantId: string,
  ): Promise<{
    isValid: boolean
    confidence: number
    errors: ValidationError[]
    warnings: ValidationWarning[]
  }> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let confidence = 1.0

    try {
      // Récupérer les autres documents validés pour ce tenant
      const { data: existingValidations } = await supabase
        .from("document_validations")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_valid", true)

      if (!existingValidations || existingValidations.length === 0) {
        return { isValid: true, confidence: 1.0, errors: [], warnings: [] }
      }

      // Appliquer les règles de validation croisée
      for (const rule of CROSS_VALIDATION_RULES.filter((r) => r.enabled)) {
        if (!rule.documents.includes(documentType)) continue

        const relevantDocs = existingValidations.filter(
          (v) => rule.documents.includes(v.document_type) && v.document_type !== documentType,
        )

        if (relevantDocs.length === 0) continue

        switch (rule.rule) {
          case "names_match":
            await this.validateNamesConsistency(data, relevantDocs, rule, errors, warnings)
            break

          case "income_coherence":
            await this.validateIncomeCoherence(data, relevantDocs, rule, errors, warnings)
            break

          case "dates_coherent":
            await this.validateDatesCoherence(data, relevantDocs, rule, errors, warnings)
            break
        }
      }

      const isValid = errors.filter((e) => e.severity === "critical").length === 0
      if (errors.length > 0 || warnings.length > 0) {
        confidence = 0.7
      }

      return { isValid, confidence, errors, warnings }
    } catch (error) {
      console.error("❌ Erreur validation croisée:", error)
      return { isValid: true, confidence: 0.5, errors: [], warnings: [] }
    }
  }

  /**
   * Valider la cohérence des noms entre documents
   */
  private async validateNamesConsistency(
    currentData: Record<string, any>,
    existingDocs: any[],
    rule: CrossValidationRule,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ) {
    const currentName = this.extractName(currentData)
    if (!currentName) return

    for (const doc of existingDocs) {
      const docData = doc.extracted_data
      const docName = this.extractName(docData)

      if (docName && !this.namesMatch(currentName, docName, rule.threshold)) {
        errors.push({
          code: "NAME_INCONSISTENCY",
          message: `Incohérence de nom entre les documents: "${currentName}" vs "${docName}"`,
          severity: "major",
          suggestion: "Vérifiez que tous les documents appartiennent à la même personne",
        })
      }
    }
  }

  /**
   * Valider la cohérence des revenus
   */
  private async validateIncomeCoherence(
    currentData: Record<string, any>,
    existingDocs: any[],
    rule: CrossValidationRule,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ) {
    // Logique de validation des revenus entre fiche de paie et avis d'imposition
    const currentIncome = currentData.net_salary || currentData.annual_revenue
    if (!currentIncome) return

    for (const doc of existingDocs) {
      const docData = doc.extracted_data
      const docIncome = docData.net_salary || docData.annual_revenue

      if (docIncome) {
        // Convertir en revenus annuels pour comparaison
        const currentAnnual = currentData.net_salary ? currentIncome * 12 : currentIncome
        const docAnnual = docData.net_salary ? docIncome * 12 : docIncome

        const ratio = Math.abs(currentAnnual - docAnnual) / Math.max(currentAnnual, docAnnual)

        if (ratio > 0.3) {
          // Plus de 30% de différence
          warnings.push({
            code: "INCOME_DISCREPANCY",
            message: `Écart important entre les revenus déclarés: ${currentAnnual}€ vs ${docAnnual}€`,
            field: "income",
          })
        }
      }
    }
  }

  /**
   * Valider la cohérence temporelle
   */
  private async validateDatesCoherence(
    currentData: Record<string, any>,
    existingDocs: any[],
    rule: CrossValidationRule,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ) {
    // Vérifier que les dates des documents sont cohérentes (même période)
    const currentDate = this.extractRelevantDate(currentData)
    if (!currentDate) return

    for (const doc of existingDocs) {
      const docData = doc.extracted_data
      const docDate = this.extractRelevantDate(docData)

      if (docDate) {
        const timeDiff = Math.abs(currentDate.getTime() - docDate.getTime())
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24)

        if (daysDiff > 90) {
          // Plus de 3 mois d'écart
          warnings.push({
            code: "DATE_INCONSISTENCY",
            message: `Écart temporel important entre les documents: ${daysDiff.toFixed(0)} jours`,
            field: "dates",
          })
        }
      }
    }
  }

  /**
   * Utilitaires
   */
  private extractName(data: Record<string, any>): string | null {
    return data.full_name || data.taxpayer_name || data.employee_name || data.account_holder || null
  }

  private extractRelevantDate(data: Record<string, any>): Date | null {
    const dateStr = data.pay_period || data.fiscal_year || data.statement_period?.end
    return dateStr ? new Date(dateStr) : null
  }

  private namesMatch(name1: string, name2: string, threshold: number): boolean {
    // Algorithme simple de similarité de chaînes
    const similarity = this.calculateStringSimilarity(name1.toLowerCase().trim(), name2.toLowerCase().trim())
    return similarity >= threshold
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Implémentation simple de la distance de Levenshtein normalisée
    const matrix = []
    const len1 = str1.length
    const len2 = str2.length

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        }
      }
    }

    const maxLen = Math.max(len1, len2)
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen
  }

  private normalizeDate(dateStr: string): string {
    // Normaliser les formats de date
    const cleaned = dateStr.replace(/[/\-.]/g, "/")
    const parts = cleaned.split("/")

    if (parts.length === 3) {
      // Assumer DD/MM/YYYY
      const [day, month, year] = parts
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }

    return dateStr
  }

  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Sauvegarder le résultat de validation
   */
  private async saveValidationResult(result: DocumentValidationResult, tenantId: string) {
    try {
      await supabase.from("document_validations").insert({
        id: result.documentId,
        tenant_id: tenantId,
        document_type: result.documentType,
        is_valid: result.isValid,
        confidence: result.confidence,
        errors: result.errors,
        warnings: result.warnings,
        extracted_data: result.extractedData,
        processing_time: result.processingTime,
        created_at: result.timestamp,
      })
    } catch (error) {
      console.error("❌ Erreur sauvegarde validation:", error)
    }
  }

  /**
   * Récupérer l'historique de validation pour un tenant
   */
  async getValidationHistory(tenantId: string): Promise<DocumentValidationResult[]> {
    try {
      const { data, error } = await supabase
        .from("document_validations")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })

      if (error) throw error

      return data.map((row) => ({
        documentId: row.id,
        documentType: row.document_type,
        isValid: row.is_valid,
        confidence: row.confidence,
        errors: row.errors || [],
        warnings: row.warnings || [],
        extractedData: row.extracted_data || {},
        processingTime: row.processing_time,
        timestamp: row.created_at,
      }))
    } catch (error) {
      console.error("❌ Erreur récupération historique:", error)
      return []
    }
  }

  /**
   * Nettoyer le cache et libérer les ressources
   */
  async cleanup() {
    this.cache.clear()
    if (this.ocrWorker) {
      await this.ocrWorker.terminate()
      this.ocrWorker = null
    }
  }
}

// Instance singleton
export const documentValidationService = new DocumentValidationService()

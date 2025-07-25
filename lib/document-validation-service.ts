import { supabase } from "./supabase"

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
  private cache = new Map<string, any>()

  constructor() {
    // Pas d'initialisation OCR côté serveur
  }

  /**
   * Point d'entrée principal pour la validation d'un document
   * Cette méthode est appelée côté serveur avec les données déjà extraites
   */
  async validateDocument(
    extractedData: Record<string, any>,
    documentType: string,
    tenantId: string,
    userId: string,
    documentUrl?: string,
  ): Promise<DocumentValidationResult> {
    const startTime = Date.now()

    try {
      console.log(`🔍 Validation document ${documentType} pour tenant ${tenantId}`)

      // Audit log
      await this.logAuditEvent(userId, "DOCUMENT_VALIDATION_START", {
        documentType,
        tenantId,
        documentUrl,
      })

      // Vérifier le cache
      const cacheKey = `${JSON.stringify(extractedData)}_${documentType}`
      if (this.cache.has(cacheKey)) {
        console.log("📋 Résultat trouvé en cache")
        return this.cache.get(cacheKey)
      }

      // Étape 1: Validation basique
      const basicValidation = await this.validateBasic(extractedData, documentType)

      // Étape 2: Validation sémantique
      const semanticValidation = await this.validateSemantic(extractedData, documentType)

      // Étape 3: Validation croisée (si d'autres documents existent)
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
      await this.saveValidationResult(result, tenantId, documentUrl || "")

      // Audit log
      await this.logAuditEvent(userId, "DOCUMENT_VALIDATION_COMPLETE", {
        documentId: result.documentId,
        isValid: result.isValid,
        confidence: result.confidence,
        processingTime: result.processingTime,
      })

      console.log(`✅ Validation terminée en ${result.processingTime}ms`)
      return result
    } catch (error) {
      console.error("❌ Erreur validation document:", error)

      // Audit log d'erreur
      await this.logAuditEvent(userId, "DOCUMENT_VALIDATION_ERROR", {
        error: error instanceof Error ? error.message : "Unknown error",
        documentType,
        tenantId,
      })

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
   * Parser le texte selon le type de document
   */
  parseDocumentText(text: string, documentType: string, ocrConfidence: number): Record<string, any> {
    const cleanText = text.replace(/\s+/g, " ").trim()
    const baseData = {
      raw_text: cleanText,
      ocr_confidence: ocrConfidence,
      extraction_timestamp: new Date().toISOString(),
    }

    switch (documentType) {
      case "identity":
        return { ...baseData, ...this.parseIdentityDocument(cleanText) }

      case "tax_notice":
        return { ...baseData, ...this.parseTaxNotice(cleanText) }

      case "payslip":
        return { ...baseData, ...this.parsePayslip(cleanText) }

      case "bank_statement":
        return { ...baseData, ...this.parseBankStatement(cleanText) }

      default:
        return baseData
    }
  }

  /**
   * Parser une pièce d'identité
   */
  private parseIdentityDocument(text: string): Record<string, any> {
    const data: Record<string, any> = {}

    // Patterns pour carte d'identité française
    const patterns = {
      // Nom de famille
      lastName: [
        /(?:NOM|SURNAME)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+?)(?:\n|PRÉNOM|PRENOM|GIVEN)/i,
        /^([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+)\n.*PRÉNOM/im,
      ],

      // Prénom
      firstName: [
        /(?:PRÉNOM|PRENOM|GIVEN\s+NAME)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+?)(?:\n|NÉ|BORN)/i,
        /PRÉNOM[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+)/i,
      ],

      // Date de naissance
      birthDate: [
        /(?:NÉ|NE|BORN)[:\s]+(?:LE\s+)?(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i,
        /(?:DATE\s+DE\s+NAISSANCE|BIRTH\s+DATE)[:\s]+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i,
      ],

      // Date d'expiration
      expirationDate: [
        /(?:EXPIRE|EXPIRY|VALABLE\s+JUSQU)[:\s]+(?:LE\s+)?(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i,
        /(?:FIN\s+DE\s+VALIDITÉ|VALID\s+UNTIL)[:\s]+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i,
      ],

      // Numéro de document
      documentNumber: [/(?:N°|NO|NUMBER|NUMÉRO)[:\s]+([A-Z0-9]+)/i, /CARTE\s+N°[:\s]*([A-Z0-9]+)/i],

      // Lieu de naissance
      birthPlace: [/(?:À|A|AT)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+?)(?:\n|\d|NATIONALITÉ)/i],
    }

    // Extraction avec patterns multiples
    for (const [field, fieldPatterns] of Object.entries(patterns)) {
      for (const pattern of fieldPatterns) {
        const match = text.match(pattern)
        if (match && match[1]) {
          data[field] = match[1].trim()
          break
        }
      }
    }

    // Construction du nom complet
    if (data.lastName && data.firstName) {
      data.full_name = `${data.firstName} ${data.lastName}`
    }

    // Normalisation des dates
    if (data.birthDate) {
      data.birth_date = this.normalizeDate(data.birthDate)
    }
    if (data.expirationDate) {
      data.expiration_date = this.normalizeDate(data.expirationDate)
    }

    // Nettoyage des données
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === "string") {
        data[key] = data[key].replace(/\s+/g, " ").trim()
      }
    })

    return data
  }

  /**
   * Parser un avis d'imposition
   */
  private parseTaxNotice(text: string): Record<string, any> {
    const data: Record<string, any> = {}

    const patterns = {
      // Année fiscale
      fiscalYear: [
        /(?:REVENUS|ANNÉE|YEAR)\s+(\d{4})/i,
        /AVIS\s+D'IMPOSITION\s+(\d{4})/i,
        /IMPÔT\s+SUR\s+LE\s+REVENU\s+(\d{4})/i,
      ],

      // Nom du contribuable
      taxpayerName: [
        /(?:M\.|MME|MR|MRS)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+?)(?:\n|ADRESSE)/i,
        /CONTRIBUABLE[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+)/i,
      ],

      // Revenu fiscal de référence
      annualRevenue: [
        /(?:REVENU\s+FISCAL\s+DE\s+RÉFÉRENCE|RFR)[:\s]+([0-9\s]+)/i,
        /RÉFÉRENCE\s+FISCALE[:\s]+([0-9\s]+)/i,
      ],

      // Revenu imposable
      taxableIncome: [/(?:REVENU\s+IMPOSABLE|TAXABLE\s+INCOME)[:\s]+([0-9\s]+)/i],

      // Nombre de parts
      taxParts: [/(?:NOMBRE\s+DE\s+PARTS|PARTS)[:\s]+([0-9,.]+)/i],

      // Impôt dû
      taxDue: [/(?:IMPÔT\s+DÛ|TAX\s+DUE)[:\s]+([0-9\s,.]+)/i],
    }

    // Extraction avec patterns
    for (const [field, fieldPatterns] of Object.entries(patterns)) {
      for (const pattern of fieldPatterns) {
        const match = text.match(pattern)
        if (match && match[1]) {
          let value = match[1].trim()

          // Conversion numérique pour les montants
          if (["annualRevenue", "taxableIncome", "taxDue"].includes(field)) {
            value = value.replace(/\s/g, "").replace(",", ".")
            data[field] = Number.parseFloat(value) || 0
          } else if (field === "fiscalYear") {
            data[field] = Number.parseInt(value)
          } else if (field === "taxParts") {
            data[field] = Number.parseFloat(value.replace(",", "."))
          } else {
            data[field] = value
          }
          break
        }
      }
    }

    return data
  }

  /**
   * Parser une fiche de paie
   */
  private parsePayslip(text: string): Record<string, any> {
    const data: Record<string, any> = {}

    const patterns = {
      // Nom de l'employé
      employeeName: [
        /(?:SALARIÉ|EMPLOYEE|NOM)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+?)(?:\n|ADRESSE)/i,
        /^([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+)\n.*(?:EMPLOYEUR|SOCIÉTÉ)/im,
      ],

      // Employeur
      employerName: [
        /(?:EMPLOYEUR|EMPLOYER|SOCIÉTÉ)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+?)(?:\n|SIRET)/i,
        /RAISON\s+SOCIALE[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+)/i,
      ],

      // Période de paie
      payPeriod: [
        /(?:PÉRIODE|PERIOD|MOIS)[:\s]+(\d{1,2}[/\-.]\d{4})/i,
        /DU\s+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})\s+AU\s+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i,
      ],

      // Salaire brut
      grossSalary: [/(?:SALAIRE\s+BRUT|BRUT|GROSS\s+PAY)[:\s]+([0-9\s,.]+)/i, /TOTAL\s+BRUT[:\s]+([0-9\s,.]+)/i],

      // Salaire net
      netSalary: [
        /(?:NET\s+À\s+PAYER|SALAIRE\s+NET|NET\s+PAY)[:\s]+([0-9\s,.]+)/i,
        /NET\s+IMPOSABLE[:\s]+([0-9\s,.]+)/i,
      ],

      // Cotisations
      totalDeductions: [/(?:TOTAL\s+COTISATIONS|DEDUCTIONS)[:\s]+([0-9\s,.]+)/i],
    }

    // Extraction avec patterns
    for (const [field, fieldPatterns] of Object.entries(patterns)) {
      for (const pattern of fieldPatterns) {
        const match = text.match(pattern)
        if (match && match[1]) {
          let value = match[1].trim()

          // Conversion numérique pour les montants
          if (["grossSalary", "netSalary", "totalDeductions"].includes(field)) {
            value = value.replace(/\s/g, "").replace(",", ".")
            data[field] = Number.parseFloat(value) || 0
          } else {
            data[field] = value
          }
          break
        }
      }
    }

    return data
  }

  /**
   * Parser un relevé bancaire
   */
  private parseBankStatement(text: string): Record<string, any> {
    const data: Record<string, any> = {}

    const patterns = {
      // Période du relevé
      statementPeriod: [
        /(?:PÉRIODE|PERIOD|DU\s+)(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})\s+(?:AU\s+)(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i,
        /RELEVÉ\s+DU\s+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})\s+AU\s+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i,
      ],

      // Solde
      balance: [/(?:SOLDE|BALANCE)[:\s]+(-?[0-9\s,.]+)/i, /NOUVEAU\s+SOLDE[:\s]+(-?[0-9\s,.]+)/i],

      // Solde précédent
      previousBalance: [/(?:ANCIEN\s+SOLDE|PREVIOUS\s+BALANCE)[:\s]+(-?[0-9\s,.]+)/i],

      // Titulaire du compte
      accountHolder: [
        /(?:TITULAIRE|HOLDER)[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+?)(?:\n|COMPTE)/i,
        /^([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s-]+)\n.*COMPTE/im,
      ],

      // Numéro de compte
      accountNumber: [/(?:COMPTE|ACCOUNT)[:\s]+([0-9\s-]+)/i, /N°\s+COMPTE[:\s]+([0-9\s-]+)/i],
    }

    // Extraction avec patterns
    for (const [field, fieldPatterns] of Object.entries(patterns)) {
      for (const pattern of fieldPatterns) {
        const match = text.match(pattern)
        if (match) {
          if (field === "statementPeriod" && match[2]) {
            // Période avec deux dates
            data.statement_period = {
              start: this.normalizeDate(match[1]),
              end: this.normalizeDate(match[2]),
            }
          } else if (match[1]) {
            let value = match[1].trim()

            // Conversion numérique pour les montants
            if (["balance", "previousBalance"].includes(field)) {
              value = value.replace(/\s/g, "").replace(",", ".")
              data[field] = Number.parseFloat(value) || 0
            } else {
              data[field] = value
            }
          }
          break
        }
      }
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

    // Vérifier la confiance OCR
    if (data.ocr_confidence && data.ocr_confidence < 70) {
      warnings.push({
        code: "LOW_OCR_CONFIDENCE",
        message: `Confiance OCR faible (${Math.round(data.ocr_confidence)}%). Les données extraites peuvent être inexactes.`,
      })
    }

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
              suggestion: "Vérifiez que le document est lisible et complet",
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
                suggestion: "Vérifiez que les données ont été correctement extraites",
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
                suggestion: "Vérifiez le format de date dans le document",
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
              suggestion: "Fournissez une pièce d'identité valide",
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

        // Vérifier la cohérence âge/date de naissance
        if (data.birth_date) {
          const birthDate = new Date(data.birth_date)
          const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          if (age < 18) {
            warnings.push({
              code: "MINOR_APPLICANT",
              message: "Le demandeur semble être mineur",
              field: "birth_date",
            })
            confidence = 0.7
          } else if (age > 100) {
            warnings.push({
              code: "UNUSUAL_AGE",
              message: "L'âge calculé semble inhabituel",
              field: "birth_date",
            })
            confidence = 0.6
          }
        }
        break

      case "payslip":
        // Vérifier la cohérence salaire brut/net
        if (data.grossSalary && data.netSalary) {
          const ratio = data.netSalary / data.grossSalary
          if (ratio > 0.9) {
            warnings.push({
              code: "HIGH_NET_GROSS_RATIO",
              message: "Le ratio salaire net/brut semble élevé",
              field: "netSalary",
            })
            confidence = 0.7
          } else if (ratio < 0.5) {
            warnings.push({
              code: "LOW_NET_GROSS_RATIO",
              message: "Le ratio salaire net/brut semble faible",
              field: "netSalary",
            })
            confidence = 0.7
          }
        }

        // Vérifier que la période n'est pas trop ancienne
        if (data.payPeriod) {
          const periodDate = new Date(data.payPeriod)
          const monthsAgo = (Date.now() - periodDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
          if (monthsAgo > 6) {
            warnings.push({
              code: "OLD_PAYSLIP",
              message: "Cette fiche de paie date de plus de 6 mois",
              field: "payPeriod",
            })
            confidence = 0.6
          }
        }
        break

      case "tax_notice":
        // Vérifier que l'année fiscale est récente
        if (data.fiscalYear) {
          const currentYear = new Date().getFullYear()
          if (data.fiscalYear < currentYear - 2) {
            warnings.push({
              code: "OLD_TAX_NOTICE",
              message: "L'avis d'imposition est ancien",
              field: "fiscalYear",
            })
            confidence = 0.6
          } else if (data.fiscalYear > currentYear) {
            errors.push({
              code: "FUTURE_TAX_YEAR",
              message: "L'année fiscale est dans le futur",
              severity: "major",
              field: "fiscalYear",
            })
            confidence = 0.2
          }
        }

        // Vérifier la cohérence des revenus
        if (data.annualRevenue && data.taxableIncome) {
          if (data.taxableIncome > data.annualRevenue) {
            warnings.push({
              code: "INCONSISTENT_INCOME",
              message: "Le revenu imposable semble supérieur au revenu de référence",
              field: "taxableIncome",
            })
            confidence = 0.7
          }
        }
        break

      case "bank_statement":
        // Vérifier que la période n'est pas trop ancienne
        if (data.statement_period && data.statement_period.end) {
          const endDate = new Date(data.statement_period.end)
          const monthsAgo = (Date.now() - endDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
          if (monthsAgo > 3) {
            warnings.push({
              code: "OLD_BANK_STATEMENT",
              message: "Ce relevé bancaire date de plus de 3 mois",
              field: "statement_period",
            })
            confidence = 0.7
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
    const currentIncome = currentData.netSalary || currentData.annualRevenue
    if (!currentIncome) return

    for (const doc of existingDocs) {
      const docData = doc.extracted_data
      const docIncome = docData.netSalary || docData.annualRevenue

      if (docIncome) {
        // Convertir en revenus annuels pour comparaison
        const currentAnnual = currentData.netSalary ? currentIncome * 12 : currentIncome
        const docAnnual = docData.netSalary ? docIncome * 12 : docIncome

        const ratio = Math.abs(currentAnnual - docAnnual) / Math.max(currentAnnual, docAnnual)

        if (ratio > 0.3) {
          // Plus de 30% de différence
          warnings.push({
            code: "INCOME_DISCREPANCY",
            message: `Écart important entre les revenus déclarés: ${currentAnnual.toLocaleString()}€ vs ${docAnnual.toLocaleString()}€`,
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
            message: `Écart temporel important entre les documents: ${Math.round(daysDiff)} jours`,
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
  private async saveValidationResult(result: DocumentValidationResult, tenantId: string, documentUrl: string) {
    try {
      await supabase.from("document_validations").insert({
        id: result.documentId,
        tenant_id: tenantId,
        document_type: result.documentType,
        document_url: documentUrl,
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
   * Log d'audit pour traçabilité RGPD
   */
  private async logAuditEvent(userId: string, action: string, details: Record<string, any>) {
    try {
      await supabase.from("validation_audit_log").insert({
        user_id: userId,
        action,
        details,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("❌ Erreur log audit:", error)
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
   * Obtenir les statistiques de validation
   */
  async getValidationStats(tenantId?: string): Promise<{
    totalDocuments: number
    validDocuments: number
    averageConfidence: number
    errorsByType: Record<string, number>
    processingTimeAvg: number
  }> {
    try {
      let query = supabase.from("document_validations").select("*")

      if (tenantId) {
        query = query.eq("tenant_id", tenantId)
      }

      const { data, error } = await query

      if (error) throw error

      const stats = {
        totalDocuments: data.length,
        validDocuments: data.filter((d) => d.is_valid).length,
        averageConfidence: data.reduce((sum, d) => sum + d.confidence, 0) / data.length || 0,
        errorsByType: {} as Record<string, number>,
        processingTimeAvg: data.reduce((sum, d) => sum + d.processing_time, 0) / data.length || 0,
      }

      // Compter les erreurs par type
      data.forEach((doc) => {
        if (doc.errors && Array.isArray(doc.errors)) {
          doc.errors.forEach((error: any) => {
            stats.errorsByType[error.code] = (stats.errorsByType[error.code] || 0) + 1
          })
        }
      })

      return stats
    } catch (error) {
      console.error("❌ Erreur récupération statistiques:", error)
      return {
        totalDocuments: 0,
        validDocuments: 0,
        averageConfidence: 0,
        errorsByType: {},
        processingTimeAvg: 0,
      }
    }
  }

  /**
   * Nettoyer le cache et libérer les ressources
   */
  async cleanup() {
    this.cache.clear()
  }
}

// Instance singleton
export const documentValidationService = new DocumentValidationService()

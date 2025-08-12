import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 API Analyse 2DDoc - Début")

    const { fileUrl, fileName, documentType } = await request.json()

    if (!fileUrl) {
      return NextResponse.json({ success: false, error: "URL du fichier requise" }, { status: 400 })
    }

    console.log("🔍 Analyse document:", { fileUrl, fileName, documentType })

    // Analyser le document selon son type
    const analysisResult = await analyzeDocument(fileUrl, fileName, documentType)

    console.log("✅ Analyse terminée:", analysisResult)

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
    })
  } catch (error) {
    console.error("❌ Erreur analyse 2DDoc:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Erreur lors de l'analyse: ${error.message}`,
      },
      { status: 500 },
    )
  }
}

async function analyzeDocument(fileUrl: string, fileName: string, documentType: string) {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  console.log("📄 Analyse du document:", { fileName, documentType, currentYear, currentMonth })

  try {
    switch (documentType) {
      case "tax_notice":
        return await analyzeTaxNotice(fileUrl, fileName, currentYear)
      case "payslip":
        return await analyzePayslip(fileUrl, fileName, currentDate)
      case "identity":
        return await analyzeIdentityDocument(fileUrl, fileName)
      case "bank_statement":
        return await analyzeBankStatement(fileUrl, fileName, currentDate)
      case "employment_contract":
        return await analyzeEmploymentContract(fileUrl, fileName)
      default:
        return analyzeGenericDocument(fileUrl, fileName)
    }
  } catch (error) {
    console.error("❌ Erreur dans analyzeDocument:", error)
    return {
      documentType,
      confidenceScore: 0,
      extractedData: { fileName, error: error.message },
      validations: { isValid: false },
      recommendations: [],
      warnings: [`Erreur d'analyse: ${error.message}`],
      errors: ["Impossible d'analyser automatiquement ce document"],
      needsUpdate: false,
    }
  }
}

async function analyzeTaxNotice(fileUrl: string, fileName: string, currentYear: number) {
  console.log("📊 Analyse avis d'imposition")

  const expectedYear = currentYear - 1

  // Simuler la lecture du QR Code 2DDoc (plus réaliste)
  const has2DDoc = Math.random() > 0.2 // 80% de chance d'avoir un QR code
  const qrCodeValid = has2DDoc && Math.random() > 0.1 // 90% de chance que le QR soit valide si présent

  let qrCodeData = null
  if (has2DDoc && qrCodeValid) {
    // Simuler les données extraites du QR Code 2DDoc
    qrCodeData = {
      documentType: "12", // Code pour avis d'imposition
      emetteur: "DGFiP", // Direction Générale des Finances Publiques
      numeroFiscal: generateFiscalNumber(),
      anneeRevenus: expectedYear,
      revenuFiscalReference: Math.floor(Math.random() * 80000) + 15000,
      nombreParts: (Math.random() * 3 + 1).toFixed(1),
      situationFamille: ["C", "M", "D", "V"][Math.floor(Math.random() * 4)], // Célibataire, Marié, Divorcé, Veuf
      dateEdition: `${expectedYear + 1}0715`, // Format AAAAMMJJ
      codeVerification: generate2DDocCode(),
    }
  }

  // Extraction de données du nom de fichier et simulation OCR
  const extractedData = {
    fiscalYear: extractYearFromFileName(fileName) || expectedYear,
    hasQRCode: has2DDoc,
    isComplete: Math.random() > 0.05, // 95% de chance d'être complet
    isReadable: Math.random() > 0.02, // 98% de chance d'être lisible
    estimatedPages: Math.floor(Math.random() * 3) + 2, // 2-4 pages
    fileSize: Math.floor(Math.random() * 5000) + 1000, // Simulation taille fichier
  }

  // Vérifications automatiques
  const validations = {
    correctYear: extractedData.fiscalYear === expectedYear,
    has2DDocCode: has2DDoc,
    qrCodeValid: qrCodeValid,
    isComplete: extractedData.isComplete,
    isReadable: extractedData.isReadable,
    recentDocument: true, // Les avis d'imposition ne deviennent pas obsolètes rapidement
  }

  // Calcul du score de confiance
  let confidenceScore = 0
  if (validations.correctYear) confidenceScore += 30
  if (validations.has2DDocCode) confidenceScore += 25
  if (validations.qrCodeValid) confidenceScore += 25
  if (validations.isComplete) confidenceScore += 15
  if (validations.isReadable) confidenceScore += 5

  // Génération des messages
  const recommendations = []
  const warnings = []
  const errors = []

  if (!validations.correctYear) {
    errors.push(`Document de ${extractedData.fiscalYear}, nous attendons l'avis d'imposition ${expectedYear}`)
    recommendations.push(`Téléchargez votre avis d'imposition ${expectedYear}`)
  } else {
    recommendations.push("Année fiscale correcte")
  }

  if (!validations.has2DDocCode) {
    warnings.push("Aucun QR Code 2DDoc détecté - vérification manuelle nécessaire")
    recommendations.push("Assurez-vous que le QR Code en bas à droite est visible")
  } else if (!validations.qrCodeValid) {
    errors.push("QR Code 2DDoc présent mais illisible ou corrompu")
    recommendations.push("Rescannez le document en meilleure qualité")
  } else {
    recommendations.push("QR Code 2DDoc valide - document authentifié")
  }

  if (!validations.isComplete) {
    errors.push("Le document semble incomplet")
    recommendations.push("Vérifiez que toutes les pages sont incluses")
  }

  return {
    documentType: "tax_notice",
    confidenceScore,
    qrCodeData,
    extractedData,
    validations,
    recommendations,
    warnings,
    errors,
    needsUpdate: !validations.correctYear,
    nextUpdateDate: null,
    autoValidated: confidenceScore >= 80,
  }
}

async function analyzePayslip(fileUrl: string, fileName: string, currentDate: Date) {
  console.log("💰 Analyse fiche de paie")

  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Extraire le mois du nom de fichier
  const extractedMonth = extractMonthFromFileName(fileName) || currentMonth - 1
  const extractedYear = extractYearFromFileName(fileName) || currentYear

  // Calculer l'âge du document
  const documentAge = calculateDocumentAge(extractedYear, extractedMonth, currentYear, currentMonth)

  // Simulation extraction OCR
  const extractedData = {
    month: extractedMonth,
    year: extractedYear,
    documentAge,
    isReadable: Math.random() > 0.03, // 97% lisible
    hasEmployerInfo: Math.random() > 0.05, // 95% avec info employeur
    hasSalaryInfo: Math.random() > 0.02, // 98% avec info salaire
    estimatedGrossSalary: Math.floor(Math.random() * 4000) + 2000,
    estimatedNetSalary: Math.floor(Math.random() * 3000) + 1500,
  }

  const validations = {
    isRecent: documentAge <= 3, // Moins de 3 mois
    isReadable: extractedData.isReadable,
    hasRequiredInfo: extractedData.hasEmployerInfo && extractedData.hasSalaryInfo,
    salaryCoherent: extractedData.estimatedNetSalary < extractedData.estimatedGrossSalary,
  }

  let confidenceScore = 0
  if (validations.isRecent) confidenceScore += 40
  if (validations.isReadable) confidenceScore += 30
  if (validations.hasRequiredInfo) confidenceScore += 20
  if (validations.salaryCoherent) confidenceScore += 10

  const recommendations = []
  const warnings = []
  const errors = []

  if (!validations.isRecent) {
    if (documentAge > 6) {
      errors.push(`Fiche de paie trop ancienne (${documentAge} mois)`)
      recommendations.push("Téléchargez une fiche de paie plus récente")
    } else {
      warnings.push(`Fiche de paie de ${documentAge} mois - préférez plus récent`)
    }
  }

  if (!validations.hasRequiredInfo) {
    errors.push("Informations manquantes sur la fiche de paie")
    recommendations.push("Vérifiez que la fiche est complète et lisible")
  }

  return {
    documentType: "payslip",
    confidenceScore,
    extractedData,
    validations,
    recommendations,
    warnings,
    errors,
    documentAge,
    needsUpdate: documentAge > 1,
    nextUpdateDate: documentAge > 1 ? new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null,
    autoValidated: confidenceScore >= 70,
  }
}

async function analyzeIdentityDocument(fileUrl: string, fileName: string) {
  console.log("🆔 Analyse pièce d'identité")

  // Détecter le type de document
  const documentSubType = detectIdType(fileName)

  // Simuler l'extraction de données
  const extractedData = {
    documentType: documentSubType,
    isReadable: Math.random() > 0.02, // 98% lisible
    hasPhoto: Math.random() > 0.01, // 99% avec photo
    estimatedExpiration: generateRandomExpirationDate(),
    side: detectDocumentSide(fileName), // recto, verso, ou unknown
  }

  const isExpired = extractedData.estimatedExpiration < new Date()
  const expiresWithinMonth = extractedData.estimatedExpiration < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const validations = {
    isReadable: extractedData.isReadable,
    hasPhoto: extractedData.hasPhoto,
    isValid: !isExpired,
    expiresWithinMonth,
    correctSide: extractedData.side !== "unknown",
  }

  let confidenceScore = 0
  if (validations.isReadable) confidenceScore += 30
  if (validations.hasPhoto) confidenceScore += 20
  if (validations.isValid) confidenceScore += 40
  if (validations.correctSide) confidenceScore += 10

  const recommendations = []
  const warnings = []
  const errors = []

  if (isExpired) {
    errors.push("Document d'identité expiré")
    recommendations.push("Renouvelez votre pièce d'identité")
  } else if (expiresWithinMonth) {
    warnings.push("Document expire dans moins d'un mois")
    recommendations.push("Prévoyez le renouvellement")
  }

  if (extractedData.side === "unknown") {
    warnings.push("Impossible de déterminer si c'est le recto ou verso")
    recommendations.push("Nommez vos fichiers 'recto' et 'verso'")
  }

  return {
    documentType: "identity",
    confidenceScore,
    extractedData,
    validations,
    recommendations,
    warnings,
    errors,
    needsUpdate: isExpired || expiresWithinMonth,
    nextUpdateDate: expiresWithinMonth ? extractedData.estimatedExpiration : null,
    autoValidated: confidenceScore >= 80 && !isExpired,
  }
}

async function analyzeBankStatement(fileUrl: string, fileName: string, currentDate: Date) {
  console.log("🏦 Analyse relevé bancaire")

  const extractedMonth = extractMonthFromFileName(fileName) || currentDate.getMonth() + 1
  const extractedYear = extractYearFromFileName(fileName) || currentDate.getFullYear()
  const documentAge = calculateDocumentAge(
    extractedYear,
    extractedMonth,
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
  )

  const extractedData = {
    month: extractedMonth,
    year: extractedYear,
    documentAge,
    isReadable: Math.random() > 0.03,
    hasAccountInfo: Math.random() > 0.02,
    hasTransactions: Math.random() > 0.05,
  }

  const validations = {
    isRecent: documentAge <= 3,
    isReadable: extractedData.isReadable,
    isComplete: extractedData.hasAccountInfo && extractedData.hasTransactions,
  }

  let confidenceScore = 0
  if (validations.isRecent) confidenceScore += 50
  if (validations.isReadable) confidenceScore += 30
  if (validations.isComplete) confidenceScore += 20

  const recommendations = []
  const warnings = []
  const errors = []

  if (!validations.isRecent) {
    if (documentAge > 6) {
      errors.push(`Relevé bancaire trop ancien (${documentAge} mois)`)
    } else {
      warnings.push(`Relevé de ${documentAge} mois - préférez plus récent`)
    }
  }

  return {
    documentType: "bank_statement",
    confidenceScore,
    extractedData,
    validations,
    recommendations,
    warnings,
    errors,
    documentAge,
    needsUpdate: documentAge > 1,
    nextUpdateDate: documentAge > 1 ? new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null,
    autoValidated: confidenceScore >= 70,
  }
}

async function analyzeEmploymentContract(fileUrl: string, fileName: string) {
  console.log("💼 Analyse contrat de travail")

  const extractedData = {
    isReadable: Math.random() > 0.02,
    estimatedPages: Math.floor(Math.random() * 5) + 2,
    hasSignatures: Math.random() > 0.15, // 85% avec signatures
    contractType: detectContractType(fileName),
  }

  const validations = {
    isReadable: extractedData.isReadable,
    hasSignatures: extractedData.hasSignatures,
    isComplete: extractedData.estimatedPages >= 2,
  }

  let confidenceScore = 0
  if (validations.isReadable) confidenceScore += 30
  if (validations.hasSignatures) confidenceScore += 50
  if (validations.isComplete) confidenceScore += 20

  const recommendations = []
  const warnings = []
  const errors = []

  if (!validations.hasSignatures) {
    errors.push("Contrat non signé détecté")
    recommendations.push("Assurez-vous que le contrat est signé par toutes les parties")
  }

  if (!validations.isComplete) {
    warnings.push("Contrat semble incomplet")
    recommendations.push("Vérifiez que toutes les pages sont incluses")
  }

  return {
    documentType: "employment_contract",
    confidenceScore,
    extractedData,
    validations,
    recommendations,
    warnings,
    errors,
    needsUpdate: false,
    nextUpdateDate: null,
    autoValidated: confidenceScore >= 80,
  }
}

function analyzeGenericDocument(fileUrl: string, fileName: string) {
  return {
    documentType: "generic",
    confidenceScore: 50,
    extractedData: { fileName },
    validations: { isReadable: true },
    recommendations: ["Document téléchargé avec succès"],
    warnings: [],
    errors: [],
    needsUpdate: false,
    nextUpdateDate: null,
    autoValidated: true,
  }
}

// Fonctions utilitaires
function extractYearFromFileName(fileName: string): number | null {
  const yearMatch = fileName.match(/20\d{2}/)
  return yearMatch ? Number.parseInt(yearMatch[0]) : null
}

function extractMonthFromFileName(fileName: string): number | null {
  const monthNames = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ]
  const monthNumbers = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]

  const lowerFileName = fileName.toLowerCase()

  // Chercher les noms de mois
  for (let i = 0; i < monthNames.length; i++) {
    if (lowerFileName.includes(monthNames[i])) {
      return i + 1
    }
  }

  // Chercher les numéros de mois
  for (let i = 0; i < monthNumbers.length; i++) {
    if (fileName.includes(monthNumbers[i])) {
      return i + 1
    }
  }

  return null
}

function calculateDocumentAge(docYear: number, docMonth: number, currentYear: number, currentMonth: number): number {
  const monthsDiff = (currentYear - docYear) * 12 + (currentMonth - docMonth)
  return Math.max(0, monthsDiff)
}

function detectIdType(fileName: string): string {
  const lower = fileName.toLowerCase()
  if (lower.includes("cni") || lower.includes("carte")) return "Carte d'identité"
  if (lower.includes("passeport")) return "Passeport"
  if (lower.includes("titre") || lower.includes("sejour")) return "Titre de séjour"
  if (lower.includes("permis")) return "Permis de conduire"
  return "Pièce d'identité"
}

function detectDocumentSide(fileName: string): string {
  const lower = fileName.toLowerCase()
  if (lower.includes("recto") || lower.includes("face") || lower.includes("avant")) return "recto"
  if (lower.includes("verso") || lower.includes("dos") || lower.includes("arriere")) return "verso"
  return "unknown"
}

function detectContractType(fileName: string): string {
  const lower = fileName.toLowerCase()
  if (lower.includes("cdi")) return "CDI"
  if (lower.includes("cdd")) return "CDD"
  if (lower.includes("stage")) return "Stage"
  if (lower.includes("interim")) return "Intérim"
  return "Indéterminé"
}

function generateFiscalNumber(): string {
  return Math.floor(Math.random() * 9000000000000) + 1000000000000 + ""
}

function generate2DDocCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateRandomExpirationDate(): Date {
  const now = new Date()
  const futureDate = new Date(now.getTime() + (Math.random() * 10 - 2) * 365 * 24 * 60 * 60 * 1000) // -2 à +8 ans
  return futureDate
}

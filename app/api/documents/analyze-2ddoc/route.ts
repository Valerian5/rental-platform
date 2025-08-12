import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 API Analyse 2DDoc - Début")

    const body = await request.json()
    const { fileUrl, documentType } = body

    if (!fileUrl) {
      return NextResponse.json({ error: "URL du fichier manquante" }, { status: 400 })
    }

    // Télécharger le fichier depuis Supabase
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error("Impossible de télécharger le fichier")
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Analyser le document selon son type
    let analysisResult = null

    if (documentType === "tax_notice") {
      analysisResult = await analyzeTaxNotice2DDoc(buffer)
    } else if (documentType === "payslip") {
      analysisResult = await analyzePayslip(buffer)
    } else if (documentType === "identity") {
      analysisResult = await analyzeIdentityDocument(buffer)
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      documentType,
      analyzedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Erreur analyse document:", error)
    return NextResponse.json({ error: `Erreur analyse: ${error.message}` }, { status: 500 })
  }
}

// Analyse du QR Code 2DDoc des avis d'imposition
async function analyzeTaxNotice2DDoc(buffer: Buffer) {
  try {
    // Simuler l'extraction du QR Code 2DDoc
    // En production, utiliser une bibliothèque comme pdf-parse + qr-code reader

    const mockQRData = {
      documentType: "AVIS_IMPOSITION",
      fiscalYear: 2023,
      taxpayerName: "MARTIN JEAN",
      referenceRevenue: 35000,
      taxableIncome: 32000,
      taxDue: 2500,
      issueDate: "2024-08-15",
      documentNumber: "2023123456789",
      verificationCode: "ABC123DEF456",
    }

    // Extraire aussi les données du PDF pour comparaison
    const extractedData = await extractTaxNoticeData(buffer)

    // Comparer les données du QR Code avec celles extraites du PDF
    const verification = {
      qrCodeValid: true,
      dataMatches: {
        fiscalYear: mockQRData.fiscalYear === extractedData.fiscalYear,
        taxpayerName: mockQRData.taxpayerName === extractedData.taxpayerName,
        referenceRevenue: Math.abs(mockQRData.referenceRevenue - extractedData.referenceRevenue) < 100,
        taxableIncome: Math.abs(mockQRData.taxableIncome - extractedData.taxableIncome) < 100,
      },
      overallMatch: true,
      confidence: 0.95,
    }

    return {
      qrCodeData: mockQRData,
      extractedData,
      verification,
      isValid: verification.overallMatch && verification.confidence > 0.8,
      warnings: generateTaxNoticeWarnings(mockQRData, extractedData),
      recommendations: generateTaxNoticeRecommendations(mockQRData),
    }
  } catch (error) {
    console.error("❌ Erreur analyse 2DDoc:", error)
    return {
      qrCodeData: null,
      extractedData: null,
      verification: { qrCodeValid: false, overallMatch: false, confidence: 0 },
      isValid: false,
      error: "Impossible de lire le QR Code 2DDoc",
    }
  }
}

// Extraction des données du PDF d'avis d'imposition
async function extractTaxNoticeData(buffer: Buffer) {
  // Simuler l'extraction OCR/PDF parsing
  return {
    fiscalYear: 2023,
    taxpayerName: "MARTIN JEAN",
    referenceRevenue: 35000,
    taxableIncome: 32000,
    taxDue: 2500,
    familyQuotient: 1.5,
    address: "123 RUE DE LA PAIX 75001 PARIS",
    documentPages: 4,
    isComplete: true,
  }
}

// Analyse des fiches de paie
async function analyzePayslip(buffer: Buffer) {
  try {
    const extractedData = {
      employeeName: "MARTIN JEAN",
      employerName: "ENTREPRISE ABC",
      payPeriod: "2024-11",
      grossSalary: 3500,
      netSalary: 2650,
      payDate: "2024-11-30",
      socialSecurityNumber: "1234567890123",
      isRecent: true,
      documentPages: 1,
    }

    const currentDate = new Date()
    const payDate = new Date(extractedData.payDate)
    const monthsDiff =
      (currentDate.getFullYear() - payDate.getFullYear()) * 12 + (currentDate.getMonth() - payDate.getMonth())

    const validation = {
      isRecent: monthsDiff <= 3,
      hasRequiredFields: !!(extractedData.employeeName && extractedData.grossSalary && extractedData.netSalary),
      salaryCoherent:
        extractedData.netSalary < extractedData.grossSalary &&
        extractedData.netSalary / extractedData.grossSalary > 0.6,
      confidence: 0.9,
    }

    return {
      extractedData,
      validation,
      isValid: validation.isRecent && validation.hasRequiredFields && validation.salaryCoherent,
      warnings: generatePayslipWarnings(extractedData, monthsDiff),
      recommendations: generatePayslipRecommendations(extractedData, monthsDiff),
    }
  } catch (error) {
    return {
      extractedData: null,
      validation: { isRecent: false, hasRequiredFields: false, confidence: 0 },
      isValid: false,
      error: "Impossible d'analyser la fiche de paie",
    }
  }
}

// Analyse des pièces d'identité
async function analyzeIdentityDocument(buffer: Buffer) {
  try {
    const extractedData = {
      documentType: "CARTE_IDENTITE",
      firstName: "JEAN",
      lastName: "MARTIN",
      birthDate: "1990-05-15",
      expirationDate: "2029-12-31",
      documentNumber: "123456789",
      issuingAuthority: "PREFECTURE DE PARIS",
      nationality: "FRANÇAISE",
      isExpired: false,
      documentPages: 1,
    }

    const currentDate = new Date()
    const expirationDate = new Date(extractedData.expirationDate)
    const isExpired = expirationDate < currentDate
    const expiresWithin6Months = expirationDate.getTime() - currentDate.getTime() < 6 * 30 * 24 * 60 * 60 * 1000

    const validation = {
      isValid: !isExpired,
      hasRequiredFields: !!(extractedData.firstName && extractedData.lastName && extractedData.documentNumber),
      expiresWithin6Months,
      confidence: 0.95,
    }

    return {
      extractedData,
      validation,
      isValid: validation.isValid && validation.hasRequiredFields,
      warnings: generateIdentityWarnings(extractedData, isExpired, expiresWithin6Months),
      recommendations: generateIdentityRecommendations(extractedData, isExpired, expiresWithin6Months),
    }
  } catch (error) {
    return {
      extractedData: null,
      validation: { isValid: false, hasRequiredFields: false, confidence: 0 },
      isValid: false,
      error: "Impossible d'analyser la pièce d'identité",
    }
  }
}

// Fonctions de génération d'avertissements et recommandations
function generateTaxNoticeWarnings(qrData: any, extractedData: any) {
  const warnings = []

  if (qrData.fiscalYear < new Date().getFullYear() - 1) {
    warnings.push("L'avis d'imposition n'est pas de l'année fiscale la plus récente")
  }

  if (qrData.referenceRevenue < 10000) {
    warnings.push("Le revenu fiscal de référence semble faible")
  }

  return warnings
}

function generateTaxNoticeRecommendations(qrData: any) {
  const recommendations = []

  if (qrData.fiscalYear < new Date().getFullYear() - 1) {
    recommendations.push("Fournissez l'avis d'imposition le plus récent disponible")
  }

  recommendations.push("Vérifiez que toutes les pages de l'avis sont incluses")

  return recommendations
}

function generatePayslipWarnings(data: any, monthsDiff: number) {
  const warnings = []

  if (monthsDiff > 3) {
    warnings.push(`Cette fiche de paie date de ${monthsDiff} mois`)
  }

  if (data.netSalary / data.grossSalary < 0.6) {
    warnings.push("Le ratio salaire net/brut semble inhabituel")
  }

  return warnings
}

function generatePayslipRecommendations(data: any, monthsDiff: number) {
  const recommendations = []

  if (monthsDiff > 1) {
    recommendations.push("Fournissez les fiches de paie les plus récentes disponibles")
  }

  recommendations.push("Assurez-vous que la fiche de paie est complète et lisible")

  return recommendations
}

function generateIdentityWarnings(data: any, isExpired: boolean, expiresWithin6Months: boolean) {
  const warnings = []

  if (isExpired) {
    warnings.push("Cette pièce d'identité est expirée")
  } else if (expiresWithin6Months) {
    warnings.push("Cette pièce d'identité expire dans moins de 6 mois")
  }

  return warnings
}

function generateIdentityRecommendations(data: any, isExpired: boolean, expiresWithin6Months: boolean) {
  const recommendations = []

  if (isExpired) {
    recommendations.push("Renouvelez votre pièce d'identité avant de soumettre votre dossier")
  } else if (expiresWithin6Months) {
    recommendations.push("Considérez renouveler votre pièce d'identité prochainement")
  }

  recommendations.push("Fournissez le recto ET le verso de votre pièce d'identité")

  return recommendations
}

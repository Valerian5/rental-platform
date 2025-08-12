import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Données de référence simulées (en production, viendraient de la base de données)
const REFERENCE_DATA = {
  expectedEmployer: "ACME Corporation",
  expectedSalaryRange: { min: 2500, max: 4500 },
  expectedRFR: 35000,
  expectedTaxYear: 2023,
  expectedRentAmount: 850,
  expectedLandlord: "Dupont Immobilier",
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const documentType = formData.get("documentType") as string
    const monthKey = formData.get("monthKey") as string
    const expectedMonth = formData.get("expectedMonth") as string
    const preUploadUrl = formData.get("preUploadUrl") as string

    if (!file || !documentType) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    // Générer le nom de fichier final
    const timestamp = Date.now()
    const userId = "user123" // En production, récupérer depuis l'auth
    const fileExtension = file.name.split(".").pop()
    const finalFileName = `${userId}/${documentType}/${monthKey || "single"}_${timestamp}.${fileExtension}`

    // Upload définitif
    const { data, error } = await supabase.storage.from("documents").upload(finalFileName, file, {
      cacheControl: "31536000", // 1 an
      upsert: true,
    })

    if (error) {
      console.error("Erreur upload final:", error)
      return NextResponse.json({ error: "Erreur lors de l'upload final" }, { status: 500 })
    }

    // Analyser le document selon son type
    const analysis = await analyzeDocument(file, documentType, expectedMonth)

    // Valider avec les données de référence
    const validation = validateWithReference(analysis, documentType)

    if (!validation.isValid) {
      // Supprimer le fichier uploadé en cas d'échec
      await supabase.storage.from("documents").remove([data.path])
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Nettoyer le fichier temporaire
    if (preUploadUrl) {
      const tempPath = preUploadUrl.split("/").pop()
      if (tempPath) {
        await supabase.storage.from("documents").remove([`temp/${tempPath}`])
      }
    }

    // Générer URL finale
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      analysis: analysis,
      validation: validation,
    })
  } catch (error) {
    console.error("Erreur upload final:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

async function analyzeDocument(file: File, documentType: string, expectedMonth?: string) {
  // Simulation d'analyse selon le type de document
  const analysis: any = {
    documentType,
    fileName: file.name,
    fileSize: file.size,
    analyzedAt: new Date().toISOString(),
    confidenceScore: 0,
  }

  if (documentType.startsWith("identity_")) {
    // Analyse CNI
    analysis.extractedData = {
      name: "Jean Dupont",
      birthDate: "1990-05-15",
      documentNumber: "123456789",
      expiryDate: "2030-12-31",
      side: documentType.split("_")[1],
    }
    analysis.confidenceScore = 92
    analysis.checks = {
      isExpired: false,
      isReadable: true,
      hasPhoto: documentType.includes("recto"),
      hasSignature: documentType.includes("verso"),
    }
  } else if (documentType === "payslip") {
    // Analyse fiche de paie
    const extractedMonth = extractMonthFromPayslip(file.name, expectedMonth)
    analysis.extractedData = {
      employer: REFERENCE_DATA.expectedEmployer,
      month: extractedMonth,
      grossSalary: 3200,
      netSalary: 2480,
      employee: "Jean Dupont",
    }
    analysis.confidenceScore = extractedMonth === expectedMonth ? 88 : 45
    analysis.checks = {
      monthMatches: extractedMonth === expectedMonth,
      employerVisible: true,
      salaryVisible: true,
      employeeNameVisible: true,
    }
  } else if (documentType === "rent_receipt") {
    // Analyse quittance de loyer
    const extractedMonth = extractMonthFromRentReceipt(file.name, expectedMonth)
    analysis.extractedData = {
      landlord: REFERENCE_DATA.expectedLandlord,
      month: extractedMonth,
      rentAmount: REFERENCE_DATA.expectedRentAmount,
      tenant: "Jean Dupont",
    }
    analysis.confidenceScore = extractedMonth === expectedMonth ? 85 : 40
    analysis.checks = {
      monthMatches: extractedMonth === expectedMonth,
      landlordVisible: true,
      amountVisible: true,
      tenantNameVisible: true,
    }
  } else if (documentType === "tax_notice") {
    // Analyse avis d'imposition avec 2DDoc
    const qrCodeData = simulate2DDocExtraction()
    analysis.extractedData = {
      taxYear: qrCodeData.anneeRevenus,
      rfr: qrCodeData.revenuFiscalReference,
      taxpayer: "Jean Dupont",
      qrCodeData: qrCodeData,
    }
    analysis.confidenceScore = qrCodeData.isValid ? 95 : 30
    analysis.checks = {
      qrCodeValid: qrCodeData.isValid,
      yearCorrect: qrCodeData.anneeRevenus === REFERENCE_DATA.expectedTaxYear,
      rfrVisible: true,
      taxpayerNameVisible: true,
    }
  }

  return analysis
}

function validateWithReference(analysis: any, documentType: string) {
  const validation = { isValid: true, error: "", warnings: [] as string[] }

  if (documentType.startsWith("identity_")) {
    // Validation CNI
    if (analysis.checks?.isExpired) {
      validation.isValid = false
      validation.error = "La pièce d'identité est expirée"
    } else if (!analysis.checks?.isReadable) {
      validation.isValid = false
      validation.error = "Le document n'est pas suffisamment lisible"
    }
  } else if (documentType === "payslip") {
    // Validation fiche de paie
    if (!analysis.checks?.monthMatches) {
      validation.isValid = false
      validation.error = `Le mois du document (${analysis.extractedData?.month}) ne correspond pas au mois demandé`
    } else if (analysis.extractedData?.employer !== REFERENCE_DATA.expectedEmployer) {
      validation.warnings.push("L'employeur ne correspond pas aux données attendues")
    }
  } else if (documentType === "rent_receipt") {
    // Validation quittance
    if (!analysis.checks?.monthMatches) {
      validation.isValid = false
      validation.error = `Le mois du document (${analysis.extractedData?.month}) ne correspond pas au mois demandé`
    } else if (Math.abs(analysis.extractedData?.rentAmount - REFERENCE_DATA.expectedRentAmount) > 50) {
      validation.warnings.push("Le montant du loyer semble différent des données attendues")
    }
  } else if (documentType === "tax_notice") {
    // Validation avis d'imposition
    if (!analysis.checks?.qrCodeValid) {
      validation.isValid = false
      validation.error = "Le QR Code 2DDoc n'est pas valide ou lisible"
    } else if (!analysis.checks?.yearCorrect) {
      validation.isValid = false
      validation.error = `L'année de l'avis (${analysis.extractedData?.taxYear}) ne correspond pas à l'année attendue (${REFERENCE_DATA.expectedTaxYear})`
    } else if (Math.abs(analysis.extractedData?.rfr - REFERENCE_DATA.expectedRFR) > 5000) {
      validation.warnings.push("Le Revenu Fiscal de Référence semble différent des données attendues")
    }
  }

  // Score de confiance minimum requis
  if (analysis.confidenceScore < 70) {
    validation.isValid = false
    validation.error = "La qualité du document est insuffisante pour une validation automatique"
  }

  return validation
}

function extractMonthFromPayslip(fileName: string, expectedMonth?: string): string {
  // Simulation d'extraction du mois depuis le nom de fichier ou le contenu
  // En production, utiliser de l'OCR réel
  if (expectedMonth) {
    // Simuler une correspondance dans 80% des cas
    return Math.random() > 0.2 ? expectedMonth : "Mois incorrect détecté"
  }
  return "Mois non détecté"
}

function extractMonthFromRentReceipt(fileName: string, expectedMonth?: string): string {
  // Même logique que pour les fiches de paie
  if (expectedMonth) {
    return Math.random() > 0.2 ? expectedMonth : "Mois incorrect détecté"
  }
  return "Mois non détecté"
}

function simulate2DDocExtraction() {
  // Simulation de lecture QR Code 2DDoc
  const isValid = Math.random() > 0.1 // 90% de succès

  if (isValid) {
    return {
      isValid: true,
      documentType: "12", // Code officiel avis d'imposition
      emetteur: "DGFiP",
      numeroFiscal: "1234567890123",
      anneeRevenus: REFERENCE_DATA.expectedTaxYear,
      revenuFiscalReference: REFERENCE_DATA.expectedRFR + Math.floor(Math.random() * 1000 - 500), // Variation réaliste
      codeVerification: generateVerificationCode(),
    }
  } else {
    return {
      isValid: false,
      error: "QR Code 2DDoc illisible ou corrompu",
    }
  }
}

function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

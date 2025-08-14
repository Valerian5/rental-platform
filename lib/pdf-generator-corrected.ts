import type { RentalFileData } from "./rental-file-service"
import jsPDF from "jspdf"

interface PersonProfile {
  id?: string
  first_name?: string
  last_name?: string
  birth_date?: string
  birth_place?: string
  nationality?: string
  phone?: string
  email?: string
  current_address?: string
  current_city?: string
  current_postal_code?: string
  housing_situation?: string
  move_in_date?: string
  activity?: string
  employer?: string
  contract_type?: string
  income?: number | string
  income_type?: string
  additional_income?: number | string
  additional_income_type?: string
  documents?: any[]
}

interface SiteInfo {
  name?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
}

// Couleurs modernes
const COLORS = {
  primary: "#2563eb", // Bleu moderne
  secondary: "#1e40af", // Bleu foncé
  accent: "#3b82f6", // Bleu clair
  success: "#10b981", // Vert moderne
  warning: "#f59e0b", // Orange
  danger: "#ef4444", // Rouge
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
  text: {
    primary: "#111827",
    secondary: "#4b5563",
    muted: "#6b7280",
  },
}

// Fonction pour dessiner des icônes géométriques simples (sans polygon)
function drawIcon(doc: jsPDF, x: number, y: number, type: string, size = 4, color: string = COLORS.primary) {
  doc.setFillColor(color)
  doc.setDrawColor(color)

  switch (type) {
    case "user":
      // Cercle pour la tête
      doc.circle(x + size / 2, y + size / 3, size / 4, "F")
      // Rectangle arrondi pour le corps
      doc.roundedRect(x + size / 6, y + size / 2, (size * 2) / 3, size / 2, 1, 1, "F")
      break
    case "work":
      // Mallette simple
      doc.roundedRect(x, y + size / 3, size, size / 2, 1, 1, "F")
      doc.roundedRect(x + size / 4, y, size / 2, size / 3, 1, 1, "F")
      break
    case "money":
      // Cercle avec symbole €
      doc.circle(x + size / 2, y + size / 2, size / 2, "D")
      doc.setFontSize(size * 2)
      doc.setTextColor(color)
      doc.text("€", x + size / 3, y + size / 1.5)
      break
    case "home":
      // Maison simple avec rectangles
      doc.rect(x + size / 6, y + size / 2, (size * 2) / 3, size / 2, "S") // Base de la maison
      doc.rect(x + size / 3, y + size / 6, size / 3, size / 3, "S") // Toit simplifié
      break
    case "shield":
      // Bouclier simplifié avec ellipse
      doc.ellipse(x + size / 2, y + size / 2, size / 2, size / 3, "F")
      break
    case "document":
      // Document simple
      doc.roundedRect(x, y, (size * 3) / 4, size, 2, 2, "S")
      doc.rect(x + (size * 3) / 4, y, size / 4, size / 4, "S") // Coin plié simplifié
      break
    case "info":
      // Point d'information
      doc.circle(x + size / 2, y + size / 2, size / 2, "D")
      doc.setFontSize(size * 2)
      doc.setTextColor(color)
      doc.text("i", x + size / 2.2, y + size / 1.4)
      break
    default:
      // Icône par défaut - carré arrondi
      doc.roundedRect(x, y, size, size, 1, 1, "F")
      break
  }

  // Reset des couleurs
  doc.setTextColor(COLORS.text.primary)
  doc.setDrawColor(0, 0, 0)
}

// Fonction pour formater les montants
function formatAmount(amount: number | string | undefined): string {
  if (!amount) return "Non renseigné"

  let numAmount: number
  if (typeof amount === "string") {
    // Nettoyer la chaîne et parser
    const cleanAmount = amount.replace(/[^\d.,]/g, "").replace(",", ".")
    numAmount = Number.parseFloat(cleanAmount)
  } else {
    numAmount = amount
  }

  if (isNaN(numAmount)) return "Non renseigné"

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount)
}

// Fonction pour ajouter le logo avec proportions correctes
async function addLogo(doc: jsPDF, logoUrl: string, x: number, y: number, maxWidth: number, maxHeight: number) {
  try {
    const response = await fetch(logoUrl)
    if (!response.ok) throw new Error("Logo non trouvé")

    const blob = await response.blob()
    const reader = new FileReader()

    return new Promise<void>((resolve) => {
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          // Calculer les dimensions en respectant le ratio
          const ratio = Math.min(maxWidth / img.width, maxHeight / img.height)
          const width = img.width * ratio
          const height = img.height * ratio

          // Centrer le logo
          const logoX = x + (maxWidth - width) / 2
          const logoY = y + (maxHeight - height) / 2

          doc.addImage(reader.result as string, "JPEG", logoX, logoY, width, height)
          resolve()
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("Erreur chargement logo:", error)
    // Logo de fallback moderne
    doc.setFillColor(COLORS.primary)
    doc.roundedRect(x, y, maxWidth, maxHeight, 3, 3, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.text("LOGO", x + maxWidth / 2, y + maxHeight / 2, { align: "center" })
    doc.setTextColor(COLORS.text.primary)
  }
}

// Fonction pour ajouter un en-tête de page avec dégradé simulé
async function addPageHeader(title: string, doc: jsPDF, siteInfo?: SiteInfo): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Fond dégradé simulé avec plusieurs rectangles
  for (let i = 0; i < 20; i++) {
    const opacity = 0.1 - i * 0.005
    doc.setFillColor(37, 99, 235) // Bleu
    doc.setGState(doc.GState({ opacity: opacity }))
    doc.rect(0, i, pageWidth, 1, "F")
  }

  // Reset opacity
  doc.setGState(doc.GState({ opacity: 1 }))

  // Logo si disponible
  if (siteInfo?.logo) {
    await addLogo(doc, siteInfo.logo, 15, 8, 40, 15)
  } else {
    drawIcon(doc, 15, 10, "home", 8, COLORS.primary)
  }

  // Titre principal
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(COLORS.text.primary)
  doc.text(title, 65, 18)

  // Informations de l'agence
  if (siteInfo) {
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(COLORS.text.secondary)

    let infoY = 8
    if (siteInfo.name) {
      doc.text(siteInfo.name, doc.internal.pageSize.getWidth() - 15, infoY, { align: "right" })
      infoY += 4
    }
    if (siteInfo.phone) {
      doc.text(`Tél: ${siteInfo.phone}`, doc.internal.pageSize.getWidth() - 15, infoY, { align: "right" })
      infoY += 4
    }
    if (siteInfo.email) {
      doc.text(siteInfo.email, doc.internal.pageSize.getWidth() - 15, infoY, { align: "right" })
    }
  }

  // Ligne de séparation moderne
  doc.setDrawColor(COLORS.gray[200])
  doc.setLineWidth(0.5)
  doc.line(15, 28, doc.internal.pageSize.getWidth() - 15, 28)

  return 35 // Position Y après l'en-tête
}

// Fonction pour créer une carte moderne
function createCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  title?: string,
  color: string = COLORS.primary,
) {
  // Ombre simulée
  doc.setFillColor(COLORS.gray[200])
  doc.roundedRect(x + 1, y + 1, width, height, 3, 3, "F")

  // Carte principale
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(COLORS.gray[200])
  doc.setLineWidth(0.5)
  doc.roundedRect(x, y, width, height, 3, 3, "FD")

  // En-tête coloré si titre
  if (title) {
    // En-tête simple sans dégradé complexe
    doc.setFillColor(color)
    doc.roundedRect(x, y, width, 8, 3, 3, "F")
    doc.rect(x, y + 5, width, 3, "F") // Pour garder le bas droit

    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text(title, x + 5, y + 6)
    doc.setTextColor(COLORS.text.primary)

    return y + 15 // Position après l'en-tête
  }

  return y + 5 // Position avec marge
}

// Fonction pour ajouter une section avec numérotation moderne
function addSectionHeader(
  doc: jsPDF,
  title: string,
  number: number,
  y: number,
  color: string = COLORS.primary,
): number {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Cercle numéroté moderne
  doc.setFillColor(color)
  doc.circle(20, y + 4, 6, "F")
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text(number.toString(), 20, y + 6, { align: "center" })

  // Titre de section
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(color)
  doc.text(title, 35, y + 6)

  // Ligne décorative
  doc.setDrawColor(color)
  doc.setLineWidth(1)
  doc.line(35, y + 10, pageWidth - 15, y + 10)

  doc.setTextColor(COLORS.text.primary)
  return y + 20
}

export const generateRentalFilePDF = async (rentalFile: RentalFileData): Promise<void> => {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Page de couverture moderne
    let yPosition = await addPageHeader("DOSSIER DE LOCATION", doc)

    // Carte de présentation principale
    const mainCardHeight = 120
    createCard(doc, 15, yPosition, pageWidth - 30, mainCardHeight, "INFORMATIONS GÉNÉRALES", COLORS.primary)

    yPosition += 20

    // Informations du locataire principal
    if (rentalFile.tenant) {
      const tenant = rentalFile.tenant

      // Icône et nom
      drawIcon(doc, 25, yPosition, "user", 6, COLORS.primary)
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(`${tenant.first_name || ""} ${tenant.last_name || ""}`, 40, yPosition + 4)

      yPosition += 15

      // Informations en colonnes
      const col1X = 25
      const col2X = pageWidth / 2 + 10
      let col1Y = yPosition
      let col2Y = yPosition

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")

      // Colonne 1
      if (tenant.birth_date) {
        doc.setFont("helvetica", "bold")
        doc.text("Date de naissance:", col1X, col1Y)
        doc.setFont("helvetica", "normal")
        doc.text(new Date(tenant.birth_date).toLocaleDateString("fr-FR"), col1X + 35, col1Y)
        col1Y += 5
      }

      if (tenant.nationality) {
        doc.setFont("helvetica", "bold")
        doc.text("Nationalité:", col1X, col1Y)
        doc.setFont("helvetica", "normal")
        doc.text(tenant.nationality, col1X + 25, col1Y)
        col1Y += 5
      }

      if (tenant.phone) {
        doc.setFont("helvetica", "bold")
        doc.text("Téléphone:", col1X, col1Y)
        doc.setFont("helvetica", "normal")
        doc.text(tenant.phone, col1X + 25, col1Y)
        col1Y += 5
      }

      if (tenant.email) {
        doc.setFont("helvetica", "bold")
        doc.text("Email:", col1X, col1Y)
        doc.setFont("helvetica", "normal")
        doc.text(tenant.email, col1X + 15, col1Y)
        col1Y += 5
      }

      // Colonne 2
      if (tenant.activity) {
        drawIcon(doc, col2X - 8, col2Y - 3, "work", 4, COLORS.success)
        doc.setFont("helvetica", "bold")
        doc.text("Activité:", col2X, col2Y)
        doc.setFont("helvetica", "normal")
        doc.text(tenant.activity, col2X + 20, col2Y)
        col2Y += 5
      }

      if (tenant.income_type) {
        doc.setFont("helvetica", "bold")
        doc.text("Type de revenus:", col2X, col2Y)
        doc.setFont("helvetica", "normal")
        doc.text(tenant.income_type, col2X + 30, col2Y)
        col2Y += 5
      }

      if (tenant.income) {
        drawIcon(doc, col2X - 8, col2Y - 3, "money", 4, COLORS.success)
        doc.setFont("helvetica", "bold")
        doc.text("Revenus:", col2X, col2Y)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(COLORS.success)
        doc.text(formatAmount(tenant.income), col2X + 20, col2Y)
        doc.setTextColor(COLORS.text.primary)
        col2Y += 5
      }

      if (tenant.housing_situation) {
        drawIcon(doc, col2X - 8, col2Y - 3, "home", 4, COLORS.accent)
        doc.setFont("helvetica", "bold")
        doc.text("Logement actuel:", col2X, col2Y)
        doc.setFont("helvetica", "normal")
        const situationLabels: { [key: string]: string } = {
          owner: "Propriétaire",
          tenant: "Locataire",
          family: "Chez la famille",
          other: "Autre",
        }
        doc.text(situationLabels[tenant.housing_situation] || tenant.housing_situation, col2X + 35, col2Y)
        col2Y += 5
      }

      yPosition = Math.max(col1Y, col2Y) + 10
    }

    // Conjoint si présent
    if (rentalFile.spouse) {
      yPosition += 10

      // Vérifier si on a besoin d'une nouvelle page
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = await addPageHeader("DOSSIER DE LOCATION (SUITE)", doc)
      }

      yPosition = addSectionHeader(doc, "CONJOINT / CONCUBIN", 2, yPosition, COLORS.secondary)

      const spouse = rentalFile.spouse
      const cardHeight = 50
      createCard(doc, 15, yPosition, pageWidth - 30, cardHeight)

      yPosition += 10

      // Informations du conjoint
      drawIcon(doc, 25, yPosition, "user", 6, COLORS.secondary)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(`${spouse.first_name || ""} ${spouse.last_name || ""}`, 40, yPosition + 4)

      yPosition += 12

      // Informations en colonnes
      const col1X = 25
      const col2X = pageWidth / 2 + 10
      let col1Y = yPosition
      let col2Y = yPosition

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")

      // Colonne 1 - Informations personnelles
      if (spouse.birth_date) {
        doc.setFont("helvetica", "bold")
        doc.text("Date de naissance:", col1X, col1Y)
        doc.setFont("helvetica", "normal")
        doc.text(new Date(spouse.birth_date).toLocaleDateString("fr-FR"), col1X + 35, col1Y)
        col1Y += 5
      }

      if (spouse.phone) {
        doc.setFont("helvetica", "bold")
        doc.text("Téléphone:", col1X, col1Y)
        doc.setFont("helvetica", "normal")
        doc.text(spouse.phone, col1X + 25, col1Y)
        col1Y += 5
      }

      if (spouse.email) {
        doc.setFont("helvetica", "bold")
        doc.text("Email:", col1X, col1Y)
        doc.setFont("helvetica", "normal")
        doc.text(spouse.email, col1X + 15, col1Y)
        col1Y += 5
      }

      // Colonne 2 - Informations professionnelles
      if (spouse.activity) {
        drawIcon(doc, col2X - 8, col2Y - 3, "work", 4, COLORS.success)
        doc.setFont("helvetica", "bold")
        doc.text("Activité:", col2X, col2Y)
        doc.setFont("helvetica", "normal")
        doc.text(spouse.activity, col2X + 20, col2Y)
        col2Y += 5
      }

      if (spouse.income_type) {
        doc.setFont("helvetica", "bold")
        doc.text("Type de revenus:", col2X, col2Y)
        doc.setFont("helvetica", "normal")
        doc.text(spouse.income_type, col2X + 30, col2Y)
        col2Y += 5
      }

      if (spouse.income) {
        drawIcon(doc, col2X - 8, col2Y - 3, "money", 4, COLORS.success)
        doc.setFont("helvetica", "bold")
        doc.text("Revenus:", col2X, col2Y)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(COLORS.success)
        doc.text(formatAmount(spouse.income), col2X + 20, col2Y)
        doc.setTextColor(COLORS.text.primary)
        col2Y += 5
      }

      yPosition = Math.max(col1Y, col2Y) + 10
    }

    // Garants si présents
    if (rentalFile.guarantors && rentalFile.guarantors.length > 0) {
      yPosition += 10

      // Vérifier si on a besoin d'une nouvelle page
      if (yPosition > pageHeight - 100) {
        doc.addPage()
        yPosition = await addPageHeader("DOSSIER DE LOCATION (SUITE)", doc)
      }

      yPosition = addSectionHeader(doc, "GARANTS", 3, yPosition, COLORS.warning)

      for (let i = 0; i < rentalFile.guarantors.length; i++) {
        const guarantor = rentalFile.guarantors[i]

        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > pageHeight - 80) {
          doc.addPage()
          yPosition = await addPageHeader("DOSSIER DE LOCATION (SUITE)", doc)
        }

        const cardHeight = 60
        createCard(doc, 15, yPosition, pageWidth - 30, cardHeight, `GARANT ${i + 1}`, COLORS.warning)

        yPosition += 20

        // Informations du garant
        drawIcon(doc, 25, yPosition, "shield", 6, COLORS.warning)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text(`${guarantor.first_name || ""} ${guarantor.last_name || ""}`, 40, yPosition + 4)

        yPosition += 12

        // Informations en colonnes
        const col1X = 25
        const col2X = pageWidth / 2 + 10
        let col1Y = yPosition
        let col2Y = yPosition

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")

        // Colonne 1
        if (guarantor.phone) {
          doc.setFont("helvetica", "bold")
          doc.text("Téléphone:", col1X, col1Y)
          doc.setFont("helvetica", "normal")
          doc.text(guarantor.phone, col1X + 25, col1Y)
          col1Y += 5
        }

        if (guarantor.email) {
          doc.setFont("helvetica", "bold")
          doc.text("Email:", col1X, col1Y)
          doc.setFont("helvetica", "normal")
          doc.text(guarantor.email, col1X + 15, col1Y)
          col1Y += 5
        }

        // Colonne 2
        if (guarantor.activity) {
          drawIcon(doc, col2X - 8, col2Y - 3, "work", 4, COLORS.success)
          doc.setFont("helvetica", "bold")
          doc.text("Activité:", col2X, col2Y)
          doc.setFont("helvetica", "normal")
          doc.text(guarantor.activity, col2X + 20, col2Y)
          col2Y += 5
        }

        if (guarantor.income_type) {
          doc.setFont("helvetica", "bold")
          doc.text("Type de revenus:", col2X, col2Y)
          doc.setFont("helvetica", "normal")
          doc.text(guarantor.income_type, col2X + 30, col2Y)
          col2Y += 5
        }

        if (guarantor.income) {
          drawIcon(doc, col2X - 8, col2Y - 3, "money", 4, COLORS.success)
          doc.setFont("helvetica", "bold")
          doc.text("Revenus:", col2X, col2Y)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(COLORS.success)
          doc.text(formatAmount(guarantor.income), col2X + 20, col2Y)
          doc.setTextColor(COLORS.text.primary)
          col2Y += 5
        }

        yPosition = Math.max(col1Y, col2Y) + 15
      }
    }

    // Nouvelle page pour les documents
    doc.addPage()
    yPosition = await addPageHeader("ANNEXES - PIÈCES JUSTIFICATIVES", doc)

    // Organiser les documents par catégorie
    const allDocuments = [
      ...(rentalFile.tenant?.documents || []),
      ...(rentalFile.spouse?.documents || []),
      ...(rentalFile.guarantors?.flatMap((g) => g.documents || []) || []),
      ...(rentalFile.documents || []),
    ]

    const documentsByCategory: { [key: string]: any[] } = {}

    allDocuments.forEach((doc) => {
      const category = doc.category || "Autres"
      if (!documentsByCategory[category]) {
        documentsByCategory[category] = []
      }
      documentsByCategory[category].push(doc)
    })

    const categoryLabels: { [key: string]: string } = {
      identity: "Pièces d'identité",
      income: "Justificatifs de revenus",
      housing: "Justificatifs de domicile",
      professional: "Justificatifs professionnels",
      tax: "Justificatifs fiscaux",
      guarantor: "Documents des garants",
      other: "Autres documents",
    }

    let sectionNumber = 1

    // Afficher les documents par catégorie
    for (const [category, documents] of Object.entries(documentsByCategory)) {
      if (documents.length === 0) continue

      // Vérifier si on a besoin d'une nouvelle page
      if (yPosition > pageHeight - 30) {
        doc.addPage()
        yPosition = await addPageHeader("ANNEXES - PIÈCES JUSTIFICATIVES (SUITE)", doc)
      }

      yPosition = addSectionHeader(doc, categoryLabels[category] || category, sectionNumber++, yPosition, COLORS.accent)

      // Créer une carte pour cette catégorie
      const cardHeight = Math.min(documents.length * 8 + 20, 100)
      createCard(doc, 15, yPosition, pageWidth - 30, cardHeight)

      yPosition += 10

      // Lister les documents
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")

      for (const document of documents) {
        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = await addPageHeader("ANNEXES - PIÈCES JUSTIFICATIVES (SUITE)", doc)
        }

        drawIcon(doc, 25, yPosition - 2, "document", 3, COLORS.accent)

        doc.setFont("helvetica", "bold")
        doc.text("•", 35, yPosition)
        doc.setFont("helvetica", "normal")

        const docName = document.name || document.type || "Document"
        const docDate = document.created_at ? ` (${new Date(document.created_at).toLocaleDateString("fr-FR")})` : ""

        doc.text(`${docName}${docDate}`, 40, yPosition)

        if (document.status) {
          const statusColor =
            document.status === "validated"
              ? COLORS.success
              : document.status === "rejected"
                ? COLORS.danger
                : COLORS.warning
          doc.setTextColor(statusColor)
          doc.text(`[${document.status.toUpperCase()}]`, pageWidth - 50, yPosition)
          doc.setTextColor(COLORS.text.primary)
        }

        yPosition += 6
      }

      yPosition += 10
    }

    // Pied de page avec informations de génération
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)

      // Ligne de séparation
      doc.setDrawColor(COLORS.gray[200])
      doc.setLineWidth(0.5)
      doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20)

      // Informations de génération
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(COLORS.text.muted)

      const generationDate = new Date().toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      doc.text(`Dossier généré le ${generationDate}`, 15, pageHeight - 10)
      doc.text(`Page ${i} sur ${totalPages}`, pageWidth - 15, pageHeight - 10, { align: "right" })

      // Mention de confidentialité
      doc.text(
        "Document confidentiel - Usage strictement réservé à l'étude du dossier de location",
        pageWidth / 2,
        pageHeight - 5,
        { align: "center" },
      )
    }

    // Générer le nom de fichier avec date
    const tenantName = rentalFile.tenant?.last_name || "locataire"
    const fileName = `dossier-location-${tenantName}-${new Date().toISOString().split("T")[0]}.pdf`

    // Télécharger le PDF
    doc.save(fileName)

    console.log("✅ PDF généré avec succès !")
  } catch (error) {
    console.error("❌ Erreur génération PDF:", error)
    throw error
  }
}

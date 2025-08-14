import type { RentalFileData } from "./rental-file-service"

// Fonction pour récupérer les logos depuis la base de données
const getLogos = async (): Promise<any> => {
  try {
    const response = await fetch("/api/admin/settings?key=logos")
    const result = await response.json()
    return result.success ? result.data : {}
  } catch (error) {
    console.error("Erreur récupération logos:", error)
    return {}
  }
}

// Fonction pour récupérer les informations du site
const getSiteInfo = async (): Promise<any> => {
  try {
    const response = await fetch("/api/admin/settings?key=site_info")
    const result = await response.json()
    return result.success
      ? result.data
      : { title: "Louer Ici", description: "Plateforme de gestion locative intelligente" }
  } catch (error) {
    console.error("Erreur récupération site info:", error)
    return { title: "Louer Ici", description: "Plateforme de gestion locative intelligente" }
  }
}

export const generateRentalFilePDF = async (rentalFile: RentalFileData): Promise<void> => {
  try {
    // Charger les paramètres du site
    const [logos, siteInfo] = await Promise.all([getLogos(), getSiteInfo()])

    console.log("🎨 Logos chargés:", logos)
    console.log("ℹ️ Info site:", siteInfo)

    // Import dynamique de jsPDF et pdf-lib
    const { jsPDF } = await import("jspdf")
    const { PDFDocument } = await import("pdf-lib")

    const doc = new jsPDF()
    let yPosition = 20
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 20

    // PALETTE DE COULEURS MODERNE 2024
    const colors = {
      primary: [37, 99, 235], // Bleu moderne
      secondary: [99, 102, 241], // Indigo
      accent: [34, 197, 94], // Vert moderne
      success: [16, 185, 129], // Emeraude
      warning: [245, 158, 11], // Ambre
      danger: [239, 68, 68], // Rouge
      dark: [15, 23, 42], // Slate 900
      gray: [71, 85, 105], // Slate 600
      lightGray: [248, 250, 252], // Slate 50
      white: [255, 255, 255],
      border: [226, 232, 240], // Slate 200
    }

    // Stocker les PDF à merger à la fin
    const pdfsToMerge: any[] = []
    const imagesToAdd: any[] = []

    // Fonction helper pour formater les montants CORRECTEMENT (sans "/")
    const formatAmount = (amount: number | string): string => {
      if (!amount || amount === 0) return "Non renseigné"

      const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
      if (isNaN(numAmount)) return "Non renseigné"

      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numAmount)
    }

    // Fonction pour calculer les revenus totaux d'une personne
    const calculateTotalIncomeForPerson = (incomeSources: any): number => {
      let total = 0
      if (incomeSources?.work_income?.amount) {
        const amount =
          typeof incomeSources.work_income.amount === "string"
            ? Number.parseFloat(incomeSources.work_income.amount)
            : incomeSources.work_income.amount
        total += amount || 0
      }
      if (incomeSources?.social_aid) {
        incomeSources.social_aid.forEach((aid: any) => {
          const amount = typeof aid.amount === "string" ? Number.parseFloat(aid.amount) : aid.amount
          total += amount || 0
        })
      }
      if (incomeSources?.retirement_pension) {
        incomeSources.retirement_pension.forEach((pension: any) => {
          const amount = typeof pension.amount === "string" ? Number.parseFloat(pension.amount) : pension.amount
          total += amount || 0
        })
      }
      if (incomeSources?.rent_income) {
        incomeSources.rent_income.forEach((rent: any) => {
          const amount = typeof rent.amount === "string" ? Number.parseFloat(rent.amount) : rent.amount
          total += amount || 0
        })
      }
      if (incomeSources?.scholarship?.amount) {
        const amount =
          typeof incomeSources.scholarship.amount === "string"
            ? Number.parseFloat(incomeSources.scholarship.amount)
            : incomeSources.scholarship.amount
        total += amount || 0
      }
      return total
    }

    // Calculer les revenus totaux du dossier
    const calculateTotalHouseholdIncome = (): number => {
      let total = 0

      // Revenus du locataire principal
      if (rentalFile.main_tenant?.income_sources) {
        total += calculateTotalIncomeForPerson(rentalFile.main_tenant.income_sources)
      }

      // Revenus des colocataires/conjoint
      if (rentalFile.cotenants && Array.isArray(rentalFile.cotenants)) {
        rentalFile.cotenants.forEach((cotenant) => {
          if (cotenant.income_sources) {
            total += calculateTotalIncomeForPerson(cotenant.income_sources)
          }
        })
      }

      return total
    }

    // Fonction pour vérifier si une URL est valide
    const isValidDocumentUrl = (url: string): boolean => {
      if (!url || url === "DOCUMENT_MIGRE_PLACEHOLDER") return false
      if (url.includes("blob:")) return false
      if (url.startsWith("https://") && url.includes("supabase")) return true
      if (url.startsWith("http")) return true
      return false
    }

    // Fonction pour déterminer le type de fichier
    const getFileType = (url: string): string => {
      const extension = url.split(".").pop()?.toLowerCase() || ""
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
        return "image"
      } else if (extension === "pdf") {
        return "pdf"
      }
      return "document"
    }

    // Fonction pour dessiner des icônes géométriques modernes
    const drawIcon = (type: string, x: number, y: number, size = 8) => {
      doc.setFillColor(...colors.primary)
      doc.setDrawColor(...colors.primary)
      doc.setLineWidth(1)

      switch (type) {
        case "user":
          // Icône utilisateur (cercle + rectangle)
          doc.circle(x + size / 2, y + size / 3, size / 4, "F")
          doc.roundedRect(x + size / 6, y + size / 2, (size * 2) / 3, size / 2, 2, 2, "F")
          break
        case "work":
          // Icône travail (mallette)
          doc.roundedRect(x, y + size / 3, size, (size * 2) / 3, 2, 2, "S")
          doc.rect(x + size / 4, y + size / 6, size / 2, size / 6, "F")
          break
        case "money":
          // Icône argent (cercle avec €)
          doc.circle(x + size / 2, y + size / 2, size / 2, "S")
          doc.setFont("helvetica", "bold")
          doc.setFontSize(size - 2)
          doc.setTextColor(...colors.primary)
          doc.text("€", x + size / 2 - 1, y + size / 2 + 2)
          break
        case "home":
          // Icône maison
          doc.polygon(
            [
              [x + size / 2, y],
              [x, y + size / 2],
              [x + size / 6, y + size / 2],
              [x + size / 6, y + size],
              [x + (size * 5) / 6, y + size],
              [x + (size * 5) / 6, y + size / 2],
              [x + size, y + size / 2],
            ],
            "S",
          )
          break
        case "shield":
          // Icône bouclier (garant)
          doc.polygon(
            [
              [x + size / 2, y],
              [x, y + size / 3],
              [x, y + (size * 2) / 3],
              [x + size / 2, y + size],
              [x + size, y + (size * 2) / 3],
              [x + size, y + size / 3],
            ],
            "F",
          )
          break
        case "document":
          // Icône document
          doc.roundedRect(x, y, (size * 3) / 4, size, 2, 2, "S")
          doc.polygon(
            [
              [x + (size * 3) / 4, y],
              [x + (size * 3) / 4, y + size / 4],
              [x + size, y + size / 4],
            ],
            "S",
          )
          break
        case "info":
          // Icône info (i dans un cercle)
          doc.circle(x + size / 2, y + size / 2, size / 2, "S")
          doc.setFont("helvetica", "bold")
          doc.setFontSize(size)
          doc.setTextColor(...colors.primary)
          doc.text("i", x + size / 2 - 1, y + size / 2 + 2)
          break
        default:
          // Icône par défaut (carré)
          doc.roundedRect(x, y, size, size, 2, 2, "F")
      }
    }

    // Fonction pour ajouter le logo avec proportions correctes
    const addLogo = async (x: number, y: number, maxWidth = 40, maxHeight = 25, logoUrl?: string) => {
      if (logoUrl && logoUrl !== "DOCUMENT_MIGRE_PLACEHOLDER") {
        try {
          const response = await fetch(logoUrl)
          if (response.ok) {
            const blob = await response.blob()
            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(blob)
            })

            // Créer une image temporaire pour obtenir les dimensions
            const img = new Image()
            await new Promise((resolve, reject) => {
              img.onload = resolve
              img.onerror = reject
              img.src = base64Data
            })

            // Calculer les dimensions en gardant le ratio
            const ratio = img.width / img.height
            let finalWidth = maxWidth
            let finalHeight = maxWidth / ratio

            if (finalHeight > maxHeight) {
              finalHeight = maxHeight
              finalWidth = maxHeight * ratio
            }

            const imgFormat = logoUrl.toLowerCase().includes(".png") ? "PNG" : "JPEG"
            doc.addImage(base64Data, imgFormat, x, y, finalWidth, finalHeight)
            return
          }
        } catch (error) {
          console.error("Erreur chargement logo:", error)
        }
      }

      // Fallback : logo moderne géométrique
      doc.setFillColor(...colors.primary)
      doc.roundedRect(x, y, maxWidth, maxHeight, 4, 4, "F")

      doc.setTextColor(...colors.white)
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("L", x + maxWidth / 2 - 4, y + maxHeight / 2 + 4)
    }

    // Fonction pour ajouter un en-tête moderne avec dégradé simulé
    const addPageHeader = async (title: string): Promise<number> => {
      // Dégradé moderne simulé
      const gradientSteps = 30
      for (let i = 0; i < gradientSteps; i++) {
        const ratio = i / gradientSteps
        const r = Math.floor(colors.primary[0] + (colors.secondary[0] - colors.primary[0]) * ratio)
        const g = Math.floor(colors.primary[1] + (colors.secondary[1] - colors.primary[1]) * ratio)
        const b = Math.floor(colors.primary[2] + (colors.secondary[2] - colors.primary[2]) * ratio)

        doc.setFillColor(r, g, b)
        doc.rect(0, i * 1.5, pageWidth, 1.5, "F")
      }

      // Logo avec bonnes proportions
      await addLogo(pageWidth - margin - 45, 8, 40, 25, logos.pdf || logos.main)

      // Titre moderne
      doc.setTextColor(...colors.white)
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text(title, margin, 25)

      // Sous-titre
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(siteInfo.title || "Louer Ici", margin, 35)

      return 55 // Position Y après l'en-tête
    }

    // Fonction pour ajouter une section moderne avec icône
    const addSectionWithIcon = (title: string, y: number, iconType = "info"): number => {
      // Fond moderne avec bordure colorée
      doc.setFillColor(...colors.lightGray)
      doc.rect(margin - 5, y - 8, pageWidth - 2 * margin + 10, 20, "F")

      // Bordure gauche colorée (accent moderne)
      doc.setFillColor(...colors.accent)
      doc.rect(margin - 5, y - 8, 4, 20, "F")

      // Icône moderne
      drawIcon(iconType, margin + 5, y - 3, 10)

      // Titre de section
      doc.setTextColor(...colors.dark)
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.text(title, margin + 20, y + 3)

      return y + 25
    }

    // Fonction pour ajouter une propriété avec design moderne
    const addProperty = async (
      label: string,
      value: string,
      x: number,
      y: number,
      options: any = {},
    ): Promise<number> => {
      // Vérifier si on dépasse la page
      if (y > pageHeight - 50) {
        doc.addPage()
        y = await addPageHeader("DOSSIER DE LOCATION (SUITE)")
      }

      // Fond moderne alterné
      if (options.background) {
        doc.setFillColor(...colors.lightGray)
        doc.roundedRect(x - 5, y - 5, 90, 20, 3, 3, "F")
      }

      // Label moderne
      doc.setTextColor(...colors.gray)
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text(label.toUpperCase(), x, y)

      // Valeur avec style moderne
      doc.setTextColor(...colors.dark)
      doc.setFontSize(11)
      doc.setFont("helvetica", options.bold ? "bold" : "normal")

      const displayValue = value || "Non renseigné"

      // Gérer les textes longs avec retour à la ligne
      const maxWidth = 85
      const lines = doc.splitTextToSize(displayValue, maxWidth)

      lines.forEach((line: string, index: number) => {
        doc.text(line, x, y + 10 + index * 5)
      })

      return y + 10 + lines.length * 5 + 8
    }

    // Fonction pour ajouter un montant avec design moderne
    const addAmount = async (label: string, amount: number | string, x: number, y: number): Promise<number> => {
      // Vérifier si on dépasse la page
      if (y > pageHeight - 50) {
        doc.addPage()
        y = await addPageHeader("DOSSIER DE LOCATION (SUITE)")
      }

      // Fond moderne pour les montants avec bordure
      doc.setFillColor(240, 253, 244) // Vert très clair
      doc.roundedRect(x - 5, y - 5, 90, 20, 3, 3, "F")

      // Bordure verte
      doc.setDrawColor(...colors.success)
      doc.setLineWidth(1)
      doc.roundedRect(x - 5, y - 5, 90, 20, 3, 3, "S")

      // Icône argent
      drawIcon("money", x, y - 2, 8)

      // Label
      doc.setTextColor(...colors.gray)
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text(label.toUpperCase(), x + 12, y)

      // Montant avec formatage correct
      doc.setTextColor(...colors.success)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(formatAmount(amount), x + 12, y + 10)

      return y + 25
    }

    // Fonction pour traiter les documents
    const processDocument = async (documentUrl: string, documentName: string, category: string) => {
      try {
        console.log("📄 Traitement du document:", documentName)

        if (!isValidDocumentUrl(documentUrl)) {
          console.log("⚠️ URL non valide, ignoré:", documentUrl)
          return
        }

        const fileType = getFileType(documentUrl)

        if (fileType === "pdf") {
          const response = await fetch("/api/pdf/merge-pages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdfUrl: documentUrl }),
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              pdfsToMerge.push({
                name: documentName,
                data: new Uint8Array(result.pdfData),
                pageCount: result.pageCount,
                category: category,
              })
              console.log(`✅ PDF préparé: ${documentName} (${result.pageCount} pages)`)
            }
          }
        } else if (fileType === "image") {
          const response = await fetch(documentUrl)
          if (response.ok) {
            const blob = await response.blob()
            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(blob)
            })

            imagesToAdd.push({
              name: documentName,
              data: base64Data,
              category: category,
            })
            console.log(`✅ Image préparée: ${documentName}`)
          }
        }
      } catch (error) {
        console.error(`❌ Erreur traitement ${documentName}:`, error)
      }
    }

    // DÉBUT DE LA GÉNÉRATION DU PDF

    const mainTenant = rentalFile.main_tenant || {}
    const tenantName = `${mainTenant.first_name || ""} ${mainTenant.last_name || ""}`.trim() || "Locataire"
    const totalHouseholdIncome = calculateTotalHouseholdIncome()

    // PAGE DE COUVERTURE ULTRA MODERNE
    yPosition = await addPageHeader("DOSSIER DE LOCATION NUMÉRIQUE")

    // Logo principal centré avec bonnes proportions
    if (logos.main) {
      try {
        await addLogo((pageWidth - 80) / 2, yPosition, 80, 50, logos.main)
        yPosition += 60
      } catch (error) {
        console.error("Erreur chargement logo principal:", error)
        yPosition += 30
      }
    } else {
      yPosition += 30
    }

    // Nom du site avec style moderne
    doc.setTextColor(...colors.primary)
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    const siteTitleWidth = doc.getTextWidth(siteInfo.title || "Louer Ici")
    doc.text(siteInfo.title || "Louer Ici", (pageWidth - siteTitleWidth) / 2, yPosition)

    yPosition += 20

    // Description avec style moderne
    doc.setTextColor(...colors.gray)
    doc.setFontSize(14)
    doc.setFont("helvetica", "normal")
    const descWidth = doc.getTextWidth(siteInfo.description || "Plateforme de gestion locative intelligente")
    doc.text(
      siteInfo.description || "Plateforme de gestion locative intelligente",
      (pageWidth - descWidth) / 2,
      yPosition,
    )

    yPosition += 40

    // Nom du locataire avec style moderne
    doc.setTextColor(...colors.dark)
    doc.setFontSize(28)
    doc.setFont("helvetica", "bold")
    const nameWidth = doc.getTextWidth(tenantName)
    doc.text(tenantName, (pageWidth - nameWidth) / 2, yPosition)

    yPosition += 50

    // CARTE DE SYNTHÈSE MODERNE (plus grande et mieux organisée)
    const cardHeight = 120
    const cardY = yPosition

    // Fond de carte moderne avec ombre simulée
    doc.setFillColor(245, 245, 245) // Ombre
    doc.roundedRect(margin + 2, cardY + 2, pageWidth - 2 * margin, cardHeight, 8, 8, "F")

    doc.setFillColor(...colors.white)
    doc.roundedRect(margin, cardY, pageWidth - 2 * margin, cardHeight, 8, 8, "F")

    // Bordure moderne
    doc.setDrawColor(...colors.border)
    doc.setLineWidth(1)
    doc.roundedRect(margin, cardY, pageWidth - 2 * margin, cardHeight, 8, 8, "S")

    // En-tête de carte
    doc.setFillColor(...colors.primary)
    doc.roundedRect(margin, cardY, pageWidth - 2 * margin, 25, 8, 8, "F")
    doc.rect(margin, cardY + 17, pageWidth - 2 * margin, 8, "F") // Pour garder le bas droit

    doc.setTextColor(...colors.white)
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    drawIcon("info", margin + 10, cardY + 8, 10)
    doc.text("SYNTHÈSE DU DOSSIER", margin + 25, cardY + 17)

    yPosition = cardY + 40

    // Contenu de la synthèse en colonnes
    const col1X = margin + 15
    const col2X = margin + (pageWidth - 2 * margin) / 2 + 10

    // Colonne 1
    let col1Y = yPosition
    doc.setTextColor(...colors.dark)
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")

    // Type de location avec icône
    drawIcon("home", col1X, col1Y - 3, 8)
    let situationText = "Location individuelle"
    if (rentalFile.rental_situation === "couple") situationText = "Location en couple"
    else if (rentalFile.rental_situation === "colocation") situationText = "Colocation"
    doc.text(situationText, col1X + 12, col1Y)
    col1Y += 15

    // Nombre de personnes avec icône
    drawIcon("user", col1X, col1Y - 3, 8)
    const totalPersons = 1 + (rentalFile.cotenants?.length || 0)
    doc.text(`${totalPersons} personne${totalPersons > 1 ? "s" : ""} dans le dossier`, col1X + 12, col1Y)
    col1Y += 15

    // Colonne 2
    let col2Y = yPosition

    // Revenus totaux avec icône
    drawIcon("money", col2X, col2Y - 3, 8)
    if (totalHouseholdIncome > 0) {
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...colors.success)
      doc.text(`Revenus: ${formatAmount(totalHouseholdIncome)}`, col2X + 12, col2Y)
    } else {
      doc.text("Revenus: Non renseignés", col2X + 12, col2Y)
    }
    col2Y += 15

    // Garants avec icône
    drawIcon("shield", col2X, col2Y - 3, 8)
    const guarantorsCount = rentalFile.guarantors?.length || 0
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...colors.dark)
    if (guarantorsCount > 0) {
      doc.text(`${guarantorsCount} garant${guarantorsCount > 1 ? "s" : ""}`, col2X + 12, col2Y)
    } else {
      doc.setTextColor(...colors.warning)
      doc.text("Aucun garant", col2X + 12, col2Y)
    }

    yPosition = cardY + cardHeight + 30

    // Date de génération moderne
    doc.setTextColor(...colors.gray)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    const dateText = `Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`
    const dateWidth = doc.getTextWidth(dateText)
    doc.text(dateText, (pageWidth - dateWidth) / 2, yPosition)

    // PAGE LOCATAIRE PRINCIPAL MODERNE
    doc.addPage()
    yPosition = await addPageHeader("LOCATAIRE PRINCIPAL")

    if (mainTenant) {
      // Informations personnelles avec icône
      yPosition = addSectionWithIcon("INFORMATIONS PERSONNELLES", yPosition, "user")

      const colWidth = (pageWidth - 2 * margin - 30) / 2
      const col2X = margin + colWidth + 30

      let col1Y = yPosition
      let col2Y = yPosition

      col1Y = await addProperty("Nom", mainTenant.last_name || "", margin, col1Y, { background: true })
      col2Y = await addProperty("Prénom", mainTenant.first_name || "", col2X, col2Y)

      col1Y = await addProperty(
        "Date de naissance",
        mainTenant.birth_date ? new Date(mainTenant.birth_date).toLocaleDateString("fr-FR") : "",
        margin,
        col1Y,
      )
      col2Y = await addProperty("Lieu de naissance", mainTenant.birth_place || "", col2X, col2Y, { background: true })

      col1Y = await addProperty("Nationalité", mainTenant.nationality || "", margin, col1Y, { background: true })

      // Situation de logement avec libellé correct
      const housingLabels: { [key: string]: string } = {
        locataire: "Locataire",
        proprietaire: "Propriétaire",
        heberge: "Hébergé(e)",
        autre: "Autre",
      }
      col2Y = await addProperty(
        "Situation logement",
        housingLabels[mainTenant.current_housing_situation || ""] || mainTenant.current_housing_situation || "",
        col2X,
        col2Y,
      )

      // Contact
      col1Y = await addProperty("Email", mainTenant.email || "", margin, col1Y)
      col2Y = await addProperty("Téléphone", mainTenant.phone || "", col2X, col2Y, { background: true })

      yPosition = Math.max(col1Y, col2Y) + 15

      // Situation professionnelle avec icône
      yPosition = addSectionWithIcon("SITUATION PROFESSIONNELLE", yPosition, "work")

      col1Y = yPosition
      col2Y = yPosition

      // Activité principale avec libellé correct
      const activityLabels: { [key: string]: string } = {
        cdi: "CDI (Contrat à durée indéterminée)",
        cdd: "CDD (Contrat à durée déterminée)",
        fonction_publique: "Fonction publique",
        independant: "Travailleur indépendant",
        retraite: "Retraité(e)",
        chomage: "Demandeur d'emploi",
        etudes: "Étudiant(e)",
        alternance: "Alternance/Apprentissage",
        stage: "Stagiaire",
        autre: "Autre activité",
      }

      const activityLabel = activityLabels[mainTenant.main_activity || ""] || mainTenant.main_activity || ""
      col1Y = await addProperty("Activité principale", activityLabel, margin, col1Y, { background: true, bold: true })

      if (mainTenant.profession) {
        col2Y = await addProperty("Profession", mainTenant.profession, col2X, col2Y)
      }

      if (mainTenant.company) {
        col1Y = await addProperty("Entreprise", mainTenant.company, margin, col1Y)
      }

      // TYPE DE REVENUS - INFO MANQUANTE AJOUTÉE
      if (mainTenant.income_sources?.work_income?.type) {
        const incomeTypeLabels: { [key: string]: string } = {
          salaire: "Salaire",
          honoraires: "Honoraires",
          benefices: "Bénéfices",
          pension: "Pension",
          allocation: "Allocation",
          autre: "Autre type de revenu",
        }
        col2Y = await addProperty(
          "Type de revenus",
          incomeTypeLabels[mainTenant.income_sources.work_income.type] || mainTenant.income_sources.work_income.type,
          col2X,
          col2Y,
          { background: true },
        )
      }

      yPosition = Math.max(col1Y, col2Y) + 15

      // Revenus avec icône moderne
      yPosition = addSectionWithIcon("REVENUS MENSUELS", yPosition, "money")

      if (mainTenant.income_sources?.work_income?.amount) {
        yPosition = await addAmount(
          "Revenus du travail",
          mainTenant.income_sources.work_income.amount,
          margin,
          yPosition,
        )
      }

      // Aides sociales avec libellés corrects
      if (mainTenant.income_sources?.social_aid && mainTenant.income_sources.social_aid.length > 0) {
        for (let index = 0; index < mainTenant.income_sources.social_aid.length; index++) {
          const aid = mainTenant.income_sources.social_aid[index]
          if (aid.amount) {
            const aidLabels: { [key: string]: string } = {
              caf_msa: "Aide CAF/MSA",
              france_travail: "Aide France Travail",
              apl_aah: "APL/AAH",
              rsa: "RSA",
              prime_activite: "Prime d'activité",
              autre: "Autre aide sociale",
            }
            yPosition = await addAmount(
              aidLabels[aid.type] || `Aide sociale ${index + 1}`,
              aid.amount,
              margin,
              yPosition,
            )
          }
        }
      }

      // Pensions avec libellés corrects
      if (mainTenant.income_sources?.retirement_pension && mainTenant.income_sources.retirement_pension.length > 0) {
        for (let index = 0; index < mainTenant.income_sources.retirement_pension.length; index++) {
          const pension = mainTenant.income_sources.retirement_pension[index]
          if (pension.amount) {
            const pensionLabels: { [key: string]: string } = {
              retraite: "Pension de retraite",
              pension_invalidite: "Pension d'invalidité",
              pension_alimentaire: "Pension alimentaire",
              pension_veuvage: "Pension de veuvage",
              autre: "Autre pension",
            }
            yPosition = await addAmount(
              pensionLabels[pension.type] || `Pension ${index + 1}`,
              pension.amount,
              margin,
              yPosition,
            )
          }
        }
      }

      // Revenus locatifs avec libellés corrects
      if (mainTenant.income_sources?.rent_income && mainTenant.income_sources.rent_income.length > 0) {
        for (let index = 0; index < mainTenant.income_sources.rent_income.length; index++) {
          const rent = mainTenant.income_sources.rent_income[index]
          if (rent.amount) {
            const rentLabels: { [key: string]: string } = {
              revenus_locatifs: "Revenus locatifs",
              rente_viagere: "Rente viagère",
              dividendes: "Dividendes",
              autre_rente: "Autre rente",
            }
            yPosition = await addAmount(
              rentLabels[rent.type] || `Revenu locatif ${index + 1}`,
              rent.amount,
              margin,
              yPosition,
            )
          }
        }
      }

      if (mainTenant.income_sources?.scholarship?.amount) {
        yPosition = await addAmount("Bourse d'études", mainTenant.income_sources.scholarship.amount, margin, yPosition)
      }

      // Total des revenus avec mise en évidence
      const mainTenantIncome = calculateTotalIncomeForPerson(mainTenant.income_sources)
      if (mainTenantIncome > 0) {
        yPosition += 10

        // Encadré spécial pour le total
        doc.setFillColor(...colors.success)
        doc.roundedRect(margin - 5, yPosition - 8, pageWidth - 2 * margin + 10, 25, 5, 5, "F")

        doc.setTextColor(...colors.white)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        drawIcon("money", margin + 5, yPosition - 3, 12)
        doc.text("TOTAL REVENUS MENSUELS", margin + 22, yPosition + 2)
        doc.setFontSize(16)
        doc.text(formatAmount(mainTenantIncome), margin + 22, yPosition + 15)

        yPosition += 35
      }
    }

    // PAGES COLOCATAIRES/CONJOINT avec toutes les infos
    if (rentalFile.cotenants && rentalFile.cotenants.length > 0) {
      for (let index = 0; index < rentalFile.cotenants.length; index++) {
        const cotenant = rentalFile.cotenants[index]
        const cotenantLabel = rentalFile.rental_situation === "couple" ? "CONJOINT(E)" : `COLOCATAIRE ${index + 1}`

        doc.addPage()
        yPosition = await addPageHeader(cotenantLabel)

        // Informations personnelles complètes
        yPosition = addSectionWithIcon("INFORMATIONS PERSONNELLES", yPosition, "user")

        const colWidth = (pageWidth - 2 * margin - 30) / 2
        const col2X = margin + colWidth + 30

        let col1Y = yPosition
        let col2Y = yPosition

        col1Y = await addProperty("Nom", cotenant.last_name || "", margin, col1Y, { background: true })
        col2Y = await addProperty("Prénom", cotenant.first_name || "", col2X, col2Y)

        if (cotenant.birth_date) {
          col1Y = await addProperty(
            "Date de naissance",
            new Date(cotenant.birth_date).toLocaleDateString("fr-FR"),
            margin,
            col1Y,
          )
        }

        if (cotenant.birth_place) {
          col2Y = await addProperty("Lieu de naissance", cotenant.birth_place, col2X, col2Y, { background: true })
        }

        if (cotenant.nationality) {
          col1Y = await addProperty("Nationalité", cotenant.nationality, margin, col1Y, { background: true })
        }

        if (cotenant.current_housing_situation) {
          const housingLabels: { [key: string]: string } = {
            locataire: "Locataire",
            proprietaire: "Propriétaire",
            heberge: "Hébergé(e)",
            autre: "Autre",
          }
          col2Y = await addProperty(
            "Situation logement",
            housingLabels[cotenant.current_housing_situation] || cotenant.current_housing_situation,
            col2X,
            col2Y,
          )
        }

        if (cotenant.email) {
          col1Y = await addProperty("Email", cotenant.email, margin, col1Y)
        }

        if (cotenant.phone) {
          col2Y = await addProperty("Téléphone", cotenant.phone, col2X, col2Y, { background: true })
        }

        yPosition = Math.max(col1Y, col2Y) + 15

        // Situation professionnelle complète
        if (cotenant.main_activity) {
          yPosition = addSectionWithIcon("SITUATION PROFESSIONNELLE", yPosition, "work")

          col1Y = yPosition
          col2Y = yPosition

          const activityLabels: { [key: string]: string } = {
            cdi: "CDI (Contrat à durée indéterminée)",
            cdd: "CDD (Contrat à durée déterminée)",
            fonction_publique: "Fonction publique",
            independant: "Travailleur indépendant",
            retraite: "Retraité(e)",
            chomage: "Demandeur d'emploi",
            etudes: "Étudiant(e)",
            alternance: "Alternance/Apprentissage",
            stage: "Stagiaire",
            autre: "Autre activité",
          }

          col1Y = await addProperty(
            "Activité principale",
            activityLabels[cotenant.main_activity] || cotenant.main_activity,
            margin,
            col1Y,
            { background: true, bold: true },
          )

          if (cotenant.profession) {
            col2Y = await addProperty("Profession", cotenant.profession, col2X, col2Y)
          }

          if (cotenant.company) {
            col1Y = await addProperty("Entreprise", cotenant.company, margin, col1Y)
          }

          // TYPE DE REVENUS pour le colocataire - INFO AJOUTÉE
          if (cotenant.income_sources?.work_income?.type) {
            const incomeTypeLabels: { [key: string]: string } = {
              salaire: "Salaire",
              honoraires: "Honoraires",
              benefices: "Bénéfices",
              pension: "Pension",
              allocation: "Allocation",
              autre: "Autre type de revenu",
            }
            col2Y = await addProperty(
              "Type de revenus",
              incomeTypeLabels[cotenant.income_sources.work_income.type] || cotenant.income_sources.work_income.type,
              col2X,
              col2Y,
              { background: true },
            )
          }

          yPosition = Math.max(col1Y, col2Y) + 15
        }

        // Revenus du colocataire - COMPLETS
        if (cotenant.income_sources) {
          yPosition = addSectionWithIcon("REVENUS MENSUELS", yPosition, "money")

          if (cotenant.income_sources.work_income?.amount) {
            yPosition = await addAmount(
              "Revenus du travail",
              cotenant.income_sources.work_income.amount,
              margin,
              yPosition,
            )
          }

          // Aides sociales du colocataire
          if (cotenant.income_sources.social_aid && cotenant.income_sources.social_aid.length > 0) {
            for (let aidIndex = 0; aidIndex < cotenant.income_sources.social_aid.length; aidIndex++) {
              const aid = cotenant.income_sources.social_aid[aidIndex]
              if (aid.amount) {
                const aidLabels: { [key: string]: string } = {
                  caf_msa: "Aide CAF/MSA",
                  france_travail: "Aide France Travail",
                  apl_aah: "APL/AAH",
                  rsa: "RSA",
                  prime_activite: "Prime d'activité",
                  autre: "Autre aide sociale",
                }
                yPosition = await addAmount(
                  aidLabels[aid.type] || `Aide sociale ${aidIndex + 1}`,
                  aid.amount,
                  margin,
                  yPosition,
                )
              }
            }
          }

          // Pensions du colocataire
          if (cotenant.income_sources.retirement_pension && cotenant.income_sources.retirement_pension.length > 0) {
            for (
              let pensionIndex = 0;
              pensionIndex < cotenant.income_sources.retirement_pension.length;
              pensionIndex++
            ) {
              const pension = cotenant.income_sources.retirement_pension[pensionIndex]
              if (pension.amount) {
                const pensionLabels: { [key: string]: string } = {
                  retraite: "Pension de retraite",
                  pension_invalidite: "Pension d'invalidité",
                  pension_alimentaire: "Pension alimentaire",
                  pension_veuvage: "Pension de veuvage",
                  autre: "Autre pension",
                }
                yPosition = await addAmount(
                  pensionLabels[pension.type] || `Pension ${pensionIndex + 1}`,
                  pension.amount,
                  margin,
                  yPosition,
                )
              }
            }
          }

          // Revenus locatifs du colocataire
          if (cotenant.income_sources.rent_income && cotenant.income_sources.rent_income.length > 0) {
            for (let rentIndex = 0; rentIndex < cotenant.income_sources.rent_income.length; rentIndex++) {
              const rent = cotenant.income_sources.rent_income[rentIndex]
              if (rent.amount) {
                const rentLabels: { [key: string]: string } = {
                  revenus_locatifs: "Revenus locatifs",
                  rente_viagere: "Rente viagère",
                  dividendes: "Dividendes",
                  autre_rente: "Autre rente",
                }
                yPosition = await addAmount(
                  rentLabels[rent.type] || `Revenu locatif ${rentIndex + 1}`,
                  rent.amount,
                  margin,
                  yPosition,
                )
              }
            }
          }

          if (cotenant.income_sources.scholarship?.amount) {
            yPosition = await addAmount(
              "Bourse d'études",
              cotenant.income_sources.scholarship.amount,
              margin,
              yPosition,
            )
          }

          // Total des revenus du colocataire
          const cotenantIncome = calculateTotalIncomeForPerson(cotenant.income_sources)
          if (cotenantIncome > 0) {
            yPosition += 10

            // Encadré spécial pour le total
            doc.setFillColor(...colors.success)
            doc.roundedRect(margin - 5, yPosition - 8, pageWidth - 2 * margin + 10, 25, 5, 5, "F")

            doc.setTextColor(...colors.white)
            doc.setFontSize(14)
            doc.setFont("helvetica", "bold")
            drawIcon("money", margin + 5, yPosition - 3, 12)
            doc.text("TOTAL REVENUS MENSUELS", margin + 22, yPosition + 2)
            doc.setFontSize(16)
            doc.text(formatAmount(cotenantIncome), margin + 22, yPosition + 15)

            yPosition += 35
          }
        }
      }
    }

    // PAGES GARANTS avec design moderne complet
    if (rentalFile.guarantors && rentalFile.guarantors.length > 0) {
      for (let index = 0; index < rentalFile.guarantors.length; index++) {
        const guarantor = rentalFile.guarantors[index]
        doc.addPage()
        yPosition = await addPageHeader(`GARANT ${index + 1}`)

        yPosition = addSectionWithIcon("TYPE DE GARANT", yPosition, "shield")

        const guarantorTypeLabels: { [key: string]: string } = {
          physical: "Personne physique",
          moral_person: "Personne morale (Entreprise)",
          organism: "Organisme de cautionnement",
        }

        yPosition = await addProperty(
          "Type de garant",
          guarantorTypeLabels[guarantor.type] || guarantor.type,
          margin,
          yPosition,
          { bold: true, background: true },
        )

        if (guarantor.personal_info) {
          const guarantorInfo = guarantor.personal_info

          yPosition += 10
          yPosition = addSectionWithIcon("INFORMATIONS PERSONNELLES", yPosition, "user")

          const colWidth = (pageWidth - 2 * margin - 30) / 2
          const col2X = margin + colWidth + 30

          let col1Y = yPosition
          let col2Y = yPosition

          col1Y = await addProperty("Nom", guarantorInfo.last_name || "", margin, col1Y, { background: true })
          col2Y = await addProperty("Prénom", guarantorInfo.first_name || "", col2X, col2Y)

          if (guarantorInfo.birth_date) {
            col1Y = await addProperty(
              "Date de naissance",
              new Date(guarantorInfo.birth_date).toLocaleDateString("fr-FR"),
              margin,
              col1Y,
            )
          }

          if (guarantorInfo.birth_place) {
            col2Y = await addProperty("Lieu de naissance", guarantorInfo.birth_place, col2X, col2Y, {
              background: true,
            })
          }

          if (guarantorInfo.nationality) {
            col1Y = await addProperty("Nationalité", guarantorInfo.nationality, margin, col1Y, { background: true })
          }

          if (guarantorInfo.current_housing_situation) {
            const housingLabels: { [key: string]: string } = {
              locataire: "Locataire",
              proprietaire: "Propriétaire",
              heberge: "Hébergé(e)",
              autre: "Autre",
            }
            col2Y = await addProperty(
              "Situation logement",
              housingLabels[guarantorInfo.current_housing_situation] || guarantorInfo.current_housing_situation,
              col2X,
              col2Y,
            )
          }

          if (guarantorInfo.email) {
            col1Y = await addProperty("Email", guarantorInfo.email, margin, col1Y)
          }

          if (guarantorInfo.phone) {
            col2Y = await addProperty("Téléphone", guarantorInfo.phone, col2X, col2Y, { background: true })
          }

          yPosition = Math.max(col1Y, col2Y) + 15

          // Situation professionnelle du garant
          if (guarantorInfo.main_activity) {
            yPosition = addSectionWithIcon("SITUATION PROFESSIONNELLE", yPosition, "work")

            col1Y = yPosition
            col2Y = yPosition

            const activityLabels: { [key: string]: string } = {
              cdi: "CDI (Contrat à durée indéterminée)",
              cdd: "CDD (Contrat à durée déterminée)",
              fonction_publique: "Fonction publique",
              independant: "Travailleur indépendant",
              retraite: "Retraité(e)",
              chomage: "Demandeur d'emploi",
              etudes: "Étudiant(e)",
              alternance: "Alternance/Apprentissage",
              autre: "Autre activité",
            }

            col1Y = await addProperty(
              "Activité principale",
              activityLabels[guarantorInfo.main_activity] || guarantorInfo.main_activity,
              margin,
              col1Y,
              { background: true, bold: true },
            )

            if (guarantorInfo.profession) {
              col2Y = await addProperty("Profession", guarantorInfo.profession, col2X, col2Y)
            }

            if (guarantorInfo.company) {
              col1Y = await addProperty("Entreprise", guarantorInfo.company, margin, col1Y)
            }

            yPosition = Math.max(col1Y, col2Y) + 15
          }

          // Revenus du garant - COMPLETS
          if (guarantorInfo.income_sources) {
            yPosition = addSectionWithIcon("REVENUS MENSUELS", yPosition, "money")

            if (guarantorInfo.income_sources.work_income?.amount) {
              yPosition = await addAmount(
                "Revenus du travail",
                guarantorInfo.income_sources.work_income.amount,
                margin,
                yPosition,
              )
            }

            // Aides sociales du garant
            if (guarantorInfo.income_sources.social_aid && guarantorInfo.income_sources.social_aid.length > 0) {
              for (let aidIndex = 0; aidIndex < guarantorInfo.income_sources.social_aid.length; aidIndex++) {
                const aid = guarantorInfo.income_sources.social_aid[aidIndex]
                if (aid.amount) {
                  yPosition = await addAmount(`Aide sociale ${aidIndex + 1}`, aid.amount, margin, yPosition)
                }
              }
            }

            // Pensions du garant
            if (
              guarantorInfo.income_sources.retirement_pension &&
              guarantorInfo.income_sources.retirement_pension.length > 0
            ) {
              for (
                let pensionIndex = 0;
                pensionIndex < guarantorInfo.income_sources.retirement_pension.length;
                pensionIndex++
              ) {
                const pension = guarantorInfo.income_sources.retirement_pension[pensionIndex]
                if (pension.amount) {
                  yPosition = await addAmount(`Pension ${pensionIndex + 1}`, pension.amount, margin, yPosition)
                }
              }
            }

            // Total des revenus du garant
            const guarantorIncome = calculateTotalIncomeForPerson(guarantorInfo.income_sources)
            if (guarantorIncome > 0) {
              yPosition += 10

              // Encadré spécial pour le total
              doc.setFillColor(...colors.success)
              doc.roundedRect(margin - 5, yPosition - 8, pageWidth - 2 * margin + 10, 25, 5, 5, "F")

              doc.setTextColor(...colors.white)
              doc.setFontSize(14)
              doc.setFont("helvetica", "bold")
              drawIcon("money", margin + 5, yPosition - 3, 12)
              doc.text("TOTAL REVENUS MENSUELS", margin + 22, yPosition + 2)
              doc.setFontSize(16)
              doc.text(formatAmount(guarantorIncome), margin + 22, yPosition + 15)

              yPosition += 35
            }
          }
        } else if (guarantor.type === "organism") {
          // Informations organisme (Visale, etc.)
          yPosition += 10
          yPosition = addSectionWithIcon("INFORMATIONS ORGANISME", yPosition, "shield")

          if (guarantor.organism_name) {
            yPosition = await addProperty("Nom de l'organisme", guarantor.organism_name, margin, yPosition, {
              background: true,
              bold: true,
            })
          }

          if (guarantor.organism_type) {
            yPosition = await addProperty("Type d'organisme", guarantor.organism_type, margin, yPosition)
          }

          if (guarantor.guarantee_number) {
            yPosition = await addProperty("Numéro de garantie", guarantor.guarantee_number, margin, yPosition, {
              background: true,
            })
          }
        } else if (guarantor.type === "moral_person") {
          // Informations personne morale
          yPosition += 10
          yPosition = addSectionWithIcon("INFORMATIONS SOCIÉTÉ", yPosition, "work")

          if (guarantor.company_name) {
            yPosition = await addProperty("Nom de la société", guarantor.company_name, margin, yPosition, {
              background: true,
              bold: true,
            })
          }

          if (guarantor.siret) {
            yPosition = await addProperty("SIRET", guarantor.siret, margin, yPosition)
          }

          if (guarantor.legal_representative) {
            yPosition = await addProperty("Représentant légal", guarantor.legal_representative, margin, yPosition, {
              background: true,
            })
          }
        }
      }
    }

    // COLLECTE COMPLÈTE DES DOCUMENTS - TOUS TYPES
    const documentsToProcess: any[] = []

    // Documents du locataire principal
    if (mainTenant) {
      // Documents d'identité
      if (mainTenant.identity_documents && Array.isArray(mainTenant.identity_documents)) {
        mainTenant.identity_documents.forEach((doc: string, index: number) => {
          documentsToProcess.push({
            url: doc,
            name: `Locataire principal - Pièce d'identité ${index + 1}`,
            category: "identity",
          })
        })
      }

      // Documents d'activité
      if (mainTenant.activity_documents && Array.isArray(mainTenant.activity_documents)) {
        mainTenant.activity_documents.forEach((doc: string, index: number) => {
          documentsToProcess.push({
            url: doc,
            name: `Locataire principal - Justificatif d'activité ${index + 1}`,
            category: "activity",
          })
        })
      }

      // Documents de revenus - TOUS TYPES
      if (
        mainTenant.income_sources?.work_income?.documents &&
        Array.isArray(mainTenant.income_sources.work_income.documents)
      ) {
        mainTenant.income_sources.work_income.documents.forEach((doc: string, index: number) => {
          documentsToProcess.push({
            url: doc,
            name: `Locataire principal - Justificatif de revenu ${index + 1}`,
            category: "income",
          })
        })
      }

      // Documents d'aides sociales
      if (mainTenant.income_sources?.social_aid && Array.isArray(mainTenant.income_sources.social_aid)) {
        mainTenant.income_sources.social_aid.forEach((aid: any, aidIndex: number) => {
          if (aid.documents && Array.isArray(aid.documents)) {
            aid.documents.forEach((doc: string, docIndex: number) => {
              documentsToProcess.push({
                url: doc,
                name: `Locataire principal - Justificatif aide sociale ${aidIndex + 1}-${docIndex + 1}`,
                category: "social_aid",
              })
            })
          }
        })
      }

      // Documents de pensions
      if (
        mainTenant.income_sources?.retirement_pension &&
        Array.isArray(mainTenant.income_sources.retirement_pension)
      ) {
        mainTenant.income_sources.retirement_pension.forEach((pension: any, pensionIndex: number) => {
          if (pension.documents && Array.isArray(pension.documents)) {
            pension.documents.forEach((doc: string, docIndex: number) => {
              documentsToProcess.push({
                url: doc,
                name: `Locataire principal - Justificatif pension ${pensionIndex + 1}-${docIndex + 1}`,
                category: "pension",
              })
            })
          }
        })
      }

      // Documents fiscaux
      if (mainTenant.tax_situation?.documents && Array.isArray(mainTenant.tax_situation.documents)) {
        mainTenant.tax_situation.documents.forEach((doc: string, index: number) => {
          documentsToProcess.push({
            url: doc,
            name: `Locataire principal - Document fiscal ${index + 1}`,
            category: "tax",
          })
        })
      }

      // Documents de logement - TOUS TYPES
      if (
        mainTenant.current_housing_documents?.quittances_loyer &&
        Array.isArray(mainTenant.current_housing_documents.quittances_loyer)
      ) {
        mainTenant.current_housing_documents.quittances_loyer.forEach((doc: string, index: number) => {
          documentsToProcess.push({
            url: doc,
            name: `Locataire principal - Quittance de loyer ${index + 1}`,
            category: "housing",
          })
        })
      }

      if (
        mainTenant.current_housing_documents?.attestation_hebergement &&
        Array.isArray(mainTenant.current_housing_documents.attestation_hebergement)
      ) {
        mainTenant.current_housing_documents.attestation_hebergement.forEach((doc: string, index: number) => {
          documentsToProcess.push({
            url: doc,
            name: `Locataire principal - Attestation d'hébergement ${index + 1}`,
            category: "housing",
          })
        })
      }

      if (
        mainTenant.current_housing_documents?.avis_taxe_fonciere &&
        Array.isArray(mainTenant.current_housing_documents.avis_taxe_fonciere)
      ) {
        mainTenant.current_housing_documents.avis_taxe_fonciere.forEach((doc: string, index: number) => {
          documentsToProcess.push({
            url: doc,
            name: `Locataire principal - Taxe foncière ${index + 1}`,
            category: "housing",
          })
        })
      }
    }

    // Documents des colocataires/conjoint - TOUS INCLUS
    if (rentalFile.cotenants && Array.isArray(rentalFile.cotenants)) {
      rentalFile.cotenants.forEach((cotenant: any, cIndex: number) => {
        const cotenantLabel = rentalFile.rental_situation === "couple" ? "Conjoint(e)" : `Colocataire ${cIndex + 1}`

        // Tous les types de documents pour les colocataires
        if (cotenant.identity_documents && Array.isArray(cotenant.identity_documents)) {
          cotenant.identity_documents.forEach((doc: string, index: number) => {
            documentsToProcess.push({
              url: doc,
              name: `${cotenantLabel} - Pièce d'identité ${index + 1}`,
              category: "cotenant_identity",
            })
          })
        }

        if (cotenant.activity_documents && Array.isArray(cotenant.activity_documents)) {
          cotenant.activity_documents.forEach((doc: string, index: number) => {
            documentsToProcess.push({
              url: doc,
              name: `${cotenantLabel} - Justificatif d'activité ${index + 1}`,
              category: "cotenant_activity",
            })
          })
        }

        // Documents de revenus des colocataires
        if (
          cotenant.income_sources?.work_income?.documents &&
          Array.isArray(cotenant.income_sources.work_income.documents)
        ) {
          cotenant.income_sources.work_income.documents.forEach((doc: string, index: number) => {
            documentsToProcess.push({
              url: doc,
              name: `${cotenantLabel} - Justificatif de revenu ${index + 1}`,
              category: "cotenant_income",
            })
          })
        }

        // Aides sociales des colocataires
        if (cotenant.income_sources?.social_aid && Array.isArray(cotenant.income_sources.social_aid)) {
          cotenant.income_sources.social_aid.forEach((aid: any, aidIndex: number) => {
            if (aid.documents && Array.isArray(aid.documents)) {
              aid.documents.forEach((doc: string, docIndex: number) => {
                documentsToProcess.push({
                  url: doc,
                  name: `${cotenantLabel} - Justificatif aide sociale ${aidIndex + 1}-${docIndex + 1}`,
                  category: "cotenant_social_aid",
                })
              })
            }
          })
        }
      })
    }

    // Documents des garants - TOUS TYPES INCLUS
    if (rentalFile.guarantors && Array.isArray(rentalFile.guarantors)) {
      rentalFile.guarantors.forEach((guarantor: any, gIndex: number) => {
        if (guarantor.type === "physical" && guarantor.personal_info) {
          // Tous les documents des garants physiques
          if (guarantor.personal_info.identity_documents && Array.isArray(guarantor.personal_info.identity_documents)) {
            guarantor.personal_info.identity_documents.forEach((doc: string, index: number) => {
              documentsToProcess.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Pièce d'identité ${index + 1}`,
                category: "guarantor_identity",
              })
            })
          }

          if (guarantor.personal_info.activity_documents && Array.isArray(guarantor.personal_info.activity_documents)) {
            guarantor.personal_info.activity_documents.forEach((doc: string, index: number) => {
              documentsToProcess.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Justificatif d'activité ${index + 1}`,
                category: "guarantor_activity",
              })
            })
          }

          // Documents de revenus des garants
          if (
            guarantor.personal_info.income_sources?.work_income?.documents &&
            Array.isArray(guarantor.personal_info.income_sources.work_income.documents)
          ) {
            guarantor.personal_info.income_sources.work_income.documents.forEach((doc: string, index: number) => {
              documentsToProcess.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Justificatif de revenu ${index + 1}`,
                category: "guarantor_income",
              })
            })
          }

          // Quittances des garants
          if (
            guarantor.personal_info.current_housing_documents?.quittances_loyer &&
            Array.isArray(guarantor.personal_info.current_housing_documents.quittances_loyer)
          ) {
            guarantor.personal_info.current_housing_documents.quittances_loyer.forEach((doc: string, index: number) => {
              documentsToProcess.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Quittance de loyer ${index + 1}`,
                category: "guarantor_housing",
              })
            })
          }

          // Documents fiscaux des garants
          if (
            guarantor.personal_info.tax_situation?.documents &&
            Array.isArray(guarantor.personal_info.tax_situation.documents)
          ) {
            guarantor.personal_info.tax_situation.documents.forEach((doc: string, index: number) => {
              documentsToProcess.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Document fiscal ${index + 1}`,
                category: "guarantor_tax",
              })
            })
          }
        } else if (guarantor.type === "organism") {
          // Documents Visale ou autres organismes
          if (guarantor.organism_documents && Array.isArray(guarantor.organism_documents)) {
            guarantor.organism_documents.forEach((doc: string, index: number) => {
              documentsToProcess.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Document organisme ${index + 1}`,
                category: "guarantor_organism",
              })
            })
          }
        } else if (guarantor.type === "moral_person") {
          // Documents Kbis et autres
          if (guarantor.kbis_documents && Array.isArray(guarantor.kbis_documents)) {
            guarantor.kbis_documents.forEach((doc: string, index: number) => {
              documentsToProcess.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Document Kbis ${index + 1}`,
                category: "guarantor_kbis",
              })
            })
          }
        }
      })
    }

    console.log(`📋 ${documentsToProcess.length} documents à traiter`)

    // Traiter tous les documents
    for (const document of documentsToProcess) {
      await processDocument(document.url, document.name, document.category)
    }

    // PAGE ANNEXES MODERNE ET COMPLÈTE
    if (pdfsToMerge.length > 0 || imagesToAdd.length > 0) {
      doc.addPage()
      yPosition = await addPageHeader("ANNEXES - PIÈCES JUSTIFICATIVES")

      yPosition = addSectionWithIcon("LISTE DES DOCUMENTS INCLUS", yPosition, "document")

      doc.setTextColor(...colors.dark)
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text("Les pièces justificatives suivantes sont intégrées dans ce document :", margin, yPosition)

      yPosition += 20

      // Organiser les documents par catégorie
      const documentsByCategory: any = {}

      pdfsToMerge.forEach((pdf) => {
        if (!documentsByCategory[pdf.category]) documentsByCategory[pdf.category] = []
        documentsByCategory[pdf.category].push({ name: pdf.name, type: "PDF", pages: pdf.pageCount })
      })

      imagesToAdd.forEach((img) => {
        if (!documentsByCategory[img.category]) documentsByCategory[img.category] = []
        documentsByCategory[img.category].push({ name: img.name, type: "Image", pages: 1 })
      })

      // Afficher par catégorie avec design moderne
      const categoryLabels: any = {
        identity: "PIÈCES D'IDENTITÉ",
        activity: "JUSTIFICATIFS D'ACTIVITÉ",
        income: "JUSTIFICATIFS DE REVENUS",
        social_aid: "JUSTIFICATIFS D'AIDES SOCIALES",
        pension: "JUSTIFICATIFS DE PENSIONS",
        tax: "DOCUMENTS FISCAUX",
        housing: "JUSTIFICATIFS DE LOGEMENT",
        cotenant_identity: "PIÈCES D'IDENTITÉ (COLOCATAIRES)",
        cotenant_activity: "JUSTIFICATIFS D'ACTIVITÉ (COLOCATAIRES)",
        cotenant_income: "JUSTIFICATIFS DE REVENUS (COLOCATAIRES)",
        cotenant_social_aid: "JUSTIFICATIFS D'AIDES (COLOCATAIRES)",
        guarantor_identity: "PIÈCES D'IDENTITÉ (GARANTS)",
        guarantor_activity: "JUSTIFICATIFS D'ACTIVITÉ (GARANTS)",
        guarantor_income: "JUSTIFICATIFS DE REVENUS (GARANTS)",
        guarantor_housing: "QUITTANCES DE LOYER (GARANTS)",
        guarantor_tax: "DOCUMENTS FISCAUX (GARANTS)",
        guarantor_organism: "DOCUMENTS ORGANISME (GARANTS)",
        guarantor_kbis: "DOCUMENTS KBIS (GARANTS)",
      }

      let docCount = 1
      Object.keys(documentsByCategory).forEach(async (category) => {
        const categoryName = categoryLabels[category] || category.replace(/_/g, " ").toUpperCase()

        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > pageHeight - 60) {
          doc.addPage()
          yPosition = await addPageHeader("ANNEXES - PIÈCES JUSTIFICATIVES (SUITE)")
        }

        // En-tête de catégorie moderne
        doc.setFillColor(...colors.lightGray)
        doc.roundedRect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 15, 3, 3, "F")

        // Bordure colorée pour la catégorie
        doc.setFillColor(...colors.secondary)
        doc.rect(margin - 5, yPosition - 5, 4, 15, "F")

        drawIcon("document", margin + 5, yPosition - 2, 8)

        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...colors.primary)
        doc.text(categoryName, margin + 18, yPosition + 3)
        yPosition += 20

        // Documents de cette catégorie
        documentsByCategory[category].forEach((docItem: any) => {
          // Vérifier si on a besoin d'une nouvelle page
          if (yPosition > pageHeight - 30) {
            doc.addPage()
            yPosition = await addPageHeader("ANNEXES - PIÈCES JUSTIFICATIVES (SUITE)")
          }

          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(...colors.dark)

          // Numérotation moderne
          doc.setFillColor(...colors.accent)
          doc.circle(margin + 5, yPosition - 2, 3, "F")
          doc.setTextColor(...colors.white)
          doc.setFontSize(8)
          doc.setFont("helvetica", "bold")
          doc.text(docCount.toString(), margin + 3, yPosition + 1)

          // Nom du document
          doc.setTextColor(...colors.dark)
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")

          const docText = `${docItem.name} (${docItem.type} - ${docItem.pages} page${docItem.pages > 1 ? "s" : ""})`
          const maxWidth = pageWidth - margin - 20
          const lines = doc.splitTextToSize(docText, maxWidth)

          lines.forEach((line: string, lineIndex: number) => {
            doc.text(line, margin + 12, yPosition + lineIndex * 5)
          })

          yPosition += lines.length * 5 + 3
          docCount++
        })

        yPosition += 8
      })

      if (docCount === 1) {
        doc.setTextColor(...colors.gray)
        doc.setFontSize(12)
        doc.setFont("helvetica", "italic")
        doc.text("Aucune pièce justificative fournie.", margin, yPosition)
      }
    }

    // MERGE FINAL AVEC TÉLÉCHARGEMENT MODERNE
    console.log(`🔄 Préparation du PDF final avec ${pdfsToMerge.length} PDF(s) et ${imagesToAdd.length} image(s)...`)

    try {
      // Convertir le PDF jsPDF en ArrayBuffer
      const jsPdfOutput = doc.output("arraybuffer")
      const mainPdfDoc = await PDFDocument.load(jsPdfOutput)

      // Ajouter les images avec en-têtes ultra modernes
      for (const imageItem of imagesToAdd) {
        try {
          console.log(`🖼️ Ajout de l'image: ${imageItem.name}`)

          const imagePage = mainPdfDoc.addPage()
          const { width, height } = imagePage.getSize()

          // En-tête moderne avec dégradé pour l'image
          const headerHeight = 50

          // Dégradé simulé pour l'en-tête
          for (let i = 0; i < headerHeight; i++) {
            const ratio = i / headerHeight
            const r = (colors.primary[0] + (colors.secondary[0] - colors.primary[0]) * ratio) / 255
            const g = (colors.primary[1] + (colors.secondary[1] - colors.primary[1]) * ratio) / 255
            const b = (colors.primary[2] + (colors.secondary[2] - colors.primary[2]) * ratio) / 255

            imagePage.drawRectangle({
              x: 0,
              y: height - headerHeight + i,
              width: width,
              height: 1,
              color: { r, g, b },
            })
          }

          // Titre de l'image
          imagePage.drawText(imageItem.name, {
            x: 20,
            y: height - 25,
            size: 14,
            color: { r: 1, g: 1, b: 1 },
          })

          // Sous-titre
          imagePage.drawText("PIÈCE JUSTIFICATIVE", {
            x: 20,
            y: height - 40,
            size: 10,
            color: { r: 0.9, g: 0.9, b: 0.9 },
          })

          // Traiter l'image
          const base64Data = imageItem.data.split(",")[1]
          const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))

          let pdfImage
          if (imageItem.data.includes("image/jpeg") || imageItem.data.includes("image/jpg")) {
            pdfImage = await mainPdfDoc.embedJpg(imageBytes)
          } else {
            pdfImage = await mainPdfDoc.embedPng(imageBytes)
          }

          // Calculer les dimensions avec marges modernes
          const imgWidth = pdfImage.width
          const imgHeight = pdfImage.height
          const availableWidth = width - 60
          const availableHeight = height - headerHeight - 60

          let finalWidth = availableWidth
          let finalHeight = (imgHeight * availableWidth) / imgWidth

          if (finalHeight > availableHeight) {
            finalHeight = availableHeight
            finalWidth = (imgWidth * availableHeight) / imgHeight
          }

          const xPos = (width - finalWidth) / 2
          const yPos = (height - finalHeight - headerHeight) / 2

          // Ombre moderne pour l'image
          imagePage.drawRectangle({
            x: xPos + 3,
            y: yPos - 3,
            width: finalWidth,
            height: finalHeight,
            color: { r: 0, g: 0, b: 0 },
            opacity: 0.1,
          })

          // Bordure moderne
          imagePage.drawRectangle({
            x: xPos - 2,
            y: yPos - 2,
            width: finalWidth + 4,
            height: finalHeight + 4,
            borderColor: { r: colors.border[0] / 255, g: colors.border[1] / 255, b: colors.border[2] / 255 },
            borderWidth: 2,
          })

          imagePage.drawImage(pdfImage, {
            x: xPos,
            y: yPos,
            width: finalWidth,
            height: finalHeight,
          })

          console.log(`✅ Image ajoutée: ${imageItem.name}`)
        } catch (imageError) {
          console.error(`❌ Erreur ajout image ${imageItem.name}:`, imageError)
        }
      }

      // Merger les PDF avec en-têtes modernes
      for (const pdfToMerge of pdfsToMerge) {
        try {
          console.log(`📄 Merge de ${pdfToMerge.name}...`)

          const sourcePdfDoc = await PDFDocument.load(pdfToMerge.data)
          const pageIndices = Array.from({ length: pdfToMerge.pageCount }, (_, i) => i)
          const copiedPages = await mainPdfDoc.copyPages(sourcePdfDoc, pageIndices)

          copiedPages.forEach((page, index) => {
            // Ajouter un en-tête moderne à chaque page de document
            const { width, height } = page.getSize()

            // Bande d'en-tête moderne
            page.drawRectangle({
              x: 0,
              y: height - 30,
              width: width,
              height: 30,
              color: { r: colors.lightGray[0] / 255, g: colors.lightGray[1] / 255, b: colors.lightGray[2] / 255 },
            })

            // Bordure colorée
            page.drawRectangle({
              x: 0,
              y: height - 30,
              width: 4,
              height: 30,
              color: { r: colors.primary[0] / 255, g: colors.primary[1] / 255, b: colors.primary[2] / 255 },
            })

            // Titre du document
            page.drawText(`${pdfToMerge.name} - Page ${index + 1}/${pdfToMerge.pageCount}`, {
              x: 10,
              y: height - 18,
              size: 10,
              color: { r: colors.dark[0] / 255, g: colors.dark[1] / 255, b: colors.dark[2] / 255 },
            })

            mainPdfDoc.addPage(page)
          })

          console.log(`✅ ${pdfToMerge.name} mergé`)
        } catch (mergeError) {
          console.error(`❌ Erreur merge ${pdfToMerge.name}:`, mergeError)
        }
      }

      // Sauvegarder le PDF final avec nom moderne
      const finalPdfBytes = await mainPdfDoc.save()
      const fileName = `dossier-location-${tenantName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`

      const blob = new Blob([finalPdfBytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log(`🎉 PDF final généré avec succès !`)
    } catch (mergeError) {
      console.error("❌ Erreur lors du merge final:", mergeError)

      // Fallback : télécharger le PDF sans les annexes
      const fileName = `dossier-location-${tenantName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)
    }
  } catch (error) {
    console.error("❌ Erreur génération PDF:", error)
    throw error
  }
}

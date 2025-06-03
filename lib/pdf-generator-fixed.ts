import { type RentalFileData, MAIN_ACTIVITIES } from "./rental-file-service"

export const generateRentalFilePDF = async (rentalFile: RentalFileData): Promise<void> => {
  try {
    // Import dynamique de jsPDF et pdf-lib
    const { jsPDF } = await import("jspdf")
    const { PDFDocument } = await import("pdf-lib")

    const jsPdfDoc = new jsPDF()
    let yPosition = 20
    const pageWidth = jsPdfDoc.internal.pageSize.width
    const pageHeight = jsPdfDoc.internal.pageSize.height
    const margin = 20

    // Couleurs de la charte graphique
    const primaryColor = "#3B82F6" // Bleu principal
    const secondaryColor = "#1E40AF" // Bleu foncé
    const accentColor = "#10B981" // Vert pour les montants

    // Stocker les PDF à merger à la fin
    const pdfsToMerge = []

    // Collecter tous les documents pour les annexes
    const allDocuments = []

    // Fonction helper pour ajouter du texte avec retour à la ligne
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      jsPdfDoc.setFontSize(options.fontSize || 12)
      jsPdfDoc.setFont(options.font || "helvetica", options.style || "normal")

      if (options.color) {
        if (Array.isArray(options.color)) {
          if (options.color.length === 3) {
            jsPdfDoc.setTextColor(options.color[0], options.color[1], options.color[2])
          } else {
            jsPdfDoc.setTextColor(options.color[0])
          }
        } else {
          jsPdfDoc.setTextColor(options.color)
        }
      } else {
        jsPdfDoc.setTextColor("#000000")
      }

      const lines = jsPdfDoc.splitTextToSize(text, pageWidth - 2 * margin)
      jsPdfDoc.text(lines, x, y)
      return y + lines.length * (options.lineHeight || 6)
    }

    // Fonction pour vérifier si une URL est valide (Supabase ou autre)
    const isValidDocumentUrl = (url: string): boolean => {
      if (!url || url === "DOCUMENT_MIGRE_PLACEHOLDER") return false
      if (url.includes("blob:")) return false
      if (url.startsWith("https://") && url.includes("supabase")) return true
      if (url.startsWith("http")) return true
      return false
    }

    // Fonction pour déterminer le type de fichier à partir de l'URL
    const getFileType = (url: string): string => {
      const extension = url.split(".").pop()?.toLowerCase() || ""

      if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
        return "image"
      } else if (extension === "pdf") {
        return "pdf"
      } else {
        return "document"
      }
    }

    // Fonction pour préparer un PDF pour le merge
    const preparePDFForMerge = async (pdfUrl: string, documentName: string, category: string) => {
      try {
        console.log("📄 Préparation PDF pour merge:", documentName, "URL:", pdfUrl)

        // Appeler l'API pour récupérer le PDF
        const response = await fetch("/api/pdf/merge-pages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pdfUrl }),
        })

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.message || "Erreur lors de la récupération")
        }

        console.log(`📋 PDF préparé: ${result.pageCount} pages`)

        // Ajouter le document à la liste des annexes
        allDocuments.push({
          name: documentName,
          type: "pdf",
          category: category,
          pageCount: result.pageCount,
        })

        // Stocker le PDF pour le merge final
        pdfsToMerge.push({
          name: documentName,
          data: new Uint8Array(result.pdfData),
          pageCount: result.pageCount,
          category: category,
        })

        console.log(`✅ PDF préparé pour merge: ${documentName}`)
      } catch (error) {
        console.error("❌ Erreur lors de la préparation du PDF:", error)

        // Ajouter quand même à la liste des annexes avec une erreur
        allDocuments.push({
          name: documentName,
          type: "error",
          category: category,
          error: error.message,
        })
      }
    }

    // Fonction pour préparer une image pour le PDF
    const prepareImageForPDF = async (imageUrl: string, documentName: string, category: string) => {
      try {
        console.log("🖼️ Préparation image:", documentName, "URL:", imageUrl)

        // Vérifier si c'est un placeholder ou une URL blob
        if (!isValidDocumentUrl(imageUrl)) {
          console.log("📋 Image placeholder ou blob détectée")

          // Ajouter à la liste des annexes avec un statut spécial
          allDocuments.push({
            name: documentName,
            type: "placeholder",
            category: category,
          })

          return
        }

        // Récupérer l'image
        const response = await fetch(imageUrl, {
          method: "GET",
          headers: {
            Accept: "image/*,*/*",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const blob = await response.blob()
        console.log("📦 Blob récupéré:", blob.type, blob.size, "bytes")

        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })

        console.log("✅ Image récupérée et convertie en base64")

        // Ajouter à la liste des annexes
        allDocuments.push({
          name: documentName,
          type: "image",
          category: category,
          data: base64Data,
        })
      } catch (error) {
        console.error("❌ Erreur lors de la préparation de l'image:", error)

        // Ajouter quand même à la liste des annexes avec une erreur
        allDocuments.push({
          name: documentName,
          type: "error",
          category: category,
          error: error.message,
        })
      }
    }

    // Fonction pour ajouter un document au PDF
    const addDocumentToPDF = async (documentUrl: string, documentName: string, category: string) => {
      try {
        console.log("📄 Traitement du document:", documentName, "URL:", documentUrl)

        // Déterminer le type de fichier
        const fileType = getFileType(documentUrl)
        console.log("📋 Type de fichier détecté:", fileType)

        // Traitement selon le type
        if (fileType === "pdf") {
          await preparePDFForMerge(documentUrl, documentName, category)
        } else {
          await prepareImageForPDF(documentUrl, documentName, category)
        }
      } catch (error) {
        console.error("❌ Erreur lors du traitement du document:", error)

        // Ajouter quand même à la liste des annexes avec une erreur
        allDocuments.push({
          name: documentName,
          type: "error",
          category: category,
          error: error.message,
        })
      }
    }

    // Fonction pour ajouter le logo
    const addLogo = () => {
      // Logo placeholder - à remplacer par le vrai logo
      const logoSize = 30
      const logoX = pageWidth - margin - logoSize
      const logoY = margin - 10

      // Dessiner un cercle comme placeholder de logo
      jsPdfDoc.setFillColor(primaryColor)
      jsPdfDoc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, "F")

      // Texte du logo
      jsPdfDoc.setTextColor("#FFFFFF")
      jsPdfDoc.setFontSize(12)
      jsPdfDoc.setFont("helvetica", "bold")
      jsPdfDoc.text("LOGO", logoX + 5, logoY + 18)
    }

    // Fonction pour ajouter un en-tête de page
    const addPageHeader = (title: string) => {
      jsPdfDoc.setFillColor(primaryColor)
      jsPdfDoc.rect(0, 0, pageWidth, 30, "F")

      jsPdfDoc.setTextColor("#FFFFFF")
      jsPdfDoc.setFontSize(16)
      jsPdfDoc.setFont("helvetica", "bold")
      jsPdfDoc.text(title, margin, 20)

      addLogo()

      return 40 // Position Y après l'en-tête
    }

    // Fonction pour ajouter une section avec icône
    const addSectionWithIcon = (title: string, y: number, iconType = "info") => {
      const iconSize = 8
      const iconX = margin
      const iconY = y - 4
      const textX = margin + iconSize + 5

      // Dessiner l'icône selon le type
      jsPdfDoc.setFillColor(primaryColor)

      if (iconType === "info") {
        jsPdfDoc.circle(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, "F")
      } else if (iconType === "document") {
        jsPdfDoc.rect(iconX, iconY, iconSize, iconSize, "F")
      } else if (iconType === "person") {
        // Dessiner une icône de personne simplifiée
        jsPdfDoc.circle(iconX + iconSize / 2, iconY + iconSize / 3, iconSize / 3, "F")
        jsPdfDoc.setFillColor(primaryColor)
        jsPdfDoc.rect(iconX, iconY + iconSize / 2, iconSize, iconSize / 2, "F")
      }

      // Texte du titre
      jsPdfDoc.setTextColor(primaryColor)
      jsPdfDoc.setFontSize(14)
      jsPdfDoc.setFont("helvetica", "bold")
      jsPdfDoc.text(title, textX, y)

      // Ligne de séparation
      jsPdfDoc.setDrawColor(primaryColor)
      jsPdfDoc.line(margin, y + 5, pageWidth - margin, y + 5)

      return y + 15
    }

    // Fonction pour ajouter une propriété avec sa valeur
    const addProperty = (label: string, value: string, x: number, y: number, options: any = {}) => {
      jsPdfDoc.setTextColor("#666666")
      jsPdfDoc.setFontSize(10)
      jsPdfDoc.setFont("helvetica", "normal")
      jsPdfDoc.text(label, x, y)

      jsPdfDoc.setTextColor(options.valueColor || "#000000")
      jsPdfDoc.setFontSize(11)
      jsPdfDoc.setFont("helvetica", options.valueStyle || "normal")

      // Si la valeur est vide, afficher "Non renseigné"
      const displayValue = value || "Non renseigné"
      jsPdfDoc.text(displayValue, x, y + 5)

      return y + 10
    }

    // Fonction pour ajouter un montant formaté
    const addAmount = (label: string, amount: number, x: number, y: number) => {
      jsPdfDoc.setTextColor("#666666")
      jsPdfDoc.setFontSize(10)
      jsPdfDoc.setFont("helvetica", "normal")
      jsPdfDoc.text(label, x, y)

      // Formater le montant
      const formattedAmount = amount
        ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
            amount,
          )
        : "Non renseigné"

      jsPdfDoc.setTextColor(accentColor)
      jsPdfDoc.setFontSize(12)
      jsPdfDoc.setFont("helvetica", "bold")
      jsPdfDoc.text(formattedAmount, x, y + 5)

      return y + 10
    }

    // Fonction pour ajouter une carte de document
    const addDocumentCard = (name: string, type: string, x: number, y: number, width: number) => {
      const cardHeight = 25

      // Fond de la carte
      jsPdfDoc.setFillColor("#F3F4F6")
      jsPdfDoc.roundedRect(x, y, width, cardHeight, 2, 2, "F")

      // Icône selon le type
      jsPdfDoc.setFillColor(primaryColor)
      if (type === "pdf") {
        // Icône PDF
        jsPdfDoc.rect(x + 5, y + 5, 15, 15, "F")
        jsPdfDoc.setTextColor("#FFFFFF")
        jsPdfDoc.setFontSize(8)
        jsPdfDoc.setFont("helvetica", "bold")
        jsPdfDoc.text("PDF", x + 8, y + 14)
      } else {
        // Icône image
        jsPdfDoc.circle(x + 12, y + 12, 7, "F")
        jsPdfDoc.setTextColor("#FFFFFF")
        jsPdfDoc.setFontSize(8)
        jsPdfDoc.setFont("helvetica", "bold")
        jsPdfDoc.text("IMG", x + 5, y + 14)
      }

      // Nom du document
      jsPdfDoc.setTextColor("#000000")
      jsPdfDoc.setFontSize(10)
      jsPdfDoc.setFont("helvetica", "normal")
      jsPdfDoc.text(name, x + 25, y + 15)

      return y + cardHeight + 5
    }

    // DÉBUT DE LA GÉNÉRATION DU PDF

    // Page de couverture
    yPosition = addPageHeader("DOSSIER DE LOCATION NUMÉRIQUE")

    // Informations de génération
    jsPdfDoc.setTextColor("#666666")
    jsPdfDoc.setFontSize(10)
    jsPdfDoc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, margin, yPosition)
    yPosition += 15

    // Image de couverture (placeholder)
    const coverImageY = yPosition
    const coverImageHeight = 100
    jsPdfDoc.setFillColor("#E5E7EB")
    jsPdfDoc.roundedRect(margin, coverImageY, pageWidth - 2 * margin, coverImageHeight, 3, 3, "F")

    jsPdfDoc.setTextColor("#9CA3AF")
    jsPdfDoc.setFontSize(14)
    jsPdfDoc.setFont("helvetica", "bold")
    jsPdfDoc.text("DOSSIER DE LOCATION", pageWidth / 2, coverImageY + coverImageHeight / 2 - 10, { align: "center" })
    jsPdfDoc.setFontSize(12)
    jsPdfDoc.text("Image de couverture", pageWidth / 2, coverImageY + coverImageHeight / 2 + 10, { align: "center" })

    yPosition = coverImageY + coverImageHeight + 20

    // Informations principales
    const mainTenant = rentalFile.main_tenant || {}
    const tenantName = `${mainTenant.first_name || ""} ${mainTenant.last_name || ""}`.trim() || "Locataire"

    jsPdfDoc.setTextColor("#000000")
    jsPdfDoc.setFontSize(20)
    jsPdfDoc.setFont("helvetica", "bold")
    jsPdfDoc.text(tenantName, pageWidth / 2, yPosition, { align: "center" })

    yPosition += 15

    // Statut du dossier
    const statusText = rentalFile.status === "completed" ? "Dossier complet" : "Dossier en cours"
    const statusColor = rentalFile.status === "completed" ? "#10B981" : "#F59E0B"

    jsPdfDoc.setFillColor(statusColor)
    jsPdfDoc.roundedRect(pageWidth / 2 - 40, yPosition, 80, 20, 10, 10, "F")

    jsPdfDoc.setTextColor("#FFFFFF")
    jsPdfDoc.setFontSize(12)
    jsPdfDoc.setFont("helvetica", "bold")
    jsPdfDoc.text(statusText, pageWidth / 2, yPosition + 13, { align: "center" })

    yPosition += 40

    // Informations complémentaires
    jsPdfDoc.setTextColor("#666666")
    jsPdfDoc.setFontSize(12)

    const situationText =
      rentalFile.rental_situation === "alone"
        ? "Location individuelle"
        : rentalFile.rental_situation === "couple"
          ? "Location en couple"
          : "Colocation"

    jsPdfDoc.text(`Situation: ${situationText}`, margin, yPosition)
    yPosition += 10

    const guarantorsCount = rentalFile.guarantors?.length || 0
    jsPdfDoc.text(`Garant(s): ${guarantorsCount}`, margin, yPosition)
    yPosition += 10

    const completionText = `Complétude: ${rentalFile.completion_percentage || 100}%`
    jsPdfDoc.text(completionText, margin, yPosition)

    // Table des matières
    jsPdfDoc.addPage()
    yPosition = addPageHeader("TABLE DES MATIÈRES")

    const sections = [
      { title: "1. Informations générales", page: 3 },
      { title: "2. Locataire principal", page: 4 },
    ]

    let sectionIndex = 3

    if (rentalFile.cotenants && rentalFile.cotenants.length > 0) {
      sections.push({
        title: `${sectionIndex}. ${rentalFile.rental_situation === "couple" ? "Conjoint(e)" : "Colocataires"}`,
        page: sections[sections.length - 1].page + 1,
      })
      sectionIndex++
    }

    if (rentalFile.guarantors && rentalFile.guarantors.length > 0) {
      sections.push({
        title: `${sectionIndex}. Garants`,
        page: sections[sections.length - 1].page + 1,
      })
      sectionIndex++
    }

    sections.push({
      title: `${sectionIndex}. Annexes - Pièces justificatives`,
      page: sections[sections.length - 1].page + 1,
    })

    // Afficher la table des matières
    jsPdfDoc.setDrawColor(primaryColor)

    sections.forEach((section, index) => {
      // Ligne pointillée
      const dotCount = 50
      const startX = margin + 100
      const endX = pageWidth - margin - 20
      const dotSpacing = (endX - startX) / dotCount

      jsPdfDoc.setTextColor("#000000")
      jsPdfDoc.setFontSize(12)
      jsPdfDoc.setFont("helvetica", index === 0 ? "bold" : "normal")
      jsPdfDoc.text(section.title, margin, yPosition)

      // Points de conduite
      for (let i = 0; i < dotCount; i++) {
        const x = startX + i * dotSpacing
        jsPdfDoc.setFillColor("#CCCCCC")
        jsPdfDoc.circle(x, yPosition - 2, 0.5, "F")
      }

      // Numéro de page
      jsPdfDoc.setTextColor(primaryColor)
      jsPdfDoc.setFont("helvetica", "bold")
      jsPdfDoc.text(section.page.toString(), pageWidth - margin, yPosition, { align: "right" })

      yPosition += 15
    })

    // Informations générales
    jsPdfDoc.addPage()
    yPosition = addPageHeader("INFORMATIONS GÉNÉRALES")

    yPosition = addSectionWithIcon("SITUATION DE LOCATION", yPosition, "info")

    // Afficher les informations générales
    yPosition = addProperty("Type de location", situationText, margin, yPosition)
    yPosition = addProperty("Statut du dossier", statusText, margin, yPosition, {
      valueColor: statusColor,
      valueStyle: "bold",
    })
    yPosition = addProperty("Complétude", `${rentalFile.completion_percentage || 100}%`, margin, yPosition)

    // Locataire principal
    jsPdfDoc.addPage()
    yPosition = addPageHeader("LOCATAIRE PRINCIPAL")

    if (mainTenant) {
      // Informations personnelles
      yPosition = addSectionWithIcon("INFORMATIONS PERSONNELLES", yPosition, "person")

      const colWidth = (pageWidth - 2 * margin) / 2
      const col2X = margin + colWidth + 10

      let col1Y = yPosition
      let col2Y = yPosition

      col1Y = addProperty("Nom", mainTenant.last_name || "", margin, col1Y)
      col2Y = addProperty("Prénom", mainTenant.first_name || "", col2X, col2Y)

      col1Y = addProperty("Date de naissance", mainTenant.birth_date || "", margin, col1Y)
      col2Y = addProperty("Lieu de naissance", mainTenant.birth_place || "", col2X, col2Y)

      col1Y = addProperty("Nationalité", mainTenant.nationality || "", margin, col1Y)
      col2Y = addProperty("Situation logement actuelle", mainTenant.current_housing_situation || "", col2X, col2Y)

      yPosition = Math.max(col1Y, col2Y) + 10

      // Situation professionnelle
      yPosition = addSectionWithIcon("SITUATION PROFESSIONNELLE", yPosition, "info")

      const activity = MAIN_ACTIVITIES.find((a) => a.value === mainTenant.main_activity)
      yPosition = addProperty(
        "Activité principale",
        activity?.label || mainTenant.main_activity || "",
        margin,
        yPosition,
      )

      if (mainTenant.income_sources?.work_income?.type) {
        yPosition = addProperty("Type de revenus", mainTenant.income_sources.work_income.type, margin, yPosition)
      }

      // Revenus
      yPosition = addSectionWithIcon("REVENUS", yPosition, "info")

      if (mainTenant.income_sources?.work_income) {
        yPosition = addAmount(
          "Revenus du travail (mensuel)",
          mainTenant.income_sources.work_income.amount || 0,
          margin,
          yPosition,
        )
      }
    }

    // Garants
    if (rentalFile.guarantors && rentalFile.guarantors.length > 0) {
      jsPdfDoc.addPage()
      yPosition = addPageHeader("GARANTS")

      rentalFile.guarantors.forEach((guarantor: any, index: number) => {
        yPosition = addSectionWithIcon(`GARANT ${index + 1}`, yPosition, "person")

        yPosition = addProperty(
          "Type",
          guarantor.type === "physical" ? "Personne physique" : "Personne morale",
          margin,
          yPosition,
        )

        if (guarantor.personal_info) {
          const guarantorInfo = guarantor.personal_info
          const colWidth = (pageWidth - 2 * margin) / 2
          const col2X = margin + colWidth + 10

          let col1Y = yPosition
          let col2Y = yPosition

          col1Y = addProperty("Nom", guarantorInfo.last_name || "", margin, col1Y)
          col2Y = addProperty("Prénom", guarantorInfo.first_name || "", col2X, col2Y)

          if (guarantorInfo.birth_date) {
            col1Y = addProperty("Date de naissance", guarantorInfo.birth_date, margin, col1Y)
          }

          if (guarantorInfo.nationality) {
            col2Y = addProperty("Nationalité", guarantorInfo.nationality, col2X, col2Y)
          }

          yPosition = Math.max(col1Y, col2Y) + 5

          if (guarantorInfo.income_sources?.work_income) {
            yPosition = addAmount(
              "Revenus du travail (mensuel)",
              guarantorInfo.income_sources.work_income.amount || 0,
              margin,
              yPosition,
            )
          }
        }

        yPosition += 15
      })
    }

    // Collecter tous les documents valides (URLs Supabase)
    const documentsToAdd = []

    if (mainTenant) {
      // Documents d'identité
      if (mainTenant.identity_documents && Array.isArray(mainTenant.identity_documents)) {
        for (const [index, doc] of mainTenant.identity_documents.entries()) {
          if (isValidDocumentUrl(doc)) {
            documentsToAdd.push({
              url: doc,
              name: `Pièce d'identité du locataire ${index + 1}`,
              category: "identity",
            })
          }
        }
      }

      // Documents d'activité
      if (mainTenant.activity_documents && Array.isArray(mainTenant.activity_documents)) {
        for (const [index, doc] of mainTenant.activity_documents.entries()) {
          if (isValidDocumentUrl(doc)) {
            documentsToAdd.push({
              url: doc,
              name: `Justificatif d'activité ${index + 1}`,
              category: "activity",
            })
          }
        }
      }

      // Documents fiscaux
      if (mainTenant.tax_situation?.documents && Array.isArray(mainTenant.tax_situation.documents)) {
        for (const [index, doc] of mainTenant.tax_situation.documents.entries()) {
          if (isValidDocumentUrl(doc)) {
            documentsToAdd.push({
              url: doc,
              name: `Document fiscal ${index + 1}`,
              category: "tax",
            })
          }
        }
      }

      // Documents de revenus
      if (
        mainTenant.income_sources?.work_income?.documents &&
        Array.isArray(mainTenant.income_sources.work_income.documents)
      ) {
        for (const [index, doc] of mainTenant.income_sources.work_income.documents.entries()) {
          if (isValidDocumentUrl(doc)) {
            documentsToAdd.push({
              url: doc,
              name: `Justificatif de revenu ${index + 1}`,
              category: "income",
            })
          }
        }
      }

      // Documents de logement
      if (
        mainTenant.current_housing_documents?.quittances_loyer &&
        Array.isArray(mainTenant.current_housing_documents.quittances_loyer)
      ) {
        for (const [index, doc] of mainTenant.current_housing_documents.quittances_loyer.entries()) {
          if (isValidDocumentUrl(doc)) {
            documentsToAdd.push({
              url: doc,
              name: `Quittance de loyer ${index + 1}`,
              category: "housing",
            })
          }
        }
      }
    }

    // Documents des garants
    if (rentalFile.guarantors && Array.isArray(rentalFile.guarantors)) {
      for (const [gIndex, guarantor] of rentalFile.guarantors.entries()) {
        // Documents d'identité des garants
        if (
          guarantor.type === "physical" &&
          guarantor.personal_info?.identity_documents &&
          Array.isArray(guarantor.personal_info.identity_documents)
        ) {
          for (const [index, doc] of guarantor.personal_info.identity_documents.entries()) {
            if (isValidDocumentUrl(doc)) {
              documentsToAdd.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Pièce d'identité ${index + 1}`,
                category: "guarantor_identity",
              })
            }
          }
        }

        // Documents de revenus des garants
        if (
          guarantor.type === "physical" &&
          guarantor.personal_info?.income_sources?.work_income?.documents &&
          Array.isArray(guarantor.personal_info.income_sources.work_income.documents)
        ) {
          for (const [index, doc] of guarantor.personal_info.income_sources.work_income.documents.entries()) {
            if (isValidDocumentUrl(doc)) {
              documentsToAdd.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Justificatif de revenu ${index + 1}`,
                category: "guarantor_income",
              })
            }
          }
        }

        // Documents fiscaux des garants
        if (
          guarantor.type === "physical" &&
          guarantor.personal_info?.tax_situation?.documents &&
          Array.isArray(guarantor.personal_info.tax_situation.documents)
        ) {
          for (const [index, doc] of guarantor.personal_info.tax_situation.documents.entries()) {
            if (isValidDocumentUrl(doc)) {
              documentsToAdd.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Document fiscal ${index + 1}`,
                category: "guarantor_tax",
              })
            }
          }
        }
      }
    }

    console.log(`📋 ${documentsToAdd.length} documents valides à traiter`)

    // Traiter tous les documents (images et PDF)
    for (const document of documentsToAdd) {
      await addDocumentToPDF(document.url, document.name, document.category)
    }

    // Page d'annexes
    jsPdfDoc.addPage()
    yPosition = addPageHeader("ANNEXES - PIÈCES JUSTIFICATIVES")

    // Afficher la liste des documents
    if (allDocuments.length > 0) {
      // Regrouper par catégorie
      const documentsByCategory = {
        identity: { title: "Pièces d'identité", docs: [] },
        activity: { title: "Justificatifs d'activité", docs: [] },
        income: { title: "Justificatifs de revenus", docs: [] },
        tax: { title: "Documents fiscaux", docs: [] },
        housing: { title: "Quittances de loyer", docs: [] },
        guarantor_identity: { title: "Pièces d'identité des garants", docs: [] },
        guarantor_income: { title: "Justificatifs de revenus des garants", docs: [] },
        guarantor_tax: { title: "Documents fiscaux des garants", docs: [] },
        other: { title: "Autres documents", docs: [] },
      }

      // Classer les documents par catégorie
      allDocuments.forEach((doc) => {
        const category = doc.category || "other"
        if (documentsByCategory[category]) {
          documentsByCategory[category].docs.push(doc)
        } else {
          documentsByCategory.other.docs.push(doc)
        }
      })

      // Afficher les documents par catégorie
      Object.values(documentsByCategory).forEach((category) => {
        if (category.docs.length > 0) {
          yPosition = addSectionWithIcon(category.title, yPosition, "document")

          // Afficher les documents de cette catégorie
          category.docs.forEach((docItem) => {
            yPosition = addDocumentCard(docItem.name, docItem.type, margin, yPosition, pageWidth - 2 * margin)

            // Ajouter une page si nécessaire
            if (yPosition > pageHeight - 40) {
              jsPdfDoc.addPage()
              yPosition = addPageHeader("ANNEXES - PIÈCES JUSTIFICATIVES (SUITE)")
            }
          })

          yPosition += 10
        }
      })

      // Ajouter une note sur les annexes
      jsPdfDoc.setTextColor("#666666")
      jsPdfDoc.setFontSize(10)
      jsPdfDoc.setFont("helvetica", "italic")
      jsPdfDoc.text("Note: Les documents listés ci-dessus sont intégrés dans les pages suivantes.", margin, yPosition)
    } else {
      jsPdfDoc.setTextColor("#666666")
      jsPdfDoc.setFontSize(12)
      jsPdfDoc.text("Aucune pièce justificative n'a été fournie.", margin, yPosition)
    }

    // MAINTENANT LE MERGE FINAL DES PDF !
    if (pdfsToMerge.length > 0 || allDocuments.some((doc) => doc.type === "image")) {
      console.log(
        `🔄 Préparation du PDF final avec ${pdfsToMerge.length} PDF(s) et ${allDocuments.filter((d) => d.type === "image").length} image(s)...`,
      )

      try {
        // Convertir le PDF jsPDF en ArrayBuffer
        const jsPdfOutput = jsPdfDoc.output("arraybuffer")

        // Charger le PDF principal avec pdf-lib
        const mainPdfDoc = await PDFDocument.load(jsPdfOutput)

        // Ajouter une page de séparation pour les annexes
        const annexPage = mainPdfDoc.addPage()

        // Dessiner un fond coloré en haut
        const { width, height } = annexPage.getSize()
        annexPage.drawRectangle({
          x: 0,
          y: height - 100,
          width: width,
          height: 100,
          color: { r: 0.23, g: 0.51, b: 0.97 }, // Bleu primaire
        })

        // Ajouter le texte
        annexPage.drawText("ANNEXES", {
          x: 50,
          y: height - 60,
          size: 30,
          color: { r: 1, g: 1, b: 1 }, // Blanc
        })

        annexPage.drawText("Pièces justificatives", {
          x: 50,
          y: height - 90,
          size: 16,
          color: { r: 1, g: 1, b: 1 }, // Blanc
        })

        // Ajouter les images
        for (const docItem of allDocuments) {
          if (docItem.type === "image" && docItem.data) {
            try {
              console.log(`📄 Ajout de l'image: ${docItem.name}...`)

              // Ajouter une page pour l'image
              const imagePage = mainPdfDoc.addPage()
              const { width, height } = imagePage.getSize()

              // Dessiner un en-tête
              imagePage.drawRectangle({
                x: 0,
                y: height - 40,
                width: width,
                height: 40,
                color: { r: 0.23, g: 0.51, b: 0.97 }, // Bleu primaire
              })

              // Ajouter le nom du document
              imagePage.drawText(docItem.name, {
                x: 50,
                y: height - 25,
                size: 12,
                color: { r: 1, g: 1, b: 1 }, // Blanc
              })

              // Convertir l'image base64 en format compatible avec pdf-lib
              const base64Data = docItem.data.split(",")[1]
              const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))

              // Déterminer le type d'image
              let pdfImage
              if (docItem.data.includes("image/jpeg") || docItem.data.includes("image/jpg")) {
                pdfImage = await mainPdfDoc.embedJpg(imageBytes)
              } else if (docItem.data.includes("image/png")) {
                pdfImage = await mainPdfDoc.embedPng(imageBytes)
              } else {
                // Fallback pour les autres types
                pdfImage = await mainPdfDoc.embedJpg(imageBytes)
              }

              // Calculer les dimensions pour ajuster l'image à la page
              const imgWidth = pdfImage.width
              const imgHeight = pdfImage.height

              const availableWidth = width - 100
              const availableHeight = height - 100

              let finalWidth = availableWidth
              let finalHeight = (imgHeight * availableWidth) / imgWidth

              if (finalHeight > availableHeight) {
                finalHeight = availableHeight
                finalWidth = (imgWidth * availableHeight) / imgHeight
              }

              // Centrer l'image
              const xPos = (width - finalWidth) / 2
              const yPos = (height - finalHeight) / 2

              // Dessiner l'image
              imagePage.drawImage(pdfImage, {
                x: xPos,
                y: yPos,
                width: finalWidth,
                height: finalHeight,
              })

              console.log(`✅ Image ajoutée: ${docItem.name}`)
            } catch (imageError) {
              console.error(`❌ Erreur ajout image ${docItem.name}:`, imageError)
            }
          }
        }

        // Merger chaque PDF
        for (const pdfToMerge of pdfsToMerge) {
          try {
            console.log(`📄 Merge de ${pdfToMerge.name}...`)

            // Ajouter une page de séparation pour ce PDF
            const pdfSeparatorPage = mainPdfDoc.addPage()
            const { width, height } = pdfSeparatorPage.getSize()

            // Dessiner un en-tête
            pdfSeparatorPage.drawRectangle({
              x: 0,
              y: height - 40,
              width: width,
              height: 40,
              color: { r: 0.23, g: 0.51, b: 0.97 }, // Bleu primaire
            })

            // Ajouter le nom du document
            pdfSeparatorPage.drawText(pdfToMerge.name, {
              x: 50,
              y: height - 25,
              size: 12,
              color: { r: 1, g: 1, b: 1 }, // Blanc
            })

            // Ajouter le nombre de pages
            pdfSeparatorPage.drawText(`Document PDF - ${pdfToMerge.pageCount} page(s)`, {
              x: 50,
              y: height - 100,
              size: 14,
              color: { r: 0, g: 0, b: 0 }, // Noir
            })

            const sourcePdfDoc = await PDFDocument.load(pdfToMerge.data)
            const pageIndices = Array.from({ length: pdfToMerge.pageCount }, (_, i) => i)
            const copiedPages = await mainPdfDoc.copyPages(sourcePdfDoc, pageIndices)

            copiedPages.forEach((page) => {
              mainPdfDoc.addPage(page)
            })

            console.log(`✅ ${pdfToMerge.name} mergé (${pdfToMerge.pageCount} pages)`)
          } catch (mergeError) {
            console.error(`❌ Erreur merge ${pdfToMerge.name}:`, mergeError)
          }
        }

        // Sauvegarder le PDF final
        const finalPdfBytes = await mainPdfDoc.save()

        // Télécharger le PDF final
        const fileName = `dossier-location-${mainTenant?.first_name || "locataire"}-${mainTenant?.last_name || ""}.pdf`

        const blob = new Blob([finalPdfBytes], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)

        console.log(
          `🎉 PDF final généré avec ${pdfsToMerge.length} PDF(s) et ${allDocuments.filter((d) => d.type === "image").length} image(s) intégré(s) !`,
        )
      } catch (mergeError) {
        console.error("❌ Erreur lors du merge final:", mergeError)

        // Fallback : télécharger le PDF sans les PDF mergés
        const fileName = `dossier-location-${mainTenant?.first_name || "locataire"}-${mainTenant?.last_name || ""}.pdf`
        jsPdfDoc.save(fileName)
      }
    } else {
      // Pas de PDF à merger, télécharger normalement
      const fileName = `dossier-location-${mainTenant?.first_name || "locataire"}-${mainTenant?.last_name || ""}.pdf`
      jsPdfDoc.save(fileName)
    }
  } catch (error) {
    console.error("❌ Erreur génération PDF:", error)
    throw error
  }
}

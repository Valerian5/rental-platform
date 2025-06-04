import { type RentalFileData, MAIN_ACTIVITIES } from "./rental-file-service"

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

    // Couleurs de la charte graphique
    const primaryColor = [59, 130, 246] // Bleu principal RGB
    const secondaryColor = [30, 64, 175] // Bleu foncé RGB
    const accentColor = [16, 185, 129] // Vert pour les montants RGB
    const grayColor = [107, 114, 128] // Gris pour les labels

    // Stocker les PDF à merger à la fin
    const pdfsToMerge = []
    const imagesToAdd = []

    // Fonction helper pour formater les montants
    const formatAmount = (amount: number): string => {
      if (!amount || amount === 0) return "Non renseigné"
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(amount)
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

    // Fonction pour ajouter le logo
    const addLogo = async (x: number, y: number, size = 25, logoUrl?: string) => {
      if (logoUrl && logoUrl !== "DOCUMENT_MIGRE_PLACEHOLDER") {
        try {
          // Charger l'image du logo
          const response = await fetch(logoUrl)
          if (response.ok) {
            const blob = await response.blob()
            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(blob)
            })

            // Ajouter l'image au PDF
            const imgFormat = logoUrl.toLowerCase().includes(".png") ? "PNG" : "JPEG"
            doc.addImage(base64Data, imgFormat, x, y, size, size * 0.6) // Ratio 5:3 pour les logos
            return
          }
        } catch (error) {
          console.error("Erreur chargement logo:", error)
        }
      }

      // Fallback : logo simple
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.circle(x + size / 2, y + size / 2, size / 2, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("L", x + size / 2 - 3, y + size / 2 + 4)
    }

    // Fonction pour ajouter un en-tête de page
    const addPageHeader = async (title: string): Promise<number> => {
      // Fond bleu
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.rect(0, 0, pageWidth, 35, "F")

      // Logo (utiliser le logo PDF s'il existe)
      await addLogo(pageWidth - margin - 30, 5, 25, logos.pdf || logos.main)

      // Titre
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(title, margin, 22)

      // Sous-titre avec le nom du site
      doc.setFontSize(10)
      doc.text(siteInfo.title || "Louer Ici", margin, 30)

      // Ligne de séparation
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setLineWidth(2)
      doc.line(0, 35, pageWidth, 35)

      return 45 // Position Y après l'en-tête
    }

    // Fonction pour ajouter une section avec icône simple
    const addSectionWithIcon = (title: string, y: number): number => {
      // Icône simple (carré coloré)
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.rect(margin, y - 3, 6, 6, "F")

      // Titre de section
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(title, margin + 12, y + 2)

      // Ligne de séparation
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setLineWidth(0.5)
      doc.line(margin, y + 8, pageWidth - margin, y + 8)

      return y + 18
    }

    // Fonction pour ajouter une propriété
    const addProperty = async (
      label: string,
      value: string,
      x: number,
      y: number,
      options: any = {},
    ): Promise<number> => {
      // Vérifier si on dépasse la page
      if (y > pageHeight - 40) {
        doc.addPage()
        y = await addPageHeader("DOSSIER DE LOCATION (SUITE)")
      }

      // Label
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text(label, x, y)

      // Valeur
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(11)
      doc.setFont("helvetica", options.bold ? "bold" : "normal")

      const displayValue = value || "Non renseigné"
      doc.text(displayValue, x, y + 8)

      return y + 18
    }

    // Fonction pour ajouter un montant
    const addAmount = (label: string, amount: number, x: number, y: number): number => {
      // Vérifier si on dépasse la page
      if (y > pageHeight - 40) {
        doc.addPage()
        y = await addPageHeader("DOSSIER DE LOCATION (SUITE)")
      }

      // Label
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text(label, x, y)

      // Montant
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2])
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(formatAmount(amount), x, y + 8)

      return y + 18
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
          // Traiter le PDF
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
          // Traiter l'image
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

    // PAGE DE COUVERTURE SIMPLIFIÉE
    yPosition = await addPageHeader("DOSSIER DE LOCATION NUMÉRIQUE")

    // Logo principal centré (si disponible)
    if (logos.main) {
      try {
        const response = await fetch(logos.main)
        if (response.ok) {
          const blob = await response.blob()
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })

          const imgFormat = logos.main.toLowerCase().includes(".png") ? "PNG" : "JPEG"
          doc.addImage(base64Data, imgFormat, (pageWidth - 60) / 2, yPosition, 60, 36) // Logo centré
          yPosition += 50
        }
      } catch (error) {
        console.error("Erreur chargement logo principal:", error)
        yPosition += 20
      }
    } else {
      yPosition += 20
    }

    // Nom du site
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    const siteTitleWidth = doc.getTextWidth(siteInfo.title || "Louer Ici")
    doc.text(siteInfo.title || "Louer Ici", (pageWidth - siteTitleWidth) / 2, yPosition)

    yPosition += 15

    // Description du site
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    const descWidth = doc.getTextWidth(siteInfo.description || "Plateforme de gestion locative intelligente")
    doc.text(
      siteInfo.description || "Plateforme de gestion locative intelligente",
      (pageWidth - descWidth) / 2,
      yPosition,
    )

    yPosition += 30

    // Nom du locataire (centré et grand)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    const nameWidth = doc.getTextWidth(tenantName)
    doc.text(tenantName, (pageWidth - nameWidth) / 2, yPosition)

    yPosition += 30

    // Synthèse du dossier
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("SYNTHÈSE DU DOSSIER", pageWidth / 2, yPosition, { align: "center" })

    yPosition += 20

    // Informations de synthèse
    const synthese = []

    // Type de location
    if (rentalFile.rental_situation === "alone") {
      synthese.push("• Location individuelle")
    } else if (rentalFile.rental_situation === "couple") {
      synthese.push("• Location en couple")
    } else {
      synthese.push("• Colocation")
    }

    // Colocataires/conjoint
    if (rentalFile.cotenants && rentalFile.cotenants.length > 0) {
      if (rentalFile.rental_situation === "couple") {
        synthese.push(`• Avec conjoint(e)`)
      } else {
        synthese.push(`• ${rentalFile.cotenants.length} colocataire(s)`)
      }
    }

    // Garants
    const guarantorsCount = rentalFile.guarantors?.length || 0
    if (guarantorsCount > 0) {
      synthese.push(`• ${guarantorsCount} garant(s)`)
    } else {
      synthese.push("• Aucun garant")
    }

    // Revenus
    const income = mainTenant.income_sources?.work_income?.amount || 0
    if (income > 0) {
      synthese.push(`• Revenus: ${formatAmount(income)}`)
    }

    // Afficher la synthèse
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")

    synthese.forEach((item) => {
      doc.text(item, pageWidth / 2, yPosition, { align: "center" })
      yPosition += 12
    })

    yPosition += 20

    // Date de génération
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.setFontSize(10)
    doc.text(`Document généré le ${new Date().toLocaleDateString("fr-FR")}`, pageWidth / 2, yPosition, {
      align: "center",
    })

    // PAGE LOCATAIRE PRINCIPAL
    doc.addPage()
    yPosition = await addPageHeader("LOCATAIRE PRINCIPAL")

    if (mainTenant) {
      // Informations personnelles
      yPosition = addSectionWithIcon("INFORMATIONS PERSONNELLES", yPosition)

      const colWidth = (pageWidth - 2 * margin - 20) / 2
      const col2X = margin + colWidth + 20

      let col1Y = yPosition
      let col2Y = yPosition

      col1Y = addProperty("Nom", mainTenant.last_name || "", margin, col1Y)
      col2Y = addProperty("Prénom", mainTenant.first_name || "", col2X, col2Y)

      col1Y = addProperty("Date de naissance", mainTenant.birth_date || "", margin, col1Y)
      col2Y = addProperty("Lieu de naissance", mainTenant.birth_place || "", col2X, col2Y)

      col1Y = addProperty("Nationalité", mainTenant.nationality || "", margin, col1Y)
      col2Y = addProperty("Situation logement", mainTenant.current_housing_situation || "", col2X, col2Y)

      yPosition = Math.max(col1Y, col2Y) + 10

      // Situation professionnelle
      yPosition = addSectionWithIcon("SITUATION PROFESSIONNELLE", yPosition)

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

      yPosition += 10

      // Revenus (section séparée pour éviter les chevauchements)
      yPosition = addSectionWithIcon("REVENUS", yPosition)

      if (mainTenant.income_sources?.work_income?.amount) {
        yPosition = addAmount(
          "Revenus du travail (mensuel)",
          mainTenant.income_sources.work_income.amount,
          margin,
          yPosition,
        )
      }

      // Autres revenus si présents
      if (mainTenant.income_sources?.social_aid && mainTenant.income_sources.social_aid.length > 0) {
        mainTenant.income_sources.social_aid.forEach((aid: any, index: number) => {
          if (aid.amount) {
            yPosition = addAmount(`Aide sociale ${index + 1}`, aid.amount, margin, yPosition)
          }
        })
      }
    }

    // PAGES GARANTS (même mise en forme que locataire principal)
    if (rentalFile.guarantors && rentalFile.guarantors.length > 0) {
      rentalFile.guarantors.forEach((guarantor: any, index: number) => {
        doc.addPage()
        yPosition = await addPageHeader(`GARANT ${index + 1}`)

        yPosition = addSectionWithIcon("TYPE DE GARANT", yPosition)
        yPosition = addProperty(
          "Type",
          guarantor.type === "physical" ? "Personne physique" : "Personne morale",
          margin,
          yPosition,
          { bold: true },
        )

        if (guarantor.personal_info) {
          const guarantorInfo = guarantor.personal_info

          yPosition += 10
          yPosition = addSectionWithIcon("INFORMATIONS PERSONNELLES", yPosition)

          const colWidth = (pageWidth - 2 * margin - 20) / 2
          const col2X = margin + colWidth + 20

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

          if (guarantorInfo.current_housing_situation) {
            col1Y = addProperty("Situation logement", guarantorInfo.current_housing_situation, margin, col1Y)
          }

          yPosition = Math.max(col1Y, col2Y) + 10

          // Situation professionnelle du garant
          if (guarantorInfo.main_activity) {
            yPosition = addSectionWithIcon("SITUATION PROFESSIONNELLE", yPosition)
            const guarantorActivity = MAIN_ACTIVITIES.find((a) => a.value === guarantorInfo.main_activity)
            yPosition = addProperty(
              "Activité principale",
              guarantorActivity?.label || guarantorInfo.main_activity,
              margin,
              yPosition,
            )
          }

          // Revenus du garant
          if (guarantorInfo.income_sources?.work_income?.amount) {
            yPosition += 10
            yPosition = addSectionWithIcon("REVENUS", yPosition)
            yPosition = addAmount(
              "Revenus du travail (mensuel)",
              guarantorInfo.income_sources.work_income.amount,
              margin,
              yPosition,
            )
          }
        }
      })
    }

    // COLLECTE DES DOCUMENTS
    const documentsToProcess = []

    // Documents du locataire principal
    if (mainTenant) {
      // Documents d'identité
      if (mainTenant.identity_documents && Array.isArray(mainTenant.identity_documents)) {
        mainTenant.identity_documents.forEach((doc, index) => {
          documentsToProcess.push({
            url: doc,
            name: `Pièce d'identité locataire ${index + 1}`,
            category: "identity",
          })
        })
      }

      // Documents d'activité
      if (mainTenant.activity_documents && Array.isArray(mainTenant.activity_documents)) {
        mainTenant.activity_documents.forEach((doc, index) => {
          documentsToProcess.push({
            url: doc,
            name: `Justificatif d'activité ${index + 1}`,
            category: "activity",
          })
        })
      }

      // Documents de revenus
      if (
        mainTenant.income_sources?.work_income?.documents &&
        Array.isArray(mainTenant.income_sources.work_income.documents)
      ) {
        mainTenant.income_sources.work_income.documents.forEach((doc, index) => {
          documentsToProcess.push({
            url: doc,
            name: `Justificatif de revenu ${index + 1}`,
            category: "income",
          })
        })
      }

      // Documents fiscaux
      if (mainTenant.tax_situation?.documents && Array.isArray(mainTenant.tax_situation.documents)) {
        mainTenant.tax_situation.documents.forEach((doc, index) => {
          documentsToProcess.push({
            url: doc,
            name: `Document fiscal ${index + 1}`,
            category: "tax",
          })
        })
      }

      // Quittances de loyer
      if (
        mainTenant.current_housing_documents?.quittances_loyer &&
        Array.isArray(mainTenant.current_housing_documents.quittances_loyer)
      ) {
        mainTenant.current_housing_documents.quittances_loyer.forEach((doc, index) => {
          documentsToProcess.push({
            url: doc,
            name: `Quittance de loyer ${index + 1}`,
            category: "housing",
          })
        })
      }
    }

    // Documents des garants
    if (rentalFile.guarantors && Array.isArray(rentalFile.guarantors)) {
      rentalFile.guarantors.forEach((guarantor, gIndex) => {
        if (guarantor.type === "physical" && guarantor.personal_info) {
          // Documents d'identité des garants
          if (guarantor.personal_info.identity_documents && Array.isArray(guarantor.personal_info.identity_documents)) {
            guarantor.personal_info.identity_documents.forEach((doc, index) => {
              documentsToProcess.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Pièce d'identité ${index + 1}`,
                category: "guarantor_identity",
              })
            })
          }

          // Documents de revenus des garants
          if (
            guarantor.personal_info.income_sources?.work_income?.documents &&
            Array.isArray(guarantor.personal_info.income_sources.work_income.documents)
          ) {
            guarantor.personal_info.income_sources.work_income.documents.forEach((doc, index) => {
              documentsToProcess.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Justificatif de revenu ${index + 1}`,
                category: "guarantor_income",
              })
            })
          }

          // Documents fiscaux des garants
          if (
            guarantor.personal_info.tax_situation?.documents &&
            Array.isArray(guarantor.personal_info.tax_situation.documents)
          ) {
            guarantor.personal_info.tax_situation.documents.forEach((doc, index) => {
              documentsToProcess.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Document fiscal ${index + 1}`,
                category: "guarantor_tax",
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

    // PAGE ANNEXES SIMPLIFIÉE
    if (pdfsToMerge.length > 0 || imagesToAdd.length > 0) {
      doc.addPage()
      yPosition = await addPageHeader("ANNEXES - PIÈCES JUSTIFICATIVES")

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text("Les pièces justificatives suivantes sont intégrées dans ce document :", margin, yPosition)

      yPosition += 20

      // Liste simplifiée des documents
      let docCount = 1

      pdfsToMerge.forEach((pdf) => {
        doc.setFontSize(10)
        doc.text(`${docCount}. ${pdf.name} (${pdf.pageCount} page(s))`, margin + 10, yPosition)
        yPosition += 8
        docCount++
      })

      imagesToAdd.forEach((img) => {
        doc.setFontSize(10)
        doc.text(`${docCount}. ${img.name} (image)`, margin + 10, yPosition)
        yPosition += 8
        docCount++
      })

      if (docCount === 1) {
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
        doc.text("Aucune pièce justificative fournie.", margin, yPosition)
      }
    }

    // MERGE FINAL
    console.log(`🔄 Préparation du PDF final avec ${pdfsToMerge.length} PDF(s) et ${imagesToAdd.length} image(s)...`)

    try {
      // Convertir le PDF jsPDF en ArrayBuffer
      const jsPdfOutput = doc.output("arraybuffer")
      const mainPdfDoc = await PDFDocument.load(jsPdfOutput)

      // Ajouter les images
      for (const imageItem of imagesToAdd) {
        try {
          console.log(`🖼️ Ajout de l'image: ${imageItem.name}`)

          const imagePage = mainPdfDoc.addPage()
          const { width, height } = imagePage.getSize()

          // En-tête de page pour l'image
          imagePage.drawRectangle({
            x: 0,
            y: height - 40,
            width: width,
            height: 40,
            color: { r: 0.23, g: 0.51, b: 0.97 },
          })

          imagePage.drawText(imageItem.name, {
            x: 20,
            y: height - 25,
            size: 12,
            color: { r: 1, g: 1, b: 1 },
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

          // Calculer les dimensions
          const imgWidth = pdfImage.width
          const imgHeight = pdfImage.height
          const availableWidth = width - 40
          const availableHeight = height - 80

          let finalWidth = availableWidth
          let finalHeight = (imgHeight * availableWidth) / imgWidth

          if (finalHeight > availableHeight) {
            finalHeight = availableHeight
            finalWidth = (imgWidth * availableHeight) / imgHeight
          }

          const xPos = (width - finalWidth) / 2
          const yPos = (height - finalHeight - 40) / 2

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

      // Merger les PDF
      for (const pdfToMerge of pdfsToMerge) {
        try {
          console.log(`📄 Merge de ${pdfToMerge.name}...`)

          const sourcePdfDoc = await PDFDocument.load(pdfToMerge.data)
          const pageIndices = Array.from({ length: pdfToMerge.pageCount }, (_, i) => i)
          const copiedPages = await mainPdfDoc.copyPages(sourcePdfDoc, pageIndices)

          copiedPages.forEach((page) => {
            mainPdfDoc.addPage(page)
          })

          console.log(`✅ ${pdfToMerge.name} mergé`)
        } catch (mergeError) {
          console.error(`❌ Erreur merge ${pdfToMerge.name}:`, mergeError)
        }
      }

      // Sauvegarder le PDF final
      const finalPdfBytes = await mainPdfDoc.save()
      const fileName = `dossier-location-${tenantName.replace(/\s+/g, "-").toLowerCase()}.pdf`

      const blob = new Blob([finalPdfBytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)

      console.log(`🎉 PDF final généré avec succès !`)
    } catch (mergeError) {
      console.error("❌ Erreur lors du merge final:", mergeError)

      // Fallback : télécharger le PDF sans les annexes
      const fileName = `dossier-location-${tenantName.replace(/\s+/g, "-").toLowerCase()}.pdf`
      doc.save(fileName)
    }
  } catch (error) {
    console.error("❌ Erreur génération PDF:", error)
    throw error
  }
}

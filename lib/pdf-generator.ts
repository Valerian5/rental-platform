import { type RentalFileData, MAIN_ACTIVITIES } from "./rental-file-service"

export const generateRentalFilePDF = async (rentalFile: RentalFileData): Promise<void> => {
  // Import dynamique de jsPDF et pdf-lib
  const { jsPDF } = await import("jspdf")
  const { PDFDocument } = await import("pdf-lib")

  const doc = new jsPDF()
  let yPosition = 20
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20

  // Stocker les PDF à merger à la fin
  const pdfsToMerge = []

  // Fonction helper pour ajouter du texte avec retour à la ligne
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    doc.setFontSize(options.fontSize || 12)
    doc.setFont(options.font || "helvetica", options.style || "normal")

    if (options.color) {
      if (Array.isArray(options.color)) {
        if (options.color.length === 3) {
          doc.setTextColor(options.color[0], options.color[1], options.color[2])
        } else {
          doc.setTextColor(options.color[0])
        }
      } else {
        doc.setTextColor(options.color)
      }
    } else {
      doc.setTextColor("#000000")
    }

    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin)
    doc.text(lines, x, y)
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
  const preparePDFForMerge = async (pdfUrl: string, documentName: string) => {
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

      // Ajouter une page de titre pour le document
      doc.addPage()
      doc.setFillColor("#3B82F6")
      doc.rect(0, 0, pageWidth, 30, "F")

      doc.setTextColor("#FFFFFF")
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("DOCUMENT PDF INTÉGRÉ", margin, 15)

      doc.setFontSize(10)
      doc.text(documentName, margin, 25)

      doc.setTextColor("#000000")
      doc.setFontSize(12)
      doc.text(`Document PDF complet - ${result.pageCount} page(s)`, margin, 50)
      doc.setFontSize(10)
      doc.text("Le document PDF complet sera intégré après cette page.", margin, 65)

      // Stocker le PDF pour le merge final
      pdfsToMerge.push({
        name: documentName,
        data: new Uint8Array(result.pdfData),
        pageCount: result.pageCount,
      })

      console.log(`✅ PDF préparé pour merge: ${documentName}`)
    } catch (error) {
      console.error("❌ Erreur lors de la préparation du PDF:", error)

      // Ajouter une page d'erreur
      doc.addPage()
      doc.setFillColor("#3B82F6")
      doc.rect(0, 0, pageWidth, 30, "F")

      doc.setTextColor("#FFFFFF")
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("DOCUMENT PDF", margin, 15)

      doc.setFontSize(10)
      doc.text(documentName, margin, 25)

      doc.setTextColor("#000000")
      doc.setFontSize(12)
      doc.text("Erreur lors de la préparation du PDF", margin, 50)
      doc.setFontSize(10)
      doc.text("Ce document n'a pas pu être préparé pour l'intégration.", margin, 70)
      doc.text(`Erreur: ${error.message}`, margin, 85)
    }
  }

  // Fonction pour ajouter une image dans le PDF
  const addImageToPDF = async (documentUrl: string, documentName: string) => {
    try {
      console.log("📄 Tentative d'ajout du document:", documentName, "URL:", documentUrl)

      // Vérifier si c'est un placeholder ou une URL blob
      if (!isValidDocumentUrl(documentUrl)) {
        console.log("📋 Document placeholder ou blob détecté")

        doc.addPage()
        doc.setFillColor("#3B82F6")
        doc.rect(0, 0, pageWidth, 30, "F")

        doc.setTextColor("#FFFFFF")
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("PIÈCE JOINTE", margin, 15)

        doc.setFontSize(10)
        doc.text(documentName, margin, 25)

        doc.setTextColor("#000000")
        doc.setFontSize(12)
        doc.text("Document à re-uploader", margin, 50)
        doc.setFontSize(10)
        doc.text("Ce document doit être uploadé à nouveau via le nouveau système.", margin, 70)

        return
      }

      // Déterminer le type de fichier
      const fileType = getFileType(documentUrl)
      console.log("📋 Type de fichier détecté:", fileType)

      // Traitement spécial pour les PDF - PRÉPARATION POUR MERGE
      if (fileType === "pdf") {
        await preparePDFForMerge(documentUrl, documentName)
        return
      }

      // Traitement pour les images
      console.log("🔗 Récupération image:", documentUrl)

      const response = await fetch(documentUrl, {
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

      // Ajouter une nouvelle page pour l'image
      doc.addPage()

      // En-tête de la page du document
      doc.setFillColor("#3B82F6")
      doc.rect(0, 0, pageWidth, 30, "F")

      doc.setTextColor("#FFFFFF")
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("PIÈCE JOINTE", margin, 15)

      doc.setFontSize(10)
      doc.text(documentName, margin, 25)

      // Ajouter l'image au PDF
      doc.setTextColor("#000000")
      doc.setFontSize(12)
      doc.text("Document:", margin, 50)

      const img = new Image()
      img.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            const imgWidth = img.width
            const imgHeight = img.height

            // Calculer les dimensions finales pour utiliser toute la page
            const availableWidth = pageWidth - 2 * margin
            const availableHeight = pageHeight - 80 // Espace pour l'en-tête

            let finalWidth = availableWidth
            let finalHeight = (imgHeight * availableWidth) / imgWidth

            if (finalHeight > availableHeight) {
              finalHeight = availableHeight
              finalWidth = (imgWidth * availableHeight) / imgHeight
            }

            // Centrer l'image
            const xPos = (pageWidth - finalWidth) / 2
            const yPos = 60

            doc.addImage(base64Data, "JPEG", xPos, yPos, finalWidth, finalHeight)
            console.log("✅ Image ajoutée au PDF:", documentName)
            resolve(true)
          } catch (addError) {
            console.error("❌ Erreur ajout image:", addError)
            reject(addError)
          }
        }

        img.onerror = (error) => {
          console.error("❌ Erreur chargement image:", error)
          reject(error)
        }

        img.src = base64Data
      })
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout du document au PDF:", error)

      // Ajouter une page d'erreur
      doc.addPage()
      doc.setFillColor("#3B82F6")
      doc.rect(0, 0, pageWidth, 30, "F")

      doc.setTextColor("#FFFFFF")
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("PIÈCE JOINTE", margin, 15)

      doc.setFontSize(10)
      doc.text(documentName, margin, 25)

      doc.setTextColor("#000000")
      doc.setFontSize(12)
      doc.text("Erreur de chargement du document", margin, 50)
      doc.setFontSize(10)
      doc.text("Le document n'a pas pu être chargé dans le PDF.", margin, 70)
    }
  }

  // [Reste du code du PDF identique...]
  // En-tête du document
  doc.setFillColor("#3B82F6")
  doc.rect(0, 0, pageWidth, 30, "F")

  yPosition = addText("DOSSIER DE LOCATION NUMÉRIQUE", margin, 20, {
    fontSize: 20,
    style: "bold",
    color: "#FFFFFF",
  })

  yPosition = addText(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, margin, yPosition + 5, {
    fontSize: 10,
    color: "#FFFFFF",
  })

  yPosition += 15

  // Table des matières
  yPosition = addText("TABLE DES MATIÈRES", margin, yPosition, {
    fontSize: 16,
    style: "bold",
    color: "#3B82F6",
  })

  yPosition += 5
  doc.setDrawColor("#3B82F6")
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  yPosition = addText("1. Informations générales", margin, yPosition)
  yPosition = addText("2. Locataire principal", margin, yPosition + 5)
  if (rentalFile.cotenants && rentalFile.cotenants.length > 0) {
    yPosition = addText(
      `3. ${rentalFile.rental_situation === "couple" ? "Conjoint(e)" : "Colocataires"}`,
      margin,
      yPosition + 5,
    )
  }
  if (rentalFile.guarantors && rentalFile.guarantors.length > 0) {
    yPosition = addText(`4. Garants`, margin, yPosition + 5)
  }
  yPosition = addText(`5. Pièces jointes`, margin, yPosition + 5)

  // Informations générales
  doc.addPage()
  yPosition = 20

  yPosition = addText("1. INFORMATIONS GÉNÉRALES", margin, yPosition, {
    fontSize: 16,
    style: "bold",
    color: "#3B82F6",
  })

  yPosition += 5
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  yPosition = addText(
    `Statut du dossier: ${rentalFile.status === "completed" ? "Complété" : "En cours"}`,
    margin,
    yPosition,
  )
  yPosition = addText(`Complétude: ${rentalFile.completion_percentage || 100}%`, margin, yPosition + 5)
  yPosition = addText(
    `Situation de location: ${rentalFile.rental_situation === "alone" ? "Seul" : rentalFile.rental_situation === "couple" ? "En couple" : "En colocation"}`,
    margin,
    yPosition + 5,
  )

  // [Continuer avec le reste du contenu...]
  const mainTenant = rentalFile.main_tenant
  if (mainTenant) {
    doc.addPage()
    yPosition = 20

    yPosition = addText("2. LOCATAIRE PRINCIPAL", margin, yPosition, {
      fontSize: 16,
      style: "bold",
      color: "#3B82F6",
    })

    yPosition += 5
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // Informations personnelles
    yPosition = addText("INFORMATIONS PERSONNELLES", margin, yPosition, { style: "bold", fontSize: 14 })
    yPosition = addText(`Nom: ${mainTenant.last_name || "Non renseigné"}`, margin + 5, yPosition + 5)
    yPosition = addText(`Prénom: ${mainTenant.first_name || "Non renseigné"}`, margin + 5, yPosition + 5)
    yPosition = addText(`Nationalité: ${mainTenant.nationality || "Non renseignée"}`, margin + 5, yPosition + 5)

    // Activité professionnelle
    yPosition = addText("ACTIVITÉ PROFESSIONNELLE", margin, yPosition + 10, { style: "bold", fontSize: 14 })
    const activity = MAIN_ACTIVITIES.find((a) => a.value === mainTenant.main_activity)
    yPosition = addText(`Activité: ${activity?.label || "Non renseignée"}`, margin + 5, yPosition + 5)

    // Revenus
    yPosition = addText("SOURCES DE REVENUS", margin, yPosition + 10, { style: "bold", fontSize: 14 })
    if (mainTenant.income_sources?.work_income) {
      yPosition = addText(
        `• Revenus du travail: ${mainTenant.income_sources.work_income.amount || 0}€/mois`,
        margin + 5,
        yPosition + 5,
      )
    }
  }

  // Garants
  if (rentalFile.guarantors && rentalFile.guarantors.length > 0) {
    doc.addPage()
    yPosition = 20

    yPosition = addText("4. GARANTS", margin, yPosition, {
      fontSize: 16,
      style: "bold",
      color: "#3B82F6",
    })

    yPosition += 5
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    rentalFile.guarantors.forEach((guarantor: any, index: number) => {
      yPosition = addText(`GARANT ${index + 1}`, margin, yPosition, { style: "bold", fontSize: 14 })
      yPosition = addText(`Type: Personne physique`, margin + 5, yPosition + 5)

      if (guarantor.personal_info) {
        const guarantorInfo = guarantor.personal_info
        yPosition = addText(`Nom: ${guarantorInfo.last_name || "Non renseigné"}`, margin + 5, yPosition + 5)
        yPosition = addText(`Prénom: ${guarantorInfo.first_name || "Non renseigné"}`, margin + 5, yPosition + 5)

        if (guarantorInfo.income_sources?.work_income) {
          yPosition = addText(
            `• Revenus du travail: ${guarantorInfo.income_sources.work_income.amount || 0}€/mois`,
            margin + 10,
            yPosition + 5,
          )
        }
      }

      yPosition += 15
    })
  }

  // Section des pièces jointes
  doc.addPage()
  yPosition = 20

  yPosition = addText("5. PIÈCES JOINTES", margin, yPosition, {
    fontSize: 16,
    style: "bold",
    color: "#3B82F6",
  })

  yPosition += 5
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  yPosition = addText("Les documents suivants sont intégrés dans ce PDF.", margin, yPosition)

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
          })
        }
      }
    }
  }

  // Documents des garants
  if (rentalFile.guarantors && Array.isArray(rentalFile.guarantors)) {
    for (const [gIndex, guarantor] of rentalFile.guarantors.entries()) {
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
            })
          }
        }
      }
    }
  }

  console.log(`📋 ${documentsToAdd.length} documents valides à ajouter au PDF`)

  // Ajouter tous les documents (images et préparer les PDF)
  for (const document of documentsToAdd) {
    await addImageToPDF(document.url, document.name)
  }

  // MAINTENANT LE MERGE FINAL DES PDF !
  if (pdfsToMerge.length > 0) {
    console.log(`🔄 Merge de ${pdfsToMerge.length} PDF(s)...`)

    try {
      // Convertir le PDF jsPDF en ArrayBuffer
      const jsPdfOutput = doc.output("arraybuffer")

      // Charger le PDF principal avec pdf-lib
      const mainPdfDoc = await PDFDocument.load(jsPdfOutput)

      // Merger chaque PDF
      for (const pdfToMerge of pdfsToMerge) {
        try {
          console.log(`📄 Merge de ${pdfToMerge.name}...`)

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

      console.log(`🎉 PDF final généré avec ${pdfsToMerge.length} PDF(s) intégré(s) !`)
    } catch (mergeError) {
      console.error("❌ Erreur lors du merge final:", mergeError)

      // Fallback : télécharger le PDF sans les PDF mergés
      const fileName = `dossier-location-${mainTenant?.first_name || "locataire"}-${mainTenant?.last_name || ""}.pdf`
      doc.save(fileName)
    }
  } else {
    // Pas de PDF à merger, télécharger normalement
    const fileName = `dossier-location-${mainTenant?.first_name || "locataire"}-${mainTenant?.last_name || ""}.pdf`
    doc.save(fileName)
  }
}

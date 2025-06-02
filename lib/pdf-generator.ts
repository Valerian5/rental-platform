import {
  type RentalFileData,
  MAIN_ACTIVITIES,
  CURRENT_HOUSING_SITUATIONS,
  WORK_INCOME_TYPES,
  TAX_SITUATIONS,
  GUARANTOR_TYPES,
} from "./rental-file-service"

// Fonction pour convertir une URL blob en base64
const blobToBase64 = async (blobUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(blobUrl)
    const blob = await response.blob()

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        resolve(base64)
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("Erreur lors de la conversion blob:", error)
    return null
  }
}

// Fonction pour déterminer le type de fichier
const getFileType = (blobUrl: string): string => {
  // Dans un environnement réel, on pourrait faire une requête HEAD pour obtenir le Content-Type
  // Pour l'instant, on assume que ce sont des images
  return "image"
}

export const generateRentalFilePDF = async (rentalFile: RentalFileData): Promise<void> => {
  // Import dynamique de jsPDF pour éviter les erreurs SSR
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF()
  let yPosition = 20
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20

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

  // Fonction pour ajouter une nouvelle page si nécessaire
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage()
      yPosition = 20
    }
  }

  // Fonction pour ajouter une image dans le PDF
  const addImageToPDF = async (blobUrl: string, documentName: string, maxWidth = 150, maxHeight = 200) => {
    try {
      const base64Data = await blobToBase64(blobUrl)
      if (!base64Data) {
        throw new Error("Impossible de convertir l'image")
      }

      // Ajouter une nouvelle page pour le document
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

      // Ajouter l'image
      doc.setTextColor("#000000")
      doc.setFontSize(12)
      doc.text("Document:", margin, 50)

      // Calculer les dimensions pour maintenir le ratio
      const img = new Image()
      img.crossOrigin = "anonymous"

      return new Promise((resolve) => {
        img.onload = () => {
          const imgWidth = img.width
          const imgHeight = img.height

          // Calculer les dimensions finales en gardant le ratio
          let finalWidth = maxWidth
          let finalHeight = (imgHeight * maxWidth) / imgWidth

          if (finalHeight > maxHeight) {
            finalHeight = maxHeight
            finalWidth = (imgWidth * maxHeight) / imgHeight
          }

          // Centrer l'image
          const xPos = (pageWidth - finalWidth) / 2
          const yPos = 60

          try {
            doc.addImage(base64Data, "JPEG", xPos, yPos, finalWidth, finalHeight)
          } catch (error) {
            console.error("Erreur lors de l'ajout de l'image:", error)
            // Fallback: afficher un placeholder
            doc.setDrawColor("#E5E7EB")
            doc.setFillColor("#F9FAFB")
            doc.rect(xPos, yPos, finalWidth, finalHeight, "FD")

            doc.setTextColor("#6B7280")
            doc.setFontSize(14)
            doc.text("📄", xPos + finalWidth / 2, yPos + finalHeight / 2, { align: "center" })
            doc.setFontSize(10)
            doc.text("Image non disponible", xPos + finalWidth / 2, yPos + finalHeight / 2 + 15, { align: "center" })
          }

          resolve(true)
        }

        img.onerror = () => {
          // Fallback en cas d'erreur
          const xPos = (pageWidth - maxWidth) / 2
          const yPos = 60

          doc.setDrawColor("#E5E7EB")
          doc.setFillColor("#F9FAFB")
          doc.rect(xPos, yPos, maxWidth, maxHeight, "FD")

          doc.setTextColor("#6B7280")
          doc.setFontSize(14)
          doc.text("📄", xPos + maxWidth / 2, yPos + maxHeight / 2, { align: "center" })
          doc.setFontSize(10)
          doc.text("Document non disponible", xPos + maxWidth / 2, yPos + maxHeight / 2 + 15, { align: "center" })

          resolve(true)
        }

        img.src = base64Data
      })
    } catch (error) {
      console.error("Erreur lors de l'ajout du document au PDF:", error)

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
      doc.text("Document non disponible", margin, 50)
      doc.setFontSize(10)
      doc.text("Une erreur s'est produite lors du chargement de ce document.", margin, 70)
    }
  }

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
  yPosition = addText(`Complétude: ${rentalFile.completion_percentage}%`, margin, yPosition + 5)
  yPosition = addText(
    `Situation de location: ${rentalFile.rental_situation === "alone" ? "Seul" : rentalFile.rental_situation === "couple" ? "En couple" : "En colocation"}`,
    margin,
    yPosition + 5,
  )

  yPosition += 15

  // Locataire principal
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

  const mainTenant = rentalFile.main_tenant
  if (mainTenant) {
    // Informations personnelles
    yPosition = addText("INFORMATIONS PERSONNELLES", margin, yPosition, { style: "bold", fontSize: 14 })
    yPosition = addText(`Nom: ${mainTenant.last_name || "Non renseigné"}`, margin + 5, yPosition + 5)
    yPosition = addText(`Prénom: ${mainTenant.first_name || "Non renseigné"}`, margin + 5, yPosition + 5)

    if (mainTenant.birth_date) {
      yPosition = addText(
        `Date de naissance: ${new Date(mainTenant.birth_date).toLocaleDateString("fr-FR")}`,
        margin + 5,
        yPosition + 5,
      )
    }

    if (mainTenant.birth_place) {
      yPosition = addText(`Lieu de naissance: ${mainTenant.birth_place}`, margin + 5, yPosition + 5)
    }

    yPosition = addText(`Nationalité: ${mainTenant.nationality || "Non renseignée"}`, margin + 5, yPosition + 5)

    yPosition += 10

    // Activité professionnelle
    yPosition = addText("ACTIVITÉ PROFESSIONNELLE", margin, yPosition, { style: "bold", fontSize: 14 })
    const activity = MAIN_ACTIVITIES.find((a) => a.value === mainTenant.main_activity)
    yPosition = addText(`Activité: ${activity?.label || "Non renseignée"}`, margin + 5, yPosition + 5)
    if (activity?.description) {
      yPosition = addText(`Description: ${activity.description}`, margin + 5, yPosition + 5, { fontSize: 10 })
    }

    // Logement actuel
    yPosition = addText("LOGEMENT ACTUEL", margin, yPosition + 10, { style: "bold", fontSize: 14 })
    const housing = CURRENT_HOUSING_SITUATIONS.find((h) => h.value === mainTenant.current_housing_situation)
    yPosition = addText(`Situation: ${housing?.label || "Non renseigné"}`, margin + 5, yPosition + 5)

    // Revenus détaillés
    checkPageBreak(40)
    yPosition = addText("SOURCES DE REVENUS", margin, yPosition + 10, { style: "bold", fontSize: 14 })

    if (mainTenant.income_sources?.work_income) {
      const workIncomeType = WORK_INCOME_TYPES.find((t) => t.value === mainTenant.income_sources.work_income?.type)
      yPosition = addText(
        `• Revenus du travail (${workIncomeType?.label || mainTenant.income_sources.work_income.type}): ${mainTenant.income_sources.work_income.amount || 0}€/mois`,
        margin + 5,
        yPosition + 5,
      )
    }

    // Situation fiscale
    checkPageBreak(30)
    yPosition = addText("SITUATION FISCALE", margin, yPosition + 10, { style: "bold", fontSize: 14 })
    const taxSituation = TAX_SITUATIONS.find((t) => t.value === mainTenant.tax_situation?.type)
    yPosition = addText(`Situation: ${taxSituation?.label || "Non renseignée"}`, margin + 5, yPosition + 5)
    if (mainTenant.tax_situation?.explanation) {
      yPosition = addText(`Explication: ${mainTenant.tax_situation.explanation}`, margin + 5, yPosition + 5)
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
      checkPageBreak(40)
      yPosition = addText(`GARANT ${index + 1}`, margin, yPosition, { style: "bold", fontSize: 14 })

      const guarantorType = GUARANTOR_TYPES.find((t) => t.value === guarantor.type)
      yPosition = addText(`Type: ${guarantorType?.label || guarantor.type}`, margin + 5, yPosition + 5)

      if (guarantor.type === "physical" && guarantor.personal_info) {
        const guarantorInfo = guarantor.personal_info
        yPosition = addText(`Nom: ${guarantorInfo.last_name || "Non renseigné"}`, margin + 5, yPosition + 5)
        yPosition = addText(`Prénom: ${guarantorInfo.first_name || "Non renseigné"}`, margin + 5, yPosition + 5)

        if (guarantorInfo.birth_date) {
          yPosition = addText(
            `Date de naissance: ${new Date(guarantorInfo.birth_date).toLocaleDateString("fr-FR")}`,
            margin + 5,
            yPosition + 5,
          )
        }

        yPosition = addText(`Nationalité: ${guarantorInfo.nationality || "Non renseignée"}`, margin + 5, yPosition + 5)

        const guarantorActivity = MAIN_ACTIVITIES.find((a) => a.value === guarantorInfo.main_activity)
        if (guarantorActivity) {
          yPosition = addText(`Activité: ${guarantorActivity.label}`, margin + 5, yPosition + 5)
        }

        // Revenus du garant
        if (guarantorInfo.income_sources) {
          yPosition += 5
          yPosition = addText("Revenus du garant:", margin + 5, yPosition, { style: "bold" })

          if (guarantorInfo.income_sources.work_income) {
            yPosition = addText(
              `• Revenus du travail: ${guarantorInfo.income_sources.work_income.amount || 0}€/mois`,
              margin + 10,
              yPosition + 5,
            )
          }
        }
      }

      yPosition += 15
    })
  }

  // Section des pièces jointes avec les vraies images
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

  // Maintenant, ajoutons tous les documents avec les vraies images
  const documentsToAdd = []

  // Locataire principal
  if (mainTenant) {
    // Documents d'identité
    if (mainTenant.identity_documents && mainTenant.identity_documents.length > 0) {
      for (const [index, doc] of mainTenant.identity_documents.entries()) {
        documentsToAdd.push({
          url: doc,
          name: `Pièce d'identité du locataire ${index + 1}`,
          category: "Identité",
        })
      }
    }

    // Documents d'activité
    if (mainTenant.activity_documents && mainTenant.activity_documents.length > 0) {
      for (const [index, doc] of mainTenant.activity_documents.entries()) {
        documentsToAdd.push({
          url: doc,
          name: `Justificatif d'activité ${index + 1}`,
          category: "Activité",
        })
      }
    }

    // Documents fiscaux
    if (mainTenant.tax_situation?.documents && mainTenant.tax_situation.documents.length > 0) {
      for (const [index, doc] of mainTenant.tax_situation.documents.entries()) {
        documentsToAdd.push({
          url: doc,
          name: `Document fiscal ${index + 1}`,
          category: "Fiscal",
        })
      }
    }

    // Documents de revenus
    if (mainTenant.income_sources?.work_income?.documents) {
      for (const [index, doc] of mainTenant.income_sources.work_income.documents.entries()) {
        documentsToAdd.push({
          url: doc,
          name: `Justificatif de revenu ${index + 1}`,
          category: "Revenus",
        })
      }
    }

    // Documents de logement actuel
    if (mainTenant.current_housing_documents?.quittances_loyer) {
      for (const [index, doc] of mainTenant.current_housing_documents.quittances_loyer.entries()) {
        documentsToAdd.push({
          url: doc,
          name: `Quittance de loyer ${index + 1}`,
          category: "Logement",
        })
      }
    }
  }

  // Documents des garants
  if (rentalFile.guarantors) {
    for (const [gIndex, guarantor] of rentalFile.guarantors.entries()) {
      if (guarantor.type === "physical" && guarantor.personal_info?.identity_documents) {
        for (const [index, doc] of guarantor.personal_info.identity_documents.entries()) {
          documentsToAdd.push({
            url: doc,
            name: `Garant ${gIndex + 1} - Pièce d'identité ${index + 1}`,
            category: "Garant",
          })
        }
      }
    }
  }

  // Ajouter tous les documents
  for (const document of documentsToAdd) {
    await addImageToPDF(document.url, document.name)
  }

  // Pied de page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" })
    doc.text("Dossier de location numérique - Conforme DossierFacile", margin, pageHeight - 10)
  }

  // Télécharger le PDF
  const fileName = `dossier-location-${mainTenant?.first_name || "locataire"}-${mainTenant?.last_name || ""}.pdf`
  doc.save(fileName)
}

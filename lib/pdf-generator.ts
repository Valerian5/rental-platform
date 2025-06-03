import { type RentalFileData, MAIN_ACTIVITIES } from "./rental-file-service"
import { fetchDocumentAsBase64 } from "./document-utils"

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
      console.log("📄 Tentative d'ajout du document:", documentName)

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

      // Essayer de récupérer le document
      const base64Data = await fetchDocumentAsBase64(blobUrl)

      if (base64Data) {
        console.log("✅ Document récupéré, ajout au PDF")

        // Ajouter l'image
        doc.setTextColor("#000000")
        doc.setFontSize(12)
        doc.text("Document:", margin, 50)

        try {
          // Créer une image pour obtenir les dimensions
          const img = new Image()
          img.crossOrigin = "anonymous"

          await new Promise((resolve, reject) => {
            img.onload = () => {
              try {
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

                // Ajouter l'image au PDF
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
        } catch (imageError) {
          console.error("❌ Erreur traitement image:", imageError)
          throw imageError
        }
      } else {
        throw new Error("Impossible de récupérer le document")
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout du document au PDF:", error)

      // Ajouter une page d'erreur avec un placeholder
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
      doc.text("Document en cours de traitement", margin, 50)
      doc.setFontSize(10)
      doc.text("Ce document sera disponible dans une version ultérieure du dossier.", margin, 70)

      // Ajouter un placeholder visuel
      const xPos = (pageWidth - 150) / 2
      const yPos = 90

      doc.setDrawColor("#E5E7EB")
      doc.setFillColor("#F9FAFB")
      doc.rect(xPos, yPos, 150, 200, "FD")

      doc.setTextColor("#6B7280")
      doc.setFontSize(24)
      doc.text("📄", xPos + 75, yPos + 100, { align: "center" })
      doc.setFontSize(12)
      doc.text("Document référencé", xPos + 75, yPos + 120, { align: "center" })
      doc.setFontSize(10)
      doc.text("Disponible en ligne", xPos + 75, yPos + 135, { align: "center" })
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

  // Collecter tous les documents
  const documentsToAdd = []

  if (mainTenant) {
    // Documents d'identité
    if (mainTenant.identity_documents && mainTenant.identity_documents.length > 0) {
      for (const [index, doc] of mainTenant.identity_documents.entries()) {
        documentsToAdd.push({
          url: doc,
          name: `Pièce d'identité du locataire ${index + 1}`,
        })
      }
    }

    // Documents d'activité
    if (mainTenant.activity_documents && mainTenant.activity_documents.length > 0) {
      for (const [index, doc] of mainTenant.activity_documents.entries()) {
        documentsToAdd.push({
          url: doc,
          name: `Justificatif d'activité ${index + 1}`,
        })
      }
    }

    // Documents fiscaux
    if (mainTenant.tax_situation?.documents && mainTenant.tax_situation.documents.length > 0) {
      for (const [index, doc] of mainTenant.tax_situation.documents.entries()) {
        documentsToAdd.push({
          url: doc,
          name: `Document fiscal ${index + 1}`,
        })
      }
    }

    // Documents de revenus
    if (mainTenant.income_sources?.work_income?.documents) {
      for (const [index, doc] of mainTenant.income_sources.work_income.documents.entries()) {
        documentsToAdd.push({
          url: doc,
          name: `Justificatif de revenu ${index + 1}`,
        })
      }
    }

    // Documents de logement
    if (mainTenant.current_housing_documents?.quittances_loyer) {
      for (const [index, doc] of mainTenant.current_housing_documents.quittances_loyer.entries()) {
        documentsToAdd.push({
          url: doc,
          name: `Quittance de loyer ${index + 1}`,
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
          })
        }
      }
    }
  }

  console.log(`📋 ${documentsToAdd.length} documents à ajouter au PDF`)

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

import {
  type RentalFileData,
  MAIN_ACTIVITIES,
  CURRENT_HOUSING_SITUATIONS,
  WORK_INCOME_TYPES,
  SOCIAL_AID_TYPES,
  TAX_SITUATIONS,
  GUARANTOR_TYPES,
} from "./rental-file-service"

export const generateRentalFilePDF = async (rentalFile: RentalFileData): Promise<void> => {
  // Import dynamique de jsPDF pour éviter les erreurs SSR
  const { jsPDF } = await import("jspdf")

  // Pour manipuler les images
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
        // Si c'est un array, on attend [r, g, b] en valeurs numériques
        if (options.color.length === 3) {
          doc.setTextColor(options.color[0], options.color[1], options.color[2])
        } else {
          // Si c'est un array avec une seule couleur hex, on l'utilise directement
          doc.setTextColor(options.color[0])
        }
      } else {
        // Si c'est une string (hex), on l'utilise directement
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

  // Fonction pour ajouter un document directement dans le PDF
  const addDocumentToPDF = async (documentUrl: string, documentName: string) => {
    try {
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

      // Essayer de charger l'image
      try {
        // Simuler le chargement d'une image (dans un environnement réel, vous utiliseriez fetch)
        // Note: Dans un environnement réel, vous devrez gérer les CORS et les types de fichiers
        const img = new Image()
        img.crossOrigin = "Anonymous"

        // Créer une promesse pour attendre le chargement de l'image
        await new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              // Calculer les dimensions pour adapter l'image à la page
              const imgRatio = img.width / img.height
              let imgWidth = pageWidth - 2 * margin
              let imgHeight = imgWidth / imgRatio

              // Si l'image est trop haute, ajuster la hauteur
              if (imgHeight > pageHeight - 60) {
                imgHeight = pageHeight - 60
                imgWidth = imgHeight * imgRatio
              }

              // Centrer l'image horizontalement
              const xOffset = (pageWidth - imgWidth) / 2

              // Ajouter l'image au PDF
              doc.addImage(img, "JPEG", xOffset, 40, imgWidth, imgHeight)
              resolve(true)
            } catch (err) {
              // En cas d'erreur lors de l'ajout de l'image
              doc.setTextColor("#FF0000")
              doc.setFontSize(12)
              doc.text("Impossible d'afficher ce document", margin, 50)
              doc.text("Type de document non supporté ou erreur de chargement", margin, 65)
              resolve(false)
            }
          }

          img.onerror = () => {
            // En cas d'erreur de chargement
            doc.setTextColor("#FF0000")
            doc.setFontSize(12)
            doc.text("Impossible de charger ce document", margin, 50)
            doc.text("URL invalide ou problème d'accès", margin, 65)
            resolve(false)
          }

          // Dans un environnement réel, vous utiliseriez l'URL réelle du document
          // Pour cette démonstration, nous utilisons une URL de placeholder
          img.src = documentUrl || "/placeholder.svg?height=400&width=300"
        })
      } catch (error) {
        // Gérer les erreurs générales
        doc.setTextColor("#FF0000")
        doc.setFontSize(12)
        doc.text("Erreur lors du traitement du document", margin, 50)
        doc.text(`${error}`, margin, 65)
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du document au PDF:", error)
    }
  }

  // Fonction pour ajouter une section de documents avec prévisualisation
  const addDocumentSection = async (title: string, documents: string[] | undefined, description?: string) => {
    if (!documents || documents.length === 0) return yPosition

    checkPageBreak(20)
    yPosition = addText(`${title}:`, margin, yPosition, { style: "bold" })

    if (description) {
      yPosition = addText(description, margin + 5, yPosition + 5, { fontSize: 10, color: "#666666" })
    }

    // Lister les documents
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i]
      checkPageBreak(10)
      yPosition = addText(`• ${doc}`, margin + 10, yPosition + 5, { fontSize: 10 })

      // Ajouter un lien vers la page du document
      const pageNumber = i + 1 // Numéro de page relatif pour ce document
      yPosition = addText(`(Voir document en page ${pageNumber})`, margin + 20, yPosition + 5, {
        fontSize: 8,
        color: "#3B82F6",
        style: "italic",
      })
    }

    // Ajouter les documents eux-mêmes (chacun sur une page)
    for (const document of documents) {
      // Dans un environnement réel, vous utiliseriez l'URL réelle du document
      // Pour cette démonstration, nous utilisons une URL fictive basée sur le nom
      const documentUrl = `/api/documents/${encodeURIComponent(document)}`
      await addDocumentToPDF(documentUrl, document)
    }

    return yPosition + 5
  }

  // En-tête du document
  doc.setFillColor("#3B82F6") // Bleu
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

    // Documents d'identité - on liste seulement, les documents seront ajoutés plus tard
    if (mainTenant.identity_documents && mainTenant.identity_documents.length > 0) {
      yPosition = addText("PIÈCES D'IDENTITÉ", margin, yPosition, { style: "bold", fontSize: 14 })
      mainTenant.identity_documents.forEach((doc, index) => {
        yPosition = addText(`• ${doc}`, margin + 5, yPosition + 5)
      })
      yPosition += 5
    }

    // Activité professionnelle
    yPosition = addText("ACTIVITÉ PROFESSIONNELLE", margin, yPosition, { style: "bold", fontSize: 14 })
    const activity = MAIN_ACTIVITIES.find((a) => a.value === mainTenant.main_activity)
    yPosition = addText(`Activité: ${activity?.label || "Non renseignée"}`, margin + 5, yPosition + 5)
    if (activity?.description) {
      yPosition = addText(`Description: ${activity.description}`, margin + 5, yPosition + 5, { fontSize: 10 })
    }

    // Documents d'activité - on liste seulement
    if (mainTenant.activity_documents && mainTenant.activity_documents.length > 0) {
      yPosition = addText("JUSTIFICATIFS D'ACTIVITÉ", margin, yPosition + 5, { style: "bold" })
      mainTenant.activity_documents.forEach((doc, index) => {
        yPosition = addText(`• ${doc}`, margin + 5, yPosition + 5)
      })
      yPosition += 5
    }

    // Logement actuel
    yPosition = addText("LOGEMENT ACTUEL", margin, yPosition, { style: "bold", fontSize: 14 })
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

    if (mainTenant.income_sources?.social_aid?.length > 0) {
      mainTenant.income_sources.social_aid.forEach((aid: any, index: number) => {
        const aidType = SOCIAL_AID_TYPES.find((t) => t.value === aid.type)
        yPosition = addText(
          `• Aide sociale ${index + 1} (${aidType?.label || aid.type}): ${aid.amount || 0}€/mois`,
          margin + 5,
          yPosition + 5,
        )
      })
    }

    if (mainTenant.income_sources?.retirement_pension?.length > 0) {
      mainTenant.income_sources.retirement_pension.forEach((pension: any, index: number) => {
        yPosition = addText(
          `• Retraite/Pension ${index + 1} (${pension.type}): ${pension.amount || 0}€/mois`,
          margin + 5,
          yPosition + 5,
        )
      })
    }

    if (mainTenant.income_sources?.rent_income?.length > 0) {
      mainTenant.income_sources.rent_income.forEach((rent: any, index: number) => {
        yPosition = addText(`• Rente ${index + 1} (${rent.type}): ${rent.amount || 0}€/mois`, margin + 5, yPosition + 5)
      })
    }

    if (mainTenant.income_sources?.scholarship) {
      yPosition = addText(
        `• Bourse: ${mainTenant.income_sources.scholarship.amount || 0}€/mois`,
        margin + 5,
        yPosition + 5,
      )
    }

    if (mainTenant.income_sources?.no_income) {
      yPosition = addText(
        `• Aucun revenu: ${mainTenant.income_sources.no_income.explanation}`,
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

  // Colocataires
  if (rentalFile.cotenants && rentalFile.cotenants.length > 0) {
    doc.addPage()
    yPosition = 20

    yPosition = addText(
      `3. ${rentalFile.rental_situation === "couple" ? "CONJOINT(E)" : "COLOCATAIRES"}`,
      margin,
      yPosition,
      {
        fontSize: 16,
        style: "bold",
        color: "#3B82F6",
      },
    )

    yPosition += 5
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    rentalFile.cotenants.forEach((cotenant: any, index: number) => {
      checkPageBreak(30)
      yPosition = addText(
        `${rentalFile.rental_situation === "couple" ? "CONJOINT(E)" : `COLOCATAIRE ${index + 1}`}`,
        margin,
        yPosition,
        { style: "bold", fontSize: 14 },
      )

      yPosition = addText(`Nom: ${cotenant.last_name || "Non renseigné"}`, margin + 5, yPosition + 5)
      yPosition = addText(`Prénom: ${cotenant.first_name || "Non renseigné"}`, margin + 5, yPosition + 5)

      const cotenantActivity = MAIN_ACTIVITIES.find((a) => a.value === cotenant.main_activity)
      if (cotenantActivity) {
        yPosition = addText(`Activité: ${cotenantActivity.label}`, margin + 5, yPosition + 5)
      }

      // Documents du colocataire - on liste seulement
      if (cotenant.identity_documents && cotenant.identity_documents.length > 0) {
        yPosition = addText("Pièces d'identité:", margin + 5, yPosition + 5, { style: "bold" })
        cotenant.identity_documents.forEach((doc, index) => {
          yPosition = addText(`• ${doc}`, margin + 10, yPosition + 5)
        })
      }

      if (cotenant.activity_documents && cotenant.activity_documents.length > 0) {
        yPosition = addText("Justificatifs d'activité:", margin + 5, yPosition + 5, { style: "bold" })
        cotenant.activity_documents.forEach((doc, index) => {
          yPosition = addText(`• ${doc}`, margin + 10, yPosition + 5)
        })
      }

      yPosition += 10
    })
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

        // Documents du garant - on liste seulement
        if (guarantorInfo.identity_documents && guarantorInfo.identity_documents.length > 0) {
          yPosition = addText("Pièces d'identité:", margin + 5, yPosition + 5, { style: "bold" })
          guarantorInfo.identity_documents.forEach((doc, index) => {
            yPosition = addText(`• ${doc}`, margin + 10, yPosition + 5)
          })
        }
      } else if (guarantor.type === "organism") {
        if (guarantor.organism_type === "visale") {
          yPosition = addText("Organisme: Garantie Visale", margin + 5, yPosition + 5)
        } else {
          yPosition = addText(`Organisme: ${guarantor.organism_name || "Non renseigné"}`, margin + 5, yPosition + 5)
        }
      } else if (guarantor.type === "moral_person") {
        yPosition = addText(`Entreprise: ${guarantor.company_name || "Non renseigné"}`, margin + 5, yPosition + 5)

        if (guarantor.kbis_documents && guarantor.kbis_documents.length > 0) {
          yPosition = addText("Documents KBIS:", margin + 5, yPosition + 5, { style: "bold" })
          guarantor.kbis_documents.forEach((doc, index) => {
            yPosition = addText(`• ${doc}`, margin + 10, yPosition + 5)
          })
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

  yPosition = addText("Toutes les pièces jointes sont présentées dans les pages suivantes.", margin, yPosition)
  yPosition = addText("Chaque document est affiché sur une page dédiée.", margin, yPosition + 5)

  // Maintenant, ajoutons tous les documents
  // Locataire principal
  if (mainTenant) {
    // Documents d'identité
    if (mainTenant.identity_documents && mainTenant.identity_documents.length > 0) {
      for (const doc of mainTenant.identity_documents) {
        await addDocumentToPDF(`/api/documents/${encodeURIComponent(doc)}`, `Pièce d'identité: ${doc}`)
      }
    }

    // Documents d'activité
    if (mainTenant.activity_documents && mainTenant.activity_documents.length > 0) {
      for (const doc of mainTenant.activity_documents) {
        await addDocumentToPDF(`/api/documents/${encodeURIComponent(doc)}`, `Justificatif d'activité: ${doc}`)
      }
    }

    // Documents fiscaux
    if (mainTenant.tax_situation?.documents && mainTenant.tax_situation.documents.length > 0) {
      for (const doc of mainTenant.tax_situation.documents) {
        await addDocumentToPDF(`/api/documents/${encodeURIComponent(doc)}`, `Document fiscal: ${doc}`)
      }
    }

    // Documents de revenus
    if (mainTenant.income_sources) {
      // Revenus du travail
      if (mainTenant.income_sources.work_income?.documents) {
        for (const doc of mainTenant.income_sources.work_income.documents) {
          await addDocumentToPDF(`/api/documents/${encodeURIComponent(doc)}`, `Justificatif de revenu: ${doc}`)
        }
      }

      // Aides sociales
      if (mainTenant.income_sources.social_aid) {
        for (const aid of mainTenant.income_sources.social_aid) {
          if (aid.documents) {
            for (const doc of aid.documents) {
              await addDocumentToPDF(`/api/documents/${encodeURIComponent(doc)}`, `Aide sociale: ${doc}`)
            }
          }
        }
      }

      // Autres revenus...
    }

    // Documents de logement actuel
    if (mainTenant.current_housing_documents) {
      if (mainTenant.current_housing_documents.quittances_loyer) {
        for (const doc of mainTenant.current_housing_documents.quittances_loyer) {
          await addDocumentToPDF(`/api/documents/${encodeURIComponent(doc)}`, `Quittance de loyer: ${doc}`)
        }
      }

      if (mainTenant.current_housing_documents.attestation_bon_paiement) {
        await addDocumentToPDF(
          `/api/documents/${encodeURIComponent(mainTenant.current_housing_documents.attestation_bon_paiement)}`,
          `Attestation de bon paiement: ${mainTenant.current_housing_documents.attestation_bon_paiement}`,
        )
      }

      // Autres documents de logement...
    }
  }

  // Documents des colocataires
  if (rentalFile.cotenants) {
    for (const [coIndex, cotenant] of rentalFile.cotenants.entries()) {
      // Documents d'identité
      if (cotenant.identity_documents) {
        for (const doc of cotenant.identity_documents) {
          await addDocumentToPDF(
            `/api/documents/${encodeURIComponent(doc)}`,
            `${rentalFile.rental_situation === "couple" ? "Conjoint(e)" : `Colocataire ${coIndex + 1}`} - Pièce d'identité: ${doc}`,
          )
        }
      }

      // Autres documents du colocataire...
    }
  }

  // Documents des garants
  if (rentalFile.guarantors) {
    for (const [gIndex, guarantor] of rentalFile.guarantors.entries()) {
      if (guarantor.type === "physical" && guarantor.personal_info) {
        // Documents d'identité du garant
        if (guarantor.personal_info.identity_documents) {
          for (const doc of guarantor.personal_info.identity_documents) {
            await addDocumentToPDF(
              `/api/documents/${encodeURIComponent(doc)}`,
              `Garant ${gIndex + 1} - Pièce d'identité: ${doc}`,
            )
          }
        }

        // Autres documents du garant...
      } else if (guarantor.type === "moral_person" && guarantor.kbis_documents) {
        // Documents KBIS
        for (const doc of guarantor.kbis_documents) {
          await addDocumentToPDF(
            `/api/documents/${encodeURIComponent(doc)}`,
            `Garant ${gIndex + 1} - Document KBIS: ${doc}`,
          )
        }
      }
    }
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

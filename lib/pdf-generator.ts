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

  const doc = new jsPDF()
  let yPosition = 20
  const pageWidth = doc.internal.pageSize.width
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
    if (yPosition + requiredSpace > doc.internal.pageSize.height - 20) {
      doc.addPage()
      yPosition = 20
    }
  }

  // Fonction pour ajouter une section de documents
  const addDocumentSection = (title: string, documents: string[] | undefined, description?: string) => {
    if (!documents || documents.length === 0) return yPosition

    checkPageBreak(20)
    yPosition = addText(`${title}:`, margin, yPosition, { style: "bold" })

    if (description) {
      yPosition = addText(description, margin + 5, yPosition + 5, { fontSize: 10, color: "#666666" })
    }

    documents.forEach((doc, index) => {
      checkPageBreak(10)
      yPosition = addText(`• ${doc}`, margin + 10, yPosition + 5, { fontSize: 10 })
    })

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

  // Informations générales
  checkPageBreak(40)
  yPosition = addText("INFORMATIONS GÉNÉRALES", margin, yPosition, {
    fontSize: 16,
    style: "bold",
    color: "#3B82F6",
  })

  yPosition += 5
  doc.setDrawColor("#3B82F6")
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
  checkPageBreak(60)
  yPosition = addText("LOCATAIRE PRINCIPAL", margin, yPosition, {
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

    // Documents d'identité
    yPosition = addDocumentSection(
      "PIÈCES D'IDENTITÉ",
      mainTenant.identity_documents,
      "Carte d'identité, passeport ou titre de séjour",
    )

    // Activité professionnelle
    yPosition += 5
    yPosition = addText("ACTIVITÉ PROFESSIONNELLE", margin, yPosition, { style: "bold", fontSize: 14 })
    const activity = MAIN_ACTIVITIES.find((a) => a.value === mainTenant.main_activity)
    yPosition = addText(`Activité: ${activity?.label || "Non renseignée"}`, margin + 5, yPosition + 5)
    if (activity?.description) {
      yPosition = addText(`Description: ${activity.description}`, margin + 5, yPosition + 5, { fontSize: 10 })
    }

    // Documents d'activité
    yPosition = addDocumentSection(
      "JUSTIFICATIFS D'ACTIVITÉ",
      mainTenant.activity_documents,
      activity?.required_documents?.join(", "),
    )

    // Logement actuel
    yPosition += 5
    yPosition = addText("LOGEMENT ACTUEL", margin, yPosition, { style: "bold", fontSize: 14 })
    const housing = CURRENT_HOUSING_SITUATIONS.find((h) => h.value === mainTenant.current_housing_situation)
    yPosition = addText(`Situation: ${housing?.label || "Non renseigné"}`, margin + 5, yPosition + 5)

    // Documents logement actuel
    if (mainTenant.current_housing_documents) {
      if (mainTenant.current_housing_documents.quittances_loyer) {
        yPosition = addDocumentSection(
          "QUITTANCES DE LOYER",
          mainTenant.current_housing_documents.quittances_loyer,
          "3 dernières quittances de loyer",
        )
      }
      if (mainTenant.current_housing_documents.attestation_bon_paiement) {
        yPosition = addDocumentSection("ATTESTATION DE BON PAIEMENT", [
          mainTenant.current_housing_documents.attestation_bon_paiement,
        ])
      }
      if (mainTenant.current_housing_documents.attestation_hebergement) {
        yPosition = addDocumentSection("ATTESTATION D'HÉBERGEMENT", [
          mainTenant.current_housing_documents.attestation_hebergement,
        ])
      }
      if (mainTenant.current_housing_documents.avis_taxe_fonciere) {
        yPosition = addDocumentSection("AVIS DE TAXE FONCIÈRE", [
          mainTenant.current_housing_documents.avis_taxe_fonciere,
        ])
      }
    }

    // Revenus détaillés
    yPosition += 10
    yPosition = addText("SOURCES DE REVENUS", margin, yPosition, { style: "bold", fontSize: 14 })

    if (mainTenant.income_sources?.work_income) {
      const workIncomeType = WORK_INCOME_TYPES.find((t) => t.value === mainTenant.income_sources.work_income?.type)
      yPosition = addText(
        `• Revenus du travail (${workIncomeType?.label || mainTenant.income_sources.work_income.type}): ${mainTenant.income_sources.work_income.amount || 0}€/mois`,
        margin + 5,
        yPosition + 5,
      )
      yPosition = addDocumentSection("Justificatifs revenus travail", mainTenant.income_sources.work_income.documents)
    }

    if (mainTenant.income_sources?.social_aid?.length > 0) {
      mainTenant.income_sources.social_aid.forEach((aid: any, index: number) => {
        const aidType = SOCIAL_AID_TYPES.find((t) => t.value === aid.type)
        yPosition = addText(
          `• Aide sociale ${index + 1} (${aidType?.label || aid.type}): ${aid.amount || 0}€/mois`,
          margin + 5,
          yPosition + 5,
        )
        yPosition = addDocumentSection(`Justificatifs aide sociale ${index + 1}`, aid.documents)
      })
    }

    if (mainTenant.income_sources?.retirement_pension?.length > 0) {
      mainTenant.income_sources.retirement_pension.forEach((pension: any, index: number) => {
        yPosition = addText(
          `• Retraite/Pension ${index + 1} (${pension.type}): ${pension.amount || 0}€/mois`,
          margin + 5,
          yPosition + 5,
        )
        yPosition = addDocumentSection(`Justificatifs retraite/pension ${index + 1}`, pension.documents)
      })
    }

    if (mainTenant.income_sources?.rent_income?.length > 0) {
      mainTenant.income_sources.rent_income.forEach((rent: any, index: number) => {
        yPosition = addText(`• Rente ${index + 1} (${rent.type}): ${rent.amount || 0}€/mois`, margin + 5, yPosition + 5)
        yPosition = addDocumentSection(`Justificatifs rente ${index + 1}`, rent.documents)
      })
    }

    if (mainTenant.income_sources?.scholarship) {
      yPosition = addText(
        `• Bourse: ${mainTenant.income_sources.scholarship.amount || 0}€/mois`,
        margin + 5,
        yPosition + 5,
      )
      yPosition = addDocumentSection("Justificatifs bourse", mainTenant.income_sources.scholarship.documents)
    }

    if (mainTenant.income_sources?.no_income) {
      yPosition = addText(
        `• Aucun revenu: ${mainTenant.income_sources.no_income.explanation}`,
        margin + 5,
        yPosition + 5,
      )
      yPosition = addDocumentSection("Justificatifs absence de revenus", mainTenant.income_sources.no_income.documents)
    }

    // Situation fiscale
    yPosition += 10
    yPosition = addText("SITUATION FISCALE", margin, yPosition, { style: "bold", fontSize: 14 })
    const taxSituation = TAX_SITUATIONS.find((t) => t.value === mainTenant.tax_situation?.type)
    yPosition = addText(`Situation: ${taxSituation?.label || "Non renseignée"}`, margin + 5, yPosition + 5)
    if (mainTenant.tax_situation?.explanation) {
      yPosition = addText(`Explication: ${mainTenant.tax_situation.explanation}`, margin + 5, yPosition + 5)
    }
    yPosition = addDocumentSection(
      "DOCUMENTS FISCAUX",
      mainTenant.tax_situation?.documents,
      "Avis d'imposition ou justificatif fiscal",
    )
  }

  // Colocataires
  if (rentalFile.cotenants && rentalFile.cotenants.length > 0) {
    yPosition += 20
    checkPageBreak(40)

    yPosition = addText(rentalFile.rental_situation === "couple" ? "CONJOINT(E)" : "COLOCATAIRES", margin, yPosition, {
      fontSize: 16,
      style: "bold",
      color: "#3B82F6",
    })

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

      // Documents du colocataire
      yPosition = addDocumentSection("Pièces d'identité", cotenant.identity_documents)
      yPosition = addDocumentSection("Justificatifs d'activité", cotenant.activity_documents)
      yPosition = addDocumentSection("Documents fiscaux", cotenant.tax_situation?.documents)

      yPosition += 10
    })
  }

  // Garants détaillés
  if (rentalFile.guarantors && rentalFile.guarantors.length > 0) {
    yPosition += 20
    checkPageBreak(40)

    yPosition = addText("GARANTS", margin, yPosition, {
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

          // Autres sources de revenus...
        }

        // Documents du garant
        yPosition += 5
        yPosition = addDocumentSection("Pièces d'identité du garant", guarantorInfo.identity_documents)
        yPosition = addDocumentSection("Justificatifs d'activité du garant", guarantorInfo.activity_documents)
        yPosition = addDocumentSection("Documents fiscaux du garant", guarantorInfo.tax_situation?.documents)
      } else if (guarantor.type === "organism") {
        if (guarantor.organism_type === "visale") {
          yPosition = addText("Organisme: Garantie Visale", margin + 5, yPosition + 5)
        } else {
          yPosition = addText(`Organisme: ${guarantor.organism_name || "Non renseigné"}`, margin + 5, yPosition + 5)
        }
      } else if (guarantor.type === "moral_person") {
        yPosition = addText(`Entreprise: ${guarantor.company_name || "Non renseigné"}`, margin + 5, yPosition + 5)
        yPosition = addDocumentSection("Documents KBIS", guarantor.kbis_documents)
      }

      yPosition += 15
    })
  }

  // Récapitulatif des documents
  yPosition += 20
  checkPageBreak(40)
  yPosition = addText("RÉCAPITULATIF DES DOCUMENTS", margin, yPosition, {
    fontSize: 16,
    style: "bold",
    color: "#3B82F6",
  })

  yPosition += 5
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  let totalDocuments = 0

  // Compter tous les documents
  if (mainTenant?.identity_documents) totalDocuments += mainTenant.identity_documents.length
  if (mainTenant?.activity_documents) totalDocuments += mainTenant.activity_documents.length
  if (mainTenant?.tax_situation?.documents) totalDocuments += mainTenant.tax_situation.documents.length

  // Documents de revenus
  if (mainTenant?.income_sources?.work_income?.documents) {
    totalDocuments += mainTenant.income_sources.work_income.documents.length
  }

  // Ajouter les documents des colocataires et garants...

  yPosition = addText(`Total des documents fournis: ${totalDocuments}`, margin, yPosition, { style: "bold" })
  yPosition = addText(`Dossier complété à ${rentalFile.completion_percentage}%`, margin, yPosition + 5)

  // Pied de page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth - margin, doc.internal.pageSize.height - 10, { align: "right" })
    doc.text("Dossier de location numérique - Conforme DossierFacile", margin, doc.internal.pageSize.height - 10)
  }

  // Télécharger le PDF
  const fileName = `dossier-location-${mainTenant?.first_name || "locataire"}-${mainTenant?.last_name || ""}.pdf`
  doc.save(fileName)
}

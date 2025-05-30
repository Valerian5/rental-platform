import { type RentalFileData, MAIN_ACTIVITIES, CURRENT_HOUSING_SITUATIONS } from "./rental-file-service"

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
    yPosition = addText(`Nom: ${mainTenant.last_name || "Non renseigné"}`, margin, yPosition)
    yPosition = addText(`Prénom: ${mainTenant.first_name || "Non renseigné"}`, margin, yPosition + 5)

    if (mainTenant.birth_date) {
      yPosition = addText(
        `Date de naissance: ${new Date(mainTenant.birth_date).toLocaleDateString("fr-FR")}`,
        margin,
        yPosition + 5,
      )
    }

    if (mainTenant.birth_place) {
      yPosition = addText(`Lieu de naissance: ${mainTenant.birth_place}`, margin, yPosition + 5)
    }

    yPosition = addText(`Nationalité: ${mainTenant.nationality || "Non renseignée"}`, margin, yPosition + 5)

    // Activité professionnelle
    yPosition += 10
    yPosition = addText("Activité professionnelle:", margin, yPosition, { style: "bold" })
    const activity = MAIN_ACTIVITIES.find((a) => a.value === mainTenant.main_activity)
    yPosition = addText(
      `${activity?.label || "Non renseignée"} - ${activity?.description || ""}`,
      margin + 5,
      yPosition + 5,
    )

    // Logement actuel
    yPosition += 10
    yPosition = addText("Logement actuel:", margin, yPosition, { style: "bold" })
    const housing = CURRENT_HOUSING_SITUATIONS.find((h) => h.value === mainTenant.current_housing_situation)
    yPosition = addText(
      `${housing?.label || "Non renseigné"} - ${housing?.description || ""}`,
      margin + 5,
      yPosition + 5,
    )

    // Revenus
    yPosition += 10
    yPosition = addText("Sources de revenus:", margin, yPosition, { style: "bold" })

    if (mainTenant.income_sources?.work_income) {
      yPosition = addText(
        `• Revenus du travail: ${mainTenant.income_sources.work_income.amount || 0}€/mois`,
        margin + 5,
        yPosition + 5,
      )
    }

    if (mainTenant.income_sources?.social_aid?.length > 0) {
      mainTenant.income_sources.social_aid.forEach((aid: any, index: number) => {
        yPosition = addText(
          `• Aide sociale ${index + 1}: ${aid.amount || 0}€/mois (${aid.type})`,
          margin + 5,
          yPosition + 5,
        )
      })
    }

    if (mainTenant.income_sources?.retirement_pension?.length > 0) {
      mainTenant.income_sources.retirement_pension.forEach((pension: any, index: number) => {
        yPosition = addText(
          `• Retraite/Pension ${index + 1}: ${pension.amount || 0}€/mois (${pension.type})`,
          margin + 5,
          yPosition + 5,
        )
      })
    }

    if (mainTenant.income_sources?.rent_income?.length > 0) {
      mainTenant.income_sources.rent_income.forEach((rent: any, index: number) => {
        yPosition = addText(`• Rente ${index + 1}: ${rent.amount || 0}€/mois (${rent.type})`, margin + 5, yPosition + 5)
      })
    }

    if (mainTenant.income_sources?.scholarship) {
      yPosition = addText(
        `• Bourse: ${mainTenant.income_sources.scholarship.amount || 0}€/mois`,
        margin + 5,
        yPosition + 5,
      )
    }

    // Documents fournis
    yPosition += 10
    yPosition = addText("Documents fournis:", margin, yPosition, { style: "bold" })

    if (mainTenant.identity_documents?.length > 0) {
      yPosition = addText(
        `• Pièces d'identité: ${mainTenant.identity_documents.length} document(s)`,
        margin + 5,
        yPosition + 5,
      )
    }

    if (mainTenant.activity_documents?.length > 0) {
      yPosition = addText(
        `• Justificatifs d'activité: ${mainTenant.activity_documents.length} document(s)`,
        margin + 5,
        yPosition + 5,
      )
    }

    if (mainTenant.tax_situation?.documents?.length > 0) {
      yPosition = addText(
        `• Documents fiscaux: ${mainTenant.tax_situation.documents.length} document(s)`,
        margin + 5,
        yPosition + 5,
      )
    }
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
        `${rentalFile.rental_situation === "couple" ? "Conjoint(e)" : `Colocataire ${index + 1}`}:`,
        margin,
        yPosition,
        { style: "bold" },
      )
      yPosition = addText(`${cotenant.first_name || ""} ${cotenant.last_name || ""}`, margin + 5, yPosition + 5)

      const cotenantActivity = MAIN_ACTIVITIES.find((a) => a.value === cotenant.main_activity)
      if (cotenantActivity) {
        yPosition = addText(`Activité: ${cotenantActivity.label}`, margin + 5, yPosition + 5)
      }
      yPosition += 10
    })
  }

  // Garants
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
      checkPageBreak(25)
      yPosition = addText(`Garant ${index + 1}:`, margin, yPosition, { style: "bold" })

      if (guarantor.type === "physical" && guarantor.personal_info) {
        yPosition = addText(
          `${guarantor.personal_info.first_name || ""} ${guarantor.personal_info.last_name || ""} (Personne physique)`,
          margin + 5,
          yPosition + 5,
        )
      } else if (guarantor.type === "organism") {
        yPosition = addText(
          `${guarantor.organism_type === "visale" ? "Garantie Visale" : guarantor.organism_name || "Organisme"} (Organisme)`,
          margin + 5,
          yPosition + 5,
        )
      } else if (guarantor.type === "moral_person") {
        yPosition = addText(
          `${guarantor.company_name || "Personne morale"} (Personne morale)`,
          margin + 5,
          yPosition + 5,
        )
      }
      yPosition += 10
    })
  }

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

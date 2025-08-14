import jsPDF from "jspdf"

interface PersonProfile {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  birth_date?: string
  birth_place?: string
  nationality?: string
  identity_documents?: string[]
  identity_documents_detailed?: any
  activity_documents?: string[]
  activity_documents_detailed?: any
  current_housing_situation?: string
  current_housing_documents?: any
  income_sources?: any
  tax_situation?: any
  main_activity?: string
  profession?: string
  company?: string
}

interface GuarantorInfo {
  type: "physical" | "organism" | "moral_person" | "none"
  personal_info?: PersonProfile
  organism_type?: string
  organism_name?: string
  company_name?: string
  kbis_documents?: string[]
}

interface RentalFileData {
  id: string
  tenant_id: string
  main_tenant: PersonProfile
  cotenants?: PersonProfile[]
  guarantors?: GuarantorInfo[]
  rental_situation?: "alone" | "couple" | "colocation"
  presentation_message?: string
  created_at: string
  updated_at: string
}

export async function generateRentalFilePDF(rentalFileData: RentalFileData): Promise<Blob> {
  const doc = new jsPDF()
  let yPosition = 20

  // Configuration des couleurs (design moderne et professionnel)
  const colors = {
    primary: [30, 58, 138], // Bleu foncé professionnel
    secondary: [71, 85, 105], // Gris ardoise
    accent: [16, 185, 129], // Vert émeraude
    text: [15, 23, 42], // Gris très foncé
    lightGray: [248, 250, 252], // Gris très clair
    border: [226, 232, 240], // Gris bordure
  }

  // Fonction utilitaire pour formater les montants
  const formatAmount = (amount: number | string): string => {
    const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
    if (isNaN(num)) return "0 €"
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  // Fonction pour ajouter du texte avec gestion des retours à la ligne
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    const fontSize = options.fontSize || 10
    const maxWidth = options.maxWidth || 170
    const lineHeight = options.lineHeight || 5

    doc.setFontSize(fontSize)
    doc.setFont("helvetica", options.bold ? "bold" : "normal")

    if (options.color) {
      doc.setTextColor(...options.color)
    } else {
      doc.setTextColor(...colors.text)
    }

    const lines = doc.splitTextToSize(text, maxWidth)
    lines.forEach((line: string, index: number) => {
      doc.text(line, x, y + index * lineHeight)
    })

    return y + lines.length * lineHeight
  }

  // Fonction pour vérifier si une nouvelle page est nécessaire
  const checkPageBreak = (requiredSpace = 20) => {
    if (yPosition + requiredSpace > 280) {
      doc.addPage()
      yPosition = 20
    }
  }

  // En-tête moderne
  doc.setFillColor(...colors.primary)
  doc.rect(0, 0, 210, 35, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("DOSSIER DE LOCATION", 105, 22, { align: "center" })

  yPosition = 50

  // Informations générales avec design moderne
  doc.setFillColor(...colors.lightGray)
  doc.rect(15, yPosition - 5, 180, 25, "F")

  yPosition = addText("INFORMATIONS GÉNÉRALES", 20, yPosition + 3, {
    fontSize: 14,
    bold: true,
    color: colors.primary,
  })
  yPosition += 5

  yPosition = addText(
    `Dossier créé le : ${new Date(rentalFileData.created_at).toLocaleDateString("fr-FR")}`,
    20,
    yPosition,
  )
  yPosition = addText(`Identifiant : ${rentalFileData.id}`, 20, yPosition)
  yPosition = addText(
    `Situation de location : ${rentalFileData.rental_situation === "alone" ? "Seul(e)" : rentalFileData.rental_situation === "couple" ? "En couple" : "En colocation"}`,
    20,
    yPosition,
  )
  yPosition += 15

  // Message de présentation
  if (rentalFileData.presentation_message) {
    checkPageBreak(30)
    doc.setFillColor(...colors.lightGray)
    doc.rect(15, yPosition - 5, 180, 8, "F")

    yPosition = addText("MESSAGE DE PRÉSENTATION", 20, yPosition + 1, {
      fontSize: 12,
      bold: true,
      color: colors.primary,
    })
    yPosition += 8

    yPosition = addText(rentalFileData.presentation_message, 20, yPosition, {
      maxWidth: 170,
      lineHeight: 4,
    })
    yPosition += 15
  }

  // Fonction pour calculer le total des revenus
  const calculateTotalIncome = (profile: PersonProfile): number => {
    let total = 0
    if (profile.income_sources) {
      // Revenus du travail
      if (profile.income_sources.work_income?.amount) {
        total += Number.parseFloat(profile.income_sources.work_income.amount.toString()) || 0
      }

      // Aides sociales
      if (profile.income_sources.social_aid) {
        profile.income_sources.social_aid.forEach((aid: any) => {
          total += Number.parseFloat(aid.amount?.toString() || "0") || 0
        })
      }

      // Pensions/retraites
      if (profile.income_sources.retirement_pension) {
        profile.income_sources.retirement_pension.forEach((pension: any) => {
          total += Number.parseFloat(pension.amount?.toString() || "0") || 0
        })
      }

      // Revenus locatifs/rentes
      if (profile.income_sources.rent_income) {
        profile.income_sources.rent_income.forEach((rent: any) => {
          total += Number.parseFloat(rent.amount?.toString() || "0") || 0
        })
      }

      // Bourses
      if (profile.income_sources.scholarship?.amount) {
        total += Number.parseFloat(profile.income_sources.scholarship.amount.toString()) || 0
      }
    }
    return total
  }

  // Fonction pour traiter un profil de personne
  const processPersonProfile = async (profile: PersonProfile, title: string, isGuarantor = false) => {
    checkPageBreak(50)

    // Titre de section avec design moderne
    doc.setFillColor(...colors.secondary)
    doc.rect(15, yPosition - 5, 180, 12, "F")

    yPosition = addText(title.toUpperCase(), 20, yPosition + 3, {
      fontSize: 14,
      bold: true,
      color: [255, 255, 255],
    })
    yPosition += 20

    // Identité
    if (profile.first_name || profile.last_name) {
      yPosition = addText("IDENTITÉ", 20, yPosition, {
        fontSize: 12,
        bold: true,
        color: colors.primary,
      })
      yPosition += 5

      if (profile.first_name && profile.last_name) {
        yPosition = addText(`Nom complet : ${profile.first_name} ${profile.last_name}`, 25, yPosition)
      }
      if (profile.birth_date) {
        yPosition = addText(
          `Date de naissance : ${new Date(profile.birth_date).toLocaleDateString("fr-FR")}`,
          25,
          yPosition,
        )
      }
      if (profile.birth_place) {
        yPosition = addText(`Lieu de naissance : ${profile.birth_place}`, 25, yPosition)
      }
      if (profile.nationality) {
        yPosition = addText(`Nationalité : ${profile.nationality}`, 25, yPosition)
      }
      if (profile.email) {
        yPosition = addText(`Email : ${profile.email}`, 25, yPosition)
      }
      if (profile.phone) {
        yPosition = addText(`Téléphone : ${profile.phone}`, 25, yPosition)
      }
      yPosition += 10
    }

    // Situation de logement actuelle
    if (profile.current_housing_situation) {
      checkPageBreak(25)
      yPosition = addText("SITUATION DE LOGEMENT ACTUELLE", 20, yPosition, {
        fontSize: 12,
        bold: true,
        color: colors.primary,
      })
      yPosition += 5

      const housingLabels: { [key: string]: string } = {
        locataire: "Locataire",
        proprietaire: "Propriétaire",
        heberge: "Hébergé(e)",
      }

      yPosition = addText(
        `Situation : ${housingLabels[profile.current_housing_situation] || profile.current_housing_situation}`,
        25,
        yPosition,
      )
      yPosition += 10
    }

    // Activité professionnelle
    if (profile.main_activity || profile.profession) {
      checkPageBreak(30)
      yPosition = addText("ACTIVITÉ PROFESSIONNELLE", 20, yPosition, {
        fontSize: 12,
        bold: true,
        color: colors.primary,
      })
      yPosition += 5

      if (profile.main_activity) {
        const activityLabels: { [key: string]: string } = {
          cdi: "CDI",
          cdd: "CDD",
          fonction_publique: "Fonction publique",
          independant: "Indépendant",
          retraite: "Retraité",
          chomage: "Demandeur d'emploi",
          etudes: "Étudiant",
          alternance: "Alternance",
        }
        yPosition = addText(
          `Activité : ${activityLabels[profile.main_activity] || profile.main_activity}`,
          25,
          yPosition,
        )
      }
      if (profile.profession) {
        yPosition = addText(`Profession : ${profile.profession}`, 25, yPosition)
      }
      if (profile.company) {
        yPosition = addText(`Entreprise : ${profile.company}`, 25, yPosition)
      }
      yPosition += 10
    }

    // Revenus détaillés
    if (profile.income_sources && Object.keys(profile.income_sources).length > 0) {
      checkPageBreak(40)
      yPosition = addText("REVENUS MENSUELS", 20, yPosition, {
        fontSize: 12,
        bold: true,
        color: colors.primary,
      })
      yPosition += 5

      let totalIncome = 0

      // Revenus du travail
      if (profile.income_sources.work_income?.amount) {
        const amount = Number.parseFloat(profile.income_sources.work_income.amount.toString()) || 0
        totalIncome += amount
        yPosition = addText(`Revenus du travail : ${formatAmount(amount)}`, 25, yPosition)
      }

      // Aides sociales
      if (profile.income_sources.social_aid && profile.income_sources.social_aid.length > 0) {
        profile.income_sources.social_aid.forEach((aid: any, index: number) => {
          const amount = Number.parseFloat(aid.amount?.toString() || "0") || 0
          totalIncome += amount
          const aidLabels: { [key: string]: string } = {
            caf_msa: "Aide CAF/MSA",
            france_travail: "Aide France Travail",
            apl_aah: "APL/AAH",
            autre: "Autre aide",
          }
          yPosition = addText(`${aidLabels[aid.type] || aid.type} : ${formatAmount(amount)}`, 25, yPosition)
        })
      }

      // Pensions/retraites
      if (profile.income_sources.retirement_pension && profile.income_sources.retirement_pension.length > 0) {
        profile.income_sources.retirement_pension.forEach((pension: any, index: number) => {
          const amount = Number.parseFloat(pension.amount?.toString() || "0") || 0
          totalIncome += amount
          const pensionLabels: { [key: string]: string } = {
            retraite: "Retraite",
            pension_invalidite: "Pension d'invalidité",
            pension_alimentaire: "Pension alimentaire",
          }
          yPosition = addText(`${pensionLabels[pension.type] || pension.type} : ${formatAmount(amount)}`, 25, yPosition)
        })
      }

      // Revenus locatifs/rentes
      if (profile.income_sources.rent_income && profile.income_sources.rent_income.length > 0) {
        profile.income_sources.rent_income.forEach((rent: any, index: number) => {
          const amount = Number.parseFloat(rent.amount?.toString() || "0") || 0
          totalIncome += amount
          const rentLabels: { [key: string]: string } = {
            revenus_locatifs: "Revenus locatifs",
            rente_viagere: "Rente viagère",
            autre_rente: "Autre rente",
          }
          yPosition = addText(`${rentLabels[rent.type] || rent.type} : ${formatAmount(amount)}`, 25, yPosition)
        })
      }

      // Bourses
      if (profile.income_sources.scholarship?.amount) {
        const amount = Number.parseFloat(profile.income_sources.scholarship.amount.toString()) || 0
        totalIncome += amount
        yPosition = addText(`Bourse : ${formatAmount(amount)}`, 25, yPosition)
      }

      // Total avec mise en évidence
      yPosition += 3
      doc.setFillColor(...colors.accent)
      doc.rect(20, yPosition - 2, 170, 8, "F")
      yPosition = addText(`TOTAL MENSUEL : ${formatAmount(totalIncome)}`, 25, yPosition + 2, {
        bold: true,
        color: [255, 255, 255],
      })
      yPosition += 10
    }

    // Situation fiscale
    if (profile.tax_situation?.type) {
      checkPageBreak(25)
      yPosition = addText("SITUATION FISCALE", 20, yPosition, {
        fontSize: 12,
        bold: true,
        color: colors.primary,
      })
      yPosition += 5

      const taxLabels: { [key: string]: string } = {
        own_notice: "Avis d'imposition personnel",
        attached_to_parents: "Rattaché au foyer fiscal des parents",
        less_than_year: "Moins d'un an en France",
        other: "Autre situation",
      }

      yPosition = addText(
        `Situation : ${taxLabels[profile.tax_situation.type] || profile.tax_situation.type}`,
        25,
        yPosition,
      )

      if (profile.tax_situation.explanation) {
        yPosition = addText(`Explication : ${profile.tax_situation.explanation}`, 25, yPosition, {
          maxWidth: 160,
          lineHeight: 4,
        })
      }
      yPosition += 10
    }

    // Documents fournis avec comptage détaillé
    checkPageBreak(30)
    yPosition = addText("DOCUMENTS FOURNIS", 20, yPosition, {
      fontSize: 12,
      bold: true,
      color: colors.primary,
    })
    yPosition += 5

    let totalDocuments = 0

    // Documents d'identité
    if (profile.identity_documents?.length || profile.identity_documents_detailed) {
      const count =
        profile.identity_documents?.length ||
        (profile.identity_documents_detailed ? Object.keys(profile.identity_documents_detailed).length : 0)
      if (count > 0) {
        totalDocuments += count
        yPosition = addText(`✓ Pièces d'identité (${count} document${count > 1 ? "s" : ""})`, 25, yPosition, {
          color: colors.accent,
        })
      }
    }

    // Documents d'activité
    if (profile.activity_documents?.length || profile.activity_documents_detailed) {
      const count = profile.activity_documents?.length || (profile.activity_documents_detailed ? 1 : 0)
      if (count > 0) {
        totalDocuments += count
        yPosition = addText(`✓ Justificatifs d'activité (${count} document${count > 1 ? "s" : ""})`, 25, yPosition, {
          color: colors.accent,
        })
      }
    }

    // Documents de logement
    if (profile.current_housing_documents) {
      let housingDocsCount = 0
      Object.entries(profile.current_housing_documents).forEach(([key, docs]: [string, any]) => {
        if (Array.isArray(docs)) {
          housingDocsCount += docs.length
        } else if (typeof docs === "object" && docs !== null) {
          housingDocsCount += Object.keys(docs).length
        }
      })
      if (housingDocsCount > 0) {
        totalDocuments += housingDocsCount
        yPosition = addText(
          `✓ Justificatifs de logement (${housingDocsCount} document${housingDocsCount > 1 ? "s" : ""})`,
          25,
          yPosition,
          {
            color: colors.accent,
          },
        )
      }
    }

    // Documents fiscaux
    if (profile.tax_situation?.documents?.length || profile.tax_situation?.documents_detailed) {
      const count = profile.tax_situation?.documents?.length || (profile.tax_situation?.documents_detailed ? 1 : 0)
      if (count > 0) {
        totalDocuments += count
        yPosition = addText(`✓ Avis d'imposition (${count} document${count > 1 ? "s" : ""})`, 25, yPosition, {
          color: colors.accent,
        })
      }
    }

    // Documents de revenus (justificatifs d'aides, bulletins de salaire, etc.)
    if (profile.income_sources) {
      let incomeDocsCount = 0

      // Compter tous les documents de revenus
      if (profile.income_sources.work_income?.documents) {
        incomeDocsCount += profile.income_sources.work_income.documents.length
      }

      if (profile.income_sources.social_aid) {
        profile.income_sources.social_aid.forEach((aid: any) => {
          if (aid.documents) incomeDocsCount += aid.documents.length
        })
      }

      if (profile.income_sources.retirement_pension) {
        profile.income_sources.retirement_pension.forEach((pension: any) => {
          if (pension.documents) incomeDocsCount += pension.documents.length
        })
      }

      if (profile.income_sources.rent_income) {
        profile.income_sources.rent_income.forEach((rent: any) => {
          if (rent.documents) incomeDocsCount += rent.documents.length
        })
      }

      if (profile.income_sources.scholarship?.documents) {
        incomeDocsCount += profile.income_sources.scholarship.documents.length
      }

      if (incomeDocsCount > 0) {
        totalDocuments += incomeDocsCount
        yPosition = addText(
          `✓ Justificatifs de revenus (${incomeDocsCount} document${incomeDocsCount > 1 ? "s" : ""})`,
          25,
          yPosition,
          {
            color: colors.accent,
          },
        )
      }
    }

    if (totalDocuments === 0) {
      yPosition = addText("Aucun document fourni", 25, yPosition, {
        color: [239, 68, 68], // Rouge
      })
    }

    yPosition += 15
    return yPosition
  }

  // Traitement du locataire principal
  if (rentalFileData.main_tenant) {
    yPosition = await processPersonProfile(rentalFileData.main_tenant, "LOCATAIRE PRINCIPAL")
  }

  // Traitement des colocataires/conjoints
  if (rentalFileData.cotenants && rentalFileData.cotenants.length > 0) {
    for (let i = 0; i < rentalFileData.cotenants.length; i++) {
      const cotenant = rentalFileData.cotenants[i]
      const title = rentalFileData.rental_situation === "couple" ? `CONJOINT(E) ${i + 1}` : `CO-LOCATAIRE ${i + 1}`
      yPosition = await processPersonProfile(cotenant, title)
    }
  }

  // Traitement des garants
  if (rentalFileData.guarantors && rentalFileData.guarantors.length > 0) {
    for (let i = 0; i < rentalFileData.guarantors.length; i++) {
      const guarantor = rentalFileData.guarantors[i]

      if (guarantor.type === "physical" && guarantor.personal_info) {
        yPosition = await processPersonProfile(guarantor.personal_info, `GARANT ${i + 1}`, true)
      } else if (guarantor.type === "organism") {
        checkPageBreak(30)
        doc.setFillColor(...colors.secondary)
        doc.rect(15, yPosition - 5, 180, 12, "F")

        yPosition = addText(`GARANT ${i + 1} - ORGANISME`, 20, yPosition + 3, {
          fontSize: 14,
          bold: true,
          color: [255, 255, 255],
        })
        yPosition += 15

        yPosition = addText(`Type d'organisme : ${guarantor.organism_type || "Non spécifié"}`, 25, yPosition)
        if (guarantor.organism_name) {
          yPosition = addText(`Nom : ${guarantor.organism_name}`, 25, yPosition)
        }
        yPosition += 15
      } else if (guarantor.type === "moral_person") {
        checkPageBreak(30)
        doc.setFillColor(...colors.secondary)
        doc.rect(15, yPosition - 5, 180, 12, "F")

        yPosition = addText(`GARANT ${i + 1} - PERSONNE MORALE`, 20, yPosition + 3, {
          fontSize: 14,
          bold: true,
          color: [255, 255, 255],
        })
        yPosition += 15

        if (guarantor.company_name) {
          yPosition = addText(`Entreprise : ${guarantor.company_name}`, 25, yPosition)
        }
        if (guarantor.kbis_documents?.length) {
          yPosition = addText(
            `✓ Documents Kbis (${guarantor.kbis_documents.length} document${guarantor.kbis_documents.length > 1 ? "s" : ""})`,
            25,
            yPosition,
            {
              color: colors.accent,
            },
          )
        }
        yPosition += 15
      }
    }
  }

  // Synthèse finale moderne
  checkPageBreak(80)
  doc.setFillColor(...colors.primary)
  doc.rect(15, yPosition - 5, 180, 12, "F")

  yPosition = addText("SYNTHÈSE DU DOSSIER", 20, yPosition + 3, {
    fontSize: 16,
    bold: true,
    color: [255, 255, 255],
  })
  yPosition += 20

  // Calcul des totaux
  const allProfiles = [rentalFileData.main_tenant, ...(rentalFileData.cotenants || [])]
  let totalHouseholdIncome = 0
  let totalPersons = 0
  let totalDocuments = 0

  allProfiles.forEach((profile) => {
    if (profile) {
      totalPersons++
      totalHouseholdIncome += calculateTotalIncome(profile)

      // Compter tous les documents
      if (profile.identity_documents?.length) totalDocuments += profile.identity_documents.length
      if (profile.activity_documents?.length) totalDocuments += profile.activity_documents.length
      if (profile.tax_situation?.documents?.length) totalDocuments += profile.tax_situation.documents.length
      if (profile.current_housing_documents) {
        Object.values(profile.current_housing_documents).forEach((docs: any) => {
          if (Array.isArray(docs)) totalDocuments += docs.length
          else if (typeof docs === "object" && docs !== null) totalDocuments += Object.keys(docs).length
        })
      }
    }
  })

  // Ajouter les documents des garants
  if (rentalFileData.guarantors) {
    rentalFileData.guarantors.forEach((guarantor) => {
      if (guarantor.type === "physical" && guarantor.personal_info) {
        totalDocuments += calculateTotalIncome(guarantor.personal_info) // Réutiliser la fonction pour compter
      }
      if (guarantor.kbis_documents?.length) {
        totalDocuments += guarantor.kbis_documents.length
      }
    })
  }

  // Affichage de la synthèse avec design moderne
  doc.setFillColor(...colors.lightGray)
  doc.rect(15, yPosition - 5, 180, 35, "F")

  yPosition = addText(`Nombre de personnes : ${totalPersons}`, 20, yPosition + 5, {
    fontSize: 11,
    bold: true,
  })
  yPosition = addText(`Revenus totaux du foyer : ${formatAmount(totalHouseholdIncome)}`, 20, yPosition, {
    fontSize: 11,
    bold: true,
    color: colors.accent,
  })
  yPosition = addText(`Nombre total de documents : ${totalDocuments}`, 20, yPosition, {
    fontSize: 11,
    bold: true,
  })
  yPosition = addText(`Nombre de garants : ${rentalFileData.guarantors?.length || 0}`, 20, yPosition, {
    fontSize: 11,
    bold: true,
  })

  // Pied de page moderne
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(`Page ${i} sur ${pageCount}`, 105, 290, { align: "center" })
    doc.text(
      `Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`,
      105,
      295,
      { align: "center" },
    )
  }

  return doc.output("blob")
}

// Fonction utilitaire pour télécharger le PDF - IDENTIQUE À L'ORIGINAL
export function downloadPDF(blob: Blob, filename = "dossier-location.pdf") {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Fonction pour générer et télécharger le PDF - IDENTIQUE À L'ORIGINAL
export async function generateAndDownloadRentalFilePDF(rentalFileData: RentalFileData, filename?: string) {
  try {
    const pdfBlob = await generateRentalFilePDF(rentalFileData)
    const finalFilename = filename || `dossier-location-${rentalFileData.id}.pdf`
    downloadPDF(pdfBlob, finalFilename)
    return true
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error)
    throw error
  }
}

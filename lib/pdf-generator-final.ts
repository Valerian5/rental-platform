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
    const accentColor = [16, 185, 129] // Vert pour les montants RGB
    const grayColor = [107, 114, 128] // Gris pour les labels
    const lightGrayColor = [243, 244, 246] // Gris clair pour les fonds

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

    // Fonction pour calculer les revenus totaux
    const calculateTotalIncomeForPerson = (incomeSources: any): number => {
      let total = 0
      if (incomeSources?.work_income?.amount) total += incomeSources.work_income.amount
      if (incomeSources?.social_aid) {
        incomeSources.social_aid.forEach((aid: any) => {
          total += aid.amount || 0
        })
      }
      if (incomeSources?.retirement_pension) {
        incomeSources.retirement_pension.forEach((pension: any) => {
          total += pension.amount || 0
        })
      }
      if (incomeSources?.rent_income) {
        incomeSources.rent_income.forEach((rent: any) => {
          total += rent.amount || 0
        })
      }
      if (incomeSources?.scholarship?.amount) total += incomeSources.scholarship.amount
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

    // Fonction pour ajouter le logo
    const addLogo = async (x: number, y: number, size = 25, logoUrl?: string) => {
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

            const imgFormat = logoUrl.toLowerCase().includes(".png") ? "PNG" : "JPEG"
            doc.addImage(base64Data, imgFormat, x, y, size, size * 0.6)
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

    // Fonction pour ajouter un en-tête de page amélioré
    const addPageHeader = async (title: string): Promise<number> => {
      // Fond dégradé simulé avec plusieurs rectangles
      for (let i = 0; i < 35; i++) {
        const opacity = 1 - i * 0.01
        doc.setFillColor(primaryColor[0] * opacity, primaryColor[1] * opacity, primaryColor[2] * opacity)
        doc.rect(0, i, pageWidth, 1, "F")
      }

      // Logo
      await addLogo(pageWidth - margin - 30, 5, 25, logos.pdf || logos.main)

      // Titre principal
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text(title, margin, 20)

      // Sous-titre
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(siteInfo.title || "Louer Ici", margin, 28)

      return 50
    }

    // Fonction pour ajouter une section avec fond coloré
    const addSectionTitle = (title: string, y: number, color = primaryColor): number => {
      // Fond coloré pour le titre
      doc.setFillColor(color[0], color[1], color[2])
      doc.rect(margin - 5, y - 5, pageWidth - 2 * margin + 10, 20, "F")

      // Titre de section
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(title, margin, y + 5)

      return y + 25
    }

    // Fonction pour ajouter une propriété avec design amélioré
    const addProperty = async (
      label: string,
      value: string,
      x: number,
      y: number,
      options: any = {},
    ): Promise<number> => {
      if (y > pageHeight - 40) {
        doc.addPage()
        y = await addPageHeader("DOSSIER DE LOCATION (SUITE)")
      }

      // Fond gris clair pour la propriété
      if (options.background) {
        doc.setFillColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2])
        doc.rect(x - 3, y - 3, 85, 16, "F")
      }

      // Label
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text(label, x, y)

      // Valeur
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      doc.setFont("helvetica", options.bold ? "bold" : "normal")

      const displayValue = value || "Non renseigné"
      doc.text(displayValue, x, y + 8)

      return y + 20
    }

    // Fonction pour ajouter un montant avec design amélioré
    const addAmount = async (label: string, amount: number, x: number, y: number): Promise<number> => {
      if (y > pageHeight - 40) {
        doc.addPage()
        y = await addPageHeader("DOSSIER DE LOCATION (SUITE)")
      }

      // Fond vert clair pour les montants
      doc.setFillColor(240, 253, 244)
      doc.rect(x - 3, y - 3, 85, 16, "F")

      // Label
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text(label, x, y)

      // Montant
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2])
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text(formatAmount(amount), x, y + 8)

      return y + 20
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

    // PAGE DE COUVERTURE AMÉLIORÉE
    yPosition = await addPageHeader("DOSSIER DE LOCATION")

    // Nom du locataire (centré et grand)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(28)
    doc.setFont("helvetica", "bold")
    const nameWidth = doc.getTextWidth(tenantName)
    doc.text(tenantName, (pageWidth - nameWidth) / 2, yPosition + 20)

    yPosition += 50

    // Encadré de synthèse amélioré
    doc.setFillColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2])
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 80, "F")
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(2)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 80, "S")

    yPosition += 15

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("SYNTHÈSE DU DOSSIER", pageWidth / 2, yPosition, { align: "center" })

    yPosition += 20

    // Synthèse améliorée avec revenus totaux
    const synthese = []

    // Type de location
    if (rentalFile.rental_situation === "alone") {
      synthese.push("📍 Location individuelle")
    } else if (rentalFile.rental_situation === "couple") {
      synthese.push("👫 Location en couple")
    } else {
      synthese.push("🏠 Colocation")
    }

    // Nombre de personnes
    const totalPersons = 1 + (rentalFile.cotenants?.length || 0)
    synthese.push(`👥 ${totalPersons} personne${totalPersons > 1 ? "s" : ""} dans le dossier`)

    // Revenus totaux
    if (totalHouseholdIncome > 0) {
      synthese.push(`💰 Revenus totaux: ${formatAmount(totalHouseholdIncome)}`)
    }

    // Garants
    const guarantorsCount = rentalFile.guarantors?.length || 0
    if (guarantorsCount > 0) {
      synthese.push(`🛡️ ${guarantorsCount} garant${guarantorsCount > 1 ? "s" : ""}`)
    } else {
      synthese.push("⚠️ Aucun garant")
    }

    // Afficher la synthèse
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")

    synthese.forEach((item) => {
      doc.text(item, pageWidth / 2, yPosition, { align: "center" })
      yPosition += 12
    })

    yPosition += 30

    // Date de génération
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.setFontSize(10)
    doc.text(
      `Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`,
      pageWidth / 2,
      yPosition,
      {
        align: "center",
      },
    )

    // PAGE LOCATAIRE PRINCIPAL AMÉLIORÉE
    doc.addPage()
    yPosition = await addPageHeader("LOCATAIRE PRINCIPAL")

    if (mainTenant) {
      // Informations personnelles
      yPosition = addSectionTitle("👤 INFORMATIONS PERSONNELLES", yPosition)

      const colWidth = (pageWidth - 2 * margin - 20) / 2
      const col2X = margin + colWidth + 20

      let col1Y = yPosition
      let col2Y = yPosition

      col1Y = await addProperty("Nom", mainTenant.last_name || "", margin, col1Y, { background: true })
      col2Y = await addProperty("Prénom", mainTenant.first_name || "", col2X, col2Y, { background: true })

      col1Y = await addProperty("Date de naissance", mainTenant.birth_date || "", margin, col1Y)
      col2Y = await addProperty("Lieu de naissance", mainTenant.birth_place || "", col2X, col2Y)

      col1Y = await addProperty("Nationalité", mainTenant.nationality || "", margin, col1Y, { background: true })
      col2Y = await addProperty("Situation logement", mainTenant.current_housing_situation || "", col2X, col2Y, {
        background: true,
      })

      yPosition = Math.max(col1Y, col2Y) + 10

      // Situation professionnelle
      yPosition = addSectionTitle("💼 SITUATION PROFESSIONNELLE", yPosition)

      const activity = MAIN_ACTIVITIES.find((a) => a.value === mainTenant.main_activity)
      yPosition = await addProperty(
        "Activité principale",
        activity?.label || mainTenant.main_activity || "",
        margin,
        yPosition,
        { bold: true, background: true },
      )

      if (mainTenant.profession) {
        yPosition = await addProperty("Profession", mainTenant.profession, margin, yPosition)
      }

      if (mainTenant.company) {
        yPosition = await addProperty("Entreprise", mainTenant.company, margin, yPosition, { background: true })
      }

      yPosition += 10

      // Revenus
      yPosition = addSectionTitle("💰 REVENUS", yPosition, accentColor)

      if (mainTenant.income_sources?.work_income?.amount) {
        yPosition = await addAmount(
          "Revenus du travail (mensuel)",
          mainTenant.income_sources.work_income.amount,
          margin,
          yPosition,
        )
      }

      // Autres revenus
      if (mainTenant.income_sources?.social_aid && mainTenant.income_sources.social_aid.length > 0) {
        for (let index = 0; index < mainTenant.income_sources.social_aid.length; index++) {
          const aid = mainTenant.income_sources.social_aid[index]
          if (aid.amount) {
            yPosition = await addAmount(`Aide sociale ${index + 1}`, aid.amount, margin, yPosition)
          }
        }
      }

      if (mainTenant.income_sources?.retirement_pension && mainTenant.income_sources.retirement_pension.length > 0) {
        for (let index = 0; index < mainTenant.income_sources.retirement_pension.length; index++) {
          const pension = mainTenant.income_sources.retirement_pension[index]
          if (pension.amount) {
            yPosition = await addAmount(`Retraite/Pension ${index + 1}`, pension.amount, margin, yPosition)
          }
        }
      }

      if (mainTenant.income_sources?.rent_income && mainTenant.income_sources.rent_income.length > 0) {
        for (let index = 0; index < mainTenant.income_sources.rent_income.length; index++) {
          const rent = mainTenant.income_sources.rent_income[index]
          if (rent.amount) {
            yPosition = await addAmount(`Rente ${index + 1}`, rent.amount, margin, yPosition)
          }
        }
      }

      if (mainTenant.income_sources?.scholarship?.amount) {
        yPosition = await addAmount("Bourse", mainTenant.income_sources.scholarship.amount, margin, yPosition)
      }
    }

    // PAGES COLOCATAIRES/CONJOINT AMÉLIORÉES
    if (rentalFile.cotenants && rentalFile.cotenants.length > 0) {
      for (let index = 0; index < rentalFile.cotenants.length; index++) {
        const cotenant = rentalFile.cotenants[index]
        const cotenantTitle = rentalFile.rental_situation === "couple" ? "CONJOINT(E)" : `COLOCATAIRE ${index + 1}`

        doc.addPage()
        yPosition = await addPageHeader(cotenantTitle)

        // Informations personnelles du colocataire
        yPosition = addSectionTitle("👤 INFORMATIONS PERSONNELLES", yPosition)

        const colWidth = (pageWidth - 2 * margin - 20) / 2
        const col2X = margin + colWidth + 20

        let col1Y = yPosition
        let col2Y = yPosition

        col1Y = await addProperty("Nom", cotenant.last_name || "", margin, col1Y, { background: true })
        col2Y = await addProperty("Prénom", cotenant.first_name || "", col2X, col2Y, { background: true })

        col1Y = await addProperty("Date de naissance", cotenant.birth_date || "", margin, col1Y)
        col2Y = await addProperty("Lieu de naissance", cotenant.birth_place || "", col2X, col2Y)

        col1Y = await addProperty("Nationalité", cotenant.nationality || "", margin, col1Y, { background: true })
        col2Y = await addProperty("Situation logement", cotenant.current_housing_situation || "", col2X, col2Y, {
          background: true,
        })

        yPosition = Math.max(col1Y, col2Y) + 10

        // Situation professionnelle du colocataire
        if (cotenant.main_activity) {
          yPosition = addSectionTitle("💼 SITUATION PROFESSIONNELLE", yPosition)
          const cotenantActivity = MAIN_ACTIVITIES.find((a) => a.value === cotenant.main_activity)
          yPosition = await addProperty(
            "Activité principale",
            cotenantActivity?.label || cotenant.main_activity,
            margin,
            yPosition,
            { bold: true, background: true },
          )

          if (cotenant.profession) {
            yPosition = await addProperty("Profession", cotenant.profession, margin, yPosition)
          }

          if (cotenant.company) {
            yPosition = await addProperty("Entreprise", cotenant.company, margin, yPosition, { background: true })
          }
        }

        // Revenus du colocataire
        if (cotenant.income_sources) {
          yPosition += 10
          yPosition = addSectionTitle("💰 REVENUS", yPosition, accentColor)

          if (cotenant.income_sources.work_income?.amount) {
            yPosition = await addAmount(
              "Revenus du travail (mensuel)",
              cotenant.income_sources.work_income.amount,
              margin,
              yPosition,
            )
          }

          // Autres revenus du colocataire
          if (cotenant.income_sources.social_aid && cotenant.income_sources.social_aid.length > 0) {
            for (let aidIndex = 0; aidIndex < cotenant.income_sources.social_aid.length; aidIndex++) {
              const aid = cotenant.income_sources.social_aid[aidIndex]
              if (aid.amount) {
                yPosition = await addAmount(`Aide sociale ${aidIndex + 1}`, aid.amount, margin, yPosition)
              }
            }
          }

          if (cotenant.income_sources.scholarship?.amount) {
            yPosition = await addAmount("Bourse", cotenant.income_sources.scholarship.amount, margin, yPosition)
          }
        }
      }
    }

    // PAGES GARANTS AMÉLIORÉES
    if (rentalFile.guarantors && rentalFile.guarantors.length > 0) {
      for (let index = 0; index < rentalFile.guarantors.length; index++) {
        const guarantor = rentalFile.guarantors[index]
        doc.addPage()
        yPosition = await addPageHeader(`GARANT ${index + 1}`)

        yPosition = addSectionTitle("🛡️ TYPE DE GARANT", yPosition, [147, 51, 234]) // Violet pour les garants

        let guarantorTypeLabel = ""
        if (guarantor.type === "physical") guarantorTypeLabel = "Personne physique"
        else if (guarantor.type === "organism") guarantorTypeLabel = "Organisme"
        else if (guarantor.type === "moral_person") guarantorTypeLabel = "Personne morale"

        yPosition = await addProperty("Type", guarantorTypeLabel, margin, yPosition, { bold: true, background: true })

        if (guarantor.type === "organism") {
          if (guarantor.organism_type === "visale") {
            yPosition = await addProperty("Organisme", "Garantie Visale", margin, yPosition, { background: true })
          } else if (guarantor.organism_name) {
            yPosition = await addProperty("Organisme", guarantor.organism_name, margin, yPosition, { background: true })
          }
        } else if (guarantor.type === "moral_person" && guarantor.company_name) {
          yPosition = await addProperty("Entreprise", guarantor.company_name, margin, yPosition, { background: true })
        }

        if (guarantor.personal_info) {
          const guarantorInfo = guarantor.personal_info

          yPosition += 10
          yPosition = addSectionTitle("👤 INFORMATIONS PERSONNELLES", yPosition)

          const colWidth = (pageWidth - 2 * margin - 20) / 2
          const col2X = margin + colWidth + 20

          let col1Y = yPosition
          let col2Y = yPosition

          col1Y = await addProperty("Nom", guarantorInfo.last_name || "", margin, col1Y, { background: true })
          col2Y = await addProperty("Prénom", guarantorInfo.first_name || "", col2X, col2Y, { background: true })

          if (guarantorInfo.birth_date) {
            col1Y = await addProperty("Date de naissance", guarantorInfo.birth_date, margin, col1Y)
          }

          if (guarantorInfo.nationality) {
            col2Y = await addProperty("Nationalité", guarantorInfo.nationality, col2X, col2Y)
          }

          if (guarantorInfo.current_housing_situation) {
            col1Y = await addProperty("Situation logement", guarantorInfo.current_housing_situation, margin, col1Y, {
              background: true,
            })
          }

          yPosition = Math.max(col1Y, col2Y) + 10

          // Situation professionnelle du garant
          if (guarantorInfo.main_activity) {
            yPosition = addSectionTitle("💼 SITUATION PROFESSIONNELLE", yPosition)
            const guarantorActivity = MAIN_ACTIVITIES.find((a) => a.value === guarantorInfo.main_activity)
            yPosition = await addProperty(
              "Activité principale",
              guarantorActivity?.label || guarantorInfo.main_activity,
              margin,
              yPosition,
              { bold: true, background: true },
            )

            if (guarantorInfo.profession) {
              yPosition = await addProperty("Profession", guarantorInfo.profession, margin, yPosition)
            }

            if (guarantorInfo.company) {
              yPosition = await addProperty("Entreprise", guarantorInfo.company, margin, yPosition, {
                background: true,
              })
            }
          }

          // Revenus du garant
          if (guarantorInfo.income_sources) {
            yPosition += 10
            yPosition = addSectionTitle("💰 REVENUS", yPosition, accentColor)

            if (guarantorInfo.income_sources.work_income?.amount) {
              yPosition = await addAmount(
                "Revenus du travail (mensuel)",
                guarantorInfo.income_sources.work_income.amount,
                margin,
                yPosition,
              )
            }

            // Autres revenus du garant
            if (guarantorInfo.income_sources.social_aid && guarantorInfo.income_sources.social_aid.length > 0) {
              for (let aidIndex = 0; aidIndex < guarantorInfo.income_sources.social_aid.length; aidIndex++) {
                const aid = guarantorInfo.income_sources.social_aid[aidIndex]
                if (aid.amount) {
                  yPosition = await addAmount(`Aide sociale ${aidIndex + 1}`, aid.amount, margin, yPosition)
                }
              }
            }

            if (guarantorInfo.income_sources.scholarship?.amount) {
              yPosition = await addAmount("Bourse", guarantorInfo.income_sources.scholarship.amount, margin, yPosition)
            }
          }
        }
      }
    }

    // COLLECTE COMPLÈTE DES DOCUMENTS
    const documentsToProcess = []

    // Documents du locataire principal
    if (mainTenant) {
      // Documents d'identité
      if (mainTenant.identity_documents && Array.isArray(mainTenant.identity_documents)) {
        mainTenant.identity_documents.forEach((doc, index) => {
          documentsToProcess.push({
            url: doc,
            name: `Locataire principal - Pièce d'identité ${index + 1}`,
            category: "identity",
          })
        })
      }

      // Documents d'activité
      if (mainTenant.activity_documents && Array.isArray(mainTenant.activity_documents)) {
        mainTenant.activity_documents.forEach((doc, index) => {
          documentsToProcess.push({
            url: doc,
            name: `Locataire principal - Justificatif d'activité ${index + 1}`,
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
            name: `Locataire principal - Justificatif de revenu ${index + 1}`,
            category: "income",
          })
        })
      }

      // Documents fiscaux
      if (mainTenant.tax_situation?.documents && Array.isArray(mainTenant.tax_situation.documents)) {
        mainTenant.tax_situation.documents.forEach((doc, index) => {
          documentsToProcess.push({
            url: doc,
            name: `Locataire principal - Document fiscal ${index + 1}`,
            category: "tax",
          })
        })
      }

      // Documents de logement
      if (
        mainTenant.current_housing_documents?.quittances_loyer &&
        Array.isArray(mainTenant.current_housing_documents.quittances_loyer)
      ) {
        mainTenant.current_housing_documents.quittances_loyer.forEach((doc, index) => {
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
        mainTenant.current_housing_documents.attestation_hebergement.forEach((doc, index) => {
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
        mainTenant.current_housing_documents.avis_taxe_fonciere.forEach((doc, index) => {
          documentsToProcess.push({
            url: doc,
            name: `Locataire principal - Taxe foncière ${index + 1}`,
            category: "housing",
          })
        })
      }
    }

    // Documents des colocataires/conjoint
    if (rentalFile.cotenants && Array.isArray(rentalFile.cotenants)) {
      rentalFile.cotenants.forEach((cotenant, cIndex) => {
        const cotenantLabel = rentalFile.rental_situation === "couple" ? "Conjoint(e)" : `Colocataire ${cIndex + 1}`

        // Documents d'identité des colocataires
        if (cotenant.identity_documents && Array.isArray(cotenant.identity_documents)) {
          cotenant.identity_documents.forEach((doc, index) => {
            documentsToProcess.push({
              url: doc,
              name: `${cotenantLabel} - Pièce d'identité ${index + 1}`,
              category: "cotenant_identity",
            })
          })
        }

        // Documents d'activité des colocataires
        if (cotenant.activity_documents && Array.isArray(cotenant.activity_documents)) {
          cotenant.activity_documents.forEach((doc, index) => {
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
          cotenant.income_sources.work_income.documents.forEach((doc, index) => {
            documentsToProcess.push({
              url: doc,
              name: `${cotenantLabel} - Justificatif de revenu ${index + 1}`,
              category: "cotenant_income",
            })
          })
        }

        // Documents fiscaux des colocataires
        if (cotenant.tax_situation?.documents && Array.isArray(cotenant.tax_situation.documents)) {
          cotenant.tax_situation.documents.forEach((doc, index) => {
            documentsToProcess.push({
              url: doc,
              name: `${cotenantLabel} - Document fiscal ${index + 1}`,
              category: "cotenant_tax",
            })
          })
        }

        // Documents de logement des colocataires
        if (
          cotenant.current_housing_documents?.quittances_loyer &&
          Array.isArray(cotenant.current_housing_documents.quittances_loyer)
        ) {
          cotenant.current_housing_documents.quittances_loyer.forEach((doc, index) => {
            documentsToProcess.push({
              url: doc,
              name: `${cotenantLabel} - Quittance de loyer ${index + 1}`,
              category: "cotenant_housing",
            })
          })
        }
      })
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

          // Documents d'activité des garants
          if (guarantor.personal_info.activity_documents && Array.isArray(guarantor.personal_info.activity_documents)) {
            guarantor.personal_info.activity_documents.forEach((doc, index) => {
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
        } else if (guarantor.type === "organism") {
          // Documents Visale ou autres organismes
          if (guarantor.organism_documents && Array.isArray(guarantor.organism_documents)) {
            guarantor.organism_documents.forEach((doc, index) => {
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
            guarantor.kbis_documents.forEach((doc, index) => {
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

    // PAGE ANNEXES AMÉLIORÉE
    if (pdfsToMerge.length > 0 || imagesToAdd.length > 0) {
      doc.addPage()
      yPosition = await addPageHeader("PIÈCES JUSTIFICATIVES")

      yPosition = addSectionTitle("📎 DOCUMENTS FOURNIS", yPosition)

      // Organiser les documents par catégorie
      const categories = {
        identity: "🆔 Pièces d'identité",
        activity: "💼 Justificatifs d'activité",
        income: "💰 Justificatifs de revenus",
        tax: "📋 Documents fiscaux",
        housing: "🏠 Documents de logement",
        cotenant_identity: "👥 Pièces d'identité colocataires/conjoint",
        cotenant_activity: "👥 Justificatifs d'activité colocataires/conjoint",
        cotenant_income: "👥 Justificatifs de revenus colocataires/conjoint",
        cotenant_tax: "👥 Documents fiscaux colocataires/conjoint",
        cotenant_housing: "👥 Documents de logement colocataires/conjoint",
        guarantor_identity: "🛡️ Pièces d'identité garants",
        guarantor_activity: "🛡️ Justificatifs d'activité garants",
        guarantor_income: "🛡️ Justificatifs de revenus garants",
        guarantor_tax: "🛡️ Documents fiscaux garants",
        guarantor_organism: "🛡️ Documents organismes garants",
        guarantor_kbis: "🛡️ Documents Kbis garants",
      }

      const documentsByCategory = {}

      // Classer les PDFs
      pdfsToMerge.forEach((pdf) => {
        if (!documentsByCategory[pdf.category]) {
          documentsByCategory[pdf.category] = []
        }
        documentsByCategory[pdf.category].push(pdf.name)
      })

      // Classer les images
      imagesToAdd.forEach((img) => {
        if (!documentsByCategory[img.category]) {
          documentsByCategory[img.category] = []
        }
        documentsByCategory[img.category].push(img.name)
      })

      // Afficher par catégorie
      Object.keys(documentsByCategory).forEach((category) => {
        if (categories[category]) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
          doc.setFontSize(11)
          doc.setFont("helvetica", "bold")
          doc.text(categories[category], margin, yPosition)
          yPosition += 12

          documentsByCategory[category].forEach((docName) => {
            doc.setTextColor(0, 0, 0)
            doc.setFontSize(9)
            doc.setFont("helvetica", "normal")
            doc.text(`• ${docName}`, margin + 10, yPosition)
            yPosition += 8
          })
          yPosition += 5
        }
      })

      if (Object.keys(documentsByCategory).length === 0) {
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
        doc.text("Aucune pièce justificative fournie.", margin, yPosition)
      }
    }

    // MERGE FINAL
    console.log(`🔄 Préparation du PDF final avec ${pdfsToMerge.length} PDF(s) et ${imagesToAdd.length} image(s)...`)

    try {
      const jsPdfOutput = doc.output("arraybuffer")
      const mainPdfDoc = await PDFDocument.load(jsPdfOutput)

      // Ajouter les images avec en-têtes améliorés
      for (const imageItem of imagesToAdd) {
        try {
          console.log(`🖼️ Ajout de l'image: ${imageItem.name}`)

          const imagePage = mainPdfDoc.addPage()
          const { width, height } = imagePage.getSize()

          // En-tête coloré pour l'image
          imagePage.drawRectangle({
            x: 0,
            y: height - 50,
            width: width,
            height: 50,
            color: { r: 0.23, g: 0.51, b: 0.97 },
          })

          imagePage.drawText(imageItem.name, {
            x: 20,
            y: height - 30,
            size: 14,
            color: { r: 1, g: 1, b: 1 },
          })

          imagePage.drawText("PIÈCE JUSTIFICATIVE", {
            x: 20,
            y: height - 15,
            size: 8,
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

          // Calculer les dimensions avec marges
          const imgWidth = pdfImage.width
          const imgHeight = pdfImage.height
          const availableWidth = width - 40
          const availableHeight = height - 90

          let finalWidth = availableWidth
          let finalHeight = (imgHeight * availableWidth) / imgWidth

          if (finalHeight > availableHeight) {
            finalHeight = availableHeight
            finalWidth = (imgWidth * availableHeight) / imgHeight
          }

          const xPos = (width - finalWidth) / 2
          const yPos = (height - finalHeight - 50) / 2

          // Bordure autour de l'image
          imagePage.drawRectangle({
            x: xPos - 2,
            y: yPos - 2,
            width: finalWidth + 4,
            height: finalHeight + 4,
            borderColor: { r: 0.8, g: 0.8, b: 0.8 },
            borderWidth: 1,
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

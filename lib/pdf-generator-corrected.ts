import type { RentalFileData } from "./rental-file-service"

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
    const lightGrayColor = [243, 244, 246] // Gris clair pour les fonds

    // Stocker les PDF à merger à la fin
    const pdfsToMerge: any[] = []
    const imagesToAdd: any[] = []

    // Fonction helper pour formater les montants
    const formatAmount = (amount: number): string => {
      if (!amount || amount === 0) return "Non renseigné"
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(amount)
    }

    // Fonction pour calculer les revenus totaux d'une personne
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

    // Fonction pour ajouter un en-tête de page amélioré
    const addPageHeader = async (title: string): Promise<number> => {
      // Fond dégradé simulé avec plusieurs rectangles
      for (let i = 0; i < 40; i++) {
        const opacity = 1 - i * 0.015
        const r = Math.floor(primaryColor[0] * opacity)
        const g = Math.floor(primaryColor[1] * opacity)
        const b = Math.floor(primaryColor[2] * opacity)
        doc.setFillColor(r, g, b)
        doc.rect(0, i, pageWidth, 1, "F")
      }

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
      doc.line(0, 40, pageWidth, 40)

      return 50 // Position Y après l'en-tête
    }

    // Fonction pour ajouter une section avec fond coloré et icône
    const addSectionWithIcon = (title: string, y: number, icon = "📋"): number => {
      // Fond coloré pour la section
      doc.setFillColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2])
      doc.rect(margin - 5, y - 5, pageWidth - 2 * margin + 10, 18, "F")

      // Bordure colorée
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setLineWidth(1)
      doc.rect(margin - 5, y - 5, pageWidth - 2 * margin + 10, 18, "S")

      // Titre de section avec icône
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`${icon} ${title}`, margin, y + 5)

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
      // Vérifier si on dépasse la page
      if (y > pageHeight - 40) {
        doc.addPage()
        y = await addPageHeader("DOSSIER DE LOCATION (SUITE)")
      }

      // Fond alterné pour améliorer la lisibilité
      if (options.background) {
        doc.setFillColor(248, 250, 252)
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

      return y + 18
    }

    // Fonction pour ajouter un montant avec design amélioré
    const addAmount = async (label: string, amount: number, x: number, y: number): Promise<number> => {
      // Vérifier si on dépasse la page
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
    const totalHouseholdIncome = calculateTotalHouseholdIncome()

    // PAGE DE COUVERTURE AMÉLIORÉE
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

    yPosition += 40

    // Encadré de synthèse amélioré
    doc.setFillColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2])
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 90, "F")
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(2)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 90, "S")

    yPosition += 15

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("📊 SYNTHÈSE DU DOSSIER", pageWidth / 2, yPosition, { align: "center" })

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

    // Revenus totaux du foyer
    if (totalHouseholdIncome > 0) {
      synthese.push(`💰 Revenus totaux du foyer: ${formatAmount(totalHouseholdIncome)}`)
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

    yPosition += 20

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

    // PAGE LOCATAIRE PRINCIPAL
    doc.addPage()
    yPosition = await addPageHeader("👤 LOCATAIRE PRINCIPAL")

    if (mainTenant) {
      // Informations personnelles
      yPosition = addSectionWithIcon("INFORMATIONS PERSONNELLES", yPosition, "👤")

      const colWidth = (pageWidth - 2 * margin - 20) / 2
      const col2X = margin + colWidth + 20

      let col1Y = yPosition
      let col2Y = yPosition

      col1Y = await addProperty("Nom", mainTenant.last_name || "", margin, col1Y, { background: true })
      col2Y = await addProperty("Prénom", mainTenant.first_name || "", col2X, col2Y)

      col1Y = await addProperty("Date de naissance", mainTenant.birth_date || "", margin, col1Y)
      col2Y = await addProperty("Lieu de naissance", mainTenant.birth_place || "", col2X, col2Y, { background: true })

      col1Y = await addProperty("Nationalité", mainTenant.nationality || "", margin, col1Y, { background: true })
      col2Y = await addProperty("Situation logement", mainTenant.current_housing_situation || "", col2X, col2Y)

      yPosition = Math.max(col1Y, col2Y) + 10

      // Situation professionnelle
      yPosition = addSectionWithIcon("SITUATION PROFESSIONNELLE", yPosition, "💼")

      const activity = rentalFile.MAIN_ACTIVITIES?.find((a: any) => a.value === mainTenant.main_activity)
      yPosition = await addProperty(
        "Activité principale",
        activity?.label || mainTenant.main_activity || "",
        margin,
        yPosition,
        { background: true, bold: true },
      )

      if (mainTenant.income_sources?.work_income?.type) {
        yPosition = await addProperty("Type de revenus", mainTenant.income_sources.work_income.type, margin, yPosition)
      }

      yPosition += 10

      // Revenus (section séparée avec fond vert)
      yPosition = addSectionWithIcon("REVENUS", yPosition, "💰")

      if (mainTenant.income_sources?.work_income?.amount) {
        yPosition = await addAmount(
          "Revenus du travail (mensuel)",
          mainTenant.income_sources.work_income.amount,
          margin,
          yPosition,
        )
      }

      // Autres revenus si présents
      if (mainTenant.income_sources?.social_aid && mainTenant.income_sources.social_aid.length > 0) {
        for (let index = 0; index < mainTenant.income_sources.social_aid.length; index++) {
          const aid = mainTenant.income_sources.social_aid[index]
          if (aid.amount) {
            yPosition = await addAmount(`Aide sociale ${index + 1}`, aid.amount, margin, yPosition)
          }
        }
      }

      if (mainTenant.income_sources?.scholarship?.amount) {
        yPosition = await addAmount("Bourse d'études", mainTenant.income_sources.scholarship.amount, margin, yPosition)
      }

      // Total des revenus du locataire principal
      const mainTenantIncome = calculateTotalIncomeForPerson(mainTenant.income_sources)
      if (mainTenantIncome > 0) {
        yPosition += 5
        yPosition = await addAmount("TOTAL REVENUS", mainTenantIncome, margin, yPosition)
      }
    }

    // PAGES COLOCATAIRES/CONJOINT
    if (rentalFile.cotenants && rentalFile.cotenants.length > 0) {
      for (let index = 0; index < rentalFile.cotenants.length; index++) {
        const cotenant = rentalFile.cotenants[index]
        const cotenantLabel = rentalFile.rental_situation === "couple" ? "CONJOINT(E)" : `COLOCATAIRE ${index + 1}`

        doc.addPage()
        yPosition = await addPageHeader(`👥 ${cotenantLabel}`)

        yPosition = addSectionWithIcon("INFORMATIONS PERSONNELLES", yPosition, "👤")

        const colWidth = (pageWidth - 2 * margin - 20) / 2
        const col2X = margin + colWidth + 20

        let col1Y = yPosition
        let col2Y = yPosition

        col1Y = await addProperty("Nom", cotenant.last_name || "", margin, col1Y, { background: true })
        col2Y = await addProperty("Prénom", cotenant.first_name || "", col2X, col2Y)

        if (cotenant.birth_date) {
          col1Y = await addProperty("Date de naissance", cotenant.birth_date, margin, col1Y)
        }

        if (cotenant.nationality) {
          col2Y = await addProperty("Nationalité", cotenant.nationality, col2X, col2Y, { background: true })
        }

        yPosition = Math.max(col1Y, col2Y) + 10

        // Situation professionnelle du colocataire
        if (cotenant.main_activity) {
          yPosition = addSectionWithIcon("SITUATION PROFESSIONNELLE", yPosition, "💼")
          const cotenantActivity = rentalFile.MAIN_ACTIVITIES?.find((a: any) => a.value === cotenant.main_activity)
          yPosition = await addProperty(
            "Activité principale",
            cotenantActivity?.label || cotenant.main_activity,
            margin,
            yPosition,
            { background: true, bold: true },
          )
        }

        // Revenus du colocataire
        if (cotenant.income_sources) {
          yPosition += 10
          yPosition = addSectionWithIcon("REVENUS", yPosition, "💰")

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
            yPosition = await addAmount(
              "Bourse d'études",
              cotenant.income_sources.scholarship.amount,
              margin,
              yPosition,
            )
          }

          // Total des revenus du colocataire
          const cotenantIncome = calculateTotalIncomeForPerson(cotenant.income_sources)
          if (cotenantIncome > 0) {
            yPosition += 5
            yPosition = await addAmount("TOTAL REVENUS", cotenantIncome, margin, yPosition)
          }
        }
      }
    }

    // PAGES GARANTS (même mise en forme que locataire principal)
    if (rentalFile.guarantors && rentalFile.guarantors.length > 0) {
      for (let index = 0; index < rentalFile.guarantors.length; index++) {
        const guarantor = rentalFile.guarantors[index]
        doc.addPage()
        yPosition = await addPageHeader(`🛡️ GARANT ${index + 1}`)

        yPosition = addSectionWithIcon("TYPE DE GARANT", yPosition, "🛡️")
        let guarantorTypeLabel = "Personne physique"
        if (guarantor.type === "moral_person") guarantorTypeLabel = "Personne morale"
        else if (guarantor.type === "organism") guarantorTypeLabel = "Organisme de cautionnement"

        yPosition = await addProperty("Type", guarantorTypeLabel, margin, yPosition, { bold: true, background: true })

        if (guarantor.personal_info) {
          const guarantorInfo = guarantor.personal_info

          yPosition += 10
          yPosition = addSectionWithIcon("INFORMATIONS PERSONNELLES", yPosition, "👤")

          const colWidth = (pageWidth - 2 * margin - 20) / 2
          const col2X = margin + colWidth + 20

          let col1Y = yPosition
          let col2Y = yPosition

          col1Y = await addProperty("Nom", guarantorInfo.last_name || "", margin, col1Y, { background: true })
          col2Y = await addProperty("Prénom", guarantorInfo.first_name || "", col2X, col2Y)

          if (guarantorInfo.birth_date) {
            col1Y = await addProperty("Date de naissance", guarantorInfo.birth_date, margin, col1Y)
          }

          if (guarantorInfo.nationality) {
            col2Y = await addProperty("Nationalité", guarantorInfo.nationality, col2X, col2Y, { background: true })
          }

          if (guarantorInfo.current_housing_situation) {
            col1Y = await addProperty("Situation logement", guarantorInfo.current_housing_situation, margin, col1Y, {
              background: true,
            })
          }

          yPosition = Math.max(col1Y, col2Y) + 10

          // Situation professionnelle du garant
          if (guarantorInfo.main_activity) {
            yPosition = addSectionWithIcon("SITUATION PROFESSIONNELLE", yPosition, "💼")
            const guarantorActivity = rentalFile.MAIN_ACTIVITIES?.find(
              (a: any) => a.value === guarantorInfo.main_activity,
            )
            yPosition = await addProperty(
              "Activité principale",
              guarantorActivity?.label || guarantorInfo.main_activity,
              margin,
              yPosition,
              { background: true, bold: true },
            )
          }

          // Revenus du garant
          if (guarantorInfo.income_sources?.work_income?.amount) {
            yPosition += 10
            yPosition = addSectionWithIcon("REVENUS", yPosition, "💰")
            yPosition = await addAmount(
              "Revenus du travail (mensuel)",
              guarantorInfo.income_sources.work_income.amount,
              margin,
              yPosition,
            )

            // Total des revenus du garant
            const guarantorIncome = calculateTotalIncomeForPerson(guarantorInfo.income_sources)
            if (guarantorIncome > 0) {
              yPosition += 5
              yPosition = await addAmount("TOTAL REVENUS", guarantorIncome, margin, yPosition)
            }
          }
        } else if (guarantor.type === "organism") {
          // Informations organisme (Visale, etc.)
          yPosition += 10
          yPosition = addSectionWithIcon("INFORMATIONS ORGANISME", yPosition, "🏢")

          if (guarantor.organism_name) {
            yPosition = await addProperty("Nom de l'organisme", guarantor.organism_name, margin, yPosition, {
              background: true,
              bold: true,
            })
          }

          if (guarantor.guarantee_number) {
            yPosition = await addProperty("Numéro de garantie", guarantor.guarantee_number, margin, yPosition)
          }
        } else if (guarantor.type === "moral_person") {
          // Informations personne morale
          yPosition += 10
          yPosition = addSectionWithIcon("INFORMATIONS SOCIÉTÉ", yPosition, "🏢")

          if (guarantor.company_name) {
            yPosition = await addProperty("Nom de la société", guarantor.company_name, margin, yPosition, {
              background: true,
              bold: true,
            })
          }

          if (guarantor.siret) {
            yPosition = await addProperty("SIRET", guarantor.siret, margin, yPosition)
          }

          if (guarantor.legal_representative) {
            yPosition = await addProperty("Représentant légal", guarantor.legal_representative, margin, yPosition, {
              background: true,
            })
          }
        }
      }
    }

    // COLLECTE COMPLÈTE DES DOCUMENTS
    const documentsToProcess: any[] = []

    // Documents du locataire principal
    if (mainTenant) {
      // Documents d'identité
      if (mainTenant.identity_documents && Array.isArray(mainTenant.identity_documents)) {
        mainTenant.identity_documents.forEach((doc: string, index: number) => {
          documentsToProcess.push({
            url: doc,
            name: `Locataire principal - Pièce d'identité ${index + 1}`,
            category: "identity",
          })
        })
      }

      // Documents d'activité
      if (mainTenant.activity_documents && Array.isArray(mainTenant.activity_documents)) {
        mainTenant.activity_documents.forEach((doc: string, index: number) => {
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
        mainTenant.income_sources.work_income.documents.forEach((doc: string, index: number) => {
          documentsToProcess.push({
            url: doc,
            name: `Locataire principal - Justificatif de revenu ${index + 1}`,
            category: "income",
          })
        })
      }

      // Documents fiscaux
      if (mainTenant.tax_situation?.documents && Array.isArray(mainTenant.tax_situation.documents)) {
        mainTenant.tax_situation.documents.forEach((doc: string, index: number) => {
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
        mainTenant.current_housing_documents.quittances_loyer.forEach((doc: string, index: number) => {
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
        mainTenant.current_housing_documents.attestation_hebergement.forEach((doc: string, index: number) => {
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
        mainTenant.current_housing_documents.avis_taxe_fonciere.forEach((doc: string, index: number) => {
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
      rentalFile.cotenants.forEach((cotenant: any, cIndex: number) => {
        const cotenantLabel = rentalFile.rental_situation === "couple" ? "Conjoint(e)" : `Colocataire ${cIndex + 1}`

        // Documents d'identité des colocataires
        if (cotenant.identity_documents && Array.isArray(cotenant.identity_documents)) {
          cotenant.identity_documents.forEach((doc: string, index: number) => {
            documentsToProcess.push({
              url: doc,
              name: `${cotenantLabel} - Pièce d'identité ${index + 1}`,
              category: "cotenant_identity",
            })
          })
        }

        // Documents d'activité des colocataires
        if (cotenant.activity_documents && Array.isArray(cotenant.activity_documents)) {
          cotenant.activity_documents.forEach((doc: string, index: number) => {
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
          cotenant.income_sources.work_income.documents.forEach((doc: string, index: number) => {
            documentsToProcess.push({
              url: doc,
              name: `${cotenantLabel} - Justificatif de revenu ${index + 1}`,
              category: "cotenant_income",
            })
          })
        }

        // Documents fiscaux des colocataires
        if (cotenant.tax_situation?.documents && Array.isArray(cotenant.tax_situation.documents)) {
          cotenant.tax_situation.documents.forEach((doc: string, index: number) => {
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
          cotenant.current_housing_documents.quittances_loyer.forEach((doc: string, index: number) => {
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
      rentalFile.guarantors.forEach((guarantor: any, gIndex: number) => {
        if (guarantor.type === "physical" && guarantor.personal_info) {
          // Documents d'identité des garants
          if (guarantor.personal_info.identity_documents && Array.isArray(guarantor.personal_info.identity_documents)) {
            guarantor.personal_info.identity_documents.forEach((doc: string, index: number) => {
              documentsToProcess.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Pièce d'identité ${index + 1}`,
                category: "guarantor_identity",
              })
            })
          }

          // Documents d'activité des garants
          if (guarantor.personal_info.activity_documents && Array.isArray(guarantor.personal_info.activity_documents)) {
            guarantor.personal_info.activity_documents.forEach((doc: string, index: number) => {
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
            guarantor.personal_info.income_sources.work_income.documents.forEach((doc: string, index: number) => {
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
            guarantor.personal_info.tax_situation.documents.forEach((doc: string, index: number) => {
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
            guarantor.organism_documents.forEach((doc: string, index: number) => {
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
            guarantor.kbis_documents.forEach((doc: string, index: number) => {
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
      yPosition = await addPageHeader("📎 ANNEXES - PIÈCES JUSTIFICATIVES")

      yPosition = addSectionWithIcon("LISTE DES DOCUMENTS INCLUS", yPosition, "📋")

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.text("Les pièces justificatives suivantes sont intégrées dans ce document :", margin, yPosition)

      yPosition += 15

      // Organiser les documents par catégorie
      const documentsByCategory: any = {}

      pdfsToMerge.forEach((pdf) => {
        if (!documentsByCategory[pdf.category]) documentsByCategory[pdf.category] = []
        documentsByCategory[pdf.category].push({ name: pdf.name, type: "PDF", pages: pdf.pageCount })
      })

      imagesToAdd.forEach((img) => {
        if (!documentsByCategory[img.category]) documentsByCategory[img.category] = []
        documentsByCategory[img.category].push({ name: img.name, type: "Image", pages: 1 })
      })

      // Afficher par catégorie avec icônes
      const categoryIcons: any = {
        identity: "🆔",
        activity: "💼",
        income: "💰",
        tax: "📊",
        housing: "🏠",
        cotenant_identity: "👥",
        cotenant_activity: "👥💼",
        cotenant_income: "👥💰",
        cotenant_tax: "👥📊",
        cotenant_housing: "👥🏠",
        guarantor_identity: "🛡️🆔",
        guarantor_activity: "🛡️💼",
        guarantor_income: "🛡️💰",
        guarantor_tax: "🛡️📊",
        guarantor_organism: "🛡️🏢",
        guarantor_kbis: "🛡️📋",
      }

      let docCount = 1
      Object.keys(documentsByCategory).forEach((category) => {
        const icon = categoryIcons[category] || "📄"
        const categoryName = category.replace(/_/g, " ").toUpperCase()

        // Titre de catégorie
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text(`${icon} ${categoryName}`, margin, yPosition)
        yPosition += 10

        // Documents de cette catégorie
        documentsByCategory[category].forEach((docItem: any) => {
          doc.setFontSize(9)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(0, 0, 0)
          doc.text(
            `   ${docCount}. ${docItem.name} (${docItem.type} - ${docItem.pages} page${docItem.pages > 1 ? "s" : ""})`,
            margin,
            yPosition,
          )
          yPosition += 8
          docCount++
        })

        yPosition += 5
      })

      if (docCount === 1) {
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
        doc.text("Aucune pièce justificative fournie.", margin, yPosition)
      }
    }

    // MERGE FINAL AMÉLIORÉ
    console.log(`🔄 Préparation du PDF final avec ${pdfsToMerge.length} PDF(s) et ${imagesToAdd.length} image(s)...`)

    try {
      // Convertir le PDF jsPDF en ArrayBuffer
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
            y: height - 25,
            size: 12,
            color: { r: 1, g: 1, b: 1 },
          })

          imagePage.drawText("PIÈCE JUSTIFICATIVE", {
            x: 20,
            y: height - 10,
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

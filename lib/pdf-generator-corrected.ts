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

// Fonction helper pour formater les montants CORRECTEMENT (AVEC ESPACES)
const formatAmount = (amount: number): string => {
  if (!amount || amount === 0) return "Non renseigné"
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s/g, " ") // Forcer les espaces normaux
}

export const generateRentalFilePDF = async (rentalFile: RentalFileData): Promise<void> => {
  try {
    // Charger les paramètres du site
    const [logos, siteInfo] = await Promise.all([getLogos(), getSiteInfo()])

    console.log("🎨 Logos chargés:", logos)
    console.log("ℹ️ Info site:", siteInfo)

    // Import dynamique de jsPDF et pdf-lib - MÉTHODE CORRECTE
    const { jsPDF } = await import("jspdf")
    const { PDFDocument } = await import("pdf-lib")

    const doc = new jsPDF()
    let yPosition = 20
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 20

    // Couleurs douces et modernes (palette pastel professionnelle)
    const primaryColor = [99, 102, 241] // Indigo doux
    const secondaryColor = [148, 163, 184] // Gris ardoise doux
    const accentColor = [34, 197, 94] // Vert émeraude doux
    const grayColor = [156, 163, 175] // Gris doux pour les labels
    const lightGrayColor = [249, 250, 251] // Gris très clair et doux
    const softBlueColor = [239, 246, 255] // Bleu très doux pour les fonds

    // Stocker les PDF à merger à la fin
    const pdfsToMerge: any[] = []
    const imagesToAdd: any[] = []

    // Fonction helper pour formater les montants CORRECTEMENT (SANS "/")
    // const formatAmount = (amount: number): string => {
    //   if (!amount || amount === 0) return "Non renseigné"
    //   return new Intl.NumberFormat("fr-FR", {
    //     style: "currency",
    //     currency: "EUR",
    //     minimumFractionDigits: 0,
    //     maximumFractionDigits: 0,
    //   }).format(amount)
    // }

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

    // Fonction pour ajouter le logo avec design doux
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

            // Ajouter l'image au PDF avec coins arrondis simulés
            const imgFormat = logoUrl.toLowerCase().includes(".png") ? "PNG" : "JPEG"
            doc.addImage(base64Data, imgFormat, x, y, size, size * 0.6) // Ratio 5:3 pour les logos
            return
          }
        } catch (error) {
          console.error("Erreur chargement logo:", error)
        }
      }

      // Fallback : logo simple et doux
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.roundedRect(x, y, size, size * 0.6, 8, 8, "F") // Coins très arrondis

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("L", x + size / 2 - 3, y + (size * 0.6) / 2 + 4)
    }

    // Fonction pour ajouter un en-tête de page moderne et uni (SANS DÉGRADÉ)
    const addPageHeader = async (title: string): Promise<number> => {
      // Fond uni moderne (pas de dégradé)
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.rect(0, 0, pageWidth, 35, "F")

      // Logo (utiliser le logo PDF s'il existe)
      await addLogo(pageWidth - margin - 30, 5, 25, logos.pdf || logos.main)

      // Titre avec style doux
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(title, margin, 22)

      // Sous-titre avec le nom du site
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(siteInfo.title || "Louer Ici", margin, 30)

      return 45 // Position Y après l'en-tête
    }

    // Fonction pour ajouter une section avec design doux et COMPACT
    const addSectionWithIcon = (title: string, y: number, icon = "•"): number => {
      // Fond très doux pour la section
      doc.setFillColor(softBlueColor[0], softBlueColor[1], softBlueColor[2])
      doc.roundedRect(margin - 8, y - 6, pageWidth - 2 * margin + 16, 16, 12, 12, "F") // Hauteur réduite

      // Titre de section moderne et doux
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`${icon} ${title}`, margin, y + 4)

      return y + 20 // Espacement réduit
    }

    // Fonction pour ajouter une propriété avec design très doux et COMPACT
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

      // Fond alterné très doux pour améliorer la lisibilité
      if (options.background) {
        doc.setFillColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2])
        doc.roundedRect(x - 5, y - 5, 90, 16, 8, 8, "F") // Hauteur réduite
      }

      // Label avec style doux
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text(label, x, y)

      // Valeur avec style doux
      doc.setTextColor(55, 65, 81) // Gris foncé doux au lieu du noir pur
      doc.setFontSize(10)
      doc.setFont("helvetica", options.bold ? "bold" : "normal")

      const displayValue = value || "Non renseigné"
      doc.text(displayValue, x, y + 8)

      return y + 18 // Espacement réduit
    }

    // Fonction pour ajouter un montant avec design très doux et COMPACT
    const addAmount = async (label: string, amount: number, x: number, y: number): Promise<number> => {
      // Vérifier si on dépasse la page
      if (y > pageHeight - 40) {
        doc.addPage()
        y = await addPageHeader("DOSSIER DE LOCATION (SUITE)")
      }

      // Fond très doux pour les montants
      doc.setFillColor(240, 253, 244) // Vert très pâle
      doc.roundedRect(x - 5, y - 5, 90, 16, 10, 10, "F") // Hauteur réduite

      // Label doux
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text(label, x, y)

      // Montant avec formatage correct et couleur douce
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2])
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text(formatAmount(amount), x, y + 8)

      return y + 18 // Espacement réduit
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

    // PAGE DE COUVERTURE MODERNE ET DOUCE
    yPosition = await addPageHeader("DOSSIER DE LOCATION NUMÉRIQUE")

    // Logo principal centré (si disponible) avec style doux
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

    // Nom du site avec couleur douce
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    const siteTitleWidth = doc.getTextWidth(siteInfo.title || "Louer Ici")
    doc.text(siteInfo.title || "Louer Ici", (pageWidth - siteTitleWidth) / 2, yPosition)

    yPosition += 15

    // Description du site avec couleur douce
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

    // Nom du locataire (centré et grand) avec couleur douce
    doc.setTextColor(55, 65, 81) // Gris foncé doux au lieu du noir pur
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    const nameWidth = doc.getTextWidth(tenantName)
    doc.text(tenantName, (pageWidth - nameWidth) / 2, yPosition)

    yPosition += 40

    // Encadré de synthèse très doux
    doc.setFillColor(softBlueColor[0], softBlueColor[1], softBlueColor[2])
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 90, 20, 20, "F")

    yPosition += 15

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("• SYNTHÈSE DU DOSSIER", pageWidth / 2, yPosition, { align: "center" })

    yPosition += 20

    // Synthèse moderne avec revenus totaux
    const synthese = []

    // Type de location
    if (rentalFile.rental_situation === "alone") {
      synthese.push("• Location individuelle")
    } else if (rentalFile.rental_situation === "couple") {
      synthese.push("• Location en couple")
    } else {
      synthese.push("• Colocation")
    }

    // Nombre de personnes
    const totalPersons = 1 + (rentalFile.cotenants?.length || 0)
    synthese.push(`• ${totalPersons} personne${totalPersons > 1 ? "s" : ""} dans le dossier`)

    // Revenus totaux du foyer
    if (totalHouseholdIncome > 0) {
      synthese.push(`• Revenus totaux du foyer: ${formatAmount(totalHouseholdIncome)}`)
    }

    // Garants
    const guarantorsCount = rentalFile.guarantors?.length || 0
    if (guarantorsCount > 0) {
      synthese.push(`• ${guarantorsCount} garant${guarantorsCount > 1 ? "s" : ""}`)
    } else {
      synthese.push("• Aucun garant")
    }

    // Afficher la synthèse avec couleur douce
    doc.setTextColor(55, 65, 81) // Gris foncé doux
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")

    synthese.forEach((item) => {
      doc.text(item, pageWidth / 2, yPosition, { align: "center" })
      yPosition += 12
    })

    yPosition += 20

    // Date de génération avec couleur douce
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
    yPosition = await addPageHeader("• LOCATAIRE PRINCIPAL")

    if (mainTenant) {
      // Informations personnelles
      yPosition = addSectionWithIcon("INFORMATIONS PERSONNELLES", yPosition, "•")

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
      yPosition = addSectionWithIcon("SITUATION PROFESSIONNELLE", yPosition, "•")

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

      // Revenus (section séparée avec fond moderne)
      yPosition = addSectionWithIcon("REVENUS", yPosition, "•")

      if (mainTenant.income_sources?.work_income?.amount) {
        yPosition = await addAmount(
          "Revenus du travail (mensuel)",
          mainTenant.income_sources.work_income.amount,
          margin,
          yPosition,
        )
      }

      // Aides sociales - INCLUSES MAINTENANT
      if (mainTenant.income_sources?.social_aid && mainTenant.income_sources.social_aid.length > 0) {
        for (let index = 0; index < mainTenant.income_sources.social_aid.length; index++) {
          const aid = mainTenant.income_sources.social_aid[index]
          if (aid.amount) {
            const aidLabels: { [key: string]: string } = {
              caf_msa: "Aide CAF/MSA",
              france_travail: "Aide France Travail",
              apl_aah: "APL/AAH",
              autre: "Autre aide",
            }
            yPosition = await addAmount(
              aidLabels[aid.type] || `Aide sociale ${index + 1}`,
              aid.amount,
              margin,
              yPosition,
            )
          }
        }
      }

      // Pensions/retraites - INCLUSES MAINTENANT
      if (mainTenant.income_sources?.retirement_pension && mainTenant.income_sources.retirement_pension.length > 0) {
        for (let index = 0; index < mainTenant.income_sources.retirement_pension.length; index++) {
          const pension = mainTenant.income_sources.retirement_pension[index]
          if (pension.amount) {
            const pensionLabels: { [key: string]: string } = {
              retraite: "Retraite",
              pension_invalidite: "Pension d'invalidité",
              pension_alimentaire: "Pension alimentaire",
            }
            yPosition = await addAmount(
              pensionLabels[pension.type] || `Pension ${index + 1}`,
              pension.amount,
              margin,
              yPosition,
            )
          }
        }
      }

      // Revenus locatifs/rentes - INCLUS MAINTENANT
      if (mainTenant.income_sources?.rent_income && mainTenant.income_sources.rent_income.length > 0) {
        for (let index = 0; index < mainTenant.income_sources.rent_income.length; index++) {
          const rent = mainTenant.income_sources.rent_income[index]
          if (rent.amount) {
            const rentLabels: { [key: string]: string } = {
              revenus_locatifs: "Revenus locatifs",
              rente_viagere: "Rente viagère",
              autre_rente: "Autre rente",
            }
            yPosition = await addAmount(
              rentLabels[rent.type] || `Revenu locatif ${index + 1}`,
              rent.amount,
              margin,
              yPosition,
            )
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

    // PAGES COLOCATAIRES/CONJOINT (même structure douce)
    if (rentalFile.cotenants && rentalFile.cotenants.length > 0) {
      for (let index = 0; index < rentalFile.cotenants.length; index++) {
        const cotenant = rentalFile.cotenants[index]
        const cotenantLabel = rentalFile.rental_situation === "couple" ? "CONJOINT(E)" : `COLOCATAIRE ${index + 1}`

        doc.addPage()
        yPosition = await addPageHeader(`• ${cotenantLabel}`)

        yPosition = addSectionWithIcon("INFORMATIONS PERSONNELLES", yPosition, "•")

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
          yPosition = addSectionWithIcon("SITUATION PROFESSIONNELLE", yPosition, "•")
          const cotenantActivity = rentalFile.MAIN_ACTIVITIES?.find((a: any) => a.value === cotenant.main_activity)
          yPosition = await addProperty(
            "Activité principale",
            cotenantActivity?.label || cotenant.main_activity,
            margin,
            yPosition,
            { background: true, bold: true },
          )
        }

        // Revenus du colocataire - TOUS INCLUS
        if (cotenant.income_sources) {
          yPosition += 10
          yPosition = addSectionWithIcon("REVENUS", yPosition, "•")

          if (cotenant.income_sources.work_income?.amount) {
            yPosition = await addAmount(
              "Revenus du travail (mensuel)",
              cotenant.income_sources.work_income.amount,
              margin,
              yPosition,
            )
          }

          // Aides sociales du colocataire
          if (cotenant.income_sources.social_aid && cotenant.income_sources.social_aid.length > 0) {
            for (let aidIndex = 0; aidIndex < cotenant.income_sources.social_aid.length; aidIndex++) {
              const aid = cotenant.income_sources.social_aid[aidIndex]
              if (aid.amount) {
                const aidLabels: { [key: string]: string } = {
                  caf_msa: "Aide CAF/MSA",
                  france_travail: "Aide France Travail",
                  apl_aah: "APL/AAH",
                  autre: "Autre aide",
                }
                yPosition = await addAmount(
                  aidLabels[aid.type] || `Aide sociale ${aidIndex + 1}`,
                  aid.amount,
                  margin,
                  yPosition,
                )
              }
            }
          }

          // Autres revenus du colocataire
          if (cotenant.income_sources.retirement_pension && cotenant.income_sources.retirement_pension.length > 0) {
            for (
              let pensionIndex = 0;
              pensionIndex < cotenant.income_sources.retirement_pension.length;
              pensionIndex++
            ) {
              const pension = cotenant.income_sources.retirement_pension[pensionIndex]
              if (pension.amount) {
                yPosition = await addAmount(`Pension ${pensionIndex + 1}`, pension.amount, margin, yPosition)
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

    // PAGES GARANTS - TOUS LES DOCUMENTS INCLUS avec design doux
    if (rentalFile.guarantors && rentalFile.guarantors.length > 0) {
      for (let index = 0; index < rentalFile.guarantors.length; index++) {
        const guarantor = rentalFile.guarantors[index]
        doc.addPage()
        yPosition = await addPageHeader(`• GARANT ${index + 1}`)

        yPosition = addSectionWithIcon("TYPE DE GARANT", yPosition, "•")
        let guarantorTypeLabel = "Personne physique"
        if (guarantor.type === "moral_person") guarantorTypeLabel = "Personne morale"
        else if (guarantor.type === "organism") guarantorTypeLabel = "Organisme de cautionnement"

        yPosition = await addProperty("Type", guarantorTypeLabel, margin, yPosition, { bold: true, background: true })

        if (guarantor.personal_info) {
          const guarantorInfo = guarantor.personal_info

          yPosition += 10
          yPosition = addSectionWithIcon("INFORMATIONS PERSONNELLES", yPosition, "•")

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
            yPosition = addSectionWithIcon("SITUATION PROFESSIONNELLE", yPosition, "•")
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

          // Revenus du garant - TOUS INCLUS
          if (guarantorInfo.income_sources) {
            yPosition += 10
            yPosition = addSectionWithIcon("REVENUS", yPosition, "•")

            if (guarantorInfo.income_sources.work_income?.amount) {
              yPosition = await addAmount(
                "Revenus du travail (mensuel)",
                guarantorInfo.income_sources.work_income.amount,
                margin,
                yPosition,
              )
            }

            // Aides sociales du garant
            if (guarantorInfo.income_sources.social_aid && guarantorInfo.income_sources.social_aid.length > 0) {
              for (let aidIndex = 0; aidIndex < guarantorInfo.income_sources.social_aid.length; aidIndex++) {
                const aid = guarantorInfo.income_sources.social_aid[aidIndex]
                if (aid.amount) {
                  yPosition = await addAmount(`Aide sociale ${aidIndex + 1}`, aid.amount, margin, yPosition)
                }
              }
            }

            // Autres revenus du garant
            if (
              guarantorInfo.income_sources.retirement_pension &&
              guarantorInfo.income_sources.retirement_pension.length > 0
            ) {
              for (
                let pensionIndex = 0;
                pensionIndex < guarantorInfo.income_sources.retirement_pension.length;
                pensionIndex++
              ) {
                const pension = guarantorInfo.income_sources.retirement_pension[pensionIndex]
                if (pension.amount) {
                  yPosition = await addAmount(`Pension ${pensionIndex + 1}`, pension.amount, margin, yPosition)
                }
              }
            }

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
          yPosition = addSectionWithIcon("INFORMATIONS ORGANISME", yPosition, "•")

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
          yPosition = addSectionWithIcon("INFORMATIONS SOCIÉTÉ", yPosition, "•")

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

    // COLLECTE COMPLÈTE DES DOCUMENTS - TOUS TYPES INCLUS
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

      // Documents de revenus - TOUS TYPES
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

      // Documents d'aides sociales - INCLUS MAINTENANT
      if (mainTenant.income_sources?.social_aid && Array.isArray(mainTenant.income_sources.social_aid)) {
        mainTenant.income_sources.social_aid.forEach((aid: any, aidIndex: number) => {
          if (aid.documents && Array.isArray(aid.documents)) {
            aid.documents.forEach((doc: string, docIndex: number) => {
              documentsToProcess.push({
                url: doc,
                name: `Locataire principal - Justificatif aide sociale ${aidIndex + 1}-${docIndex + 1}`,
                category: "social_aid",
              })
            })
          }
        })
      }

      // Documents de pensions - INCLUS MAINTENANT
      if (
        mainTenant.income_sources?.retirement_pension &&
        Array.isArray(mainTenant.income_sources.retirement_pension)
      ) {
        mainTenant.income_sources.retirement_pension.forEach((pension: any, pensionIndex: number) => {
          if (pension.documents && Array.isArray(pension.documents)) {
            pension.documents.forEach((doc: string, docIndex: number) => {
              documentsToProcess.push({
                url: doc,
                name: `Locataire principal - Justificatif pension ${pensionIndex + 1}-${docIndex + 1}`,
                category: "pension",
              })
            })
          }
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

      // Documents de logement - TOUS TYPES
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

    // Documents des colocataires/conjoint - TOUS INCLUS
    if (rentalFile.cotenants && Array.isArray(rentalFile.cotenants)) {
      rentalFile.cotenants.forEach((cotenant: any, cIndex: number) => {
        const cotenantLabel = rentalFile.rental_situation === "couple" ? "Conjoint(e)" : `Colocataire ${cIndex + 1}`

        // Tous les types de documents pour les colocataires
        if (cotenant.identity_documents && Array.isArray(cotenant.identity_documents)) {
          cotenant.identity_documents.forEach((doc: string, index: number) => {
            documentsToProcess.push({
              url: doc,
              name: `${cotenantLabel} - Pièce d'identité ${index + 1}`,
              category: "cotenant_identity",
            })
          })
        }

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

        // Aides sociales des colocataires
        if (cotenant.income_sources?.social_aid && Array.isArray(cotenant.income_sources.social_aid)) {
          cotenant.income_sources.social_aid.forEach((aid: any, aidIndex: number) => {
            if (aid.documents && Array.isArray(aid.documents)) {
              aid.documents.forEach((doc: string, docIndex: number) => {
                documentsToProcess.push({
                  url: doc,
                  name: `${cotenantLabel} - Justificatif aide sociale ${aidIndex + 1}-${docIndex + 1}`,
                  category: "cotenant_social_aid",
                })
              })
            }
          })
        }
      })
    }

    // Documents des garants - TOUS TYPES INCLUS
    if (rentalFile.guarantors && Array.isArray(rentalFile.guarantors)) {
      rentalFile.guarantors.forEach((guarantor: any, gIndex: number) => {
        if (guarantor.type === "physical" && guarantor.personal_info) {
          // Tous les documents des garants physiques
          if (guarantor.personal_info.identity_documents && Array.isArray(guarantor.personal_info.identity_documents)) {
            guarantor.personal_info.identity_documents.forEach((doc: string, index: number) => {
              documentsToProcess.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Pièce d'identité ${index + 1}`,
                category: "guarantor_identity",
              })
            })
          }

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

          // Quittances des garants - INCLUSES MAINTENANT
          if (
            guarantor.personal_info.current_housing_documents?.quittances_loyer &&
            Array.isArray(guarantor.personal_info.current_housing_documents.quittances_loyer)
          ) {
            guarantor.personal_info.current_housing_documents.quittances_loyer.forEach((doc: string, index: number) => {
              documentsToProcess.push({
                url: doc,
                name: `Garant ${gIndex + 1} - Quittance de loyer ${index + 1}`,
                category: "guarantor_housing",
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
          // Documents Kbis et autres - INCLUS MAINTENANT
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

    // Dans la section PAGE ANNEXES MODERNE ET DOUCE, améliorer la gestion des pages :

    // PAGE ANNEXES MODERNE ET DOUCE
    if (pdfsToMerge.length > 0 || imagesToAdd.length > 0) {
      doc.addPage()
      yPosition = await addPageHeader("• ANNEXES - PIÈCES JUSTIFICATIVES")

      yPosition = addSectionWithIcon("LISTE DES DOCUMENTS INCLUS", yPosition, "•")

      doc.setTextColor(55, 65, 81) // Gris foncé doux
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

      // Afficher par catégorie avec design doux
      const categoryLabels: any = {
        identity: "• PIÈCES D'IDENTITÉ",
        activity: "• JUSTIFICATIFS D'ACTIVITÉ",
        income: "• JUSTIFICATIFS DE REVENUS",
        social_aid: "• JUSTIFICATIFS D'AIDES SOCIALES",
        pension: "• JUSTIFICATIFS DE PENSIONS",
        tax: "• DOCUMENTS FISCAUX",
        housing: "• JUSTIFICATIFS DE LOGEMENT",
        cotenant_identity: "• PIÈCES D'IDENTITÉ (COLOCATAIRES)",
        cotenant_activity: "• JUSTIFICATIFS D'ACTIVITÉ (COLOCATAIRES)",
        cotenant_income: "• JUSTIFICATIFS DE REVENUS (COLOCATAIRES)",
        cotenant_social_aid: "• JUSTIFICATIFS D'AIDES (COLOCATAIRES)",
        guarantor_identity: "• PIÈCES D'IDENTITÉ (GARANTS)",
        guarantor_activity: "• JUSTIFICATIFS D'ACTIVITÉ (GARANTS)",
        guarantor_income: "• JUSTIFICATIFS DE REVENUS (GARANTS)",
        guarantor_housing: "• QUITTANCES DE LOYER (GARANTS)",
        guarantor_tax: "• DOCUMENTS FISCAUX (GARANTS)",
        guarantor_organism: "• DOCUMENTS ORGANISME (GARANTS)",
        guarantor_kbis: "• DOCUMENTS KBIS (GARANTS)",
      }

      let docCount = 1
      Object.keys(documentsByCategory).forEach(async (category) => {
        const categoryName = categoryLabels[category] || category.replace(/_/g, " ").toUpperCase()

        // Vérifier si on a besoin d'une nouvelle page AVANT d'ajouter la catégorie
        if (yPosition > pageHeight - 60) {
          doc.addPage()
          yPosition = await addPageHeader("• ANNEXES - PIÈCES JUSTIFICATIVES (SUITE)")
        }

        // Titre de catégorie doux
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text(categoryName, margin, yPosition)
        yPosition += 10

        // Documents de cette catégorie avec style doux
        documentsByCategory[category].forEach((docItem: any) => {
          // Vérifier si on a besoin d'une nouvelle page AVANT chaque document
          if (yPosition > pageHeight - 30) {
            doc.addPage()
            yPosition = await addPageHeader("• ANNEXES - PIÈCES JUSTIFICATIVES (SUITE)")
          }

          doc.setFontSize(9)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(55, 65, 81) // Gris foncé doux
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

    // MERGE FINAL AVEC TÉLÉCHARGEMENT CORRECT
    console.log(`🔄 Préparation du PDF final avec ${pdfsToMerge.length} PDF(s) et ${imagesToAdd.length} image(s)...`)

    try {
      // Convertir le PDF jsPDF en ArrayBuffer
      const jsPdfOutput = doc.output("arraybuffer")
      const mainPdfDoc = await PDFDocument.load(jsPdfOutput)

      // Ajouter les images avec en-têtes doux
      for (const imageItem of imagesToAdd) {
        try {
          console.log(`🖼️ Ajout de l'image: ${imageItem.name}`)

          const imagePage = mainPdfDoc.addPage()
          const { width, height } = imagePage.getSize()

          // En-tête doux pour l'image
          imagePage.drawRectangle({
            x: 0,
            y: height - 40,
            width: width,
            height: 40,
            color: { r: primaryColor[0] / 255, g: primaryColor[1] / 255, b: primaryColor[2] / 255 },
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

          // Calculer les dimensions avec marges douces
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

          // Bordure très douce autour de l'image
          imagePage.drawRectangle({
            x: xPos - 2,
            y: yPos - 2,
            width: finalWidth + 4,
            height: finalHeight + 4,
            borderColor: { r: 0.9, g: 0.9, b: 0.9 },
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

      // Sauvegarder le PDF final - MÉTHODE CORRECTE
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

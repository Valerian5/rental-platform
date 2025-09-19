import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface FiscalPDFData {
  year: number
  owner: {
    name: string
    address: string
    email: string
  }
  summary: {
    totalRentCollected: number
    totalRecoverableCharges: number
    totalDeductibleExpenses: number
    netRentalIncome: number
  }
  simulations: {
    microFoncier: {
      applicable: boolean
      grossIncome: number
      deduction: number
      taxableIncome: number
    }
    microBIC: {
      applicable: boolean
      grossIncome: number
      deduction: number
      taxableIncome: number
    }
    realRegime: {
      grossIncome: number
      deductibleExpenses: number
      taxableIncome: number
    }
    recommendation: {
      regime: string
      reason: string
      savings: number
    }
  }
  expenses: {
    deductible: Array<{
      category: string
      amount: number
      count: number
    }>
    nonDeductible: Array<{
      category: string
      amount: number
      count: number
    }>
  }
  properties: Array<{
    title: string
    address: string
    type: string
    monthlyRent: number
    charges: number
  }>
}

export class FiscalPDFGenerator {
  private doc: jsPDF

  constructor() {
    this.doc = new jsPDF()
  }

  /**
   * Génère un récapitulatif fiscal complet
   */
  generateFiscalSummary(data: FiscalPDFData): jsPDF {
    this.doc = new jsPDF()
    
    // Page 1: En-tête et résumé
    this.addHeader(data)
    this.addSummary(data)
    this.addSimulations(data)
    
    // Page 2: Détail des dépenses
    this.doc.addPage()
    this.addExpensesBreakdown(data)
    
    // Page 3: Détail des biens
    this.doc.addPage()
    this.addPropertiesDetails(data)
    
    return this.doc
  }

  /**
   * Génère un formulaire 2044 prérempli
   */
  generateForm2044(data: FiscalPDFData): jsPDF {
    this.doc = new jsPDF()
    
    this.addHeader(data)
    this.addForm2044Content(data)
    
    return this.doc
  }

  /**
   * Génère un formulaire 2042-C-PRO prérempli
   */
  generateForm2042CPRO(data: FiscalPDFData): jsPDF {
    this.doc = new jsPDF()
    
    this.addHeader(data)
    this.addForm2042CPROContent(data)
    
    return this.doc
  }

  private addHeader(data: FiscalPDFData) {
    // Titre principal
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Déclaration fiscale locative', 20, 30)
    
    // Année
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Année ${data.year}`, 20, 45)
    
    // Informations propriétaire
    this.doc.setFontSize(12)
    this.doc.text('Propriétaire:', 20, 60)
    this.doc.text(data.owner.name, 60, 60)
    this.doc.text(data.owner.address, 60, 70)
    this.doc.text(data.owner.email, 60, 80)
    
    // Date de génération
    this.doc.setFontSize(10)
    this.doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 150, 30)
  }

  private addSummary(data: FiscalPDFData) {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Résumé fiscal', 20, 100)
    
    // Tableau résumé
    const summaryData = [
      ['Revenus bruts (loyers encaissés)', `${data.summary.totalRentCollected.toLocaleString('fr-FR')} €`],
      ['Charges récupérables (non imposables)', `${data.summary.totalRecoverableCharges.toLocaleString('fr-FR')} €`],
      ['Dépenses déductibles', `${data.summary.totalDeductibleExpenses.toLocaleString('fr-FR')} €`],
      ['Revenu net locatif', `${data.summary.netRentalIncome.toLocaleString('fr-FR')} €`]
    ]
    
    this.doc.autoTable({
      startY: 110,
      head: [['Élément', 'Montant']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 }
    })
  }

  private addSimulations(data: FiscalPDFData) {
    const finalY = (this.doc as any).lastAutoTable.finalY || 150
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Simulations fiscales', 20, finalY + 20)
    
    const simulationsData = [
      [
        'Régime',
        'Revenu imposable',
        'Recommandé',
        'Observations'
      ],
      [
        'Micro-foncier',
        `${data.simulations.microFoncier.taxableIncome.toLocaleString('fr-FR')} €`,
        data.simulations.recommendation.regime === 'micro-foncier' ? 'Oui' : 'Non',
        data.simulations.microFoncier.applicable ? 'Applicable' : 'Non applicable'
      ],
      [
        'Micro-BIC',
        `${data.simulations.microBIC.taxableIncome.toLocaleString('fr-FR')} €`,
        data.simulations.recommendation.regime === 'micro-bic' ? 'Oui' : 'Non',
        'Location meublée uniquement'
      ],
      [
        'Régime réel',
        `${data.simulations.realRegime.taxableIncome.toLocaleString('fr-FR')} €`,
        data.simulations.recommendation.regime === 'real' ? 'Oui' : 'Non',
        'Toujours applicable'
      ]
    ]
    
    this.doc.autoTable({
      startY: finalY + 30,
      head: [simulationsData[0]],
      body: simulationsData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 }
    })
    
    // Recommandation
    const tableY = (this.doc as any).lastAutoTable.finalY || finalY + 30
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Recommandation:', 20, tableY + 20)
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(
      `Régime ${data.simulations.recommendation.regime} - ${data.simulations.recommendation.reason}`,
      20,
      tableY + 35
    )
    
    if (data.simulations.recommendation.savings > 0) {
      this.doc.text(
        `Économie estimée: ${data.simulations.recommendation.savings.toLocaleString('fr-FR')} €`,
        20,
        tableY + 50
      )
    }
  }

  private addExpensesBreakdown(data: FiscalPDFData) {
    this.addHeader(data)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Détail des dépenses', 20, 100)
    
    // Dépenses déductibles
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Dépenses déductibles', 20, 120)
    
    const deductibleData = data.expenses.deductible.map(expense => [
      expense.category,
      `${expense.amount.toLocaleString('fr-FR')} €`,
      `${expense.count} dépense${expense.count > 1 ? 's' : ''}`
    ])
    
    this.doc.autoTable({
      startY: 130,
      head: [['Catégorie', 'Montant total', 'Nombre']],
      body: deductibleData,
      theme: 'grid',
      headStyles: { fillColor: [40, 167, 69] },
      styles: { fontSize: 10 }
    })
    
    // Dépenses non déductibles
    const deductibleY = (this.doc as any).lastAutoTable.finalY || 130
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Dépenses non déductibles', 20, deductibleY + 20)
    
    const nonDeductibleData = data.expenses.nonDeductible.map(expense => [
      expense.category,
      `${expense.amount.toLocaleString('fr-FR')} €`,
      `${expense.count} dépense${expense.count > 1 ? 's' : ''}`
    ])
    
    if (nonDeductibleData.length > 0) {
      this.doc.autoTable({
        startY: deductibleY + 30,
        head: [['Catégorie', 'Montant total', 'Nombre']],
        body: nonDeductibleData,
        theme: 'grid',
        headStyles: { fillColor: [255, 193, 7] },
        styles: { fontSize: 10 }
      })
    } else {
      this.doc.setFont('helvetica', 'normal')
      this.doc.text('Aucune dépense non déductible', 20, deductibleY + 30)
    }
  }

  private addPropertiesDetails(data: FiscalPDFData) {
    this.addHeader(data)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Détail des biens locatifs', 20, 100)
    
    const propertiesData = data.properties.map(property => [
      property.title,
      property.address,
      property.type,
      `${property.monthlyRent.toLocaleString('fr-FR')} €`,
      `${property.charges.toLocaleString('fr-FR')} €`
    ])
    
    this.doc.autoTable({
      startY: 110,
      head: [['Bien', 'Adresse', 'Type', 'Loyer mensuel', 'Charges']],
      body: propertiesData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 }
    })
  }

  private addForm2044Content(data: FiscalPDFData) {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Formulaire 2044 - Revenus fonciers', 20, 100)
    
    // Instructions
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Ce formulaire est prérempli avec vos données. Vérifiez et complétez selon vos besoins.', 20, 120)
    
    // Données préremplies
    const formData = [
      ['Ligne 4BE - Revenus bruts', `${data.summary.totalRentCollected.toLocaleString('fr-FR')} €`],
      ['Ligne 4BF - Charges déductibles', `${data.summary.totalDeductibleExpenses.toLocaleString('fr-FR')} €`],
      ['Ligne 4BG - Revenu net', `${data.summary.netRentalIncome.toLocaleString('fr-FR')} €`]
    ]
    
    this.doc.autoTable({
      startY: 140,
      head: [['Ligne', 'Montant']],
      body: formData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 }
    })
  }

  private addForm2042CPROContent(data: FiscalPDFData) {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Formulaire 2042-C-PRO - BIC/LMNP', 20, 100)
    
    // Instructions
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Ce formulaire est prérempli avec vos données pour la location meublée. Vérifiez et complétez selon vos besoins.', 20, 120)
    
    // Données préremplies
    const formData = [
      ['Chiffre d\'affaires', `${data.summary.totalRentCollected.toLocaleString('fr-FR')} €`],
      ['Charges déductibles', `${data.summary.totalDeductibleExpenses.toLocaleString('fr-FR')} €`],
      ['Résultat net', `${data.summary.netRentalIncome.toLocaleString('fr-FR')} €`]
    ]
    
    this.doc.autoTable({
      startY: 140,
      head: [['Élément', 'Montant']],
      body: formData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 }
    })
  }

  /**
   * Sauvegarde le PDF et retourne l'URL de téléchargement
   */
  savePDF(filename: string): string {
    this.doc.save(filename)
    return URL.createObjectURL(this.doc.output('blob'))
  }
}

import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Fonctions de traduction
const translateCategory = (category: string): string => {
  const translations: { [key: string]: string } = {
    'repair': 'Réparations',
    'maintenance': 'Maintenance',
    'improvement': 'Améliorations',
    'tax': 'Taxes',
    'insurance': 'Assurance',
    'interest': 'Intérêts',
    'management': 'Gestion'
  }
  return translations[category] || category
}

const translateLeaseType = (type: string): string => {
  const translations: { [key: string]: string } = {
    'unfurnished': 'Non meublé',
    'furnished': 'Meublé',
    'commercial': 'Commercial',
    'parking': 'Parking',
    'storage': 'Cave/Box'
  }
  return translations[type] || type
}

const translateRegime = (regime: string): string => {
  const translations: { [key: string]: string } = {
    'micro-foncier': 'Micro-foncier',
    'micro-bic': 'Micro-BIC',
    'real': 'Régime réel'
  }
  return translations[regime] || regime
}

// Fonction pour formater les montants sans espaces
const formatAmount = (amount: number): string => {
  return `${amount.toLocaleString('fr-FR', { useGrouping: false })} €`
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
      ['Revenus bruts (loyers encaissés)', formatAmount(data.summary.totalRentCollected || 0)],
      ['Charges récupérables (non imposables)', formatAmount(data.summary.totalRecoverableCharges || 0)],
      ['Dépenses déductibles', formatAmount(data.summary.totalDeductibleExpenses || 0)],
      ['Revenu net locatif', formatAmount(data.summary.netRentalIncome || 0)]
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
        formatAmount(data.simulations.microFoncier.taxableIncome || 0),
        data.simulations.recommendation.regime === 'micro-foncier' ? 'Oui' : 'Non',
        data.simulations.microFoncier.applicable ? 'Applicable' : 'Non applicable'
      ],
      [
        'Micro-BIC',
        formatAmount(data.simulations.microBIC.taxableIncome || 0),
        data.simulations.recommendation.regime === 'micro-bic' ? 'Oui' : 'Non',
        'Location meublée uniquement'
      ],
      [
        'Régime réel',
        formatAmount(data.simulations.realRegime.taxableIncome || 0),
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
      `Régime ${translateRegime(data.simulations.recommendation.regime)} - ${data.simulations.recommendation.reason || 'Recommandé'}`,
      20,
      tableY + 35
    )
    
    if (data.simulations.recommendation.savings > 0) {
      this.doc.text(
        `Économie estimée: ${formatAmount(data.simulations.recommendation.savings || 0)}`,
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
      translateCategory(expense.category),
      formatAmount(expense.amount || 0),
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
      translateCategory(expense.category),
      formatAmount(expense.amount || 0),
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
      translateLeaseType(property.type),
      formatAmount(property.monthlyRent || 0),
      formatAmount(property.charges || 0)
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
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('FORMULAIRE 2044 - REVENUS FONCIERS', 20, 100)
    
    // Instructions
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Déclaration des revenus fonciers - Année d\'imposition ' + data.year, 20, 115)
    this.doc.text('Ce formulaire est prérempli avec vos données. Vérifiez et complétez selon vos besoins.', 20, 125)
    
    // Section A - Revenus bruts
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('A - REVENUS BRUTS', 20, 145)
    
    const revenueData = [
      ['Ligne 4BE', 'Revenus bruts (loyers encaissés)', formatAmount(data.summary.totalRentCollected || 0)],
      ['Ligne 4BF', 'Charges récupérables (non imposables)', formatAmount(data.summary.totalRecoverableCharges || 0)],
      ['Ligne 4BG', 'Revenu net imposable', formatAmount(data.summary.netRentalIncome || 0)]
    ]
    
    this.doc.autoTable({
      startY: 155,
      head: [['Ligne', 'Description', 'Montant']],
      body: revenueData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 80 },
        2: { cellWidth: 30, halign: 'right' }
      }
    })
    
    // Section B - Charges déductibles
    const tableY = (this.doc as any).lastAutoTable.finalY || 155
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('B - CHARGES DÉDUCTIBLES', 20, tableY + 20)
    
    const chargesData = [
      ['Ligne 4BF', 'Charges déductibles', formatAmount(data.summary.totalDeductibleExpenses || 0)],
      ['', 'Dont réparations et améliorations', formatAmount(0)],
      ['', 'Dont charges de gestion', formatAmount(0)],
      ['', 'Dont assurances', formatAmount(0)],
      ['', 'Dont intérêts d\'emprunt', formatAmount(0)]
    ]
    
    this.doc.autoTable({
      startY: tableY + 30,
      head: [['Ligne', 'Description', 'Montant']],
      body: chargesData,
      theme: 'grid',
      headStyles: { fillColor: [40, 167, 69] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 80 },
        2: { cellWidth: 30, halign: 'right' }
      }
    })
    
    // Section C - Résultat
    const chargesTableY = (this.doc as any).lastAutoTable.finalY || tableY + 30
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('C - RÉSULTAT', 20, chargesTableY + 20)
    
    const resultData = [
      ['Ligne 4BG', 'Revenu net foncier', formatAmount(data.summary.netRentalIncome || 0)],
      ['', 'Déficit foncier reportable', formatAmount(0)],
      ['', 'Résultat net imposable', formatAmount(data.summary.netRentalIncome || 0)]
    ]
    
    this.doc.autoTable({
      startY: chargesTableY + 30,
      head: [['Ligne', 'Description', 'Montant']],
      body: resultData,
      theme: 'grid',
      headStyles: { fillColor: [220, 53, 69] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 80 },
        2: { cellWidth: 30, halign: 'right' }
      }
    })
  }

  private addForm2042CPROContent(data: FiscalPDFData) {
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('FORMULAIRE 2042-C-PRO - BIC/LMNP', 20, 100)
    
    // Instructions
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Déclaration des bénéfices industriels et commerciaux - Location meublée', 20, 115)
    this.doc.text('Année d\'imposition ' + data.year + ' - Ce formulaire est prérempli avec vos données.', 20, 125)
    
    // Section A - Chiffre d'affaires
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('A - CHIFFRE D\'AFFAIRES', 20, 145)
    
    const revenueData = [
      ['Ligne CA', 'Chiffre d\'affaires (loyers meublés)', formatAmount(data.summary.totalRentCollected || 0)],
      ['', 'Dont charges récupérables', formatAmount(data.summary.totalRecoverableCharges || 0)],
      ['', 'Chiffre d\'affaires net', formatAmount(data.summary.totalRentCollected || 0)]
    ]
    
    this.doc.autoTable({
      startY: 155,
      head: [['Ligne', 'Description', 'Montant']],
      body: revenueData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 80 },
        2: { cellWidth: 30, halign: 'right' }
      }
    })
    
    // Section B - Charges déductibles
    const tableY = (this.doc as any).lastAutoTable.finalY || 155
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('B - CHARGES DÉDUCTIBLES', 20, tableY + 20)
    
    const chargesData = [
      ['Ligne CD', 'Charges déductibles totales', formatAmount(data.summary.totalDeductibleExpenses || 0)],
      ['', 'Dont amortissements', formatAmount(0)],
      ['', 'Dont réparations et maintenance', formatAmount(0)],
      ['', 'Dont charges de gestion', formatAmount(0)],
      ['', 'Dont assurances', formatAmount(0)],
      ['', 'Dont intérêts d\'emprunt', formatAmount(0)],
      ['', 'Dont autres charges', formatAmount(0)]
    ]
    
    this.doc.autoTable({
      startY: tableY + 30,
      head: [['Ligne', 'Description', 'Montant']],
      body: chargesData,
      theme: 'grid',
      headStyles: { fillColor: [40, 167, 69] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 80 },
        2: { cellWidth: 30, halign: 'right' }
      }
    })
    
    // Section C - Résultat
    const chargesTableY = (this.doc as any).lastAutoTable.finalY || tableY + 30
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('C - RÉSULTAT', 20, chargesTableY + 20)
    
    const resultData = [
      ['Ligne RN', 'Résultat net BIC', formatAmount(data.summary.netRentalIncome || 0)],
      ['', 'Déficit reportable', formatAmount(0)],
      ['', 'Résultat net imposable', formatAmount(data.summary.netRentalIncome || 0)]
    ]
    
    this.doc.autoTable({
      startY: chargesTableY + 30,
      head: [['Ligne', 'Description', 'Montant']],
      body: resultData,
      theme: 'grid',
      headStyles: { fillColor: [220, 53, 69] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 80 },
        2: { cellWidth: 30, halign: 'right' }
      }
    })
    
    // Section D - Régime fiscal
    const resultTableY = (this.doc as any).lastAutoTable.finalY || chargesTableY + 30
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('D - RÉGIME FISCAL APPLICABLE', 20, resultTableY + 20)
    
    const regimeData = [
      ['Micro-BIC', 'Abattement forfaitaire 50%', 'Revenus < 72 600€'],
      ['Régime réel', 'Déduction des charges réelles', 'Revenus ≥ 72 600€'],
      ['Recommandé', data.simulations?.recommendation?.regime || 'Régime réel', 'Selon calcul optimisé']
    ]
    
    this.doc.autoTable({
      startY: resultTableY + 30,
      head: [['Régime', 'Modalités', 'Conditions']],
      body: regimeData,
      theme: 'grid',
      headStyles: { fillColor: [108, 117, 125] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 60 },
        2: { cellWidth: 40 }
      }
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

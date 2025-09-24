import jsPDF from 'jspdf'

export interface LeaseRevisionData {
  // Données du bail
  lease: {
    id: string
    property: {
      title: string
      address: string
      city: string
    }
    tenant: {
      first_name: string
      last_name: string
      email: string
    }
    owner: {
      first_name: string
      last_name: string
      email: string
    }
  }
  
  // Données de révision
  revision: {
    revision_year: number
    revision_date: string
    reference_irl_value: number
    new_irl_value: number
    irl_quarter: string
    old_rent_amount: number
    new_rent_amount: number
    rent_increase_amount: number
    rent_increase_percentage: number
    calculation_method: string
  }
}

export interface ChargeRegularizationData {
  // Données du bail
  lease: {
    id: string
    property: {
      title: string
      address: string
      city: string
    }
    tenant: {
      first_name: string
      last_name: string
      email: string
    }
    owner: {
      first_name: string
      last_name: string
      email: string
    }
  }
  
  // Données de régularisation
  regularization: {
    regularization_year: number
    regularization_date: string
    total_provisions_collected: number
    provisions_period_start: string
    provisions_period_end: string
    total_real_charges: number
    recoverable_charges: number
    non_recoverable_charges: number
    tenant_balance: number
    balance_type: 'refund' | 'additional_payment'
    calculation_method: string
    calculation_notes: string
  }
  
  // Détail des charges
  chargeBreakdown: Array<{
    charge_category: string
    charge_name: string
    provision_amount: number
    real_amount: number
    difference: number
    is_recoverable: boolean
    is_exceptional: boolean
    notes?: string
  }>
}

export class RevisionPDFGenerator {
  private doc: jsPDF

  constructor() {
    this.doc = new jsPDF()
  }

  /**
   * Génère un avenant de bail pour la révision de loyer
   */
  generateLeaseAmendment(data: LeaseRevisionData): jsPDF {
    this.doc = new jsPDF()
    
    // En-tête
    this.addHeader()
    
    // Titre
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('AVENANT AU BAIL DE LOCATION', 105, 40, { align: 'center' })
    
    // Informations du bail
    this.addLeaseInfo(data.lease)
    
    // Données de révision
    this.addRevisionData(data.revision)
    
    // Clauses de l'avenant
    this.addAmendmentClauses(data.revision)
    
    // Signature
    this.addSignatureSection(data.lease)
    
    return this.doc
  }

  /**
   * Génère un décompte de charges locatives
   */
  generateChargeStatement(data: ChargeRegularizationData): jsPDF {
    this.doc = new jsPDF()
    
    // En-tête
    this.addHeader()
    
    // Titre
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('DÉCOMPTE DE CHARGES LOCATIVES', 105, 40, { align: 'center' })
    
    // Informations du bail
    this.addLeaseInfo(data.lease)
    
    // Période de régularisation
    this.addRegularizationPeriod(data.regularization)
    
    // Résumé des charges
    this.addChargeSummary(data.regularization)
    
    // Détail des charges
    this.addChargeBreakdown(data.chargeBreakdown)
    
    // Calcul du solde
    this.addBalanceCalculation(data.regularization)
    
    // Méthode de calcul
    this.addCalculationMethod(data.regularization)
    
    // Signature
    this.addSignatureSection(data.lease)
    
    return this.doc
  }

  private addHeader(): void {
    // Logo ou titre de l'application
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('LOUER ICI', 20, 20)
    
    // Date de génération
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(10)
    this.doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 30)
  }

  private addLeaseInfo(lease: LeaseRevisionData['lease']): void {
    let y = 60
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('INFORMATIONS DU BAIL', 20, y)
    
    y += 15
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(10)
    
    this.doc.text(`Logement : ${lease.property.title}`, 20, y)
    y += 8
    this.doc.text(`Adresse : ${lease.property.address}, ${lease.property.city}`, 20, y)
    y += 8
    this.doc.text(`Locataire : ${lease.tenant.first_name} ${lease.tenant.last_name}`, 20, y)
    y += 8
    this.doc.text(`Propriétaire : ${lease.owner.first_name} ${lease.owner.last_name}`, 20, y)
    y += 15
  }

  private addRevisionData(revision: LeaseRevisionData['revision']): void {
    let y = 120
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('DONNÉES DE RÉVISION', 20, y)
    
    y += 15
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(10)
    
    this.doc.text(`Année de révision : ${revision.revision_year}`, 20, y)
    y += 8
    this.doc.text(`Date de révision : ${new Date(revision.revision_date).toLocaleDateString('fr-FR')}`, 20, y)
    y += 8
    this.doc.text(`Trimestre IRL de référence : ${revision.irl_quarter}`, 20, y)
    y += 8
    this.doc.text(`Valeur IRL de référence : ${revision.reference_irl_value}`, 20, y)
    y += 8
    this.doc.text(`Nouvelle valeur IRL : ${revision.new_irl_value}`, 20, y)
    y += 15
    
    // Calculs
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('CALCULS DE RÉVISION', 20, y)
    
    y += 15
    this.doc.setFont('helvetica', 'normal')
    
    this.doc.text(`Ancien loyer : ${revision.old_rent_amount.toFixed(2)} €`, 20, y)
    y += 8
    this.doc.text(`Nouveau loyer : ${revision.new_rent_amount.toFixed(2)} €`, 20, y)
    y += 8
    this.doc.text(`Augmentation : ${revision.rent_increase_amount.toFixed(2)} € (${revision.rent_increase_percentage.toFixed(2)}%)`, 20, y)
    y += 15
  }

  private addAmendmentClauses(revision: LeaseRevisionData['revision']): void {
    let y = 200
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('CLAUSES DE L\'AVENANT', 20, y)
    
    y += 15
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(10)
    
    const clauses = [
      `Article 1 : Le loyer mensuel est révisé de ${revision.old_rent_amount.toFixed(2)} € à ${revision.new_rent_amount.toFixed(2)} € à compter du ${new Date(revision.revision_date).toLocaleDateString('fr-FR')}.`,
      `Article 2 : Cette révision est effectuée conformément à l'indice de référence des loyers (IRL) publié par l'INSEE.`,
      `Article 3 : L'indice de référence est celui du trimestre ${revision.irl_quarter} (valeur : ${revision.reference_irl_value}).`,
      `Article 4 : Le nouveau loyer est calculé selon la formule : nouveau loyer = ancien loyer × (IRL nouveau / IRL référence).`,
      `Article 5 : Toutes les autres clauses du bail restent inchangées.`
    ]
    
    clauses.forEach(clause => {
      const lines = this.doc.splitTextToSize(clause, 170)
      this.doc.text(lines, 20, y)
      y += lines.length * 5 + 5
    })
  }

  private addRegularizationPeriod(regularization: ChargeRegularizationData['regularization']): void {
    let y = 120
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('PÉRIODE DE RÉGULARISATION', 20, y)
    
    y += 15
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(10)
    
    this.doc.text(`Année : ${regularization.regularization_year}`, 20, y)
    y += 8
    this.doc.text(`Période : du ${new Date(regularization.provisions_period_start).toLocaleDateString('fr-FR')} au ${new Date(regularization.provisions_period_end).toLocaleDateString('fr-FR')}`, 20, y)
    y += 8
    this.doc.text(`Date de régularisation : ${new Date(regularization.regularization_date).toLocaleDateString('fr-FR')}`, 20, y)
    y += 15
  }

  private addChargeSummary(regularization: ChargeRegularizationData['regularization']): void {
    let y = 160
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('RÉSUMÉ DES CHARGES', 20, y)
    
    y += 15
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(10)
    
    this.doc.text(`Provisions encaissées : ${regularization.total_provisions_collected.toFixed(2)} €`, 20, y)
    y += 8
    this.doc.text(`Charges réelles totales : ${regularization.total_real_charges.toFixed(2)} €`, 20, y)
    y += 8
    this.doc.text(`Charges récupérables : ${regularization.recoverable_charges.toFixed(2)} €`, 20, y)
    y += 8
    this.doc.text(`Charges non récupérables : ${regularization.non_recoverable_charges.toFixed(2)} €`, 20, y)
    y += 15
  }

  private addChargeBreakdown(chargeBreakdown: ChargeRegularizationData['chargeBreakdown']): void {
    let y = 220
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('DÉTAIL DES CHARGES', 20, y)
    
    y += 15
    
    // En-tête du tableau
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(9)
    this.doc.text('Catégorie', 20, y)
    this.doc.text('Provision', 80, y)
    this.doc.text('Réel', 110, y)
    this.doc.text('Différence', 140, y)
    this.doc.text('Type', 170, y)
    
    y += 10
    
    // Ligne de séparation
    this.doc.line(20, y, 190, y)
    y += 5
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(8)
    
    chargeBreakdown.forEach(charge => {
      this.doc.text(charge.charge_name, 20, y)
      this.doc.text(`${charge.provision_amount.toFixed(2)} €`, 80, y)
      this.doc.text(`${charge.real_amount.toFixed(2)} €`, 110, y)
      this.doc.text(`${charge.difference.toFixed(2)} €`, 140, y)
      this.doc.text(charge.is_recoverable ? 'Récupérable' : 'Non récupérable', 170, y)
      y += 8
    })
  }

  private addBalanceCalculation(regularization: ChargeRegularizationData['regularization']): void {
    let y = 280
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('CALCUL DU SOLDE', 20, y)
    
    y += 15
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(10)
    
    const balanceText = regularization.balance_type === 'refund' 
      ? `Remboursement dû au locataire : ${Math.abs(regularization.tenant_balance).toFixed(2)} €`
      : `Complément dû par le locataire : ${Math.abs(regularization.tenant_balance).toFixed(2)} €`
    
    this.doc.text(balanceText, 20, y)
    y += 15
  }

  private addCalculationMethod(regularization: ChargeRegularizationData['regularization']): void {
    let y = 320
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('MÉTHODE DE CALCUL', 20, y)
    
    y += 15
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(10)
    
    if (regularization.calculation_method) {
      const lines = this.doc.splitTextToSize(regularization.calculation_method, 170)
      this.doc.text(lines, 20, y)
      y += lines.length * 5 + 5
    }
    
    if (regularization.calculation_notes) {
      y += 5
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Notes :', 20, y)
      y += 8
      this.doc.setFont('helvetica', 'normal')
      const lines = this.doc.splitTextToSize(regularization.calculation_notes, 170)
      this.doc.text(lines, 20, y)
    }
  }

  private addSignatureSection(lease: LeaseRevisionData['lease']): void {
    let y = 400
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    // Signature propriétaire
    this.doc.text('Propriétaire :', 20, y)
    y += 20
    this.doc.text(`${lease.owner.first_name} ${lease.owner.last_name}`, 20, y)
    y += 15
    this.doc.text('Signature :', 20, y)
    y += 20
    
    // Signature locataire
    this.doc.text('Locataire :', 20, y)
    y += 20
    this.doc.text(`${lease.tenant.first_name} ${lease.tenant.last_name}`, 20, y)
    y += 15
    this.doc.text('Signature :', 20, y)
    
    // Date et lieu
    y += 30
    this.doc.text(`Fait à ________________, le ________________`, 20, y)
  }
}

// Exemple d'utilisation du module de gestion des paiements

import { paymentService } from '@/lib/payment-service'
import { notificationService } from '@/lib/notification-service'
import PaiementManager from '@/lib/paiementManager'

// Exemple 1: Configuration d'un bail pour la gestion des paiements
async function configureLeasePayment() {
  const leaseId = "lease_lyon_001"
  
  // Configuration des paramètres de paiement
  const config = {
    lease_id: leaseId,
    property_id: "property_lyon_001",
    tenant_id: "tenant_dupont_001",
    monthly_rent: 800,
    monthly_charges: 75,
    payment_day: 5, // Le 5 de chaque mois
    payment_method: "virement" as const,
    is_active: true
  }

  try {
    await paymentService.updateLeasePaymentConfig(leaseId, config)
    console.log("Configuration sauvegardée avec succès")
  } catch (error) {
    console.error("Erreur lors de la configuration:", error)
  }
}

// Exemple 2: Génération des paiements mensuels
async function generateMonthlyPayments() {
  try {
    const payments = await paymentService.generateMonthlyPayments()
    console.log(`${payments.length} paiements générés pour le mois`)
    
    // Notifier le propriétaire des nouvelles échéances
    for (const payment of payments) {
      await notificationService.sendPaymentOverdueNotification(
        payment,
        "proprietaire@example.com",
        "Jean Propriétaire"
      )
    }
  } catch (error) {
    console.error("Erreur lors de la génération:", error)
  }
}

// Exemple 3: Validation d'un paiement
async function validatePayment() {
  const paymentId = "payment_lyon_001_2025_03"
  
  try {
    // Marquer comme payé
    const result = await paymentService.validatePayment({
      payment_id: paymentId,
      status: "paid",
      payment_date: new Date().toISOString(),
      payment_method: "virement"
    })
    
    console.log("Paiement validé:", result)
    
    // Envoyer la quittance au locataire
    if (result.receipt) {
      await notificationService.sendReceiptGeneratedNotification(
        result.payment,
        "locataire@example.com",
        "Marie Locataire"
      )
    }
  } catch (error) {
    console.error("Erreur lors de la validation:", error)
  }
}

// Exemple 4: Envoi d'un rappel
async function sendReminder() {
  const paymentId = "payment_lyon_001_2025_03"
  
  try {
    const result = await paymentService.sendReminder({
      payment_id: paymentId,
      reminder_type: "first"
    })
    
    console.log("Rappel envoyé:", result)
  } catch (error) {
    console.error("Erreur lors de l'envoi du rappel:", error)
  }
}

// Exemple 5: Récupération des statistiques
async function getPaymentStats() {
  const ownerId = "owner_001"
  
  try {
    const stats = await paymentService.getPaymentStats(ownerId, "month")
    console.log("Statistiques du mois:", stats)
    
    // Afficher les montants
    console.log(`Montant reçu: ${stats.total_received.toLocaleString()} €`)
    console.log(`Montant en attente: ${stats.total_pending.toLocaleString()} €`)
    console.log(`Montant en retard: ${stats.total_overdue.toLocaleString()} €`)
    console.log(`Taux de recouvrement: ${stats.collection_rate}%`)
  } catch (error) {
    console.error("Erreur lors de la récupération des stats:", error)
  }
}

// Exemple 6: Utilisation du gestionnaire de paiements
async function usePaymentManager() {
  const manager = new PaiementManager()
  
  // Configuration d'un bail
  manager.setLeasePaymentConfig("lease_001", {
    monthly_rent: 1000,
    monthly_charges: 100,
    payment_day: 1,
    payment_method: "virement",
    is_active: true
  })
  
  // Génération des paiements pour le mois en cours
  const activeLeases = [
    { id: "lease_001", tenant: "Jean Dupont" },
    { id: "lease_002", tenant: "Marie Martin" }
  ]
  
  const currentMonth = new Date()
  const payments = manager.generateMonthlyPayments(activeLeases, currentMonth)
  console.log("Paiements générés:", payments)
  
  // Calcul des statistiques
  const stats = manager.calculatePaymentStats("owner_001", "month")
  console.log("Statistiques calculées:", stats)
}

// Exemple 7: Workflow complet de gestion des paiements
async function completePaymentWorkflow() {
  console.log("=== Début du workflow de gestion des paiements ===")
  
  // 1. Configuration
  await configureLeasePayment()
  
  // 2. Génération mensuelle
  await generateMonthlyPayments()
  
  // 3. Récupération des paiements en attente
  const pendingPayments = await paymentService.getPendingPayments("owner_001")
  console.log(`${pendingPayments.length} paiements en attente`)
  
  // 4. Validation d'un paiement
  if (pendingPayments.length > 0) {
    await validatePayment()
  }
  
  // 5. Gestion des impayés
  const overduePayments = await paymentService.getOverduePayments("owner_001")
  console.log(`${overduePayments.length} paiements en retard`)
  
  if (overduePayments.length > 0) {
    await sendReminder()
  }
  
  // 6. Statistiques finales
  await getPaymentStats()
  
  console.log("=== Fin du workflow ===")
}

// Exécution des exemples
if (typeof window === 'undefined') {
  // Exécution côté serveur
  completePaymentWorkflow().catch(console.error)
}

export {
  configureLeasePayment,
  generateMonthlyPayments,
  validatePayment,
  sendReminder,
  getPaymentStats,
  usePaymentManager,
  completePaymentWorkflow
}

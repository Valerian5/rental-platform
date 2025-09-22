# Module de Gestion des Paiements

## 🎯 Vue d'ensemble

Le module de gestion des paiements permet aux propriétaires de :
- Gérer la validation manuelle des paiements mensuels
- Générer automatiquement des quittances de loyer (PDF)
- Gérer les impayés avec système de rappels
- Assurer la traçabilité complète des paiements

## 📁 Structure des fichiers

```
lib/
├── payment-models.ts          # Modèles de données TypeScript
├── payment-service.ts         # Service API pour les paiements
├── paiementManager.js         # Logique métier des paiements
├── pdf-generator.ts          # Générateur de quittances PDF
└── notification-service.ts    # Service de notifications

components/
├── PaymentManagement.tsx      # Composant principal de gestion
└── PaymentConfig.tsx         # Configuration des paiements par bail

app/api/payments/
├── route.ts                  # API principale des paiements
├── [id]/validate/route.ts    # Validation des paiements
├── [id]/reminder/route.ts    # Envoi de rappels
├── generate-monthly/route.ts # Génération mensuelle
└── stats/[ownerId]/route.ts  # Statistiques des paiements
```

## 🚀 Fonctionnalités implémentées

### 1. Gestion des paiements
- ✅ Création automatique des paiements mensuels
- ✅ Validation manuelle par le propriétaire (payé/impayé)
- ✅ Suivi des statuts (en attente, payé, en retard)
- ✅ Historique complet des paiements

### 2. Génération de quittances
- ✅ Génération automatique de quittances PDF
- ✅ Templates HTML personnalisables
- ✅ Numérotation automatique des quittances
- ✅ Mentions légales obligatoires

### 3. Système de rappels
- ✅ Rappels automatiques pour les impayés
- ✅ Templates d'emails personnalisés
- ✅ Historique des rappels envoyés
- ✅ Types de rappels (premier, deuxième, final)

### 4. Notifications
- ✅ Notifications propriétaire (paiement reçu/retard)
- ✅ Notifications locataire (quittance générée)
- ✅ Emails automatiques avec templates

### 5. Configuration
- ✅ Paramétrage par bail (loyer, charges, jour de paiement)
- ✅ Modes de paiement (virement, chèque, espèces)
- ✅ Activation/désactivation de la gestion automatique

## 📊 Interface utilisateur

### Page principale des paiements (`/owner/payments`)
- Statistiques en temps réel (montants reçus, en attente, en retard)
- Liste des paiements avec filtres (statut, période, recherche)
- Actions rapides (valider, rappeler, télécharger quittance)
- Génération des paiements mensuels

### Configuration des paiements
- Paramétrage du loyer et des charges
- Sélection du jour de paiement
- Choix du mode de paiement
- Activation de la gestion automatique

## 🔧 Utilisation

### 1. Configuration initiale
```typescript
// Configurer un bail pour la gestion des paiements
const config = {
  lease_id: "lease_123",
  monthly_rent: 800,
  monthly_charges: 75,
  payment_day: 5,
  payment_method: "virement",
  is_active: true
}

await paymentService.updateLeasePaymentConfig(leaseId, config)
```

### 2. Génération des paiements mensuels
```typescript
// Générer tous les paiements du mois
const payments = await paymentService.generateMonthlyPayments()
```

### 3. Validation d'un paiement
```typescript
// Marquer un paiement comme payé
await paymentService.validatePayment({
  payment_id: "payment_123",
  status: "paid",
  payment_date: new Date().toISOString()
})
```

### 4. Envoi d'un rappel
```typescript
// Envoyer un rappel au locataire
await paymentService.sendReminder({
  payment_id: "payment_123",
  reminder_type: "first"
})
```

## 📋 Modèles de données

### Payment
```typescript
interface Payment {
  id: string
  lease_id: string
  month: string              // "2025-03"
  year: number
  month_name: string         // "Mars 2025"
  amount_due: number         // Montant total dû
  rent_amount: number        // Loyer hors charges
  charges_amount: number     // Charges
  due_date: string          // Date d'échéance
  payment_date?: string     // Date de paiement effectif
  status: PaymentStatus     // pending | paid | overdue | cancelled
  payment_method?: PaymentMethod
  reference: string         // Référence unique
  receipt_id?: string       // ID de la quittance
}
```

### Receipt
```typescript
interface Receipt {
  id: string
  payment_id: string
  lease_id: string
  reference: string         // "Quittance #2025-03-APT001"
  month: string
  year: number
  rent_amount: number
  charges_amount: number
  total_amount: number
  pdf_path?: string
  generated_at: string
  sent_to_tenant: boolean
}
```

### Reminder
```typescript
interface Reminder {
  id: string
  payment_id: string
  lease_id: string
  tenant_id: string
  sent_at: string
  message: string
  status: 'sent' | 'delivered' | 'failed'
  reminder_type: 'first' | 'second' | 'final'
}
```

## 🔄 Flux de travail

1. **Configuration** : Le propriétaire configure les paramètres de paiement pour chaque bail
2. **Génération** : Les paiements mensuels sont générés automatiquement
3. **Notification** : Le propriétaire reçoit une notification d'échéance
4. **Validation** : Le propriétaire valide le paiement (reçu/non reçu)
5. **Quittance** : Si payé, une quittance PDF est générée automatiquement
6. **Rappel** : Si impayé, le propriétaire peut envoyer un rappel
7. **Historique** : Toutes les actions sont tracées dans l'historique

## 🎨 Personnalisation

### Templates d'emails
Les templates d'emails sont personnalisables dans `notification-service.ts` :
- Paiement reçu
- Paiement en retard
- Rappel locataire
- Quittance générée

### Templates de quittances
Les quittances PDF utilisent des templates HTML personnalisables dans `pdf-generator.ts`.

## 🚨 Notifications importantes

- Les paiements sont générés automatiquement le 1er de chaque mois
- Les notifications de retard sont envoyées automatiquement après l'échéance
- Les quittances sont générées uniquement après validation du paiement
- L'historique des rappels est conservé pour la traçabilité

## 🔧 Développement

### Ajout de nouvelles fonctionnalités
1. Modifier les modèles dans `payment-models.ts`
2. Mettre à jour la logique dans `paiementManager.js`
3. Créer les routes API correspondantes
4. Ajouter l'interface utilisateur dans les composants React

### Tests
- Tester la génération des paiements mensuels
- Vérifier la validation des paiements
- Tester l'envoi des rappels
- Valider la génération des quittances PDF

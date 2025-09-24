# Fonctionnalité Révision Annuelle

Cette fonctionnalité permet aux propriétaires de gérer les révisions annuelles de loyer (IRL) et les régularisations de charges locatives de manière automatisée et conforme à la législation.

## 🎯 Fonctionnalités principales

### 1. Révision de loyer (IRL)
- **Récupération automatique** des indices IRL INSEE
- **Calcul automatique** de la révision selon la formule légale
- **Vérification de conformité** (plafonds, zones tendues)
- **Génération d'avenant PDF** téléchargeable et envoyable

### 2. Régularisation des charges
- **Calcul automatique** des provisions encaissées via les quittances
- **Saisie des charges réelles** par catégorie
- **Séparation** charges récupérables vs non récupérables
- **Génération de décompte PDF** avec justificatifs

### 3. Communication avec les locataires
- **Envoi automatique** des documents par email
- **Dépôt dans l'espace locataire** pour consultation
- **Traçabilité complète** des envois et lectures

### 4. Notifications et rappels
- **Rappels automatiques** 1 mois avant les échéances
- **Notifications** de nouveaux documents
- **Historique complet** des communications

## 📊 Structure de la base de données

### Tables principales

#### `lease_revisions`
Stocke les révisions de loyer par bail et par année.

```sql
- id: UUID (clé primaire)
- lease_id: UUID (référence vers leases)
- property_id: UUID (référence vers properties)
- revision_year: INTEGER
- revision_date: DATE
- reference_irl_value: DECIMAL(10,2)
- new_irl_value: DECIMAL(10,2)
- irl_quarter: VARCHAR(10)
- old_rent_amount: DECIMAL(10,2)
- new_rent_amount: DECIMAL(10,2)
- rent_increase_amount: DECIMAL(10,2)
- rent_increase_percentage: DECIMAL(5,2)
- status: VARCHAR(20) ('draft', 'calculated', 'validated', 'sent', 'signed')
- amendment_pdf_url: TEXT
- calculation_method: TEXT
- legal_compliance_checked: BOOLEAN
- compliance_notes: TEXT
```

#### `charge_regularizations`
Stocke les régularisations de charges par bail et par année.

```sql
- id: UUID (clé primaire)
- lease_id: UUID (référence vers leases)
- property_id: UUID (référence vers properties)
- regularization_year: INTEGER
- regularization_date: DATE
- total_provisions_collected: DECIMAL(10,2)
- provisions_period_start: DATE
- provisions_period_end: DATE
- total_real_charges: DECIMAL(10,2)
- recoverable_charges: DECIMAL(10,2)
- non_recoverable_charges: DECIMAL(10,2)
- tenant_balance: DECIMAL(10,2)
- balance_type: VARCHAR(20) ('refund', 'additional_payment')
- status: VARCHAR(20) ('draft', 'calculated', 'validated', 'sent', 'paid')
- statement_pdf_url: TEXT
- calculation_method: TEXT
- calculation_notes: TEXT
- supporting_documents: JSONB
```

#### `charge_breakdown`
Détail des charges par catégorie pour chaque régularisation.

```sql
- id: UUID (clé primaire)
- regularization_id: UUID (référence vers charge_regularizations)
- charge_category: VARCHAR(50)
- charge_name: VARCHAR(100)
- provision_amount: DECIMAL(10,2)
- real_amount: DECIMAL(10,2)
- difference: DECIMAL(10,2)
- is_recoverable: BOOLEAN
- is_exceptional: BOOLEAN
- supporting_documents: JSONB
- notes: TEXT
```

#### `revision_notifications`
Historique des notifications et communications.

```sql
- id: UUID (clé primaire)
- lease_id: UUID (référence vers leases)
- property_id: UUID (référence vers properties)
- notification_type: VARCHAR(30)
- title: VARCHAR(200)
- message: TEXT
- recipient_type: VARCHAR(20) ('owner', 'tenant')
- recipient_id: UUID (référence vers auth.users)
- recipient_email: VARCHAR(255)
- status: VARCHAR(20) ('pending', 'sent', 'delivered', 'read', 'failed')
- sent_at: TIMESTAMP WITH TIME ZONE
- read_at: TIMESTAMP WITH TIME ZONE
- metadata: JSONB
```

## 🚀 Installation

### 1. Migration de la base de données

Exécutez le script de migration :

```bash
node scripts/run-revision-migration.js
```

Ou exécutez manuellement les fichiers SQL dans l'interface Supabase :

```sql
-- Voir le fichier scripts/create-revision-tables.sql
-- Voir le fichier scripts/create-tenant-documents-table.sql
```

### 2. Configuration des variables d'environnement

Assurez-vous que les variables suivantes sont configurées :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Configuration des charges récupérables

Pour chaque bail, vous pouvez configurer les catégories de charges récupérables :

```typescript
// Exemple de configuration
const chargeSettings = {
  charge_categories: [
    { name: 'Eau', category: 'eau', recoverable: true },
    { name: 'Chauffage', category: 'chauffage', recoverable: true },
    { name: 'Ascenseur', category: 'ascenseur', recoverable: true },
    { name: 'Électricité parties communes', category: 'electricite', recoverable: true },
    { name: 'TEOM', category: 'teom', recoverable: true },
    { name: 'Gardiennage', category: 'gardiennage', recoverable: true },
    { name: 'Nettoyage', category: 'nettoyage', recoverable: true }
  ],
  recovery_method: 'proportional',
  calculation_basis: 'surface'
}
```

## 📱 Interface utilisateur

### Assistant de révision (Wizard)

L'interface suit un processus en 3 étapes :

#### Étape 1 : Révision du loyer
- Sélection de l'indice IRL de référence
- Récupération automatique du nouvel indice IRL
- Calcul automatique de la révision
- Vérification de conformité légale

#### Étape 2 : Régularisation des charges
- Calcul automatique des provisions encaissées
- Saisie des charges réelles par catégorie
- Calcul du solde (remboursement ou complément)
- Ajout de justificatifs et notes

#### Étape 3 : Validation et envoi
- Génération des PDF (avenant et décompte)
- Envoi par email au locataire
- Dépôt dans l'espace locataire
- Traçabilité des envois

### Historique et suivi

- **Historique des révisions** par bail et par année
- **Statut des documents** (brouillon, validé, envoyé, signé)
- **Notifications** et rappels automatiques
- **Téléchargement** des documents PDF

## 🔧 API Endpoints

### Révisions de loyer

```typescript
// Récupérer les révisions
GET /api/revisions?propertyId=xxx&year=2024

// Créer une révision
POST /api/revisions
{
  leaseId: string,
  propertyId: string,
  revisionYear: number,
  referenceIrlValue: number,
  newIrlValue: number,
  // ... autres champs
}

// Récupérer les données IRL
GET /api/revisions/irl?year=2024&quarter=2024-Q1
```

### Régularisations de charges

```typescript
// Récupérer les régularisations
GET /api/revisions/charges?propertyId=xxx&year=2024

// Créer une régularisation
POST /api/revisions/charges
{
  leaseId: string,
  propertyId: string,
  regularizationYear: number,
  totalProvisionsCollected: number,
  totalRealCharges: number,
  // ... autres champs
}

// Calculer les provisions
POST /api/revisions/charges/calculate
{
  leaseId: string,
  year: number,
  provisionsPeriodStart: string,
  provisionsPeriodEnd: string
}
```

### Communication

```typescript
// Envoyer un document au locataire
POST /api/revisions/communication
{
  action: 'send-document',
  leaseId: string,
  documentType: 'amendment' | 'statement',
  documentUrl: string,
  sendEmail: boolean,
  saveToTenantSpace: boolean
}
```

### Notifications

```typescript
// Récupérer les notifications
GET /api/revisions/notifications?propertyId=xxx

// Créer une notification
POST /api/revisions/notifications
{
  leaseId: string,
  propertyId: string,
  notificationType: string,
  title: string,
  message: string,
  recipientType: 'owner' | 'tenant',
  recipientId: string
}

// Vérifier et envoyer les rappels
POST /api/revisions/reminders
{
  action: 'check-reminders'
}
```

## 📄 Génération de documents PDF

### Avenant de bail

Le générateur PDF crée un avenant conforme avec :
- Informations du bail et des parties
- Données de révision (IRL, calculs)
- Clauses de l'avenant
- Section de signature

### Décompte de charges

Le décompte inclut :
- Période de régularisation
- Résumé des charges (provisions vs réelles)
- Détail par catégorie de charge
- Calcul du solde
- Méthode de calcul
- Section de signature

## 🔔 Système de notifications

### Types de notifications

1. **Rappels de révision** : 1 mois avant la date anniversaire
2. **Rappels de régularisation** : 1 an après le début du bail
3. **Documents envoyés** : Confirmation d'envoi au locataire
4. **Documents signés** : Confirmation de réception par le locataire

### Canaux de communication

- **Email** : Envoi automatique avec pièces jointes
- **Espace locataire** : Dépôt des documents pour consultation
- **Notifications in-app** : Alertes dans l'interface

## 🛡️ Sécurité et conformité

### Row Level Security (RLS)

Toutes les tables sont protégées par RLS :
- **Propriétaires** : Accès à leurs propres données
- **Locataires** : Accès aux documents de leurs baux
- **Isolation** : Chaque utilisateur ne voit que ses données

### Conformité légale

- **Vérification des plafonds** de révision
- **Gestion des zones tendues** (limitation à 2,5%)
- **Calculs conformes** à la législation
- **Traçabilité complète** des opérations

## 📈 Monitoring et analytics

### Métriques disponibles

- Nombre de révisions par propriétaire
- Taux de conformité légale
- Délais moyens de traitement
- Taux d'ouverture des emails
- Satisfaction des locataires

### Rapports

- **Rapport annuel** des révisions
- **Tableau de bord** des échéances
- **Alertes** de non-conformité
- **Export** des données pour comptabilité

## 🔄 Maintenance

### Tâches récurrentes

1. **Vérification des rappels** (cron job quotidien)
2. **Mise à jour des indices IRL** (trimestriel)
3. **Nettoyage des notifications** anciennes
4. **Sauvegarde** des documents PDF

### Monitoring

- **Logs** des opérations de révision
- **Alertes** en cas d'erreur
- **Métriques** de performance
- **Audit trail** complet

## 🆘 Dépannage

### Problèmes courants

1. **Données IRL non disponibles** : Vérifier la connexion à l'API INSEE
2. **Calculs incorrects** : Vérifier les valeurs de référence
3. **Documents non générés** : Vérifier les permissions de stockage
4. **Emails non envoyés** : Vérifier la configuration SMTP

### Support

Pour toute question ou problème :
- Consulter les logs d'erreur
- Vérifier la configuration des variables d'environnement
- Contacter l'équipe de support technique

# Installation du Module de Gestion des Paiements

## 🚀 Installation Rapide

### 1. Exécuter la migration de la base de données

**Option A: Via l'interface Supabase (Recommandé)**
1. Connectez-vous à votre dashboard Supabase
2. Allez dans l'onglet "SQL Editor"
3. Copiez et exécutez le contenu du fichier `scripts/create-payments-tables.sql`

**Option B: Via l'API de migration**
```bash
# Appelez l'endpoint de migration (nécessite d'être admin)
curl -X POST https://votre-domaine.com/api/migrate/payments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Option C: Via le script Node.js**
```bash
# Assurez-vous d'avoir les variables d'environnement configurées
node scripts/run-payments-migration.js
```

### 2. Vérifier l'installation

Après la migration, vous devriez voir ces nouvelles tables dans Supabase :
- ✅ `payments` - Table des paiements
- ✅ `receipts` - Table des quittances
- ✅ `reminders` - Table des rappels
- ✅ `lease_payment_configs` - Configuration des paiements par bail

### 3. Configuration initiale

1. **Configurer un bail pour les paiements** :
   - Allez sur la page d'un bail existant
   - Utilisez le composant `PaymentConfig` pour configurer les paramètres

2. **Générer les premiers paiements** :
   - Allez sur `/owner/payments`
   - Cliquez sur "Générer paiements mensuels"

## 🔧 Configuration des Variables d'Environnement

Assurez-vous d'avoir ces variables dans votre `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Pour les migrations
```

## 📊 Structure des Tables

### Table `payments`
```sql
- id (uuid, PK)
- lease_id (uuid, FK vers leases)
- month (varchar) - Format "2025-03"
- year (integer)
- month_name (varchar) - "Mars 2025"
- amount_due (numeric) - Montant total dû
- rent_amount (numeric) - Loyer hors charges
- charges_amount (numeric) - Charges
- due_date (timestamp) - Date d'échéance
- payment_date (timestamp) - Date de paiement effectif
- status (varchar) - pending/paid/overdue/cancelled
- payment_method (varchar) - virement/cheque/especes/prelevement
- reference (varchar) - Référence unique
- receipt_id (uuid, FK vers receipts)
```

### Table `receipts`
```sql
- id (uuid, PK)
- payment_id (uuid, FK vers payments)
- lease_id (uuid, FK vers leases)
- reference (varchar) - "Quittance #2025-03-APT001"
- month (varchar)
- year (integer)
- rent_amount (numeric)
- charges_amount (numeric)
- total_amount (numeric)
- pdf_path (text) - Chemin vers le PDF
- generated_at (timestamp)
- sent_to_tenant (boolean)
```

### Table `reminders`
```sql
- id (uuid, PK)
- payment_id (uuid, FK vers payments)
- lease_id (uuid, FK vers leases)
- tenant_id (uuid, FK vers users)
- sent_at (timestamp)
- message (text)
- status (varchar) - sent/delivered/failed
- reminder_type (varchar) - first/second/final
```

### Table `lease_payment_configs`
```sql
- id (uuid, PK)
- lease_id (uuid, FK vers leases, UNIQUE)
- property_id (uuid, FK vers properties)
- tenant_id (uuid, FK vers users)
- monthly_rent (numeric)
- monthly_charges (numeric)
- payment_day (integer) - Jour du mois (1-31)
- payment_method (varchar)
- is_active (boolean)
```

## 🔒 Sécurité (RLS)

Le module utilise Row Level Security (RLS) pour :
- Les propriétaires peuvent gérer leurs paiements
- Les locataires peuvent voir leurs paiements
- Isolation des données par utilisateur

## 🚨 Dépannage

### Erreur 404 sur les routes API
- Vérifiez que les tables existent dans Supabase
- Vérifiez que la migration s'est bien passée

### Erreur 500 sur les statistiques
- Vérifiez que les relations entre tables sont correctes
- Vérifiez que les données de test existent

### Erreur de génération des paiements
- Vérifiez que la fonction `generate_monthly_payments` existe
- Vérifiez que les baux ont une configuration de paiement

## 📝 Données de Test

Pour tester le module, vous pouvez :

1. **Créer une configuration de paiement** :
```sql
INSERT INTO lease_payment_configs (
  lease_id, property_id, tenant_id, 
  monthly_rent, monthly_charges, payment_day, 
  payment_method, is_active
) VALUES (
  'your-lease-id', 'your-property-id', 'your-tenant-id',
  800, 75, 5, 'virement', true
);
```

2. **Générer des paiements de test** :
```sql
SELECT * FROM generate_monthly_payments('2025-01');
```

## 🎯 Prochaines Étapes

1. Configurez vos baux existants avec `PaymentConfig`
2. Testez la génération des paiements mensuels
3. Validez quelques paiements pour tester le workflow complet
4. Configurez les notifications email si nécessaire

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs de la console
2. Vérifiez les logs Supabase
3. Vérifiez que toutes les tables existent
4. Vérifiez les permissions RLS

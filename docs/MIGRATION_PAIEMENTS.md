# Guide de Migration du Module Paiements

## 🚀 Migration de la Base de Données Existante

### 📋 Prérequis
- ✅ Base de données Supabase active
- ✅ Tables `leases`, `users`, `properties` existantes
- ✅ Accès administrateur à Supabase

### 🔧 Étape 1 : Vérifier la Structure Existante

#### 1.1 Vérifier la table `leases`
```sql
-- Exécuter dans Supabase SQL Editor
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'leases' 
AND column_name IN ('id', 'owner_id', 'tenant_id', 'property_id')
ORDER BY column_name;
```

**Résultat attendu :**
- `id` (uuid, not null)
- `owner_id` (uuid, nullable)
- `tenant_id` (uuid, not null)
- `property_id` (uuid, not null)

#### 1.2 Vérifier les contraintes de clé étrangère
```sql
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'leases';
```

### 🔧 Étape 2 : Exécuter la Migration

#### 2.1 Exécuter le script de migration
1. Ouvrir Supabase SQL Editor
2. Copier le contenu de `scripts/migrate-existing-database.sql`
3. Exécuter le script complet

#### 2.2 Vérifier la création des tables
```sql
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'receipts', 'reminders', 'lease_payment_configs')
ORDER BY table_name;
```

### 🔧 Étape 3 : Tester le Module

#### 3.1 Exécuter les tests
1. Copier le contenu de `scripts/test-payment-module.sql`
2. Exécuter dans Supabase SQL Editor
3. Vérifier que tous les tests passent

#### 3.2 Tester la génération de paiements
```sql
-- Générer les paiements pour le mois actuel
SELECT * FROM generate_monthly_payments('2025-01');
```

### 🔧 Étape 4 : Configurer les Paiements

#### 4.1 Créer des configurations de paiement
```sql
-- Créer des configurations pour tous les baux actifs
INSERT INTO lease_payment_configs (lease_id, rent_amount, charges_amount, payment_day, payment_method)
SELECT 
    l.id,
    l.monthly_rent,
    COALESCE(l.charges, 0),
    1, -- 1er du mois
    'virement'
FROM leases l
WHERE l.status = 'active';
```

#### 4.2 Générer les paiements mensuels
```sql
-- Générer les paiements pour le mois actuel
SELECT * FROM generate_monthly_payments('2025-01');
```

### 🔧 Étape 5 : Vérifier l'Interface

#### 5.1 Tester la page de paiements
1. Aller sur `/owner/payments`
2. Vérifier que les paiements se chargent
3. Tester les fonctionnalités (validation, rappels)

#### 5.2 Tester la page de test
1. Aller sur `/test-payments`
2. Exécuter tous les tests
3. Vérifier que tout fonctionne

## ✅ Vérifications Post-Migration

### 📊 Vérifications de Base
- [ ] Tables créées : `payments`, `receipts`, `reminders`, `lease_payment_configs`
- [ ] Index créés sur toutes les tables
- [ ] Politiques RLS activées
- [ ] Fonction `generate_monthly_payments` créée
- [ ] Triggers `updated_at` fonctionnels

### 🔗 Vérifications des Relations
- [ ] Relations `payments` → `leases` fonctionnelles
- [ ] Relations `receipts` → `payments` fonctionnelles
- [ ] Relations `reminders` → `payments` fonctionnelles
- [ ] Relations `lease_payment_configs` → `leases` fonctionnelles

### 🧪 Vérifications Fonctionnelles
- [ ] Génération de paiements mensuels
- [ ] Création de configurations de paiement
- [ ] Interface de paiements opérationnelle
- [ ] Tests de connexion Supabase réussis

## 🚨 Dépannage

### Problème : Erreur de contrainte de clé étrangère
```sql
-- Vérifier les contraintes existantes
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'payments' AND constraint_type = 'FOREIGN KEY';
```

### Problème : Erreur de politique RLS
```sql
-- Vérifier les politiques
SELECT * FROM pg_policies WHERE tablename = 'payments';
```

### Problème : Fonction de génération ne fonctionne pas
```sql
-- Tester la fonction
SELECT * FROM generate_monthly_payments('2025-01');
```

## 📞 Support

Si vous rencontrez des problèmes :
1. Consultez `docs/DEPANNAGE_PAIEMENTS.md`
2. Vérifiez les logs Supabase
3. Testez les requêtes une par une
4. Utilisez le service simplifié en cas de problème de relations

## 🎉 Résultat Final

Après migration réussie :
- ✅ Module de paiements opérationnel
- ✅ Interface utilisateur fonctionnelle
- ✅ Génération automatique de paiements
- ✅ Gestion des quittances et rappels
- ✅ Statistiques de paiements disponibles

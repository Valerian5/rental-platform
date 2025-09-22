# Correction des Colonnes de la Table Leases

## 🚨 Problème Identifié

Les scripts utilisaient `bailleur_id` et `locataire_id` mais la table `leases` utilise `owner_id` et `tenant_id`.

## ✅ Corrections Appliquées

### 1. **Scripts SQL mis à jour**
- ✅ `create-payments-tables-simple.sql` - Utilise `owner_id` et `tenant_id`
- ✅ `create-payments-indexes-and-policies.sql` - Politiques RLS corrigées
- ✅ `create-payments-tables.sql` - Script principal corrigé

### 2. **Services mis à jour**
- ✅ `lib/payment-service.ts` - Toutes les requêtes corrigées
- ✅ `app/api/payments/route.ts` - Routes API corrigées
- ✅ `components/SupabaseTestComponent.tsx` - Tests corrigés

### 3. **Script de correction**
- ✅ `scripts/fix-lease-columns.sql` - Pour corriger les tables existantes

## 🔧 Si Vous Avez Déjà Créé les Tables

### Option 1: Renommer les colonnes (Recommandé)
```sql
-- Exécutez dans Supabase SQL Editor
-- Voir le contenu de scripts/fix-lease-columns.sql
```

### Option 2: Recréer les tables
1. Supprimez les tables existantes
2. Exécutez les nouveaux scripts corrigés

## 📋 Vérification

### Vérifier la structure de la table leases
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'leases' 
AND column_name IN ('owner_id', 'tenant_id')
ORDER BY column_name;
```

### Résultat attendu
```
column_name | data_type | is_nullable
------------|-----------|------------
owner_id    | uuid      | NO
tenant_id   | uuid      | NO
```

## 🧪 Test de Fonctionnement

1. **Allez sur `/test-payments`**
2. **Cliquez sur "Tester Supabase"**
3. **Vérifiez que tous les tests passent**

## 🎯 Colonnes Correctes

### Table `leases`
- ✅ `owner_id` (au lieu de `bailleur_id`)
- ✅ `tenant_id` (au lieu de `locataire_id`)

### Tables de paiements
- ✅ `payments.lease_id` → `leases.id`
- ✅ `reminders.tenant_id` → `users.id`
- ✅ `lease_payment_configs.tenant_id` → `users.id`

## 🚀 Après Correction

Le module de paiements devrait maintenant fonctionner correctement avec :
- ✅ Connexion Supabase fonctionnelle
- ✅ Requêtes SQL correctes
- ✅ Politiques RLS appropriées
- ✅ Tests passant avec succès

## 📞 Si Problème Persiste

1. **Vérifiez les logs** de la console
2. **Exécutez le script de correction**
3. **Testez via `/test-payments`**
4. **Vérifiez la structure** de la table `leases`

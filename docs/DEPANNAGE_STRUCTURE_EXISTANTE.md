# Dépannage du Module Paiements - Structure Existante

## 🚨 Problème : "invalid input syntax for type uuid: \"[object Object]\""

### ❌ Erreur
```
22P02: invalid input syntax for type uuid: "[object Object]"
```

### 🔍 Cause
L'`ownerId` passé au service de paiements n'est pas une chaîne UUID valide. Cela peut arriver si :
- L'utilisateur n'est pas correctement authentifié
- L'`ownerId` est un objet au lieu d'une chaîne
- L'utilisateur n'a pas le bon type (`owner`)

### ✅ Solutions Implémentées

#### 1. **Validation de l'ownerId dans le service**
```typescript
// Vérifier que ownerId est une chaîne UUID valide
if (!ownerId || typeof ownerId !== 'string') {
  console.error('ownerId invalide:', ownerId)
  throw new Error('ID propriétaire invalide')
}
```

#### 2. **Service adapté à votre structure existante**
- ✅ Modèles correspondant à votre table `payments`
- ✅ Relations correctes avec `owner_id` et `tenant_id`
- ✅ Gestion des colonnes `month`, `year`, `month_name`, `rent_amount`, `charges_amount`

#### 3. **Fonctions SQL adaptées**
- ✅ `generate_monthly_payments()` - Génère les paiements mensuels
- ✅ `mark_payment_as_paid()` - Marque un paiement comme payé
- ✅ `mark_payment_as_unpaid()` - Marque un paiement comme impayé
- ✅ `create_payment_reminder()` - Crée un rappel
- ✅ `generate_receipt()` - Génère une quittance
- ✅ `get_owner_payment_stats()` - Calcule les statistiques

## 🔧 Instructions de Correction

### Étape 1 : Exécuter les fonctions SQL
```sql
-- Dans Supabase SQL Editor
-- Copier et exécuter le contenu de scripts/create-payment-functions.sql
```

### Étape 2 : Tester la connexion
1. Aller sur `/test-payments`
2. Cliquer sur "Tester le Module Paiements"
3. Vérifier que tous les tests passent

### Étape 3 : Vérifier l'authentification
```typescript
// Dans la console du navigateur
import { authService } from '@/lib/auth-service'
const user = await authService.getCurrentUser()
console.log('Utilisateur:', user)
console.log('Type:', user?.user_type)
console.log('ID:', user?.id)
```

### Étape 4 : Tester la génération de paiements
```sql
-- Dans Supabase SQL Editor
SELECT * FROM generate_monthly_payments('2025-01');
```

## 🧪 Tests de Vérification

### Test 1 : Vérifier la structure des tables
```sql
-- Vérifier que les tables existent
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'receipts', 'reminders');
```

### Test 2 : Vérifier les données de test
```sql
-- Vérifier les paiements existants
SELECT COUNT(*) as total_payments FROM payments;

-- Vérifier les baux actifs
SELECT COUNT(*) as active_leases FROM leases WHERE status = 'active';

-- Vérifier les propriétaires
SELECT COUNT(*) as owners FROM users WHERE user_type = 'owner';
```

### Test 3 : Tester les relations
```sql
-- Tester les relations avec les utilisateurs
SELECT 
    p.id,
    p.amount_due,
    p.status,
    l.owner_id,
    l.tenant_id,
    u_owner.first_name as owner_name,
    u_tenant.first_name as tenant_name
FROM payments p
JOIN leases l ON p.lease_id = l.id
LEFT JOIN users u_owner ON l.owner_id = u_owner.id
LEFT JOIN users u_tenant ON l.tenant_id = u_tenant.id
LIMIT 5;
```

## 🚀 Résolution des Problèmes Courants

### Problème 1 : Erreur de relation Supabase
```typescript
// Solution : Spécifier explicitement la relation
tenant:users!leases_tenant_id_fkey(
  id,
  first_name,
  last_name,
  email
)
```

### Problème 2 : Fonction SQL non trouvée
```sql
-- Vérifier que la fonction existe
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'generate_monthly_payments';
```

### Problème 3 : Aucun bail actif
```sql
-- Créer des baux de test
UPDATE leases 
SET status = 'active' 
WHERE status = 'draft' 
LIMIT 5;
```

### Problème 4 : Aucun propriétaire
```sql
-- Vérifier les utilisateurs
SELECT id, email, user_type FROM users WHERE user_type = 'owner';
```

## 📋 Checklist de Vérification

- [ ] Tables `payments`, `receipts`, `reminders` existent
- [ ] Fonctions SQL créées et testées
- [ ] Relations avec `owner_id` et `tenant_id` fonctionnelles
- [ ] Utilisateur authentifié avec `user_type = 'owner'`
- [ ] Baux actifs disponibles
- [ ] Tests de génération de paiements réussis
- [ ] Interface de paiements opérationnelle

## 🎯 Résultat Attendu

Après correction :
- ✅ Plus d'erreurs UUID
- ✅ Paiements générés correctement
- ✅ Relations Supabase fonctionnelles
- ✅ Interface utilisateur opérationnelle
- ✅ Statistiques calculées correctement

## 📞 Support

Si le problème persiste :
1. Vérifiez les logs de la console du navigateur
2. Vérifiez les logs Supabase
3. Testez les requêtes SQL une par une
4. Vérifiez que l'utilisateur est bien authentifié
5. Vérifiez que les baux sont actifs

# Dépannage des Relations Supabase

## 🚨 Problème : "Could not embed because more than one relationship was found"

### ❌ Erreur
```
PGRST201: Could not embed because more than one relationship was found for 'leases' and 'users'
```

### 🔍 Cause
Supabase ne peut pas déterminer quelle relation utiliser entre `leases` et `users` car il y a deux relations possibles :
- `leases.owner_id` → `users.id`
- `leases.tenant_id` → `users.id`

### ✅ Solutions Implémentées

#### 1. **Spécification explicite des relations**
```typescript
// AVANT (problématique)
tenant:users(
  id,
  first_name,
  last_name,
  email
)

// APRÈS (corrigé)
tenant:users!leases_tenant_id_fkey(
  id,
  first_name,
  last_name,
  email
)
```

#### 2. **Service simplifié créé**
- ✅ `lib/payment-service-simple.ts` - Évite les relations complexes
- ✅ Requêtes séparées pour enrichir les données
- ✅ Plus de problèmes de relations multiples

#### 3. **Composants mis à jour**
- ✅ `PaymentManagement` utilise maintenant le service simplifié
- ✅ Plus d'erreurs de relations dans l'interface

## 🔧 Solutions Alternatives

### Option 1: Utiliser le service simplifié (Recommandé)
```typescript
import { paymentServiceSimple as paymentService } from "@/lib/payment-service-simple"
```

### Option 2: Spécifier explicitement les relations
```typescript
// Pour le locataire
tenant:users!leases_tenant_id_fkey(...)

// Pour le propriétaire (si nécessaire)
owner:users!leases_owner_id_fkey(...)
```

### Option 3: Requêtes séparées
```typescript
// 1. Récupérer les paiements
const { data: payments } = await supabase.from('payments').select('*')

// 2. Enrichir avec les données du bail
const { data: lease } = await supabase
  .from('leases')
  .select('*')
  .eq('id', payment.lease_id)
  .single()

// 3. Enrichir avec les données du locataire
const { data: tenant } = await supabase
  .from('users')
  .select('*')
  .eq('id', lease.tenant_id)
  .single()
```

## 🧪 Test de Vérification

### 1. Vérifier les relations dans Supabase
```sql
-- Exécuter dans Supabase SQL Editor
SELECT 
    tc.constraint_name,
    tc.table_name,
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

### 2. Tester la connexion
```javascript
// Dans la console du navigateur
import { paymentServiceSimple } from '@/lib/payment-service-simple'
const payments = await paymentServiceSimple.getOwnerPayments('your-owner-id')
console.log('Paiements:', payments)
```

## 📋 Checklist de Vérification

- [ ] Relations spécifiées explicitement dans les requêtes
- [ ] Service simplifié utilisé dans les composants
- [ ] Tests passent sans erreur de relations
- [ ] Données enrichies correctement
- [ ] Interface fonctionnelle

## 🚀 Résultat Attendu

Après application des corrections :
- ✅ Plus d'erreurs PGRST201
- ✅ Relations Supabase fonctionnelles
- ✅ Données de paiements chargées correctement
- ✅ Interface utilisateur opérationnelle

## 📞 Si Problème Persiste

1. **Vérifiez les contraintes** de clé étrangère dans Supabase
2. **Testez les requêtes** une par une
3. **Utilisez le service simplifié** en priorité
4. **Consultez les logs** Supabase pour plus de détails

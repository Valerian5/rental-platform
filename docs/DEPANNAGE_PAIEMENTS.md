# Dépannage du Module de Paiements

## 🚨 Erreurs Courantes et Solutions

### ❌ Erreur 404 - "Failed to load resource"
**Cause** : Les routes API ne sont pas accessibles ou mal configurées.

**Solution** :
1. Vérifiez que les tables existent dans Supabase
2. Utilisez le composant `SupabaseTestComponent` pour tester la connexion
3. Vérifiez les variables d'environnement Supabase

### ❌ Erreur 401 - "Unauthorized"
**Cause** : Problème d'authentification avec les routes API.

**Solution** :
1. Le service utilise maintenant Supabase directement (plus de problème d'auth)
2. Vérifiez que l'utilisateur est connecté
3. Vérifiez les politiques RLS dans Supabase

### ❌ Erreur "relation does not exist"
**Cause** : Les tables n'ont pas été créées correctement.

**Solution** :
1. Exécutez les scripts SQL dans l'ordre :
   - `create-payments-tables-simple.sql`
   - `create-payments-indexes-and-policies.sql`
   - `create-payments-functions.sql`

## 🔧 Vérifications Rapides

### 1. Vérifier les Tables
```sql
-- Dans Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'receipts', 'reminders', 'lease_payment_configs');
```

### 2. Vérifier les Fonctions
```sql
-- Dans Supabase SQL Editor
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'generate_monthly_payments';
```

### 3. Vérifier les Variables d'Environnement
```javascript
// Dans la console du navigateur
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

### 4. Tester la Connexion
```javascript
// Dans la console du navigateur
import { supabase } from '@/lib/supabase'
const { data, error } = await supabase.from('payments').select('id').limit(1)
console.log('Test Supabase:', { data, error })
```

## 🛠️ Solutions par Type d'Erreur

### Erreur de Connexion Supabase
```bash
# Vérifiez votre .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Erreur de Tables Manquantes
1. Allez sur Supabase Dashboard
2. SQL Editor > Nouvelle requête
3. Exécutez `create-payments-tables-simple.sql`
4. Vérifiez que les 4 tables apparaissent

### Erreur de Fonctions Manquantes
1. Exécutez `create-payments-functions.sql`
2. Vérifiez que `generate_monthly_payments` existe

### Erreur de Politiques RLS
1. Exécutez `create-payments-indexes-and-policies.sql`
2. Vérifiez les politiques dans Supabase Dashboard > Authentication > Policies

## 🧪 Tests de Diagnostic

### Test 1: Connexion de Base
```javascript
// Test simple de connexion
const { data, error } = await supabase.from('payments').select('count')
console.log('Connexion OK:', !error)
```

### Test 2: Tables Accessibles
```javascript
// Test des tables
const tables = ['payments', 'receipts', 'reminders', 'lease_payment_configs']
for (const table of tables) {
  const { error } = await supabase.from(table).select('id').limit(1)
  console.log(`${table}:`, error ? 'ERREUR' : 'OK')
}
```

### Test 3: Fonction de Génération
```javascript
// Test de la fonction
const { data, error } = await supabase.rpc('generate_monthly_payments', { target_month: '2025-01' })
console.log('Fonction génération:', error ? 'ERREUR' : 'OK', data)
```

## 📋 Checklist de Vérification

- [ ] Variables d'environnement Supabase configurées
- [ ] Tables créées dans Supabase (4 tables)
- [ ] Index et politiques RLS appliqués
- [ ] Fonction `generate_monthly_payments` créée
- [ ] Utilisateur connecté dans l'application
- [ ] Politiques RLS permettent l'accès aux données
- [ ] Test Supabase passe avec succès

## 🚀 Si Tout Fonctionne

1. **Configurez un bail** avec des paramètres de paiement
2. **Générez des paiements** mensuels
3. **Testez la validation** des paiements
4. **Vérifiez la génération** des quittances

## 📞 Support Supplémentaire

Si les erreurs persistent :

1. **Vérifiez les logs** de la console du navigateur
2. **Vérifiez les logs** Supabase Dashboard > Logs
3. **Testez chaque composant** individuellement
4. **Vérifiez les permissions** RLS dans Supabase

## 🎯 Résultat Attendu

Après résolution, vous devriez voir :
- ✅ Connexion Supabase fonctionnelle
- ✅ Tables accessibles
- ✅ Fonctions SQL opérationnelles
- ✅ Interface de paiements chargée
- ✅ Statistiques calculées
- ✅ Génération de paiements possible

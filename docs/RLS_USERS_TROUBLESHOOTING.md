# Résolution des problèmes RLS sur la table users

## Problèmes courants et solutions

### 🚨 Problème : Déconnexions automatiques

**Symptômes :**
- Utilisateurs déconnectés automatiquement
- Redirections vers `/login` inattendues
- Erreurs d'authentification

**Causes possibles :**
1. RLS activé sans politique pour `auth.uid()`
2. Politique trop restrictive
3. Token d'authentification invalide

**Solutions :**

#### Solution 1: Vérifier les politiques RLS
```sql
-- Vérifier que RLS est activé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Vérifier les politiques
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'users';
```

#### Solution 2: Tester l'accès utilisateur
```sql
-- Tester avec un utilisateur spécifique
SET LOCAL "request.jwt.claims" TO '{"sub": "user-id-here", "role": "authenticated"}';
SELECT * FROM users WHERE id = 'user-id-here';
```

#### Solution 3: Désactiver temporairement RLS
```sql
-- ATTENTION: Seulement en cas d'urgence
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### 🚨 Problème : Overlays d'accès partout

**Symptômes :**
- Overlays d'accès sur toutes les pages
- Messages "Fonctionnalité réservée"
- API `/api/premium/access` retourne 401

**Causes possibles :**
1. RLS empêche l'accès à la table `users`
2. Politique système manquante
3. Service role non configuré

**Solutions :**

#### Solution 1: Vérifier la politique système
```sql
-- S'assurer que la politique système existe
SELECT * FROM pg_policies 
WHERE tablename = 'users' 
AND policyname = 'System can manage all users';
```

#### Solution 2: Vérifier le service role
```sql
-- Tester avec service_role
SET LOCAL "request.jwt.claims" TO '{"role": "service_role"}';
SELECT COUNT(*) FROM users;
```

### 🚨 Problème : Erreurs d'API

**Symptômes :**
- Erreurs 401 sur les APIs
- Erreurs 403 sur les requêtes
- Timeouts sur les requêtes

**Causes possibles :**
1. RLS bloque les requêtes API
2. Token d'authentification expiré
3. Politiques mal configurées

**Solutions :**

#### Solution 1: Vérifier les logs d'erreur
```sql
-- Vérifier les erreurs récentes
SELECT * FROM pg_stat_statements 
WHERE query ILIKE '%users%' 
ORDER BY total_time DESC;
```

#### Solution 2: Tester les APIs
```bash
# Tester l'API avec un token valide
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/users/profile
```

### 🚨 Problème : Performance dégradée

**Symptômes :**
- Requêtes lentes
- Timeouts fréquents
- Utilisation CPU élevée

**Causes possibles :**
1. Index manquants
2. Politiques complexes
3. Requêtes non optimisées

**Solutions :**

#### Solution 1: Vérifier les index
```sql
-- Vérifier les index existants
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users';
```

#### Solution 2: Ajouter des index manquants
```sql
-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
```

## Procédures de diagnostic

### 1. Diagnostic complet
```sql
-- Exécuter le script de diagnostic
\i scripts/diagnose-users-rls.sql
```

### 2. Test des politiques
```sql
-- Tester chaque politique individuellement
-- Politique utilisateur
SET LOCAL "request.jwt.claims" TO '{"sub": "user-id", "role": "authenticated"}';
SELECT * FROM users WHERE id = 'user-id';

-- Politique système
SET LOCAL "request.jwt.claims" TO '{"role": "service_role"}';
SELECT * FROM users;
```

### 3. Vérification des permissions
```sql
-- Vérifier les permissions sur la table
SELECT grantee, privilege_type, is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'users';
```

## Solutions d'urgence

### Désactiver RLS temporairement
```sql
-- ATTENTION: Sécurité réduite
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Réactiver RLS avec politiques de base
```sql
-- Réactiver RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique de base pour les utilisateurs
CREATE POLICY "Users can access their own data" ON users
    FOR ALL USING (id = auth.uid());

-- Politique système
CREATE POLICY "System access" ON users
    FOR ALL USING (true);
```

## Prévention des problèmes

### 1. Tests avant déploiement
- Tester toutes les politiques RLS
- Vérifier les performances
- Valider l'authentification

### 2. Monitoring continu
- Surveiller les erreurs d'authentification
- Vérifier les performances des requêtes
- Logger les tentatives d'accès

### 3. Documentation
- Documenter toutes les politiques
- Maintenir les scripts de test
- Former l'équipe sur RLS

## Contacts et support

En cas de problème critique :
1. **Désactiver RLS temporairement** si nécessaire
2. **Exécuter le diagnostic** pour identifier la cause
3. **Contacter l'équipe** de développement
4. **Consulter la documentation** Supabase RLS

## Commandes utiles

### Vérifier l'état RLS
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';
```

### Lister les politiques
```sql
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'users';
```

### Désactiver RLS
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Réactiver RLS
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

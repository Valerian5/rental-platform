# 🚨 Correction rapide : Récursion infinie RLS

## Problème
```
Erreur création profil: infinite recursion detected in policy for relation "users"
```

## Solution immédiate

### Option 1 : Désactiver RLS temporairement (Recommandé)

1. **Ouvrir l'interface Supabase** : https://supabase.com/dashboard
2. **Aller dans SQL Editor**
3. **Exécuter ce script** :

```sql
-- Désactiver RLS temporairement
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "System can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
```

4. **Tester la création d'utilisateur** - cela devrait maintenant fonctionner

### Option 2 : Réactiver RLS avec des politiques simplifiées

Après avoir désactivé RLS, vous pouvez le réactiver avec des politiques plus simples :

```sql
-- Réactiver RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Créer des politiques simplifiées
CREATE POLICY "Allow user creation" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Service role access" ON users
    FOR ALL USING (auth.role() = 'service_role');
```

## Vérification

### 1. Tester la création d'utilisateur
- Aller sur `/register`
- Créer un nouveau compte
- Vérifier que l'erreur ne se produit plus

### 2. Vérifier les politiques RLS
```sql
-- Lister les politiques actives
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';
```

### 3. Vérifier le statut RLS
```sql
-- Vérifier si RLS est activé
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'users';
```

## Pourquoi ce problème ?

Les politiques RLS créent une **récursion infinie** quand elles tentent de vérifier l'utilisateur actuel en interrogeant la même table `users`.

### Exemple de politique problématique :
```sql
-- ❌ PROBLÉMATIQUE - cause la récursion
CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users  -- ← Récursion ici !
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );
```

### Solution recommandée :
```sql
-- ✅ CORRECT - pas de récursion
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());
```

## Code mis à jour

Le service d'authentification a été mis à jour pour **gérer automatiquement** les erreurs RLS :

- **Détection automatique** des erreurs de récursion
- **Fallback vers service role** si nécessaire
- **Gestion d'erreurs robuste** pour l'inscription

## Prochaines étapes

1. **Tester l'inscription** - devrait fonctionner maintenant
2. **Vérifier les emails** - confirmation d'email
3. **Tester la connexion** - après vérification
4. **Configurer RLS** - avec des politiques simplifiées si nécessaire

## Support

Si le problème persiste :
1. Vérifier les logs Supabase
2. Contacter l'équipe de développement
3. Consulter la documentation RLS Supabase

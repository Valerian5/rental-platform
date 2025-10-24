# Dépannage RLS - Table Users

## Problème : Récursion infinie dans les politiques RLS

### Symptômes
```
Erreur création profil: infinite recursion detected in policy for relation "users"
```

### Cause
Les politiques RLS créent une boucle infinie quand elles tentent de vérifier l'utilisateur actuel en interrogeant la même table `users`.

### Solutions

#### Solution 1 : Désactiver temporairement RLS (Recommandé pour le développement)
```bash
psql $DATABASE_URL -f scripts/disable-users-rls-temp.sql
```

#### Solution 2 : Réactiver avec des politiques simplifiées
```bash
psql $DATABASE_URL -f scripts/enable-users-rls-simple.sql
```

#### Solution 3 : Corriger les politiques existantes
```bash
psql $DATABASE_URL -f scripts/fix-users-rls-recursion.sql
```

### Politiques RLS recommandées

#### Politiques simplifiées (sans récursion)
```sql
-- 1. Permettre la création d'utilisateurs
CREATE POLICY "Allow user creation" ON users
    FOR INSERT WITH CHECK (true);

-- 2. Accès public en lecture
CREATE POLICY "Public read access" ON users
    FOR SELECT USING (true);

-- 3. Mise à jour de son propre profil
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- 4. Accès système complet
CREATE POLICY "Service role access" ON users
    FOR ALL USING (auth.role() = 'service_role');
```

### Vérification

#### 1. Vérifier que RLS est activé
```sql
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'users';
```

#### 2. Lister les politiques
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';
```

#### 3. Tester l'insertion
```sql
-- Test d'insertion (doit fonctionner)
INSERT INTO users (id, email, first_name, last_name, user_type) 
VALUES ('test-id', 'test@example.com', 'Test', 'User', 'tenant');
```

### Bonnes pratiques

#### 1. Éviter les sous-requêtes dans les politiques
❌ **Mauvais** (cause la récursion) :
```sql
CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );
```

✅ **Bon** (utilise auth.uid() directement) :
```sql
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());
```

#### 2. Utiliser des fonctions helper pour les vérifications complexes
```sql
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'user_type' = 'admin'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. Politiques par défaut permissives
Pour éviter les problèmes de récursion, commencez avec des politiques permissives :
```sql
-- Politique permissive pour l'insertion
CREATE POLICY "Allow user creation" ON users
    FOR INSERT WITH CHECK (true);

-- Politique permissive pour la lecture
CREATE POLICY "Public read access" ON users
    FOR SELECT USING (true);
```

### Dépannage avancé

#### 1. Désactiver RLS complètement
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

#### 2. Supprimer toutes les politiques
```sql
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
-- ... autres politiques
```

#### 3. Réactiver avec des politiques minimales
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique minimale pour l'insertion
CREATE POLICY "Allow user creation" ON users
    FOR INSERT WITH CHECK (true);
```

### Monitoring

#### 1. Vérifier les erreurs RLS
```sql
SELECT * FROM pg_stat_user_tables 
WHERE relname = 'users';
```

#### 2. Tester les politiques
```sql
-- Test de lecture
SELECT COUNT(*) FROM users;

-- Test d'insertion
INSERT INTO users (id, email, first_name, last_name, user_type) 
VALUES ('test-id', 'test@example.com', 'Test', 'User', 'tenant');
```

### Contact
Si les problèmes persistent, vérifiez :
1. Les logs de la base de données
2. Les politiques RLS actives
3. Les permissions des rôles
4. La configuration Supabase

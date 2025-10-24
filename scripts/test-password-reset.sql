-- Script de test pour la réinitialisation de mot de passe
-- Ce script permet de tester et diagnostiquer les problèmes de réinitialisation

-- 1. Vérifier la configuration de la table users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les utilisateurs existants
SELECT 
    id,
    email,
    user_type,
    is_verified,
    created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Vérifier les politiques RLS sur la table users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 4. Tester l'insertion d'un utilisateur de test
-- (À exécuter seulement en développement)
/*
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    user_type,
    is_verified
) VALUES (
    'test-reset@example.com',
    'hashed_password_here',
    'Test',
    'User',
    'tenant',
    true
) ON CONFLICT (email) DO NOTHING;
*/

-- 5. Vérifier les logs d'authentification récents
-- (Cette requête nécessite l'accès aux logs Supabase)
/*
SELECT 
    timestamp,
    event_type,
    user_id,
    email,
    error_message
FROM auth.logs 
WHERE event_type LIKE '%password%' 
OR event_type LIKE '%reset%'
ORDER BY timestamp DESC 
LIMIT 20;
*/

-- 6. Vérifier la configuration des emails
-- Vérifier que les templates d'email sont configurés
-- Aller dans Supabase Dashboard > Authentication > Email Templates

-- 7. Test de la fonction de réinitialisation
-- (À exécuter depuis l'application)
/*
// Dans la console du navigateur sur /forgot-password
const { supabase } = await import('@/lib/supabase')
const { error } = await supabase.auth.resetPasswordForEmail('test@example.com', {
  redirectTo: 'https://votre-domaine.com/reset-password'
})
console.log('Résultat:', { error })
*/

-- 8. Vérifier les variables d'environnement
-- Vérifier que ces variables sont définies :
-- NEXT_PUBLIC_SUPABASE_URL
-- NEXT_PUBLIC_SUPABASE_ANON_KEY  
-- NEXT_PUBLIC_SITE_URL

-- 9. Diagnostic des problèmes courants

-- Problème 1: Utilisateur non trouvé
-- Vérifier que l'email existe dans la table users
SELECT COUNT(*) as user_count 
FROM users 
WHERE email = 'email-a-tester@example.com';

-- Problème 2: RLS bloque l'accès
-- Vérifier que les politiques RLS permettent l'accès
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users' 
AND policyname LIKE '%select%';

-- Problème 3: Configuration des URLs
-- Vérifier que les URLs de redirection sont correctement configurées
-- Dans Supabase Dashboard > Authentication > URL Configuration

-- 10. Script de nettoyage (développement uniquement)
-- Supprimer les utilisateurs de test
/*
DELETE FROM users 
WHERE email LIKE '%test%' 
AND email LIKE '%example.com';
*/

-- 11. Vérification finale
-- Après configuration, tester le flux complet :
-- 1. Aller sur /forgot-password
-- 2. Saisir un email valide
-- 3. Vérifier la réception de l'email
-- 4. Cliquer sur le lien
-- 5. Vérifier la redirection vers /reset-password
-- 6. Saisir un nouveau mot de passe
-- 7. Vérifier que la connexion fonctionne

-- 12. Logs à surveiller
-- Dans Supabase Dashboard > Logs > Auth, chercher :
-- - "password reset"
-- - "email sent" 
-- - "error"
-- - "invalid redirect"

-- 13. Configuration recommandée
-- Pour une configuration optimale :

-- Dans Supabase Dashboard > Authentication > Settings :
-- ✅ Email confirmations: Enabled
-- ✅ Secure email change: Enabled  
-- ✅ Double confirm email changes: Enabled
-- ✅ Enable email confirmations: Enabled

-- URLs de redirection à configurer :
-- - https://votre-domaine.com/auth/callback
-- - https://votre-domaine.com/reset-password
-- - http://localhost:3000/auth/callback (développement)
-- - http://localhost:3000/reset-password (développement)

-- 14. Dépannage avancé
-- Si les emails ne sont toujours pas envoyés :

-- Option 1: Configuration SMTP personnalisée
-- Aller dans Supabase Dashboard > Settings > Auth > SMTP Settings
-- Configurer votre propre serveur SMTP

-- Option 2: Vérifier les restrictions de domaine
-- Vérifier "Allowed domains" dans les settings d'authentification

-- Option 3: Tester avec un email de développement
-- Utiliser un email de test pour isoler le problème

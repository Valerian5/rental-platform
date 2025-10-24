-- Script de diagnostic pour la réinitialisation de mot de passe
-- Ce script aide à diagnostiquer les problèmes de réinitialisation

-- 1. Vérifier la structure de la table users
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
    first_name,
    last_name,
    user_type,
    is_verified,
    created_at,
    updated_at
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Tester la récupération d'un utilisateur par email
-- Remplacer 'test@example.com' par un email de test
SELECT 
    id,
    email,
    first_name,
    last_name,
    user_type,
    is_verified
FROM users 
WHERE email = 'test@example.com';

-- 4. Vérifier les politiques RLS sur la table users
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

-- 5. Test de mise à jour du mot de passe (simulation)
-- ATTENTION: Ne pas exécuter en production sans précaution
/*
UPDATE users 
SET 
    password_hash = '$2a$12$example.new.hash.here',
    updated_at = NOW()
WHERE email = 'test@example.com'
RETURNING id, email, updated_at;
*/

-- 6. Vérifier les logs d'authentification récents
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
LIMIT 10;
*/

-- 7. Configuration requise pour le fonctionnement

-- Variables d'environnement nécessaires:
-- NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
-- NEXT_PUBLIC_SITE_URL=https://votre-domaine.com

-- 8. Test du flux complet

-- Étape 1: Aller sur /forgot-password
-- Étape 2: Saisir un email valide
-- Étape 3: Vérifier la console du navigateur pour les logs
-- Étape 4: Vérifier la réception de l'email
-- Étape 5: Cliquer sur le lien dans l'email
-- Étape 6: Vérifier les paramètres URL dans la console
-- Étape 7: Saisir un nouveau mot de passe
-- Étape 8: Vérifier la réinitialisation

-- 9. Diagnostic des problèmes courants

-- Problème 1: "Lien de réinitialisation invalide"
-- Vérifier que l'URL contient l'email en paramètre
-- Vérifier que la page /reset-password accepte l'email

-- Problème 2: "Utilisateur non trouvé"
-- Vérifier que l'email existe dans la table users
-- Vérifier que l'email est correctement encodé dans l'URL

-- Problème 3: "Erreur lors de la réinitialisation"
-- Vérifier les logs de l'API /api/auth/reset-password-direct
-- Vérifier que bcrypt est installé
-- Vérifier les permissions sur la table users

-- 10. Logs à surveiller

-- Console du navigateur:
-- 🔍 Paramètres URL: { token: null, type: null, access_token: null, refresh_token: null, email: "test@example.com", allParams: {...} }
-- ✅ Paramètres de réinitialisation trouvés
-- 🔄 Réinitialisation avec email: test@example.com

-- Logs serveur:
-- 🔄 Réinitialisation directe pour: test@example.com
-- ✅ Utilisateur trouvé: test@example.com
-- ✅ Mot de passe mis à jour pour: test@example.com

-- 11. Test de l'API directement

-- Test avec curl:
/*
curl -X POST https://votre-domaine.com/api/auth/reset-password-direct \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "newPassword": "NouveauMotDePasse123!"
  }'
*/

-- 12. Vérification finale

-- Après la réinitialisation, vérifier que:
-- ✅ Le mot de passe est mis à jour dans la table users
-- ✅ La colonne updated_at est mise à jour
-- ✅ L'utilisateur peut se connecter avec le nouveau mot de passe
-- ✅ L'ancien mot de passe ne fonctionne plus

-- 13. Nettoyage (développement uniquement)
-- Supprimer l'utilisateur de test après les tests
/*
DELETE FROM users 
WHERE email = 'test@example.com';
*/

-- 14. Configuration Supabase

-- Vérifier que la configuration est correcte:
-- 1. Authentication > URL Configuration
--    - Site URL: https://votre-domaine.com
--    - Redirect URLs: https://votre-domaine.com/reset-password

-- 2. Authentication > Settings
--    - Email confirmations: Enabled
--    - Secure email change: Enabled
--    - Double confirm email changes: Enabled

-- 3. Authentication > Email Templates
--    - Reset Password: Template personnalisé configuré

-- 15. Dépannage avancé

-- Si le problème persiste:
-- 1. Vérifier les logs Supabase Dashboard > Logs > Auth
-- 2. Vérifier que l'URL de redirection est correcte
-- 3. Vérifier que les variables d'environnement sont correctes
-- 4. Tester avec un email de développement
-- 5. Vérifier que le domaine est autorisé dans les settings Supabase

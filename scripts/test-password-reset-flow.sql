-- Script de test pour le flux complet de réinitialisation de mot de passe
-- Ce script teste et valide le processus de réinitialisation

-- 1. Vérifier la structure de la table users
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Créer un utilisateur de test (développement uniquement)
-- ATTENTION: Ne pas exécuter en production
/*
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    user_type,
    is_verified,
    created_at
) VALUES (
    'test-reset@example.com',
    '$2a$12$example.hash.here',
    'Test',
    'User',
    'tenant',
    true,
    NOW()
) ON CONFLICT (email) DO NOTHING;
*/

-- 3. Vérifier que l'utilisateur de test existe
SELECT 
    id,
    email,
    first_name,
    last_name,
    user_type,
    is_verified,
    created_at
FROM users 
WHERE email = 'test-reset@example.com';

-- 4. Tester l'API de réinitialisation
-- (À exécuter depuis l'application ou avec curl)

-- Test 1: Vérifier que l'email est envoyé
-- Aller sur /forgot-password et saisir l'email de test

-- Test 2: Vérifier que l'URL de réinitialisation est correcte
-- L'URL devrait être: https://votre-domaine.com/reset-password?email=test-reset@example.com

-- Test 3: Tester la réinitialisation du mot de passe
-- Aller sur l'URL générée et saisir un nouveau mot de passe

-- 5. Vérifier que le mot de passe a été mis à jour
SELECT 
    id,
    email,
    password_hash,
    updated_at
FROM users 
WHERE email = 'test-reset@example.com';

-- 6. Test de connexion avec le nouveau mot de passe
-- Aller sur /login et tester la connexion avec le nouveau mot de passe

-- 7. Vérifier les logs d'erreur
-- Vérifier la console du navigateur et les logs serveur

-- 8. Configuration requise pour le fonctionnement

-- Variables d'environnement nécessaires:
-- NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
-- NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
-- RESEND_API_KEY=your_resend_api_key
-- RESEND_DOMAIN=your_domain.com

-- 9. Configuration Supabase

-- Vérifier que la table users a les colonnes nécessaires:
-- - id (uuid, primary key)
-- - email (varchar, unique)
-- - password_hash (varchar)
-- - first_name (varchar)
-- - last_name (varchar)
-- - user_type (varchar)
-- - is_verified (boolean)
-- - created_at (timestamp)
-- - updated_at (timestamp)

-- 10. Test du flux complet

-- Étape 1: Aller sur /forgot-password
-- Étape 2: Saisir l'email de test
-- Étape 3: Vérifier la réception de l'email
-- Étape 4: Cliquer sur le lien dans l'email
-- Étape 5: Vérifier la redirection vers /reset-password?email=...
-- Étape 6: Saisir un nouveau mot de passe
-- Étape 7: Confirmer le nouveau mot de passe
-- Étape 8: Vérifier le message de succès
-- Étape 9: Vérifier la redirection vers /login
-- Étape 10: Tester la connexion avec le nouveau mot de passe

-- 11. Dépannage

-- Problème: Email non reçu
-- Solution: Vérifier la configuration Resend et les logs

-- Problème: Lien ne fonctionne pas
-- Solution: Vérifier NEXT_PUBLIC_SITE_URL et l'URL générée

-- Problème: Erreur lors de la réinitialisation
-- Solution: Vérifier les logs de l'API /api/auth/reset-password

-- Problème: Connexion ne fonctionne pas après réinitialisation
-- Solution: Vérifier que le mot de passe est correctement hashé

-- 12. Nettoyage (développement uniquement)
-- Supprimer l'utilisateur de test après les tests
/*
DELETE FROM users 
WHERE email = 'test-reset@example.com';
*/

-- 13. Validation finale

-- Vérifier que:
-- ✅ L'email est envoyé avec le bon template
-- ✅ Le lien redirige vers la bonne page
-- ✅ La réinitialisation fonctionne
-- ✅ La connexion fonctionne avec le nouveau mot de passe
-- ✅ L'ancien mot de passe ne fonctionne plus

-- 14. Sécurité

-- Vérifier que:
-- ✅ Le mot de passe est correctement hashé (bcrypt)
-- ✅ L'email est validé avant l'envoi
-- ✅ L'URL contient l'email pour validation
-- ✅ Le nouveau mot de passe respecte les critères
-- ✅ La session est correctement gérée

-- 15. Performance

-- Vérifier que:
-- ✅ L'email est envoyé rapidement
-- ✅ La réinitialisation est rapide
-- ✅ Pas d'erreurs de timeout
-- ✅ Les logs sont correctement gérés

-- Script de test pour vérifier l'affichage du logo
-- Ce script teste que le logo est correctement configuré et accessible

-- 1. Vérifier la structure de la table site_settings
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les paramètres de logo existants
SELECT 
    setting_key,
    setting_value,
    updated_at
FROM site_settings 
WHERE setting_key = 'logos'
ORDER BY updated_at DESC;

-- 3. Vérifier la structure JSONB des logos
SELECT 
    setting_key,
    jsonb_pretty(setting_value) as logos_json
FROM site_settings 
WHERE setting_key = 'logos';

-- 4. Tester l'API publique du logo
-- (À tester depuis l'application)
-- GET /api/public/logo

-- 5. Vérifier les URLs de logo
SELECT 
    setting_key,
    setting_value->>'main' as main_logo_url,
    setting_value->>'favicon' as favicon_url,
    setting_value->>'footer' as footer_logo_url
FROM site_settings 
WHERE setting_key = 'logos';

-- 6. Test de l'API upload-logo
-- (À tester depuis l'application)
-- POST /api/admin/upload-logo
-- Content-Type: multipart/form-data
-- Body: file + logoType=main

-- 7. Vérifier les permissions sur la table site_settings
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'site_settings' 
AND table_schema = 'public';

-- 8. Test de l'API settings
-- (À tester depuis l'application)
-- GET /api/admin/settings?key=logos
-- POST /api/admin/settings
-- Body: {"key": "logos", "value": {"main": "https://example.com/logo.png"}}

-- 9. Vérifier les index sur la table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'site_settings' 
AND schemaname = 'public';

-- 10. Test de performance des requêtes
EXPLAIN (ANALYZE, BUFFERS) 
SELECT setting_value 
FROM site_settings 
WHERE setting_key = 'logos';

-- 11. Vérifier les contraintes
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'site_settings' 
AND table_schema = 'public';

-- 12. Test de l'upsert
INSERT INTO site_settings (setting_key, setting_value, updated_at)
VALUES ('test_logo', '{"main": "https://test.com/logo.png"}', NOW())
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = EXCLUDED.updated_at;

-- Vérifier l'insertion
SELECT * FROM site_settings WHERE setting_key = 'test_logo';

-- Nettoyer le test
DELETE FROM site_settings WHERE setting_key = 'test_logo';

-- 13. Configuration requise pour le fonctionnement

-- Variables d'environnement nécessaires:
-- NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
-- NEXT_PUBLIC_SITE_URL=https://votre-domaine.com

-- 14. Test des pages avec logo

-- Pages à tester:
-- 1. /login - Logo dans la section gauche
-- 2. /register - Logo dans la section gauche
-- 3. /forgot-password - Logo dans la section gauche
-- 4. /reset-password - Logo dans la section gauche

-- 15. Vérification visuelle

-- Pour chaque page, vérifier:
-- ✅ Le logo s'affiche correctement
-- ✅ Le logo a la bonne taille (120x120px)
-- ✅ Le logo est centré et bien positionné
-- ✅ Le fallback (icône Building) s'affiche si pas de logo
-- ✅ Le logo est responsive (mobile/desktop)

-- 16. Test de l'API publique

-- Test avec curl:
/*
curl -X GET https://votre-domaine.com/api/public/logo
*/

-- Réponse attendue:
-- {
--   "success": true,
--   "logoUrl": "https://example.com/logo.png"
-- }

-- 17. Test de l'upload de logo

-- Test avec curl:
/*
curl -X POST https://votre-domaine.com/api/admin/upload-logo \
  -F "file=@logo.png" \
  -F "logoType=main"
*/

-- Réponse attendue:
-- {
--   "success": true,
--   "data": {
--     "url": "https://example.com/logo.png",
--     "filename": "main_1234567890.png",
--     "logoType": "main"
--   }
-- }

-- 18. Dépannage

-- Problème: Logo ne s'affiche pas
-- Solutions:
-- 1. Vérifier que l'API /api/public/logo fonctionne
-- 2. Vérifier que le logo est uploadé dans Supabase Storage
-- 3. Vérifier que l'URL est correcte dans site_settings
-- 4. Vérifier les permissions sur le bucket logos

-- Problème: Erreur 500 lors de l'upload
-- Solutions:
-- 1. Vérifier la contrainte unique sur site_settings
-- 2. Exécuter le script fix-site-settings-table.sql
-- 3. Vérifier les permissions sur la table

-- Problème: Logo déformé
-- Solutions:
-- 1. Vérifier les dimensions du logo (120x120px recommandé)
-- 2. Vérifier le CSS (width, height, object-fit)
-- 3. Tester avec différents formats (PNG, JPEG, SVG)

-- 19. Optimisations

-- Pour améliorer les performances:
-- 1. Utiliser des images optimisées (WebP si possible)
-- 2. Mettre en cache l'URL du logo
-- 3. Utiliser des images responsive
-- 4. Précharger le logo sur les pages critiques

-- 20. Monitoring

-- Métriques à surveiller:
-- 1. Temps de chargement de l'API /api/public/logo
-- 2. Taux d'erreur sur l'upload de logo
-- 3. Taille des fichiers uploadés
-- 4. Utilisation du stockage Supabase

-- 21. Sécurité

-- Bonnes pratiques:
-- 1. Valider le type de fichier (images uniquement)
-- 2. Limiter la taille des fichiers (5MB max)
-- 3. Utiliser HTTPS pour toutes les URLs
-- 4. Vérifier les permissions d'accès

-- 22. Maintenance

-- Tâches régulières:
-- 1. Nettoyer les anciens logos non utilisés
-- 2. Vérifier l'intégrité des URLs
-- 3. Mettre à jour les logos si nécessaire
-- 4. Surveiller l'utilisation du stockage

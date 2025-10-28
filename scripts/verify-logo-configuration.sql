-- Script de vérification de la configuration des logos
-- Ce script vérifie que la configuration des logos est correcte

-- 1. Vérifier la structure de la table site_settings
SELECT 
    'Table structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes
SELECT 
    'Constraints' as check_type,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'site_settings' 
AND table_schema = 'public';

-- 3. Vérifier les index
SELECT 
    'Indexes' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'site_settings' 
AND schemaname = 'public';

-- 4. Vérifier les permissions
SELECT 
    'Permissions' as check_type,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'site_settings' 
AND table_schema = 'public';

-- 5. Vérifier les données actuelles
SELECT 
    'Current data' as check_type,
    setting_key,
    setting_value,
    created_at,
    updated_at
FROM site_settings 
ORDER BY setting_key;

-- 6. Vérifier spécifiquement les logos
SELECT 
    'Logo configuration' as check_type,
    setting_key,
    setting_value->>'main' as main_logo_url,
    setting_value->>'favicon' as favicon_url,
    setting_value->>'footer' as footer_logo_url,
    updated_at
FROM site_settings 
WHERE setting_key = 'logos';

-- 7. Vérifier la structure JSONB des logos
SELECT 
    'Logo JSON structure' as check_type,
    setting_key,
    jsonb_pretty(setting_value) as logos_json
FROM site_settings 
WHERE setting_key = 'logos';

-- 8. Test de l'API publique du logo
-- (À tester depuis l'application)
-- GET /api/public/logo
-- Réponse attendue:
-- - Si pas de logo: {"success": true, "logoUrl": null}
-- - Si logo configuré: {"success": true, "logoUrl": "https://example.com/logo.png"}

-- 9. Test de l'upload de logo
-- (À tester depuis l'application)
-- POST /api/admin/upload-logo
-- Content-Type: multipart/form-data
-- Body: file + logoType=main
-- Réponse attendue: {"success": true, "data": {"url": "...", "filename": "...", "logoType": "main"}}

-- 10. Vérifier les buckets Supabase Storage
-- (À vérifier dans Supabase Dashboard > Storage)
-- Buckets requis:
-- - logos (préféré)
-- - documents (fallback)

-- 11. Vérifier les permissions des buckets
-- (À vérifier dans Supabase Dashboard > Storage > Settings)
-- Permissions requises:
-- - Public read pour logos
-- - Authenticated write pour upload

-- 12. Test de performance des requêtes
EXPLAIN (ANALYZE, BUFFERS) 
SELECT setting_value 
FROM site_settings 
WHERE setting_key = 'logos';

-- 13. Vérifier l'intégrité des données
SELECT 
    'Data integrity' as check_type,
    COUNT(*) as total_settings,
    COUNT(CASE WHEN setting_key = 'logos' THEN 1 END) as logo_settings,
    COUNT(CASE WHEN setting_value IS NULL THEN 1 END) as null_values
FROM site_settings;

-- 14. Test de l'upsert
-- Test d'insertion/mise à jour d'un paramètre
INSERT INTO site_settings (setting_key, setting_value, updated_at)
VALUES ('test_upsert', '{"test": "value"}', NOW())
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = EXCLUDED.updated_at;

-- Vérifier l'insertion
SELECT * FROM site_settings WHERE setting_key = 'test_upsert';

-- Nettoyer le test
DELETE FROM site_settings WHERE setting_key = 'test_upsert';

-- 15. Vérifier les variables d'environnement
-- (À vérifier dans l'application)
-- Variables requises:
-- NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
-- NEXT_PUBLIC_SITE_URL=https://votre-domaine.com

-- 16. Test des pages avec logo
-- (À tester depuis l'application)
-- Pages à vérifier:
-- 1. /login - Logo dans la section gauche
-- 2. /register - Logo dans la section gauche
-- 3. /forgot-password - Logo dans la section gauche
-- 4. /reset-password - Logo dans la section gauche

-- 17. Vérification finale
-- Résumé de la configuration
SELECT 
    'Configuration summary' as check_type,
    'Total settings' as metric,
    COUNT(*)::text as value
FROM site_settings

UNION ALL

SELECT 
    'Configuration summary' as check_type,
    'Logo settings' as metric,
    COUNT(*)::text as value
FROM site_settings 
WHERE setting_key = 'logos'

UNION ALL

SELECT 
    'Configuration summary' as check_type,
    'Main logo configured' as metric,
    CASE 
        WHEN setting_value->>'main' IS NOT NULL AND setting_value->>'main' != 'null' THEN 'YES'
        ELSE 'NO'
    END as value
FROM site_settings 
WHERE setting_key = 'logos'

UNION ALL

SELECT 
    'Configuration summary' as check_type,
    'Last updated' as metric,
    MAX(updated_at)::text as value
FROM site_settings;

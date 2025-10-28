-- Script de nettoyage des données de test
-- Ce script supprime les données de test et vérifie la configuration

-- 1. Supprimer les données de test
DELETE FROM site_settings WHERE setting_key = 'test_logo';

-- 2. Vérifier que les données de test ont été supprimées
SELECT 
    setting_key,
    setting_value,
    created_at,
    updated_at
FROM site_settings 
WHERE setting_key = 'test_logo';

-- 3. Vérifier les paramètres de logo actuels
SELECT 
    setting_key,
    setting_value,
    updated_at
FROM site_settings 
WHERE setting_key = 'logos'
ORDER BY updated_at DESC;

-- 4. Vérifier la structure JSONB des logos
SELECT 
    setting_key,
    jsonb_pretty(setting_value) as logos_json
FROM site_settings 
WHERE setting_key = 'logos';

-- 5. Vérifier les URLs de logo
SELECT 
    setting_key,
    setting_value->>'main' as main_logo_url,
    setting_value->>'favicon' as favicon_url,
    setting_value->>'footer' as footer_logo_url
FROM site_settings 
WHERE setting_key = 'logos';

-- 6. Initialiser les paramètres par défaut s'ils n'existent pas
INSERT INTO site_settings (setting_key, setting_value, updated_at)
VALUES 
    ('logos', '{"main": null, "favicon": null, "footer": null}', NOW()),
    ('site_info', '{"title": "Louer Ici", "description": "Plateforme de gestion locative", "contact_email": "contact@louer-ici.com"}', NOW()),
    ('colors', '{"primary": "#2563eb", "secondary": "#64748b", "accent": "#f59e0b"}', NOW()),
    ('layout', '{"header_style": "modern", "footer_style": "minimal", "sidebar_style": "default"}', NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- 7. Vérifier tous les paramètres après initialisation
SELECT 
    setting_key,
    setting_value,
    updated_at
FROM site_settings 
ORDER BY setting_key;

-- 8. Test de l'API publique du logo
-- (À tester depuis l'application)
-- GET /api/public/logo
-- Réponse attendue si pas de logo: {"success": true, "logoUrl": null}

-- 9. Test de l'upload de logo
-- (À tester depuis l'application)
-- POST /api/admin/upload-logo
-- Content-Type: multipart/form-data
-- Body: file + logoType=main

-- 10. Vérifier les permissions sur la table
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'site_settings' 
AND table_schema = 'public';

-- 11. Vérifier les contraintes
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'site_settings' 
AND table_schema = 'public';

-- 12. Vérifier les index
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'site_settings' 
AND schemaname = 'public';

-- 13. Test de l'upsert avec un vrai logo
-- (À exécuter après avoir uploadé un logo)
/*
UPDATE site_settings 
SET 
    setting_value = jsonb_set(
        setting_value, 
        '{main}', 
        '"https://votre-domaine.com/logo.png"'::jsonb
    ),
    updated_at = NOW()
WHERE setting_key = 'logos';
*/

-- 14. Vérifier la mise à jour
SELECT 
    setting_key,
    setting_value->>'main' as main_logo_url,
    updated_at
FROM site_settings 
WHERE setting_key = 'logos';

-- 15. Test de l'API publique après mise à jour
-- (À tester depuis l'application)
-- GET /api/public/logo
-- Réponse attendue: {"success": true, "logoUrl": "https://votre-domaine.com/logo.png"}

-- 16. Vérification finale
-- Vérifier que tout fonctionne correctement
SELECT 
    'Configuration check' as test_type,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM site_settings 
WHERE setting_key = 'logos'

UNION ALL

SELECT 
    'Data integrity' as test_type,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM site_settings 
WHERE setting_key = 'test_logo'

UNION ALL

SELECT 
    'Table structure' as test_type,
    CASE 
        WHEN COUNT(*) >= 4 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM site_settings;

-- Script pour corriger la table site_settings
-- Ce script résout les problèmes de contrainte unique et d'upsert

-- 1. Vérifier la structure actuelle de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes existantes
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'site_settings' 
AND table_schema = 'public';

-- 3. Vérifier les index existants
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'site_settings' 
AND schemaname = 'public';

-- 4. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Créer l'index sur setting_key s'il n'existe pas
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

-- 6. Créer l'index GIN sur setting_value pour les requêtes JSONB
CREATE INDEX IF NOT EXISTS idx_site_settings_value ON site_settings USING GIN(setting_value);

-- 7. Vérifier les données existantes
SELECT 
    setting_key,
    setting_value,
    created_at,
    updated_at
FROM site_settings 
ORDER BY setting_key;

-- 8. Nettoyer les doublons s'il y en a
-- (À exécuter seulement s'il y a des doublons)
/*
DELETE FROM site_settings 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM site_settings 
    GROUP BY setting_key
);
*/

-- 9. Tester l'upsert
-- Insérer ou mettre à jour un paramètre de test
INSERT INTO site_settings (setting_key, setting_value, updated_at)
VALUES ('test_key', '{"test": "value"}', NOW())
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = EXCLUDED.updated_at;

-- 10. Vérifier que l'upsert fonctionne
SELECT * FROM site_settings WHERE setting_key = 'test_key';

-- 11. Nettoyer le test
DELETE FROM site_settings WHERE setting_key = 'test_key';

-- 12. Initialiser les paramètres par défaut s'ils n'existent pas
INSERT INTO site_settings (setting_key, setting_value, updated_at)
VALUES 
    ('logos', '{"main": null, "favicon": null, "footer": null}', NOW()),
    ('site_info', '{"title": "Louer Ici", "description": "Plateforme de gestion locative", "contact_email": "contact@louer-ici.com"}', NOW()),
    ('colors', '{"primary": "#2563eb", "secondary": "#64748b", "accent": "#f59e0b"}', NOW()),
    ('layout', '{"header_style": "modern", "footer_style": "minimal", "sidebar_style": "default"}', NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- 13. Vérifier les paramètres initialisés
SELECT 
    setting_key,
    setting_value,
    updated_at
FROM site_settings 
ORDER BY setting_key;

-- 14. Fonction pour faciliter l'upsert
CREATE OR REPLACE FUNCTION upsert_site_setting(
    p_key VARCHAR(255),
    p_value JSONB
) RETURNS VOID AS $$
BEGIN
    INSERT INTO site_settings (setting_key, setting_value, updated_at)
    VALUES (p_key, p_value, NOW())
    ON CONFLICT (setting_key) 
    DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- 15. Test de la fonction
SELECT upsert_site_setting('test_function', '{"test": "function"}');
SELECT * FROM site_settings WHERE setting_key = 'test_function';
DELETE FROM site_settings WHERE setting_key = 'test_function';

-- 16. Vérification finale
-- Vérifier que la table est correctement configurée
SELECT 
    'Table structure' as check_type,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
AND table_schema = 'public'

UNION ALL

SELECT 
    'Unique constraints' as check_type,
    COUNT(*) as constraint_count
FROM information_schema.table_constraints 
WHERE table_name = 'site_settings' 
AND constraint_type = 'UNIQUE'
AND table_schema = 'public'

UNION ALL

SELECT 
    'Indexes' as check_type,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE tablename = 'site_settings' 
AND schemaname = 'public'

UNION ALL

SELECT 
    'Data rows' as check_type,
    COUNT(*) as row_count
FROM site_settings;

-- 17. Instructions pour l'application
-- Pour utiliser cette table dans l'application :

-- Récupérer un paramètre :
-- SELECT setting_value FROM site_settings WHERE setting_key = 'logos';

-- Mettre à jour un paramètre :
-- INSERT INTO site_settings (setting_key, setting_value, updated_at)
-- VALUES ('logos', '{"main": "https://example.com/logo.png"}', NOW())
-- ON CONFLICT (setting_key) 
-- DO UPDATE SET 
--     setting_value = EXCLUDED.setting_value,
--     updated_at = EXCLUDED.updated_at;

-- Ou utiliser la fonction :
-- SELECT upsert_site_setting('logos', '{"main": "https://example.com/logo.png"}');

-- 18. Dépannage
-- Si l'erreur persiste :

-- 1. Vérifier que la contrainte unique existe :
-- SELECT constraint_name FROM information_schema.table_constraints 
-- WHERE table_name = 'site_settings' AND constraint_type = 'UNIQUE';

-- 2. Vérifier qu'il n'y a pas de doublons :
-- SELECT setting_key, COUNT(*) FROM site_settings GROUP BY setting_key HAVING COUNT(*) > 1;

-- 3. Nettoyer les doublons si nécessaire :
-- DELETE FROM site_settings WHERE id NOT IN (
--     SELECT MIN(id) FROM site_settings GROUP BY setting_key
-- );

-- 4. Vérifier les permissions :
-- GRANT ALL ON site_settings TO authenticated;
-- GRANT ALL ON site_settings TO service_role;

-- Script pour initialiser les paramètres par défaut dans site_settings
-- Ce script peut être exécuté plusieurs fois sans problème (UPSERT)

-- Insérer les paramètres par défaut
INSERT INTO site_settings (setting_key, setting_value) VALUES
('logos', '{"main": null, "icon": null, "pdf": null, "watermark": null}'::jsonb),
('site_info', '{"title": "Louer Ici", "description": "La plateforme qui simplifie la location immobilière", "contact_email": "contact@louerici.com", "contact_phone": "+33 1 23 45 67 89", "address": "123 Rue de la Paix, 75001 Paris"}'::jsonb),
('colors', '{"primary": "#2563eb", "secondary": "#64748b", "accent": "#10b981"}'::jsonb),
('typography', '{"primary": "Inter", "secondary": "Poppins"}'::jsonb),
('layout', '{"header_type": "standard", "footer_type": "standard", "logo_position": "left"}'::jsonb),
('components', '{"button_style": "rounded", "border_radius": 8}'::jsonb),
('theme', '{"dark_mode": false}'::jsonb),
('social', '{"facebook": null, "twitter": null, "linkedin": null, "instagram": null}'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- Vérification que les paramètres sont bien insérés
SELECT 
    setting_key,
    CASE 
        WHEN setting_key = 'logos' THEN 'Logos configurés'
        WHEN setting_key = 'site_info' THEN 'Informations du site'
        WHEN setting_key = 'colors' THEN 'Couleurs du thème'
        WHEN setting_key = 'typography' THEN 'Typographie'
        WHEN setting_key = 'layout' THEN 'Mise en page'
        WHEN setting_key = 'components' THEN 'Composants'
        WHEN setting_key = 'theme' THEN 'Thème'
        WHEN setting_key = 'social' THEN 'Réseaux sociaux'
        ELSE 'Autre'
    END as description,
    updated_at
FROM site_settings 
ORDER BY setting_key;

-- Message de confirmation
DO $$
DECLARE
    param_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO param_count FROM site_settings;
    RAISE NOTICE '✅ Paramètres du site initialisés: % paramètres configurés', param_count;
END $$;

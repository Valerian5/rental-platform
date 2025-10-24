-- Script pour créer la table app_settings pour stocker les paramètres de l'application
-- comme le logo, les couleurs, etc.

-- Créer la table app_settings
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Activer RLS sur la table
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture publique de certains paramètres
CREATE POLICY "Public can read app settings" ON app_settings
    FOR SELECT USING (
        key IN ('logo', 'site_name', 'site_description', 'primary_color', 'secondary_color')
    );

-- Politique pour les administrateurs : accès complet
CREATE POLICY "Admins can manage app settings" ON app_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_app_settings_updated_at();

-- Insérer les paramètres par défaut
INSERT INTO app_settings (key, value, description) VALUES
('logo', NULL, 'URL du logo de l''application'),
('site_name', 'Louer Ici', 'Nom du site'),
('site_description', 'La plateforme qui simplifie la location immobilière', 'Description du site'),
('primary_color', '#2563eb', 'Couleur principale de l''application'),
('secondary_color', '#64748b', 'Couleur secondaire de l''application'),
('contact_email', 'contact@louerici.com', 'Email de contact'),
('contact_phone', '+33 1 23 45 67 89', 'Téléphone de contact'),
('address', '123 Rue de la Paix, 75001 Paris', 'Adresse de l''entreprise'),
('social_facebook', NULL, 'Lien Facebook'),
('social_twitter', NULL, 'Lien Twitter'),
('social_linkedin', NULL, 'Lien LinkedIn'),
('social_instagram', NULL, 'Lien Instagram')
ON CONFLICT (key) DO NOTHING;

-- Fonction pour obtenir un paramètre
CREATE OR REPLACE FUNCTION get_app_setting(setting_key TEXT)
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
BEGIN
    SELECT value INTO setting_value
    FROM app_settings
    WHERE key = setting_key;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour définir un paramètre
CREATE OR REPLACE FUNCTION set_app_setting(setting_key TEXT, setting_value TEXT, setting_description TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO app_settings (key, value, description)
    VALUES (setting_key, setting_value, setting_description)
    ON CONFLICT (key) 
    DO UPDATE SET 
        value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, app_settings.description),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir tous les paramètres publics
CREATE OR REPLACE FUNCTION get_public_app_settings()
RETURNS TABLE (
    key TEXT,
    value TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.key, s.value
    FROM app_settings s
    WHERE s.key IN ('logo', 'site_name', 'site_description', 'primary_color', 'secondary_color', 'contact_email', 'contact_phone', 'address', 'social_facebook', 'social_twitter', 'social_linkedin', 'social_instagram');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour la documentation
COMMENT ON TABLE app_settings IS 'Table des paramètres de l''application (logo, couleurs, contact, etc.)';
COMMENT ON COLUMN app_settings.key IS 'Clé unique du paramètre';
COMMENT ON COLUMN app_settings.value IS 'Valeur du paramètre';
COMMENT ON COLUMN app_settings.description IS 'Description du paramètre';

COMMENT ON FUNCTION get_app_setting(TEXT) IS 'Récupère la valeur d''un paramètre';
COMMENT ON FUNCTION set_app_setting(TEXT, TEXT, TEXT) IS 'Définit la valeur d''un paramètre';
COMMENT ON FUNCTION get_public_app_settings() IS 'Récupère tous les paramètres publics';

-- Vérification que la table est créée
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'app_settings'
    ) THEN
        RAISE EXCEPTION 'Table app_settings non créée';
    END IF;
END $$;

-- Vérification que les paramètres par défaut sont insérés
DO $$
DECLARE
    setting_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO setting_count
    FROM app_settings;
    
    IF setting_count < 5 THEN
        RAISE EXCEPTION 'Paramètres par défaut non insérés';
    END IF;
    
    RAISE NOTICE '✅ Table app_settings créée avec % paramètres', setting_count;
END $$;

-- Créer la table pour les paramètres du site
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

-- Insérer quelques paramètres par défaut
INSERT INTO site_settings (setting_key, setting_value) VALUES 
('site_info', '{"title": "Louer Ici", "description": "Plateforme de gestion locative intelligente"}'),
('logos', '{}'),
('colors', '{"primary": "#0066FF", "secondary": "#FF6B00", "accent": "#00C48C"}')
ON CONFLICT (setting_key) DO NOTHING;

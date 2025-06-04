-- Créer la table pour stocker les logos et paramètres d'apparence
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les paramètres par défaut
INSERT INTO site_settings (setting_key, setting_value) VALUES
('site_info', '{"title": "Louer Ici", "description": "Plateforme de gestion locative intelligente"}'),
('colors', '{"primary": "#0066FF", "secondary": "#FF6B00", "accent": "#00C48C"}'),
('typography', '{"primary": "Inter", "secondary": "Poppins"}'),
('logos', '{"main": null, "icon": null, "pdf": null, "watermark": null}'),
('layout', '{"header_type": "standard", "footer_type": "standard", "logo_position": "left"}'),
('components', '{"button_style": "rounded", "border_radius": 8}'),
('theme', '{"dark_mode": false}')
ON CONFLICT (setting_key) DO NOTHING;

-- Créer la table pour les uploads de fichiers
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_url TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_uploaded_files_category ON uploaded_files(category);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

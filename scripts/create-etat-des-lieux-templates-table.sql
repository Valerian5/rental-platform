-- Création de la table pour les modèles d'état des lieux
CREATE TABLE IF NOT EXISTS etat_des_lieux_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('entree', 'sortie')),
  room_count INTEGER NOT NULL CHECK (room_count > 0),
  description TEXT,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_etat_des_lieux_templates_type ON etat_des_lieux_templates(type);
CREATE INDEX IF NOT EXISTS idx_etat_des_lieux_templates_room_count ON etat_des_lieux_templates(room_count);
CREATE INDEX IF NOT EXISTS idx_etat_des_lieux_templates_is_active ON etat_des_lieux_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_etat_des_lieux_templates_type_room_count ON etat_des_lieux_templates(type, room_count);

-- RLS (Row Level Security) - Seuls les admins peuvent accéder
ALTER TABLE etat_des_lieux_templates ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins
CREATE POLICY "Admins peuvent gérer les modèles d'état des lieux" ON etat_des_lieux_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Politique pour les utilisateurs normaux (lecture seule des modèles actifs)
CREATE POLICY "Utilisateurs peuvent voir les modèles actifs" ON etat_des_lieux_templates
  FOR SELECT USING (is_active = true);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_etat_des_lieux_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER update_etat_des_lieux_templates_updated_at
  BEFORE UPDATE ON etat_des_lieux_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_etat_des_lieux_templates_updated_at();

-- Contrainte d'unicité pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS idx_etat_des_lieux_templates_unique 
ON etat_des_lieux_templates(type, room_count) 
WHERE is_active = true;

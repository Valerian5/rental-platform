-- Création de la table pour les documents d'état des lieux
CREATE TABLE IF NOT EXISTS etat_des_lieux_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('entree', 'sortie')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'signed')),
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  digital_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_etat_des_lieux_lease_id ON etat_des_lieux_documents(lease_id);
CREATE INDEX IF NOT EXISTS idx_etat_des_lieux_property_id ON etat_des_lieux_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_etat_des_lieux_type ON etat_des_lieux_documents(type);
CREATE INDEX IF NOT EXISTS idx_etat_des_lieux_status ON etat_des_lieux_documents(status);

-- RLS (Row Level Security)
ALTER TABLE etat_des_lieux_documents ENABLE ROW LEVEL SECURITY;

-- Politique pour les propriétaires
CREATE POLICY "Propriétaires peuvent voir leurs documents d'état des lieux" ON etat_des_lieux_documents
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Politique pour les locataires
CREATE POLICY "Locataires peuvent voir les documents d'état des lieux de leurs baux" ON etat_des_lieux_documents
  FOR SELECT USING (
    lease_id IN (
      SELECT id FROM leases WHERE tenant_id = auth.uid()
    )
  );

-- Politique pour les propriétaires (insert/update/delete)
CREATE POLICY "Propriétaires peuvent gérer leurs documents d'état des lieux" ON etat_des_lieux_documents
  FOR ALL USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_etat_des_lieux_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER update_etat_des_lieux_updated_at
  BEFORE UPDATE ON etat_des_lieux_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_etat_des_lieux_updated_at();

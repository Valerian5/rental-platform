-- Création de la table pour stocker les dossiers DossierFacile
CREATE TABLE IF NOT EXISTS dossierfacile_dossiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dossierfacile_id VARCHAR(255) UNIQUE,
  dossierfacile_verification_code VARCHAR(255) UNIQUE,
  dossierfacile_pdf_url TEXT,
  dossierfacile_status VARCHAR(50) DEFAULT 'pending' CHECK (dossierfacile_status IN ('pending', 'verified', 'rejected', 'converted')),
  dossierfacile_verified_at TIMESTAMP WITH TIME ZONE,
  dossierfacile_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_dossierfacile_dossiers_tenant_id ON dossierfacile_dossiers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dossierfacile_dossiers_verification_code ON dossierfacile_dossiers(dossierfacile_verification_code);
CREATE INDEX IF NOT EXISTS idx_dossierfacile_dossiers_status ON dossierfacile_dossiers(dossierfacile_status);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_dossierfacile_dossiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dossierfacile_dossiers_updated_at
  BEFORE UPDATE ON dossierfacile_dossiers
  FOR EACH ROW
  EXECUTE FUNCTION update_dossierfacile_dossiers_updated_at();

-- RLS (Row Level Security)
ALTER TABLE dossierfacile_dossiers ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leurs propres dossiers
CREATE POLICY "Users can view their own dossierfacile dossiers" ON dossierfacile_dossiers
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Users can insert their own dossierfacile dossiers" ON dossierfacile_dossiers
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Users can update their own dossierfacile dossiers" ON dossierfacile_dossiers
  FOR UPDATE USING (auth.uid() = tenant_id);

CREATE POLICY "Users can delete their own dossierfacile dossiers" ON dossierfacile_dossiers
  FOR DELETE USING (auth.uid() = tenant_id);

-- Politique pour les propriétaires (peuvent voir les dossiers des candidats)
CREATE POLICY "Owners can view dossierfacile dossiers of applicants" ON dossierfacile_dossiers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE a.tenant_id = dossierfacile_dossiers.tenant_id
      AND p.owner_id = auth.uid()
    )
  );

-- Commentaires pour la documentation
COMMENT ON TABLE dossierfacile_dossiers IS 'Stockage des dossiers DossierFacile importés par les locataires';
COMMENT ON COLUMN dossierfacile_dossiers.dossierfacile_id IS 'ID unique du dossier sur la plateforme DossierFacile';
COMMENT ON COLUMN dossierfacile_dossiers.dossierfacile_verification_code IS 'Code de vérification fourni par DossierFacile';
COMMENT ON COLUMN dossierfacile_dossiers.dossierfacile_pdf_url IS 'URL du PDF du dossier DossierFacile';
COMMENT ON COLUMN dossierfacile_dossiers.dossierfacile_status IS 'Statut du dossier: pending, verified, rejected, converted';
COMMENT ON COLUMN dossierfacile_dossiers.dossierfacile_data IS 'Données extraites du dossier DossierFacile (JSON)';

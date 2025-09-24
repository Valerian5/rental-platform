-- Création de la table pour les documents dans l'espace locataire
CREATE TABLE IF NOT EXISTS tenant_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de document
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('amendment', 'statement', 'receipt', 'notice', 'other')),
  
  -- Informations du document
  title VARCHAR(200) NOT NULL,
  description TEXT,
  document_url TEXT NOT NULL,
  document_filename VARCHAR(255) NOT NULL,
  document_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Statut et dates
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'read', 'archived')),
  read_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tenant_documents_lease_id ON tenant_documents(lease_id);
CREATE INDEX IF NOT EXISTS idx_tenant_documents_tenant_id ON tenant_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_documents_type ON tenant_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_tenant_documents_status ON tenant_documents(status);
CREATE INDEX IF NOT EXISTS idx_tenant_documents_created_at ON tenant_documents(created_at);

-- RLS (Row Level Security)
ALTER TABLE tenant_documents ENABLE ROW LEVEL SECURITY;

-- Politique pour les locataires (peuvent voir leurs propres documents)
CREATE POLICY "Locataires peuvent voir leurs documents" ON tenant_documents
  FOR SELECT USING (tenant_id = auth.uid());

-- Politique pour les propriétaires (peuvent voir les documents de leurs locataires)
CREATE POLICY "Propriétaires peuvent voir les documents de leurs locataires" ON tenant_documents
  FOR SELECT USING (
    lease_id IN (
      SELECT id FROM leases 
      WHERE property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      )
    )
  );

-- Politique pour les propriétaires (peuvent créer des documents pour leurs locataires)
CREATE POLICY "Propriétaires peuvent créer des documents pour leurs locataires" ON tenant_documents
  FOR INSERT WITH CHECK (
    lease_id IN (
      SELECT id FROM leases 
      WHERE property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      )
    )
  );

-- Politique pour les locataires (peuvent marquer leurs documents comme lus)
CREATE POLICY "Locataires peuvent marquer leurs documents comme lus" ON tenant_documents
  FOR UPDATE USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_tenant_documents_updated_at 
  BEFORE UPDATE ON tenant_documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

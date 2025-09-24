-- Création des tables pour la gestion des révisions annuelles
-- Table pour les révisions de loyer (IRL)
CREATE TABLE IF NOT EXISTS lease_revisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  revision_year INTEGER NOT NULL,
  revision_date DATE NOT NULL,
  
  -- Données IRL
  reference_irl_value DECIMAL(10,2) NOT NULL,
  new_irl_value DECIMAL(10,2) NOT NULL,
  irl_quarter VARCHAR(10) NOT NULL, -- Format: "2024-Q1"
  
  -- Calculs de révision
  old_rent_amount DECIMAL(10,2) NOT NULL,
  new_rent_amount DECIMAL(10,2) NOT NULL,
  rent_increase_amount DECIMAL(10,2) NOT NULL,
  rent_increase_percentage DECIMAL(5,2) NOT NULL,
  
  -- Statut et validation
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'validated', 'sent', 'signed')),
  validation_date TIMESTAMP WITH TIME ZONE,
  sent_to_tenant_date TIMESTAMP WITH TIME ZONE,
  
  -- Documents générés
  amendment_pdf_url TEXT,
  amendment_pdf_filename VARCHAR(255),
  
  -- Métadonnées
  calculation_method TEXT,
  legal_compliance_checked BOOLEAN DEFAULT false,
  compliance_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(lease_id, revision_year)
);

-- Table pour les régularisations de charges
CREATE TABLE IF NOT EXISTS charge_regularizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  regularization_year INTEGER NOT NULL,
  regularization_date DATE NOT NULL,
  
  -- Provisions encaissées
  total_provisions_collected DECIMAL(10,2) NOT NULL,
  provisions_period_start DATE NOT NULL,
  provisions_period_end DATE NOT NULL,
  
  -- Charges réelles
  total_real_charges DECIMAL(10,2) NOT NULL,
  recoverable_charges DECIMAL(10,2) NOT NULL,
  non_recoverable_charges DECIMAL(10,2) NOT NULL,
  
  -- Calcul du solde
  tenant_balance DECIMAL(10,2) NOT NULL, -- Positif = remboursement, Négatif = complément
  balance_type VARCHAR(20) NOT NULL CHECK (balance_type IN ('refund', 'additional_payment')),
  
  -- Méthode de calcul
  calculation_method TEXT,
  calculation_notes TEXT,
  
  -- Statut et validation
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'validated', 'sent', 'paid')),
  validation_date TIMESTAMP WITH TIME ZONE,
  sent_to_tenant_date TIMESTAMP WITH TIME ZONE,
  payment_date TIMESTAMP WITH TIME ZONE,
  
  -- Documents générés
  statement_pdf_url TEXT,
  statement_pdf_filename VARCHAR(255),
  
  -- Justificatifs
  supporting_documents JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(lease_id, regularization_year)
);

-- Table pour le détail des charges par catégorie
CREATE TABLE IF NOT EXISTS charge_breakdown (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  regularization_id UUID NOT NULL REFERENCES charge_regularizations(id) ON DELETE CASCADE,
  
  -- Catégorie de charge
  charge_category VARCHAR(50) NOT NULL, -- 'eau', 'chauffage', 'ascenseur', 'electricite', 'teom', etc.
  charge_name VARCHAR(100) NOT NULL,
  
  -- Montants
  provision_amount DECIMAL(10,2) DEFAULT 0,
  real_amount DECIMAL(10,2) NOT NULL,
  difference DECIMAL(10,2) NOT NULL,
  
  -- Type de charge
  is_recoverable BOOLEAN NOT NULL DEFAULT true,
  is_exceptional BOOLEAN NOT NULL DEFAULT false, -- Charge non prévue dans la provision
  
  -- Justificatifs
  supporting_documents JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les paramètres de charges récupérables par bail
CREATE TABLE IF NOT EXISTS lease_charge_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  
  -- Configuration des charges
  charge_categories JSONB NOT NULL DEFAULT '[]'::jsonb, -- Liste des catégories de charges
  recovery_method VARCHAR(50) NOT NULL DEFAULT 'proportional', -- 'proportional', 'fixed', 'custom'
  calculation_basis VARCHAR(50) NOT NULL DEFAULT 'surface', -- 'surface', 'occupants', 'custom'
  
  -- Paramètres de calcul
  calculation_parameters JSONB DEFAULT '{}'::jsonb,
  
  -- Exclusions
  excluded_charges JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(lease_id)
);

-- Table pour l'historique des notifications
CREATE TABLE IF NOT EXISTS revision_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Type de notification
  notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('rent_revision_reminder', 'charge_regularization_reminder', 'document_sent', 'document_signed')),
  
  -- Contenu
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  
  -- Destinataire
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('owner', 'tenant')),
  recipient_id UUID REFERENCES auth.users(id),
  recipient_email VARCHAR(255),
  
  -- Statut d'envoi
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_lease_revisions_lease_id ON lease_revisions(lease_id);
CREATE INDEX IF NOT EXISTS idx_lease_revisions_property_id ON lease_revisions(property_id);
CREATE INDEX IF NOT EXISTS idx_lease_revisions_year ON lease_revisions(revision_year);
CREATE INDEX IF NOT EXISTS idx_lease_revisions_status ON lease_revisions(status);

CREATE INDEX IF NOT EXISTS idx_charge_regularizations_lease_id ON charge_regularizations(lease_id);
CREATE INDEX IF NOT EXISTS idx_charge_regularizations_property_id ON charge_regularizations(property_id);
CREATE INDEX IF NOT EXISTS idx_charge_regularizations_year ON charge_regularizations(regularization_year);
CREATE INDEX IF NOT EXISTS idx_charge_regularizations_status ON charge_regularizations(status);

CREATE INDEX IF NOT EXISTS idx_charge_breakdown_regularization_id ON charge_breakdown(regularization_id);
CREATE INDEX IF NOT EXISTS idx_charge_breakdown_category ON charge_breakdown(charge_category);

CREATE INDEX IF NOT EXISTS idx_lease_charge_settings_lease_id ON lease_charge_settings(lease_id);

CREATE INDEX IF NOT EXISTS idx_revision_notifications_lease_id ON revision_notifications(lease_id);
CREATE INDEX IF NOT EXISTS idx_revision_notifications_recipient ON revision_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_revision_notifications_type ON revision_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_revision_notifications_status ON revision_notifications(status);

-- RLS (Row Level Security)
ALTER TABLE lease_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE charge_regularizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE charge_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_charge_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les propriétaires
CREATE POLICY "Propriétaires peuvent gérer leurs révisions de loyer" ON lease_revisions
  FOR ALL USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Propriétaires peuvent gérer leurs régularisations de charges" ON charge_regularizations
  FOR ALL USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Propriétaires peuvent gérer le détail des charges" ON charge_breakdown
  FOR ALL USING (
    regularization_id IN (
      SELECT id FROM charge_regularizations 
      WHERE property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Propriétaires peuvent gérer les paramètres de charges" ON lease_charge_settings
  FOR ALL USING (
    lease_id IN (
      SELECT id FROM leases 
      WHERE property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Propriétaires peuvent voir leurs notifications" ON revision_notifications
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    ) OR recipient_id = auth.uid()
  );

-- Politiques RLS pour les locataires
CREATE POLICY "Locataires peuvent voir leurs révisions de loyer" ON lease_revisions
  FOR SELECT USING (
    lease_id IN (
      SELECT id FROM leases WHERE tenant_id = auth.uid()
    )
  );

CREATE POLICY "Locataires peuvent voir leurs régularisations de charges" ON charge_regularizations
  FOR SELECT USING (
    lease_id IN (
      SELECT id FROM leases WHERE tenant_id = auth.uid()
    )
  );

CREATE POLICY "Locataires peuvent voir le détail de leurs charges" ON charge_breakdown
  FOR SELECT USING (
    regularization_id IN (
      SELECT id FROM charge_regularizations 
      WHERE lease_id IN (
        SELECT id FROM leases WHERE tenant_id = auth.uid()
      )
    )
  );

CREATE POLICY "Locataires peuvent voir leurs notifications" ON revision_notifications
  FOR SELECT USING (
    recipient_id = auth.uid()
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_lease_revisions_updated_at BEFORE UPDATE ON lease_revisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_charge_regularizations_updated_at BEFORE UPDATE ON charge_regularizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_charge_breakdown_updated_at BEFORE UPDATE ON charge_breakdown FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lease_charge_settings_updated_at BEFORE UPDATE ON lease_charge_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

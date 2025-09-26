-- Script de création des tables pour la régularisation des charges v2
-- Approche simplifiée avec navigation par année et calculs prorata jour exact

-- Table principale des régularisations
CREATE TABLE IF NOT EXISTS public.charge_regularizations_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL,
  year INTEGER NOT NULL,
  days_occupied INTEGER NOT NULL,
  total_provisions NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_quote_part NUMERIC(10, 2) NOT NULL DEFAULT 0,
  balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  calculation_method TEXT,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  
  CONSTRAINT charge_regularizations_v2_pkey PRIMARY KEY (id),
  CONSTRAINT charge_regularizations_v2_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE CASCADE,
  CONSTRAINT charge_regularizations_v2_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT charge_regularizations_v2_unique_lease_year UNIQUE (lease_id, year)
);

-- Table des dépenses réelles
CREATE TABLE IF NOT EXISTS public.charge_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  regularization_id UUID NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  is_recoverable BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT charge_expenses_pkey PRIMARY KEY (id),
  CONSTRAINT charge_expenses_regularization_id_fkey FOREIGN KEY (regularization_id) REFERENCES charge_regularizations_v2(id) ON DELETE CASCADE
);

-- Table des justificatifs
CREATE TABLE IF NOT EXISTS public.charge_supporting_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT charge_supporting_documents_pkey PRIMARY KEY (id),
  CONSTRAINT charge_supporting_documents_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES charge_expenses(id) ON DELETE CASCADE
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_charge_regularizations_v2_lease_year ON public.charge_regularizations_v2(lease_id, year);
CREATE INDEX IF NOT EXISTS idx_charge_regularizations_v2_status ON public.charge_regularizations_v2(status);
CREATE INDEX IF NOT EXISTS idx_charge_expenses_regularization_id ON public.charge_expenses(regularization_id);
CREATE INDEX IF NOT EXISTS idx_charge_supporting_documents_expense_id ON public.charge_supporting_documents(expense_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_charge_regularizations_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_charge_regularizations_v2_updated_at
  BEFORE UPDATE ON public.charge_regularizations_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_charge_regularizations_v2_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.charge_regularizations_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charge_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charge_supporting_documents ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les propriétaires
CREATE POLICY "Propriétaires peuvent voir leurs régularisations" ON public.charge_regularizations_v2
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Propriétaires peuvent voir leurs dépenses" ON public.charge_expenses
  FOR ALL USING (
    regularization_id IN (
      SELECT id FROM charge_regularizations_v2 WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Propriétaires peuvent voir leurs justificatifs" ON public.charge_supporting_documents
  FOR ALL USING (
    expense_id IN (
      SELECT e.id FROM charge_expenses e
      JOIN charge_regularizations_v2 r ON e.regularization_id = r.id
      WHERE r.created_by = auth.uid()
    )
  );

-- Politiques RLS pour les locataires (lecture seule)
CREATE POLICY "Locataires peuvent voir leurs régularisations" ON public.charge_regularizations_v2
  FOR SELECT USING (
    lease_id IN (
      SELECT id FROM leases WHERE tenant_id = auth.uid()
    )
  );

CREATE POLICY "Locataires peuvent voir leurs dépenses" ON public.charge_expenses
  FOR SELECT USING (
    regularization_id IN (
      SELECT r.id FROM charge_regularizations_v2 r
      JOIN leases l ON r.lease_id = l.id
      WHERE l.tenant_id = auth.uid()
    )
  );

CREATE POLICY "Locataires peuvent voir leurs justificatifs" ON public.charge_supporting_documents
  FOR SELECT USING (
    expense_id IN (
      SELECT e.id FROM charge_expenses e
      JOIN charge_regularizations_v2 r ON e.regularization_id = r.id
      JOIN leases l ON r.lease_id = l.id
      WHERE l.tenant_id = auth.uid()
    )
  );

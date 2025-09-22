-- Script pour ajouter les index et politiques RLS
-- À exécuter APRÈS avoir créé les tables de base

-- 1. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_payments_lease_id ON public.payments USING btree (lease_id);
CREATE INDEX IF NOT EXISTS idx_payments_month ON public.payments USING btree (month);
CREATE INDEX IF NOT EXISTS idx_payments_year ON public.payments USING btree (year);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments USING btree (status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments USING btree (payment_date);

CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON public.receipts USING btree (payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_lease_id ON public.receipts USING btree (lease_id);
CREATE INDEX IF NOT EXISTS idx_receipts_month ON public.receipts USING btree (month);
CREATE INDEX IF NOT EXISTS idx_receipts_year ON public.receipts USING btree (year);

CREATE INDEX IF NOT EXISTS idx_reminders_payment_id ON public.reminders USING btree (payment_id);
CREATE INDEX IF NOT EXISTS idx_reminders_lease_id ON public.reminders USING btree (lease_id);
CREATE INDEX IF NOT EXISTS idx_reminders_tenant_id ON public.reminders USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_reminders_sent_at ON public.reminders USING btree (sent_at);

CREATE INDEX IF NOT EXISTS idx_lease_payment_configs_lease_id ON public.lease_payment_configs USING btree (lease_id);
CREATE INDEX IF NOT EXISTS idx_lease_payment_configs_property_id ON public.lease_payment_configs USING btree (property_id);
CREATE INDEX IF NOT EXISTS idx_lease_payment_configs_tenant_id ON public.lease_payment_configs USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_lease_payment_configs_is_active ON public.lease_payment_configs USING btree (is_active);

-- 2. Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_payment_configs ENABLE ROW LEVEL SECURITY;

-- 3. Politiques RLS pour les paiements
CREATE POLICY "Propriétaires peuvent gérer leurs paiements" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leases 
      WHERE leases.id = payments.lease_id 
      AND leases.bailleur_id = auth.uid()
    )
  );

CREATE POLICY "Locataires peuvent voir leurs paiements" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leases 
      WHERE leases.id = payments.lease_id 
      AND leases.locataire_id = auth.uid()
    )
  );

-- 4. Politiques RLS pour les quittances
CREATE POLICY "Propriétaires peuvent gérer leurs quittances" ON public.receipts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leases 
      WHERE leases.id = receipts.lease_id 
      AND leases.bailleur_id = auth.uid()
    )
  );

CREATE POLICY "Locataires peuvent voir leurs quittances" ON public.receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leases 
      WHERE leases.id = receipts.lease_id 
      AND leases.locataire_id = auth.uid()
    )
  );

-- 5. Politiques RLS pour les rappels
CREATE POLICY "Propriétaires peuvent gérer leurs rappels" ON public.reminders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leases 
      WHERE leases.id = reminders.lease_id 
      AND leases.bailleur_id = auth.uid()
    )
  );

CREATE POLICY "Locataires peuvent voir leurs rappels" ON public.reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leases 
      WHERE leases.id = reminders.lease_id 
      AND leases.locataire_id = auth.uid()
    )
  );

-- 6. Politiques RLS pour la configuration des paiements
CREATE POLICY "Propriétaires peuvent gérer leur configuration de paiements" ON public.lease_payment_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leases 
      WHERE leases.id = lease_payment_configs.lease_id 
      AND leases.bailleur_id = auth.uid()
    )
  );

CREATE POLICY "Locataires peuvent voir leur configuration de paiements" ON public.lease_payment_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leases 
      WHERE leases.id = lease_payment_configs.lease_id 
      AND leases.locataire_id = auth.uid()
    )
  );

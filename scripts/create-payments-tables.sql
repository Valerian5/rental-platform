-- Script SQL pour créer les tables de gestion des paiements
-- Ce script crée les tables nécessaires pour le module de gestion des paiements

-- 1. Table des paiements
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL,
  month varchar(7) NOT NULL, -- Format: "2025-03"
  year integer NOT NULL,
  month_name varchar(20) NOT NULL, -- "Mars 2025"
  amount_due numeric(10,2) NOT NULL,
  rent_amount numeric(10,2) NOT NULL,
  charges_amount numeric(10,2) NOT NULL,
  due_date timestamp with time zone NOT NULL,
  payment_date timestamp with time zone,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method varchar(20) CHECK (payment_method IN ('virement', 'cheque', 'especes', 'prelevement')),
  reference varchar(100) NOT NULL,
  receipt_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases (id) ON DELETE CASCADE,
  CONSTRAINT payments_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES receipts (id) ON DELETE SET NULL
);

-- 2. Table des quittances
CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  lease_id uuid NOT NULL,
  reference varchar(100) NOT NULL, -- "Quittance #2025-03-APT001"
  month varchar(7) NOT NULL,
  year integer NOT NULL,
  rent_amount numeric(10,2) NOT NULL,
  charges_amount numeric(10,2) NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  pdf_path text,
  pdf_filename varchar(255),
  generated_at timestamp with time zone DEFAULT now(),
  sent_to_tenant boolean DEFAULT false,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT receipts_pkey PRIMARY KEY (id),
  CONSTRAINT receipts_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE CASCADE,
  CONSTRAINT receipts_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases (id) ON DELETE CASCADE
);

-- 3. Table des rappels
CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  lease_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  message text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  reminder_type varchar(20) NOT NULL CHECK (reminder_type IN ('first', 'second', 'final')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reminders_pkey PRIMARY KEY (id),
  CONSTRAINT reminders_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE CASCADE,
  CONSTRAINT reminders_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases (id) ON DELETE CASCADE,
  CONSTRAINT reminders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 4. Table de configuration des paiements par bail
CREATE TABLE IF NOT EXISTS public.lease_payment_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL UNIQUE,
  property_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  monthly_rent numeric(10,2) NOT NULL,
  monthly_charges numeric(10,2) NOT NULL,
  payment_day integer NOT NULL CHECK (payment_day >= 1 AND payment_day <= 31),
  payment_method varchar(20) NOT NULL CHECK (payment_method IN ('virement', 'cheque', 'especes', 'prelevement')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lease_payment_configs_pkey PRIMARY KEY (id),
  CONSTRAINT lease_payment_configs_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases (id) ON DELETE CASCADE,
  CONSTRAINT lease_payment_configs_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE,
  CONSTRAINT lease_payment_configs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 5. Index pour optimiser les requêtes
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

-- 6. Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_payment_configs ENABLE ROW LEVEL SECURITY;

-- 7. Politiques RLS pour les paiements
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

-- 8. Politiques RLS pour les quittances
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

-- 9. Politiques RLS pour les rappels
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

-- 10. Politiques RLS pour la configuration des paiements
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

-- 11. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Triggers pour updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lease_payment_configs_updated_at BEFORE UPDATE ON public.lease_payment_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Fonction pour générer les paiements mensuels
CREATE OR REPLACE FUNCTION generate_monthly_payments(target_month varchar(7))
RETURNS TABLE (
  payment_id uuid,
  lease_id uuid,
  month varchar(7),
  amount_due numeric(10,2)
) AS $$
DECLARE
  current_year integer;
  current_month integer;
  payment_record record;
BEGIN
  -- Extraire l'année et le mois de la chaîne target_month (format: "2025-03")
  current_year := CAST(SPLIT_PART(target_month, '-', 1) AS integer);
  current_month := CAST(SPLIT_PART(target_month, '-', 2) AS integer);
  
  -- Générer les paiements pour tous les baux actifs avec configuration
  FOR payment_record IN
    SELECT 
      l.id as lease_id,
      lpc.monthly_rent,
      lpc.monthly_charges,
      lpc.payment_day,
      lpc.payment_method
    FROM leases l
    JOIN lease_payment_configs lpc ON l.id = lpc.lease_id
    WHERE lpc.is_active = true
    AND l.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM payments p 
      WHERE p.lease_id = l.id 
      AND p.month = target_month
    )
  LOOP
    -- Insérer le paiement
    INSERT INTO payments (
      lease_id,
      month,
      year,
      month_name,
      amount_due,
      rent_amount,
      charges_amount,
      due_date,
      status,
      payment_method,
      reference
    ) VALUES (
      payment_record.lease_id,
      target_month,
      current_year,
      CASE current_month
        WHEN 1 THEN 'Janvier ' || current_year
        WHEN 2 THEN 'Février ' || current_year
        WHEN 3 THEN 'Mars ' || current_year
        WHEN 4 THEN 'Avril ' || current_year
        WHEN 5 THEN 'Mai ' || current_year
        WHEN 6 THEN 'Juin ' || current_year
        WHEN 7 THEN 'Juillet ' || current_year
        WHEN 8 THEN 'Août ' || current_year
        WHEN 9 THEN 'Septembre ' || current_year
        WHEN 10 THEN 'Octobre ' || current_year
        WHEN 11 THEN 'Novembre ' || current_year
        WHEN 12 THEN 'Décembre ' || current_year
      END,
      payment_record.monthly_rent + payment_record.monthly_charges,
      payment_record.monthly_rent,
      payment_record.monthly_charges,
      -- Calculer la date d'échéance (jour du mois)
      CASE 
        WHEN payment_record.payment_day <= EXTRACT(DAY FROM (current_year || '-' || current_month || '-01')::date + INTERVAL '1 month' - INTERVAL '1 day')::integer
        THEN (current_year || '-' || current_month || '-' || payment_record.payment_day)::timestamp
        ELSE (current_year || '-' || current_month || '-01')::date + INTERVAL '1 month' - INTERVAL '1 day'
      END,
      'pending',
      payment_record.payment_method,
      'PAY-' || target_month || '-' || UPPER(SUBSTRING(payment_record.lease_id::text, -6))
    ) RETURNING id, lease_id, month, amount_due INTO payment_id, lease_id, month, amount_due;
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

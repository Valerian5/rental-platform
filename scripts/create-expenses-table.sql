-- Script SQL pour créer la table des dépenses fiscales
-- Ce script crée la table expenses pour gérer les dépenses déductibles et non déductibles

-- 1. Créer la table expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  property_id uuid NOT NULL,
  lease_id uuid,
  type varchar(20) NOT NULL CHECK (type IN ('incident', 'maintenance', 'annual_charge')),
  category varchar(20) NOT NULL CHECK (category IN ('repair', 'maintenance', 'improvement', 'tax', 'insurance', 'interest', 'management')),
  amount numeric(10,2) NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  deductible boolean NOT NULL DEFAULT true,
  receipt_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT expenses_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE,
  CONSTRAINT expenses_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases (id) ON DELETE SET NULL
);

-- 2. Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_expenses_owner_id ON public.expenses USING btree (owner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_property_id ON public.expenses USING btree (property_id);
CREATE INDEX IF NOT EXISTS idx_expenses_lease_id ON public.expenses USING btree (lease_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses USING btree (date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON public.expenses USING btree (type);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses USING btree (category);
CREATE INDEX IF NOT EXISTS idx_expenses_deductible ON public.expenses USING btree (deductible);

-- 3. Créer la table des régularisations de charges (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.charge_regularizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL,
  year integer NOT NULL,
  total_charges_paid numeric(10,2) NOT NULL,
  actual_charges numeric(10,2) NOT NULL,
  difference numeric(10,2) NOT NULL,
  type varchar(20) NOT NULL CHECK (type IN ('additional_payment', 'refund')),
  status varchar(20) NOT NULL DEFAULT 'calculated' CHECK (status IN ('calculated', 'paid', 'pending')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT charge_regularizations_pkey PRIMARY KEY (id),
  CONSTRAINT charge_regularizations_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases (id) ON DELETE CASCADE
);

-- 4. Créer les index pour les régularisations
CREATE INDEX IF NOT EXISTS idx_charge_regularizations_lease_id ON public.charge_regularizations USING btree (lease_id);
CREATE INDEX IF NOT EXISTS idx_charge_regularizations_year ON public.charge_regularizations USING btree (year);
CREATE INDEX IF NOT EXISTS idx_charge_regularizations_status ON public.charge_regularizations USING btree (status);

-- 5. Ajouter des contraintes de validation
ALTER TABLE public.expenses ADD CONSTRAINT check_amount_positive CHECK (amount > 0);
ALTER TABLE public.expenses ADD CONSTRAINT check_date_not_future CHECK (date <= CURRENT_DATE);

-- 6. Créer une fonction pour calculer automatiquement le champ deductible
CREATE OR REPLACE FUNCTION calculate_expense_deductible()
RETURNS TRIGGER AS $$
BEGIN
  -- Les améliorations ne sont généralement pas déductibles
  IF NEW.category = 'improvement' THEN
    NEW.deductible = false;
  -- Les autres catégories sont déductibles par défaut
  ELSE
    NEW.deductible = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer le trigger pour calculer automatiquement deductible
DROP TRIGGER IF EXISTS trigger_calculate_expense_deductible ON public.expenses;
CREATE TRIGGER trigger_calculate_expense_deductible
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION calculate_expense_deductible();

-- 8. Insérer des données d'exemple (optionnel)
-- INSERT INTO public.expenses (owner_id, property_id, type, category, amount, date, description, deductible) VALUES
-- ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'maintenance', 'repair', 300.00, '2024-01-15', 'Réparation fuite cuisine', true),
-- ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'maintenance', 'maintenance', 700.00, '2024-02-20', 'Peinture salon', true),
-- ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'annual_charge', 'tax', 900.00, '2024-01-01', 'Taxe foncière 2024', true),
-- ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'annual_charge', 'interest', 1500.00, '2024-01-01', 'Intérêts emprunt 2024', true),
-- ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'annual_charge', 'insurance', 120.00, '2024-01-01', 'Assurance PNO 2024', true);

-- 9. Créer une vue pour faciliter les requêtes fiscales
CREATE OR REPLACE VIEW fiscal_summary AS
SELECT 
  e.owner_id,
  EXTRACT(YEAR FROM e.date) as year,
  SUM(CASE WHEN e.deductible THEN e.amount ELSE 0 END) as total_deductible_expenses,
  SUM(CASE WHEN NOT e.deductible THEN e.amount ELSE 0 END) as total_non_deductible_expenses,
  SUM(e.amount) as total_expenses,
  COUNT(CASE WHEN e.deductible THEN 1 END) as deductible_count,
  COUNT(CASE WHEN NOT e.deductible THEN 1 END) as non_deductible_count,
  COUNT(*) as total_count
FROM public.expenses e
GROUP BY e.owner_id, EXTRACT(YEAR FROM e.date);

-- 10. Créer une vue pour les revenus locatifs par année
CREATE OR REPLACE VIEW rental_income_summary AS
SELECT 
  l.owner_id,
  rr.year,
  SUM(rr.rent_amount) as total_rent_collected,
  SUM(rr.charges_amount) as total_recoverable_charges,
  SUM(rr.total_amount) as total_income,
  COUNT(*) as receipt_count
FROM public.rent_receipts rr
JOIN public.leases l ON rr.lease_id = l.id
WHERE rr.status = 'paid'
GROUP BY l.owner_id, rr.year;

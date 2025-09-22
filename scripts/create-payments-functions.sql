-- Script pour créer les fonctions et triggers
-- À exécuter APRÈS avoir créé les tables et les index

-- 1. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Triggers pour updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lease_payment_configs_updated_at BEFORE UPDATE ON public.lease_payment_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Fonction pour générer les paiements mensuels
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

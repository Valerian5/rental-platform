-- Script pour corriger la génération des paiements avec la date du bail
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer la fonction existante
DROP FUNCTION IF EXISTS generate_monthly_payments(character varying);

-- 2. Créer la nouvelle fonction qui utilise jour_paiement_loyer
CREATE OR REPLACE FUNCTION generate_monthly_payments(target_month VARCHAR(7))
RETURNS TABLE(
    id UUID,
    lease_id UUID,
    amount_due NUMERIC(10,2),
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20)
) AS $$
DECLARE
    current_year INTEGER;
    current_month INTEGER;
    month_names TEXT[] := ARRAY['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                               'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    month_name TEXT;
    due_date_calc TIMESTAMP WITH TIME ZONE;
    payment_day INTEGER;
BEGIN
    -- Extraire l'année et le mois de la chaîne target_month (format: "2025-03")
    current_year := CAST(SPLIT_PART(target_month, '-', 1) AS INTEGER);
    current_month := CAST(SPLIT_PART(target_month, '-', 2) AS INTEGER);
    month_name := month_names[current_month];
    
    -- Insérer les paiements pour le mois cible
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
        reference
    )
    SELECT 
        l.id as lease_id,
        target_month as month,
        current_year as year,
        month_name || ' ' || current_year as month_name,
        COALESCE(l.monthly_rent, 0) + COALESCE(l.monthly_charges, 0) as amount_due,
        COALESCE(l.monthly_rent, 0) as rent_amount,
        COALESCE(l.monthly_charges, 0) as charges_amount,
        -- Calculer la date d'échéance en utilisant jour_paiement_loyer
        CASE 
            WHEN l.jour_paiement_loyer IS NOT NULL AND l.jour_paiement_loyer::INTEGER BETWEEN 1 AND 31 THEN
                -- Utiliser le jour spécifié dans le bail
                (current_year || '-' || LPAD(current_month::TEXT, 2, '0') || '-' || LPAD(l.jour_paiement_loyer::INTEGER::TEXT, 2, '0'))::DATE
            ELSE
                -- Par défaut, utiliser le 1er du mois
                (current_year || '-' || LPAD(current_month::TEXT, 2, '0') || '-01')::DATE
        END as due_date,
        'pending' as status,
        'PAY-' || target_month || '-' || l.id::TEXT as reference
    FROM leases l
    WHERE l.status = 'active'
    AND NOT EXISTS (
        SELECT 1 FROM payments p 
        WHERE p.lease_id = l.id 
        AND p.month = target_month
    )
    RETURNING payments.id, payments.lease_id, payments.amount_due, payments.due_date, payments.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tester la fonction avec un mois spécifique
-- SELECT * FROM generate_monthly_payments('2025-01');

-- 4. Vérifier les baux et leurs jours de paiement
SELECT 
    l.id,
    l.monthly_rent,
    l.monthly_charges,
    l.jour_paiement_loyer,
    l.status,
    p.property_address
FROM leases l
LEFT JOIN properties p ON l.property_id = p.id
WHERE l.status = 'active'
ORDER BY l.created_at DESC;

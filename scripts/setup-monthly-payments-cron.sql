-- Script pour configurer la génération automatique des paiements mensuels
-- À exécuter dans Supabase SQL Editor

-- 1. Créer une fonction pour générer automatiquement les paiements du mois suivant
CREATE OR REPLACE FUNCTION generate_next_month_payments()
RETURNS void AS $$
DECLARE
    next_month VARCHAR(7);
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Calculer le mois suivant
    next_month := TO_CHAR(current_date + INTERVAL '1 month', 'YYYY-MM');
    
    -- Générer les paiements pour le mois suivant
    PERFORM generate_monthly_payments(next_month);
    
    -- Log de l'opération
    RAISE NOTICE 'Paiements générés pour le mois: %', next_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Créer une fonction pour vérifier et générer les paiements si nécessaire
CREATE OR REPLACE FUNCTION ensure_monthly_payments()
RETURNS void AS $$
DECLARE
    current_month VARCHAR(7);
    payment_count INTEGER;
BEGIN
    -- Calculer le mois actuel
    current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    
    -- Vérifier s'il y a déjà des paiements pour ce mois
    SELECT COUNT(*) INTO payment_count
    FROM payments p
    JOIN leases l ON p.lease_id = l.id
    WHERE p.month = current_month
    AND l.status = 'active';
    
    -- Si aucun paiement n'existe pour ce mois, en générer
    IF payment_count = 0 THEN
        PERFORM generate_monthly_payments(current_month);
        RAISE NOTICE 'Paiements générés pour le mois actuel: %', current_month;
    ELSE
        RAISE NOTICE 'Paiements déjà existants pour le mois: %', current_month;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tester la génération automatique
SELECT ensure_monthly_payments();

-- 4. Vérifier les paiements générés
SELECT 
    p.month,
    COUNT(*) as payment_count,
    SUM(p.amount_due) as total_amount
FROM payments p
JOIN leases l ON p.lease_id = l.id
WHERE l.status = 'active'
GROUP BY p.month
ORDER BY p.month DESC;

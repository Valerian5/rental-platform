-- Script pour mettre à jour les dates d'échéance des paiements existants
-- À exécuter dans Supabase SQL Editor

-- 1. Mettre à jour les dates d'échéance des paiements existants
UPDATE payments 
SET 
    due_date = CASE 
        WHEN l.jour_paiement_loyer IS NOT NULL AND l.jour_paiement_loyer::INTEGER BETWEEN 1 AND 31 THEN
            -- Utiliser le jour spécifié dans le bail
            (EXTRACT(YEAR FROM p.due_date) || '-' || 
             LPAD(EXTRACT(MONTH FROM p.due_date)::TEXT, 2, '0') || '-' || 
             LPAD(l.jour_paiement_loyer::INTEGER::TEXT, 2, '0'))::DATE
        ELSE
            -- Garder la date actuelle si pas de jour spécifié
            p.due_date
    END,
    updated_at = NOW()
FROM payments p
JOIN leases l ON p.lease_id = l.id
WHERE payments.id = p.id
AND l.jour_paiement_loyer IS NOT NULL
AND l.jour_paiement_loyer::INTEGER BETWEEN 1 AND 31;

-- 2. Vérifier les mises à jour
SELECT 
    p.id,
    p.month_name,
    p.due_date,
    EXTRACT(DAY FROM p.due_date) as payment_day,
    l.jour_paiement_loyer as lease_payment_day,
    prop.property_address
FROM payments p
JOIN leases l ON p.lease_id = l.id
LEFT JOIN properties prop ON l.property_id = prop.id
WHERE l.jour_paiement_loyer IS NOT NULL
ORDER BY p.due_date ASC;

-- 3. Mettre à jour le statut des paiements en retard
SELECT update_overdue_payments();

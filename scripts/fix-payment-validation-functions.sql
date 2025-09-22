-- Script pour corriger les fonctions de validation des paiements
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS mark_payment_as_paid(UUID, TIMESTAMP WITH TIME ZONE, VARCHAR);
DROP FUNCTION IF EXISTS mark_payment_as_unpaid(UUID, TEXT);

-- 2. Créer une fonction simplifiée pour marquer comme payé
CREATE OR REPLACE FUNCTION mark_payment_as_paid(
    payment_id_param UUID,
    payment_date_param TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method_param VARCHAR(20) DEFAULT 'virement'
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Mettre à jour le paiement
    UPDATE payments 
    SET 
        status = 'paid',
        payment_date = payment_date_param,
        payment_method = payment_method_param,
        updated_at = NOW()
    WHERE id = payment_id_param;
    
    -- Retourner les informations du paiement mis à jour
    SELECT to_json(p.*) INTO result
    FROM payments p
    WHERE p.id = payment_id_param;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer une fonction simplifiée pour marquer comme impayé
CREATE OR REPLACE FUNCTION mark_payment_as_unpaid(
    payment_id_param UUID,
    notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Mettre à jour le paiement
    UPDATE payments 
    SET 
        status = 'unpaid',
        notes = COALESCE(notes_param, notes),
        updated_at = NOW()
    WHERE id = payment_id_param;
    
    -- Retourner les informations du paiement mis à jour
    SELECT to_json(p.*) INTO result
    FROM payments p
    WHERE p.id = payment_id_param;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Tester les fonctions
-- (Remplacer 'PAYMENT_ID_HERE' par un ID de paiement réel)
/*
SELECT mark_payment_as_paid('PAYMENT_ID_HERE'::UUID, NOW(), 'virement');
SELECT mark_payment_as_unpaid('PAYMENT_ID_HERE'::UUID, 'Test impayé');
*/

-- 5. Vérifier les paiements pour tester
SELECT 
    id,
    month_name,
    amount_due,
    status,
    due_date
FROM payments 
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 5;

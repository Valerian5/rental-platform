-- Script de correction pour les fonctions de paiements
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer la fonction problématique
DROP FUNCTION IF EXISTS mark_payment_as_paid(uuid, timestamp with time zone, character varying);

-- 2. Recréer la fonction avec des noms de paramètres uniques
CREATE OR REPLACE FUNCTION mark_payment_as_paid(
    payment_id UUID,
    payment_date_param TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method VARCHAR(20) DEFAULT 'virement'
)
RETURNS TABLE(
    id UUID,
    status VARCHAR(20),
    payment_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Mettre à jour le paiement
    UPDATE payments 
    SET 
        status = 'paid',
        payment_date = payment_date_param,
        payment_method = payment_method,
        updated_at = NOW()
    WHERE id = payment_id;
    
    -- Retourner le paiement mis à jour
    RETURN QUERY
    SELECT p.id, p.status, p.payment_date
    FROM payments p
    WHERE p.id = payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Vérifier que la fonction a été créée correctement
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'mark_payment_as_paid';

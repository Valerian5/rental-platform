-- Script pour corriger l'ordre des paramètres de la fonction de statistiques
-- À exécuter dans Supabase SQL Editor

-- Supprimer la fonction existante
DROP FUNCTION IF EXISTS get_owner_payment_stats(uuid, timestamp with time zone, timestamp with time zone);

-- Recréer avec l'ordre correct des paramètres
CREATE OR REPLACE FUNCTION get_owner_payment_stats(
    owner_id_param UUID,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
    total_received NUMERIC(10,2),
    total_pending NUMERIC(10,2),
    total_overdue NUMERIC(10,2),
    collection_rate NUMERIC(5,2),
    average_delay NUMERIC(5,2)
) AS $$
DECLARE
    total_received NUMERIC(10,2) := 0;
    total_pending NUMERIC(10,2) := 0;
    total_overdue NUMERIC(10,2) := 0;
    total_amount NUMERIC(10,2) := 0;
    collection_rate NUMERIC(5,2) := 0;
    average_delay NUMERIC(5,2) := 0;
    paid_count INTEGER := 0;
    total_delay NUMERIC(10,2) := 0;
BEGIN
    -- Calculer les montants par statut
    SELECT 
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount_due ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount_due ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN p.status = 'overdue' THEN p.amount_due ELSE 0 END), 0)
    INTO total_received, total_pending, total_overdue
    FROM payments p
    JOIN leases l ON p.lease_id = l.id
    WHERE l.owner_id = owner_id_param
    AND (get_owner_payment_stats.start_date IS NULL OR p.created_at >= get_owner_payment_stats.start_date)
    AND (get_owner_payment_stats.end_date IS NULL OR p.created_at <= get_owner_payment_stats.end_date);
    
    -- Calculer le taux de recouvrement
    total_amount := total_received + total_pending + total_overdue;
    IF total_amount > 0 THEN
        collection_rate := (total_received / total_amount) * 100;
    END IF;
    
    -- Calculer le délai moyen de paiement
    SELECT 
        COUNT(*),
        COALESCE(SUM(EXTRACT(EPOCH FROM (p.payment_date - p.due_date)) / 86400), 0)
    INTO paid_count, total_delay
    FROM payments p
    JOIN leases l ON p.lease_id = l.id
    WHERE l.owner_id = owner_id_param
    AND p.status = 'paid'
    AND p.payment_date IS NOT NULL
    AND (get_owner_payment_stats.start_date IS NULL OR p.created_at >= get_owner_payment_stats.start_date)
    AND (get_owner_payment_stats.end_date IS NULL OR p.created_at <= get_owner_payment_stats.end_date);
    
    IF paid_count > 0 THEN
        average_delay := total_delay / paid_count;
    END IF;
    
    -- Retourner les statistiques
    RETURN QUERY
    SELECT total_received, total_pending, total_overdue, collection_rate, average_delay;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tester la fonction
SELECT * FROM get_owner_payment_stats(
    (SELECT id FROM users WHERE user_type = 'owner' LIMIT 1),
    '2025-01-01'::TIMESTAMP WITH TIME ZONE,
    '2025-12-31'::TIMESTAMP WITH TIME ZONE
);

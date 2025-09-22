-- Script pour mettre à jour les paiements en retard
-- À exécuter dans Supabase SQL Editor

-- 1. Fonction pour marquer les paiements en retard
CREATE OR REPLACE FUNCTION update_overdue_payments()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Marquer comme 'overdue' les paiements en attente dont la date d'échéance est dépassée
    UPDATE payments 
    SET 
        status = 'overdue',
        updated_at = NOW()
    WHERE status = 'pending' 
    AND due_date < NOW();
    
    -- Retourner le nombre de paiements mis à jour
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Paiements marqués comme en retard: %', updated_count;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Exécuter la mise à jour
SELECT update_overdue_payments();

-- 3. Vérifier les paiements par statut
SELECT 
    status,
    COUNT(*) as count,
    MIN(due_date) as earliest_due,
    MAX(due_date) as latest_due
FROM payments
GROUP BY status
ORDER BY status;

-- 4. Voir les paiements en retard
SELECT 
    p.id,
    p.month_name,
    p.amount_due,
    p.due_date,
    p.status,
    l.owner_id,
    u.first_name as tenant_name
FROM payments p
JOIN leases l ON p.lease_id = l.id
LEFT JOIN users u ON l.tenant_id = u.id
WHERE p.status = 'overdue'
ORDER BY p.due_date ASC;

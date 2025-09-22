-- Script pour vérifier et activer les baux
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier le statut des baux
SELECT 
    status,
    COUNT(*) as count
FROM leases
GROUP BY status
ORDER BY status;

-- 2. Vérifier les baux avec leurs propriétaires
SELECT 
    l.id,
    l.status,
    l.monthly_rent,
    l.charges,
    u.first_name as owner_name,
    u.email as owner_email
FROM leases l
LEFT JOIN users u ON l.owner_id = u.id
ORDER BY l.status, l.created_at DESC;

-- 3. Activer les baux qui ne sont pas encore actifs (optionnel)
-- Décommentez les lignes suivantes si vous voulez activer automatiquement les baux
/*
UPDATE leases 
SET status = 'active'
WHERE status IN ('draft', 'sent_to_tenant', 'sent_for_signature', 'signed_by_tenant', 'signed_by_owner')
AND owner_id IS NOT NULL
AND tenant_id IS NOT NULL
AND monthly_rent > 0;

-- Vérifier les baux activés
SELECT 
    status,
    COUNT(*) as count
FROM leases
GROUP BY status
ORDER BY status;
*/

-- 4. Tester la génération de paiements pour un bail spécifique
-- Remplacez 'YOUR_LEASE_ID' par l'ID d'un bail actif
/*
SELECT * FROM generate_monthly_payments('2025-01');
*/

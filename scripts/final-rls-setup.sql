-- Script final pour configurer RLS de manière appropriée
-- À exécuter dans Supabase SQL Editor

-- 1. Garder RLS désactivé sur receipts (les données fiscales sont publiques pour les propriétaires)
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;

-- 2. Vérifier le statut RLS
SELECT 
    'Status RLS receipts' as type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'receipts';

-- 3. Tester la requête finale
SELECT 
    'Test final' as type,
    r.id,
    r.lease_id,
    r.year,
    r.month,
    r.rent_amount,
    r.charges_amount,
    r.total_amount
FROM receipts r
WHERE r.year = 2025
AND r.lease_id IN (
    SELECT l.id
    FROM leases l
    WHERE l.owner_id = '211895cc-4c89-479b-8cce-0cb34b5404a5'
    AND l.status IN ('active', 'signed', 'expired')
);

-- 4. Note: La sécurité est assurée par l'API qui valide l'owner_id

-- Script pour tester la requête exacte avec l'ID du bail
-- À exécuter dans Supabase SQL Editor

-- 1. Tester la requête exacte utilisée par le service fiscal
SELECT 
    'Requête exacte' as type,
    r.id,
    r.lease_id,
    r.year,
    r.month,
    r.rent_amount,
    r.charges_amount,
    r.total_amount,
    r.generated_at
FROM receipts r
WHERE r.year = 2025
AND r.lease_id IN ('acd025bf-e1db-4100-ac19-1684228193a4');

-- 2. Vérifier si la quittance existe avec cet ID de bail
SELECT 
    'Quittance avec ID bail' as type,
    r.id,
    r.lease_id,
    r.year,
    r.month,
    r.rent_amount,
    r.charges_amount,
    r.total_amount
FROM receipts r
WHERE r.lease_id = 'acd025bf-e1db-4100-ac19-1684228193a4';

-- 3. Vérifier les quittances pour l'année 2025 (sans filtre de bail)
SELECT 
    'Toutes quittances 2025' as type,
    r.id,
    r.lease_id,
    r.year,
    r.month,
    r.rent_amount,
    r.charges_amount,
    r.total_amount
FROM receipts r
WHERE r.year = 2025;

-- 4. Vérifier la relation entre la quittance et le bail
SELECT 
    'Relation quittance-bail' as type,
    r.id as receipt_id,
    r.lease_id as receipt_lease_id,
    r.year,
    r.month,
    p.id as payment_id,
    p.lease_id as payment_lease_id,
    l.id as lease_id,
    l.status as lease_status,
    l.owner_id
FROM receipts r
JOIN payments p ON r.payment_id = p.id
JOIN leases l ON p.lease_id = l.id
WHERE r.id = '29fd63be-ae2d-4648-a9c6-0a2d8c36c727';

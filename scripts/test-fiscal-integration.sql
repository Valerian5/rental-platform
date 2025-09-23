-- Script pour tester l'intégration entre les paiements et le module fiscal
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les quittances générées
SELECT 
    r.id,
    r.reference,
    r.year,
    r.month,
    r.rent_amount,
    r.charges_amount,
    r.total_amount,
    r.generated_at,
    p.status as payment_status,
    l.owner_id
FROM receipts r
JOIN payments p ON r.payment_id = p.id
JOIN leases l ON p.lease_id = l.id
WHERE r.year = 2025
ORDER BY r.generated_at DESC
LIMIT 10;

-- 2. Vérifier que les données sont compatibles avec le module fiscal
SELECT 
    r.id,
    r.lease_id,
    r.year,
    r.month,
    r.rent_amount,
    r.charges_amount,
    r.total_amount,
    l.lease_type,
    l.monthly_rent,
    l.charges,
    prop.title as property_title,
    prop.address as property_address
FROM receipts r
JOIN payments p ON r.payment_id = p.id
JOIN leases l ON p.lease_id = l.id
LEFT JOIN properties prop ON l.property_id = prop.id
WHERE r.year = 2025
ORDER BY r.generated_at DESC
LIMIT 5;

-- 3. Compter les quittances par propriétaire pour 2025
SELECT 
    l.owner_id,
    COUNT(r.id) as total_receipts,
    SUM(r.rent_amount) as total_rent,
    SUM(r.charges_amount) as total_charges,
    SUM(r.total_amount) as total_amount
FROM receipts r
JOIN payments p ON r.payment_id = p.id
JOIN leases l ON p.lease_id = l.id
WHERE r.year = 2025
GROUP BY l.owner_id
ORDER BY total_amount DESC;

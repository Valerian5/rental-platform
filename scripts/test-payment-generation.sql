-- Script de test pour la génération des paiements avec la date du bail
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les baux actifs et leurs jours de paiement
SELECT 
    l.id as lease_id,
    l.monthly_rent,
    l.charges,
    l.jour_paiement_loyer,
    l.status,
    p.address as property_address,
    u.first_name as tenant_name
FROM leases l
LEFT JOIN properties p ON l.property_id = p.id
LEFT JOIN users u ON l.tenant_id = u.id
WHERE l.status = 'active'
ORDER BY l.created_at DESC;

-- 2. Supprimer les anciens paiements de test (optionnel)
-- DELETE FROM payments WHERE month = '2025-01';

-- 3. Générer les paiements pour janvier 2025
SELECT * FROM generate_monthly_payments('2025-01');

-- 4. Vérifier les paiements générés
SELECT 
    p.id,
    p.month,
    p.month_name,
    p.amount_due,
    p.rent_amount,
    p.charges_amount,
    p.due_date,
    p.status,
    p.reference,
    l.jour_paiement_loyer,
    prop.address as property_address
FROM payments p
JOIN leases l ON p.lease_id = l.id
LEFT JOIN properties prop ON l.property_id = prop.id
WHERE p.month = '2025-01'
ORDER BY p.due_date ASC;

-- 5. Vérifier que les dates d'échéance correspondent aux jours de paiement des baux
SELECT 
    p.month_name,
    p.due_date,
    EXTRACT(DAY FROM p.due_date) as payment_day,
    l.jour_paiement_loyer as lease_payment_day,
    CASE 
        WHEN EXTRACT(DAY FROM p.due_date) = l.jour_paiement_loyer::INTEGER THEN '✅ Correct'
        ELSE '❌ Incorrect'
    END as status
FROM payments p
JOIN leases l ON p.lease_id = l.id
WHERE p.month = '2025-01';

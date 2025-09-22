-- Script de test pour vérifier le module de paiements
-- À exécuter dans Supabase SQL Editor après la migration

-- 1. Vérifier que les tables existent
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'receipts', 'reminders', 'lease_payment_configs')
ORDER BY table_name;

-- 2. Vérifier les contraintes de clé étrangère
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('payments', 'receipts', 'reminders', 'lease_payment_configs')
ORDER BY tc.table_name, kcu.column_name;

-- 3. Vérifier les index
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('payments', 'receipts', 'reminders', 'lease_payment_configs')
ORDER BY tablename, indexname;

-- 4. Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('payments', 'receipts', 'reminders', 'lease_payment_configs')
ORDER BY tablename, policyname;

-- 5. Tester la fonction de génération des paiements
-- Générer les paiements pour le mois actuel
SELECT * FROM generate_monthly_payments('2025-01');

-- 6. Vérifier les données générées
SELECT 
    p.id,
    p.lease_id,
    p.amount_due,
    p.due_date,
    p.status,
    l.owner_id,
    l.tenant_id,
    pr.title as property_title
FROM payments p
JOIN leases l ON p.lease_id = l.id
LEFT JOIN properties pr ON l.property_id = pr.id
WHERE TO_CHAR(p.due_date, 'YYYY-MM') = '2025-01'
ORDER BY p.created_at DESC
LIMIT 10;

-- 7. Tester les relations avec les utilisateurs
SELECT 
    p.id as payment_id,
    p.amount_due,
    p.due_date,
    p.status,
    u_owner.first_name as owner_name,
    u_owner.email as owner_email,
    u_tenant.first_name as tenant_name,
    u_tenant.email as tenant_email,
    pr.title as property_title
FROM payments p
JOIN leases l ON p.lease_id = l.id
LEFT JOIN users u_owner ON l.owner_id = u_owner.id
LEFT JOIN users u_tenant ON l.tenant_id = u_tenant.id
LEFT JOIN properties pr ON l.property_id = pr.id
WHERE TO_CHAR(p.due_date, 'YYYY-MM') = '2025-01'
ORDER BY p.created_at DESC
LIMIT 5;

-- 8. Vérifier les statistiques
SELECT 
    COUNT(*) as total_payments,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_payments,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_payments,
    SUM(amount_due) as total_amount_due,
    SUM(CASE WHEN status = 'paid' THEN amount_paid ELSE 0 END) as total_amount_paid
FROM payments
WHERE TO_CHAR(due_date, 'YYYY-MM') = '2025-01';

-- 9. Tester l'insertion d'une configuration de paiement
INSERT INTO lease_payment_configs (lease_id, rent_amount, charges_amount, payment_day, payment_method)
SELECT 
    l.id,
    l.monthly_rent,
    COALESCE(l.charges, 0),
    1, -- 1er du mois
    'virement'
FROM leases l
WHERE l.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM lease_payment_configs lpc WHERE lpc.lease_id = l.id
)
LIMIT 5;

-- 10. Vérifier les configurations créées
SELECT 
    lpc.id,
    lpc.lease_id,
    lpc.rent_amount,
    lpc.charges_amount,
    lpc.payment_day,
    lpc.payment_method,
    l.owner_id,
    l.tenant_id
FROM lease_payment_configs lpc
JOIN leases l ON lpc.lease_id = l.id
ORDER BY lpc.created_at DESC
LIMIT 10;

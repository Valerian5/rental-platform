-- Test du module de paiements avec la structure existante
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier que les tables existent
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'receipts', 'reminders', 'leases', 'users', 'properties')
ORDER BY table_name;

-- 2. Vérifier la structure de la table payments
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes de clé étrangère
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
    AND tc.table_name IN ('payments', 'receipts', 'reminders')
ORDER BY tc.table_name, kcu.column_name;

-- 4. Vérifier les index
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('payments', 'receipts', 'reminders')
ORDER BY tablename, indexname;

-- 5. Tester la fonction de génération des paiements
-- Générer les paiements pour le mois actuel
SELECT * FROM generate_monthly_payments('2025-01');

-- 6. Vérifier les paiements générés
SELECT 
    p.id,
    p.lease_id,
    p.month,
    p.year,
    p.month_name,
    p.amount_due,
    p.rent_amount,
    p.charges_amount,
    p.due_date,
    p.status,
    p.reference,
    l.owner_id,
    l.tenant_id
FROM payments p
JOIN leases l ON p.lease_id = l.id
WHERE p.month = '2025-01'
ORDER BY p.created_at DESC
LIMIT 10;

-- 7. Tester les relations avec les utilisateurs
SELECT 
    p.id as payment_id,
    p.amount_due,
    p.due_date,
    p.status,
    p.reference,
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
WHERE p.month = '2025-01'
ORDER BY p.created_at DESC
LIMIT 5;

-- 8. Tester la fonction de statistiques
SELECT * FROM get_owner_payment_stats(
    (SELECT id FROM users WHERE user_type = 'owner' LIMIT 1),
    '2025-01-01'::TIMESTAMP WITH TIME ZONE,
    '2025-12-31'::TIMESTAMP WITH TIME ZONE
);

-- 9. Tester la fonction de marquage comme payé
-- Sélectionner un paiement en attente
SELECT p.id, p.status, p.amount_due
FROM payments p
WHERE p.status = 'pending'
LIMIT 1;

-- Marquer comme payé (remplacer l'ID par un ID réel)
-- SELECT * FROM mark_payment_as_paid('REPLACE_WITH_ACTUAL_PAYMENT_ID');

-- 10. Tester la fonction de génération de quittance
-- Sélectionner un paiement payé
SELECT p.id, p.status, p.amount_due
FROM payments p
WHERE p.status = 'paid'
LIMIT 1;

-- Générer une quittance (remplacer l'ID par un ID réel)
-- SELECT * FROM generate_receipt('REPLACE_WITH_ACTUAL_PAYMENT_ID');

-- 11. Vérifier les données de test
SELECT 
    COUNT(*) as total_payments,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_payments,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_payments,
    SUM(amount_due) as total_amount_due
FROM payments
WHERE month = '2025-01';

-- 12. Vérifier les baux actifs
SELECT 
    COUNT(*) as total_leases,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_leases,
    COUNT(CASE WHEN owner_id IS NOT NULL THEN 1 END) as leases_with_owner,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as leases_with_tenant
FROM leases;

-- 13. Vérifier les utilisateurs
SELECT 
    user_type,
    COUNT(*) as count
FROM users
GROUP BY user_type
ORDER BY user_type;

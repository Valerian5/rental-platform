-- Script de test pour la solution RLS sécurisée
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier le statut RLS sur toutes les tables concernées
SELECT 
    'Statut RLS' as type,
    schemaname,
    tablename,
    rowsecurity as rls_actif
FROM pg_tables 
WHERE tablename IN ('receipts', 'expenses', 'leases', 'payments')
ORDER BY tablename;

-- 2. Vérifier les politiques RLS sur receipts
SELECT 
    'Politiques receipts' as type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'receipts'
ORDER BY policyname;

-- 3. Vérifier les politiques RLS sur expenses
SELECT 
    'Politiques expenses' as type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'expenses'
ORDER BY policyname;

-- 4. Vérifier les politiques RLS sur leases
SELECT 
    'Politiques leases' as type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'leases'
ORDER BY policyname;

-- 5. Tester l'accès aux données avec un utilisateur spécifique
-- Remplacez 'YOUR_USER_ID_HERE' par un ID d'utilisateur réel
DO $$
DECLARE
    test_user_id UUID := '211895cc-4c89-479b-8cce-0cb34b5404a5'; -- Remplacez par un ID réel
    receipts_count INTEGER;
    expenses_count INTEGER;
    leases_count INTEGER;
BEGIN
    -- Compter les quittances accessibles
    SELECT COUNT(*) INTO receipts_count
    FROM receipts r
    WHERE EXISTS (
        SELECT 1 
        FROM payments p
        JOIN leases l ON p.lease_id = l.id
        WHERE p.id = r.payment_id
        AND l.owner_id = test_user_id
    );
    
    -- Compter les dépenses accessibles
    SELECT COUNT(*) INTO expenses_count
    FROM expenses e
    WHERE e.owner_id = test_user_id;
    
    -- Compter les baux accessibles
    SELECT COUNT(*) INTO leases_count
    FROM leases l
    WHERE l.owner_id = test_user_id;
    
    RAISE NOTICE 'Test RLS pour utilisateur %:', test_user_id;
    RAISE NOTICE '- Quittances accessibles: %', receipts_count;
    RAISE NOTICE '- Dépenses accessibles: %', expenses_count;
    RAISE NOTICE '- Baux accessibles: %', leases_count;
END $$;

-- 6. Vérifier que les données sont bien protégées
-- Cette requête ne devrait retourner que les données de l'utilisateur connecté
-- (ou rien si aucun utilisateur n'est connecté)
SELECT 
    'Test protection données' as type,
    'receipts' as table_name,
    COUNT(*) as accessible_records
FROM receipts r
WHERE EXISTS (
    SELECT 1 
    FROM payments p
    JOIN leases l ON p.lease_id = l.id
    WHERE p.id = r.payment_id
    AND l.owner_id = auth.uid()
)

UNION ALL

SELECT 
    'Test protection données' as type,
    'expenses' as table_name,
    COUNT(*) as accessible_records
FROM expenses e
WHERE e.owner_id = auth.uid()

UNION ALL

SELECT 
    'Test protection données' as type,
    'leases' as table_name,
    COUNT(*) as accessible_records
FROM leases l
WHERE l.owner_id = auth.uid();

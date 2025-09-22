-- Script pour vérifier les fonctions de paiement
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si les fonctions existent
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%payment%'
ORDER BY routine_name;

-- 2. Vérifier les paramètres de mark_payment_as_paid
SELECT 
    parameter_name,
    data_type,
    parameter_mode
FROM information_schema.parameters 
WHERE specific_name = (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_name = 'mark_payment_as_paid' 
    AND routine_schema = 'public'
)
ORDER BY ordinal_position;

-- 3. Tester la fonction mark_payment_as_paid avec un paiement existant
-- (Remplacer 'PAYMENT_ID_HERE' par un ID de paiement réel)
/*
SELECT * FROM mark_payment_as_paid(
    'PAYMENT_ID_HERE'::UUID,
    NOW(),
    'virement'
);
*/

-- 4. Vérifier les paiements existants pour tester
SELECT 
    id,
    month_name,
    amount_due,
    status,
    due_date
FROM payments 
WHERE status = 'pending'
LIMIT 5;

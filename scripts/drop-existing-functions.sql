-- Script pour supprimer les fonctions existantes avant de les recréer
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer la fonction generate_monthly_payments si elle existe
DROP FUNCTION IF EXISTS generate_monthly_payments(character varying);

-- 2. Supprimer les autres fonctions de paiements si elles existent
DROP FUNCTION IF EXISTS mark_payment_as_paid(uuid, timestamp with time zone, character varying);
DROP FUNCTION IF EXISTS mark_payment_as_unpaid(uuid, text);
DROP FUNCTION IF EXISTS create_payment_reminder(uuid, character varying, text);
DROP FUNCTION IF EXISTS generate_receipt(uuid);
DROP FUNCTION IF EXISTS get_owner_payment_stats(uuid, timestamp with time zone, timestamp with time zone);

-- 3. Vérifier que les fonctions ont été supprimées
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'generate_monthly_payments',
    'mark_payment_as_paid',
    'mark_payment_as_unpaid',
    'create_payment_reminder',
    'generate_receipt',
    'get_owner_payment_stats'
);

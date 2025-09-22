-- Script pour vérifier la structure de la base de données
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure de la table leases
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leases' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier la structure de la table properties
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier la structure de la table payments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Test de jointure pour vérifier les noms de colonnes
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
LIMIT 5;

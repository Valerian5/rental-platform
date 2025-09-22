-- Script pour vérifier les relations de la table leases
-- À exécuter dans Supabase SQL Editor pour diagnostiquer les problèmes de relations

-- 1. Vérifier la structure de la table leases
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leases' 
AND column_name IN ('id', 'owner_id', 'tenant_id', 'property_id')
ORDER BY column_name;

-- 2. Vérifier les contraintes de clé étrangère
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'leases'
    AND kcu.column_name IN ('owner_id', 'tenant_id', 'property_id');

-- 3. Vérifier les index sur les colonnes de relation
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'leases'
    AND indexdef LIKE '%owner_id%' OR indexdef LIKE '%tenant_id%';

-- 4. Test de relation simple
SELECT 
    l.id as lease_id,
    l.owner_id,
    l.tenant_id,
    l.property_id,
    u_owner.first_name as owner_name,
    u_tenant.first_name as tenant_name
FROM leases l
LEFT JOIN users u_owner ON l.owner_id = u_owner.id
LEFT JOIN users u_tenant ON l.tenant_id = u_tenant.id
LIMIT 5;

-- 5. Vérifier les données de test
SELECT 
    COUNT(*) as total_leases,
    COUNT(owner_id) as leases_with_owner,
    COUNT(tenant_id) as leases_with_tenant,
    COUNT(property_id) as leases_with_property
FROM leases;

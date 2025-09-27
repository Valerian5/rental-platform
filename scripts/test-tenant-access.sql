-- Script de test pour vérifier l'accès tenant
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les politiques RLS existantes
SELECT 
    'Politiques RLS existantes' as type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('leases', 'notifications', 'charge_regularizations_v2', 'lease_revisions')
ORDER BY tablename, policyname;

-- 2. Vérifier si RLS est activé sur les tables
SELECT 
    'État RLS des tables' as type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('leases', 'notifications', 'charge_regularizations_v2', 'lease_revisions')
ORDER BY tablename;

-- 3. Tester l'accès aux données (nécessite un utilisateur connecté)
-- Cette requête ne fonctionnera que si un utilisateur est connecté
SELECT 
    'Test accès leases' as type,
    COUNT(*) as total_leases,
    COUNT(CASE WHEN tenant_id = auth.uid() THEN 1 END) as leases_tenant,
    COUNT(CASE WHEN property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
    ) THEN 1 END) as leases_owner
FROM leases;

-- 4. Tester l'accès aux notifications
SELECT 
    'Test accès notifications' as type,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as notifications_user
FROM notifications;

-- 5. Vérifier les données de test
SELECT 
    'Données de test' as type,
    'leases' as table_name,
    COUNT(*) as count
FROM leases
UNION ALL
SELECT 
    'Données de test' as type,
    'notifications' as table_name,
    COUNT(*) as count
FROM notifications
UNION ALL
SELECT 
    'Données de test' as type,
    'charge_regularizations_v2' as table_name,
    COUNT(*) as count
FROM charge_regularizations_v2
UNION ALL
SELECT 
    'Données de test' as type,
    'lease_revisions' as table_name,
    COUNT(*) as count
FROM lease_revisions;

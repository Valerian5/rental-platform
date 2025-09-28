-- Script de test pour l'accès tenant avec debug
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'utilisateur connecté
SELECT 
    'Utilisateur connecté' as type,
    auth.uid() as user_id,
    auth.role() as user_role;

-- 2. Vérifier l'accès aux baux
SELECT 
    'Test accès baux' as type,
    COUNT(*) as total_leases,
    COUNT(CASE WHEN tenant_id = auth.uid() THEN 1 END) as my_leases_as_tenant,
    COUNT(CASE WHEN property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
    ) THEN 1 END) as my_leases_as_owner
FROM leases;

-- 3. Vérifier l'accès aux notifications
SELECT 
    'Test accès notifications' as type,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_notifications
FROM notifications;

-- 4. Vérifier l'accès aux régularisations
SELECT 
    'Test accès régularisations' as type,
    COUNT(*) as total_regularizations,
    COUNT(CASE WHEN created_by = auth.uid() THEN 1 END) as my_created_regularizations,
    COUNT(CASE WHEN lease_id IN (
        SELECT id FROM leases WHERE tenant_id = auth.uid()
    ) THEN 1 END) as my_tenant_regularizations
FROM charge_regularizations_v2;

-- 5. Vérifier l'accès aux révisions
SELECT 
    'Test accès révisions' as type,
    COUNT(*) as total_revisions,
    COUNT(CASE WHEN created_by = auth.uid() THEN 1 END) as my_created_revisions,
    COUNT(CASE WHEN lease_id IN (
        SELECT id FROM leases WHERE tenant_id = auth.uid()
    ) THEN 1 END) as my_tenant_revisions
FROM lease_revisions;

-- 6. Vérifier les données spécifiques pour un locataire
SELECT 
    'Données locataire' as type,
    'leases' as table_name,
    l.id,
    l.tenant_id,
    l.property_id,
    l.status
FROM leases l
WHERE l.tenant_id = auth.uid()
LIMIT 5;

-- 7. Vérifier les notifications spécifiques
SELECT 
    'Notifications locataire' as type,
    n.id,
    n.user_id,
    n.type,
    n.title,
    n.read,
    n.created_at
FROM notifications n
WHERE n.user_id = auth.uid()
ORDER BY n.created_at DESC
LIMIT 5;

-- 8. Vérifier les politiques RLS actives
SELECT 
    'Politiques RLS actives' as type,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('leases', 'notifications', 'charge_regularizations_v2', 'lease_revisions')
ORDER BY tablename, policyname;

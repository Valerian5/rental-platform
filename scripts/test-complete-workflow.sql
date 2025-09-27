-- Script de test complet pour le workflow tenant
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'accès aux baux pour les locataires
SELECT 
    'Test accès baux' as type,
    COUNT(*) as total_leases,
    COUNT(CASE WHEN tenant_id = auth.uid() THEN 1 END) as my_leases,
    COUNT(CASE WHEN property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
    ) THEN 1 END) as owner_leases
FROM public.leases;

-- 2. Vérifier l'accès aux régularisations
SELECT 
    'Test accès régularisations' as type,
    COUNT(*) as total_regularizations,
    COUNT(CASE WHEN created_by = auth.uid() THEN 1 END) as my_created_regularizations,
    COUNT(CASE WHEN lease_id IN (
        SELECT id FROM leases WHERE tenant_id = auth.uid()
    ) THEN 1 END) as my_tenant_regularizations
FROM public.charge_regularizations_v2;

-- 3. Vérifier l'accès aux révisions de loyer
SELECT 
    'Test accès révisions' as type,
    COUNT(*) as total_revisions,
    COUNT(CASE WHEN created_by = auth.uid() THEN 1 END) as my_created_revisions,
    COUNT(CASE WHEN lease_id IN (
        SELECT id FROM leases WHERE tenant_id = auth.uid()
    ) THEN 1 END) as my_tenant_revisions
FROM public.lease_revisions;

-- 4. Vérifier l'accès aux notifications
SELECT 
    'Test accès notifications' as type,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_notifications,
    COUNT(CASE WHEN type = 'charge_regularization' THEN 1 END) as charge_notifications,
    COUNT(CASE WHEN type = 'rent_revision' THEN 1 END) as rent_notifications
FROM public.notifications;

-- 5. Vérifier les données de test spécifiques
SELECT 
    'Données de test' as type,
    'leases' as table_name,
    COUNT(*) as count,
    COUNT(CASE WHEN tenant_id = auth.uid() THEN 1 END) as accessible_to_me
FROM public.leases
UNION ALL
SELECT 
    'Données de test' as type,
    'notifications' as table_name,
    COUNT(*) as count,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as accessible_to_me
FROM public.notifications
UNION ALL
SELECT 
    'Données de test' as type,
    'charge_regularizations_v2' as table_name,
    COUNT(*) as count,
    COUNT(CASE WHEN lease_id IN (
        SELECT id FROM leases WHERE tenant_id = auth.uid()
    ) THEN 1 END) as accessible_to_me
FROM public.charge_regularizations_v2
UNION ALL
SELECT 
    'Données de test' as type,
    'lease_revisions' as table_name,
    COUNT(*) as count,
    COUNT(CASE WHEN lease_id IN (
        SELECT id FROM leases WHERE tenant_id = auth.uid()
    ) THEN 1 END) as accessible_to_me
FROM public.lease_revisions;

-- 6. Vérifier les politiques RLS actives
SELECT 
    'Politiques RLS actives' as type,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('leases', 'notifications', 'charge_regularizations_v2', 'lease_revisions')
GROUP BY tablename
ORDER BY tablename;

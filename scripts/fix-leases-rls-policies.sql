-- Script pour corriger les politiques RLS des baux
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer toutes les politiques existantes sur leases
DROP POLICY IF EXISTS "Owners can manage their leases" ON public.leases;
DROP POLICY IF EXISTS "Owners can view their own leases" ON public.leases;
DROP POLICY IF EXISTS "Service role can manage all leases" ON public.leases;
DROP POLICY IF EXISTS "Tenants can view their leases" ON public.leases;

-- 2. Créer les politiques RLS correctes pour leases
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;

-- Propriétaires peuvent gérer leurs baux
CREATE POLICY "Owners can manage their leases" ON public.leases
    FOR ALL
    TO authenticated
    USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

-- Locataires peuvent voir leurs baux
CREATE POLICY "Tenants can view their leases" ON public.leases
    FOR SELECT
    TO authenticated
    USING (tenant_id = auth.uid());

-- Service role peut tout faire
CREATE POLICY "Service role can manage all leases" ON public.leases
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 3. Vérifier les politiques créées
SELECT 
    'Politiques leases créées' as type,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'leases'
ORDER BY policyname;

-- 4. Tester l'accès aux baux (nécessite un utilisateur connecté)
SELECT 
    'Test accès baux' as type,
    COUNT(*) as total_leases,
    COUNT(CASE WHEN tenant_id = auth.uid() THEN 1 END) as my_leases_as_tenant,
    COUNT(CASE WHEN property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
    ) THEN 1 END) as my_leases_as_owner
FROM public.leases;

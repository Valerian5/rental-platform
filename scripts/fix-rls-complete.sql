-- Script de correction RLS complet
-- À exécuter dans Supabase SQL Editor

-- 1. SUPPRIMER TOUTES LES POLITIQUES EXISTANTES
DO $$
DECLARE
    table_name TEXT;
    policy_name TEXT;
BEGIN
    -- Tables concernées
    FOR table_name IN SELECT unnest(ARRAY['leases', 'notifications', 'charge_regularizations_v2', 'lease_revisions', 'charge_expenses', 'charge_supporting_documents']) LOOP
        -- Supprimer toutes les politiques existantes
        FOR policy_name IN 
            SELECT policyname FROM pg_policies WHERE tablename = table_name
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
        END LOOP;
    END LOOP;
END $$;

-- 2. CRÉER LES POLITIQUES RLS CORRECTES POUR LEASES
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

-- 3. CRÉER LES POLITIQUES RLS CORRECTES POUR NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Locataires peuvent voir leurs notifications
CREATE POLICY "Tenants can view their notifications" ON public.notifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Locataires peuvent marquer leurs notifications comme lues
CREATE POLICY "Tenants can update their notifications" ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Propriétaires peuvent créer des notifications pour leurs locataires
CREATE POLICY "Owners can create notifications for their tenants" ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT l.tenant_id 
            FROM leases l 
            JOIN properties p ON l.property_id = p.id 
            WHERE p.owner_id = auth.uid()
        )
    );

-- Service role peut tout faire
CREATE POLICY "Service role can manage all notifications" ON public.notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 4. CRÉER LES POLITIQUES RLS CORRECTES POUR CHARGE_REGULARIZATIONS_V2
ALTER TABLE public.charge_regularizations_v2 ENABLE ROW LEVEL SECURITY;

-- Propriétaires peuvent gérer leurs régularisations
CREATE POLICY "Owners can manage their regularizations" ON public.charge_regularizations_v2
    FOR ALL
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Locataires peuvent voir leurs régularisations
CREATE POLICY "Tenants can view their regularizations" ON public.charge_regularizations_v2
    FOR SELECT
    TO authenticated
    USING (
        lease_id IN (
            SELECT id FROM leases WHERE tenant_id = auth.uid()
        )
    );

-- Service role peut tout faire
CREATE POLICY "Service role can manage all regularizations" ON public.charge_regularizations_v2
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. CRÉER LES POLITIQUES RLS CORRECTES POUR LEASE_REVISIONS
ALTER TABLE public.lease_revisions ENABLE ROW LEVEL SECURITY;

-- Propriétaires peuvent gérer leurs révisions
CREATE POLICY "Owners can manage their rent revisions" ON public.lease_revisions
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

-- Locataires peuvent voir leurs révisions
CREATE POLICY "Tenants can view their rent revisions" ON public.lease_revisions
    FOR SELECT
    TO authenticated
    USING (
        lease_id IN (
            SELECT id FROM leases WHERE tenant_id = auth.uid()
        )
    );

-- Service role peut tout faire
CREATE POLICY "Service role can manage all rent revisions" ON public.lease_revisions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. CRÉER LES POLITIQUES RLS CORRECTES POUR CHARGE_EXPENSES
ALTER TABLE public.charge_expenses ENABLE ROW LEVEL SECURITY;

-- Propriétaires peuvent gérer leurs dépenses
CREATE POLICY "Owners can manage their expenses" ON public.charge_expenses
    FOR ALL
    TO authenticated
    USING (
        regularization_id IN (
            SELECT id FROM charge_regularizations_v2 WHERE created_by = auth.uid()
        )
    )
    WITH CHECK (
        regularization_id IN (
            SELECT id FROM charge_regularizations_v2 WHERE created_by = auth.uid()
        )
    );

-- Locataires peuvent voir leurs dépenses
CREATE POLICY "Tenants can view their expenses" ON public.charge_expenses
    FOR SELECT
    TO authenticated
    USING (
        regularization_id IN (
            SELECT r.id 
            FROM charge_regularizations_v2 r
            JOIN leases l ON r.lease_id = l.id
            WHERE l.tenant_id = auth.uid()
        )
    );

-- Service role peut tout faire
CREATE POLICY "Service role can manage all expenses" ON public.charge_expenses
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 7. CRÉER LES POLITIQUES RLS CORRECTES POUR CHARGE_SUPPORTING_DOCUMENTS
ALTER TABLE public.charge_supporting_documents ENABLE ROW LEVEL SECURITY;

-- Propriétaires peuvent gérer leurs justificatifs
CREATE POLICY "Owners can manage their supporting documents" ON public.charge_supporting_documents
    FOR ALL
    TO authenticated
    USING (
        expense_id IN (
            SELECT e.id 
            FROM charge_expenses e
            JOIN charge_regularizations_v2 r ON e.regularization_id = r.id
            WHERE r.created_by = auth.uid()
        )
    )
    WITH CHECK (
        expense_id IN (
            SELECT e.id 
            FROM charge_expenses e
            JOIN charge_regularizations_v2 r ON e.regularization_id = r.id
            WHERE r.created_by = auth.uid()
        )
    );

-- Locataires peuvent voir leurs justificatifs
CREATE POLICY "Tenants can view their supporting documents" ON public.charge_supporting_documents
    FOR SELECT
    TO authenticated
    USING (
        expense_id IN (
            SELECT e.id 
            FROM charge_expenses e
            JOIN charge_regularizations_v2 r ON e.regularization_id = r.id
            JOIN leases l ON r.lease_id = l.id
            WHERE l.tenant_id = auth.uid()
        )
    );

-- Service role peut tout faire
CREATE POLICY "Service role can manage all supporting documents" ON public.charge_supporting_documents
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 8. VÉRIFIER LES POLITIQUES CRÉÉES
SELECT 
    'Politiques RLS créées' as type,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Condition: ' || qual
        ELSE 'Pas de condition'
    END as condition
FROM pg_policies 
WHERE tablename IN ('leases', 'notifications', 'charge_regularizations_v2', 'lease_revisions', 'charge_expenses', 'charge_supporting_documents')
ORDER BY tablename, policyname;

-- 9. VÉRIFIER L'ÉTAT RLS DES TABLES
SELECT 
    'État RLS des tables' as type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('leases', 'notifications', 'charge_regularizations_v2', 'lease_revisions', 'charge_expenses', 'charge_supporting_documents')
ORDER BY tablename;

-- Script de correction complet pour l'accès tenant et les notifications
-- À exécuter dans Supabase SQL Editor

-- 1. CORRIGER L'ACCÈS À LA TABLE LEASES POUR LES LOCATAIRES
-- Vérifier si RLS est activé sur leases
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leases') THEN
        ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
        
        -- Supprimer les politiques existantes si elles existent
        DROP POLICY IF EXISTS "Tenants can view their leases" ON public.leases;
        DROP POLICY IF EXISTS "Owners can manage their leases" ON public.leases;
        
        -- Créer la politique pour les locataires
        CREATE POLICY "Tenants can view their leases" ON public.leases
            FOR SELECT USING (tenant_id = auth.uid());
            
        -- Créer la politique pour les propriétaires
        CREATE POLICY "Owners can manage their leases" ON public.leases
            FOR ALL USING (
                property_id IN (
                    SELECT id FROM properties WHERE owner_id = auth.uid()
                )
            );
    END IF;
END $$;

-- 2. CORRIGER LES POLITIQUES RLS POUR LES NOTIFICATIONS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        
        -- Supprimer les politiques existantes
        DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Tenants can view their notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Tenants can update their notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Owners can create notifications for their tenants" ON public.notifications;
        
        -- Créer les nouvelles politiques
        CREATE POLICY "Tenants can view their notifications" ON public.notifications
            FOR SELECT USING (user_id = auth.uid());
            
        CREATE POLICY "Tenants can update their notifications" ON public.notifications
            FOR UPDATE USING (user_id = auth.uid());
            
        CREATE POLICY "Owners can create notifications for their tenants" ON public.notifications
            FOR INSERT WITH CHECK (
                user_id IN (
                    SELECT l.tenant_id 
                    FROM leases l 
                    JOIN properties p ON l.property_id = p.id 
                    WHERE p.owner_id = auth.uid()
                )
            );
    END IF;
END $$;

-- 3. CORRIGER LES POLITIQUES RLS POUR CHARGE_REGULARIZATIONS_V2
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'charge_regularizations_v2') THEN
        ALTER TABLE public.charge_regularizations_v2 ENABLE ROW LEVEL SECURITY;
        
        -- Supprimer les politiques existantes
        DROP POLICY IF EXISTS "Propriétaires peuvent voir leurs régularisations" ON public.charge_regularizations_v2;
        DROP POLICY IF EXISTS "Locataires peuvent voir leurs régularisations" ON public.charge_regularizations_v2;
        
        -- Créer les nouvelles politiques
        CREATE POLICY "Owners can manage their regularizations" ON public.charge_regularizations_v2
            FOR ALL USING (created_by = auth.uid());
            
        CREATE POLICY "Tenants can view their regularizations" ON public.charge_regularizations_v2
            FOR SELECT USING (
                lease_id IN (
                    SELECT id FROM leases WHERE tenant_id = auth.uid()
                )
            );
    END IF;
END $$;

-- 4. CORRIGER LES POLITIQUES RLS POUR LEASE_REVISIONS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lease_revisions') THEN
        ALTER TABLE public.lease_revisions ENABLE ROW LEVEL SECURITY;
        
        -- Supprimer les politiques existantes
        DROP POLICY IF EXISTS "Propriétaires peuvent gérer leurs révisions de loyer" ON public.lease_revisions;
        DROP POLICY IF EXISTS "Locataires peuvent voir leurs révisions de loyer" ON public.lease_revisions;
        
        -- Créer les nouvelles politiques
        CREATE POLICY "Owners can manage their rent revisions" ON public.lease_revisions
            FOR ALL USING (
                property_id IN (
                    SELECT id FROM properties WHERE owner_id = auth.uid()
                )
            );
            
        CREATE POLICY "Tenants can view their rent revisions" ON public.lease_revisions
            FOR SELECT USING (
                lease_id IN (
                    SELECT id FROM leases WHERE tenant_id = auth.uid()
                )
            );
    END IF;
END $$;

-- 5. CORRIGER LES POLITIQUES RLS POUR CHARGE_EXPENSES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'charge_expenses') THEN
        ALTER TABLE public.charge_expenses ENABLE ROW LEVEL SECURITY;
        
        -- Supprimer les politiques existantes
        DROP POLICY IF EXISTS "Propriétaires peuvent voir leurs dépenses" ON public.charge_expenses;
        DROP POLICY IF EXISTS "Locataires peuvent voir leurs dépenses" ON public.charge_expenses;
        
        -- Créer les nouvelles politiques
        CREATE POLICY "Owners can manage their expenses" ON public.charge_expenses
            FOR ALL USING (
                regularization_id IN (
                    SELECT id FROM charge_regularizations_v2 WHERE created_by = auth.uid()
                )
            );
            
        CREATE POLICY "Tenants can view their expenses" ON public.charge_expenses
            FOR SELECT USING (
                regularization_id IN (
                    SELECT r.id FROM charge_regularizations_v2 r
                    JOIN leases l ON r.lease_id = l.id
                    WHERE l.tenant_id = auth.uid()
                )
            );
    END IF;
END $$;

-- 6. CORRIGER LES POLITIQUES RLS POUR CHARGE_SUPPORTING_DOCUMENTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'charge_supporting_documents') THEN
        ALTER TABLE public.charge_supporting_documents ENABLE ROW LEVEL SECURITY;
        
        -- Supprimer les politiques existantes
        DROP POLICY IF EXISTS "Propriétaires peuvent voir leurs justificatifs" ON public.charge_supporting_documents;
        DROP POLICY IF EXISTS "Locataires peuvent voir leurs justificatifs" ON public.charge_supporting_documents;
        
        -- Créer les nouvelles politiques
        CREATE POLICY "Owners can manage their supporting documents" ON public.charge_supporting_documents
            FOR ALL USING (
                expense_id IN (
                    SELECT e.id FROM charge_expenses e
                    JOIN charge_regularizations_v2 r ON e.regularization_id = r.id
                    WHERE r.created_by = auth.uid()
                )
            );
            
        CREATE POLICY "Tenants can view their supporting documents" ON public.charge_supporting_documents
            FOR SELECT USING (
                expense_id IN (
                    SELECT e.id FROM charge_expenses e
                    JOIN charge_regularizations_v2 r ON e.regularization_id = r.id
                    JOIN leases l ON r.lease_id = l.id
                    WHERE l.tenant_id = auth.uid()
                )
            );
    END IF;
END $$;

-- 7. VÉRIFIER QUE LES TABLES EXISTENT ET SONT ACCESSIBLES
SELECT 
    'Vérification des tables' as type,
    table_name,
    CASE 
        WHEN table_name = 'leases' THEN 'Table principale des baux'
        WHEN table_name = 'notifications' THEN 'Table des notifications'
        WHEN table_name = 'charge_regularizations_v2' THEN 'Table des régularisations v2'
        WHEN table_name = 'lease_revisions' THEN 'Table des révisions de loyer'
        WHEN table_name = 'charge_expenses' THEN 'Table des dépenses'
        WHEN table_name = 'charge_supporting_documents' THEN 'Table des justificatifs'
        ELSE 'Autre table'
    END as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('leases', 'notifications', 'charge_regularizations_v2', 'lease_revisions', 'charge_expenses', 'charge_supporting_documents')
ORDER BY table_name;

-- 8. AFFICHER LES POLITIQUES RLS CRÉÉES
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

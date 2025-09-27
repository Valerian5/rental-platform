-- Script pour corriger les politiques RLS pour les documents des locataires

-- Ajouter les politiques RLS manquantes pour les notifications
-- (Les locataires doivent pouvoir voir les notifications qui leur sont destinées)

-- Vérifier si la politique existe déjà
DO $$
BEGIN
    -- Politique pour que les locataires puissent voir leurs notifications
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Tenants can view their notifications'
    ) THEN
        CREATE POLICY "Tenants can view their notifications" ON public.notifications
            FOR SELECT USING (user_id = auth.uid());
    END IF;

    -- Politique pour que les locataires puissent marquer leurs notifications comme lues
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Tenants can update their notifications'
    ) THEN
        CREATE POLICY "Tenants can update their notifications" ON public.notifications
            FOR UPDATE USING (user_id = auth.uid());
    END IF;

    -- Politique pour que les propriétaires puissent créer des notifications pour leurs locataires
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Owners can create notifications for their tenants'
    ) THEN
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

-- Vérifier que les tables existent et ont RLS activé
DO $$
BEGIN
    -- S'assurer que RLS est activé sur les tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'charge_regularizations_v2') THEN
        ALTER TABLE public.charge_regularizations_v2 ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lease_revisions') THEN
        ALTER TABLE public.lease_revisions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Afficher les politiques existantes pour vérification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('notifications', 'charge_regularizations_v2', 'lease_revisions')
ORDER BY tablename, policyname;

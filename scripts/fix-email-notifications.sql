-- Script pour corriger les notifications et emails
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier que la table notifications existe et a les bonnes colonnes
DO $$
BEGIN
    -- Vérifier si la table existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Créer la table si elle n'existe pas
        CREATE TABLE public.notifications (
            id UUID NOT NULL DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            data JSONB DEFAULT '{}',
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            read_at TIMESTAMP WITH TIME ZONE,
            
            CONSTRAINT notifications_pkey PRIMARY KEY (id),
            CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        -- Créer les index
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
        CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
        
        RAISE NOTICE 'Table notifications créée';
    ELSE
        RAISE NOTICE 'Table notifications existe déjà';
    END IF;
END $$;

-- 2. Activer RLS sur la table notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les politiques existantes
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Tenants can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Tenants can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Owners can create notifications for their tenants" ON public.notifications;

-- 4. Créer les nouvelles politiques RLS
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

-- 5. Vérifier les données existantes
SELECT 
    'Vérification des données' as type,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN type = 'charge_regularization' THEN 1 END) as charge_regularizations,
    COUNT(CASE WHEN type = 'rent_revision' THEN 1 END) as rent_revisions,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications
FROM public.notifications;

-- 6. Afficher les politiques créées
SELECT 
    'Politiques notifications' as type,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

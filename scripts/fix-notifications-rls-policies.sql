-- Script pour corriger les politiques RLS des notifications
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer toutes les politiques existantes sur notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Tenants can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Tenants can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Owners can create notifications for their tenants" ON public.notifications;
DROP POLICY IF EXISTS "Service role can manage all notifications" ON public.notifications;

-- 2. Créer les politiques RLS correctes pour notifications
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

-- Service role peut tout faire (pour les APIs backend)
CREATE POLICY "Service role can manage all notifications" ON public.notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 3. Vérifier les politiques créées
SELECT 
    'Politiques notifications créées' as type,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- 4. Tester l'insertion d'une notification de test avec service role
-- (Cette requête devrait fonctionner car elle utilise service_role)
INSERT INTO public.notifications (
    user_id,
    type,
    title,
    content,
    action_url,
    read
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- UUID de test
    'test',
    'Test notification service role',
    'Ceci est une notification de test créée avec service role',
    'https://example.com',
    false
) RETURNING id, created_at;

-- 5. Nettoyer la notification de test
DELETE FROM public.notifications WHERE type = 'test';

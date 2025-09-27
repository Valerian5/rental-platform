-- Script de test pour les notifications
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure de la table notifications
SELECT 
    'Structure table notifications' as type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les données existantes
SELECT 
    'Données notifications' as type,
    COUNT(*) as total,
    COUNT(CASE WHEN type = 'charge_regularization' THEN 1 END) as charge_regularizations,
    COUNT(CASE WHEN type = 'rent_revision' THEN 1 END) as rent_revisions,
    COUNT(CASE WHEN read = false THEN 1 END) as unread,
    COUNT(CASE WHEN read = true THEN 1 END) as read
FROM public.notifications;

-- 3. Vérifier les notifications récentes
SELECT 
    'Notifications récentes' as type,
    id,
    user_id,
    type,
    title,
    read,
    created_at
FROM public.notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Vérifier les politiques RLS sur notifications
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

-- 5. Tester l'accès aux notifications (nécessite un utilisateur connecté)
SELECT 
    'Test accès notifications' as type,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_notifications
FROM public.notifications;

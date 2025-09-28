-- Script de test pour l'API documents tenant
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les notifications de type charge_regularization
SELECT 
    'Notifications charge_regularization' as type,
    COUNT(*) as total,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_notifications
FROM notifications 
WHERE type = 'charge_regularization';

-- 2. Vérifier les notifications de type rent_revision
SELECT 
    'Notifications rent_revision' as type,
    COUNT(*) as total,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_notifications
FROM notifications 
WHERE type = 'rent_revision';

-- 3. Vérifier les données des notifications
SELECT 
    'Données notifications' as type,
    id,
    user_id,
    type,
    title,
    data,
    created_at
FROM notifications 
WHERE type IN ('charge_regularization', 'rent_revision')
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

-- 5. Tester l'accès aux notifications avec un utilisateur spécifique
-- (Remplacer 'USER_ID_HERE' par un ID d'utilisateur réel)
SELECT 
    'Test accès notifications utilisateur' as type,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN user_id = 'USER_ID_HERE' THEN 1 END) as user_notifications
FROM notifications;

-- 6. Vérifier la structure de la table notifications
SELECT 
    'Structure notifications' as type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Script de test complet pour le workflow
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

-- 4. Vérifier les politiques RLS sur toutes les tables
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

-- 5. Vérifier l'état RLS des tables
SELECT 
    'État RLS des tables' as type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('leases', 'notifications', 'charge_regularizations_v2', 'lease_revisions', 'charge_expenses', 'charge_supporting_documents')
ORDER BY tablename;

-- 6. Vérifier les utilisateurs existants
SELECT 
    'Utilisateurs existants' as type,
    COUNT(*) as total_users,
    MIN(id::text) as first_user_id,
    MAX(id::text) as last_user_id
FROM users;

-- 7. Tester l'insertion d'une notification avec service role
-- (Simuler ce que fait l'API backend)
DO $$
DECLARE
    test_user_id UUID;
    notification_id UUID;
BEGIN
    -- Récupérer un utilisateur existant pour le test
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Utilisateur de test trouvé: %', test_user_id;
        
        -- Insérer une notification de test
        INSERT INTO notifications (
            user_id,
            type,
            title,
            content,
            action_url,
            read
        ) VALUES (
            test_user_id,
            'test_workflow',
            'Test workflow complet',
            'Ceci est un test du workflow complet',
            'https://example.com/test',
            false
        ) RETURNING id INTO notification_id;
        
        RAISE NOTICE 'Notification de test créée avec ID: %', notification_id;
        
        -- Vérifier que la notification a été créée
        IF notification_id IS NOT NULL THEN
            RAISE NOTICE 'Test d''insertion notification: SUCCÈS';
        ELSE
            RAISE NOTICE 'Test d''insertion notification: ÉCHEC';
        END IF;
        
        -- Nettoyer
        DELETE FROM notifications WHERE id = notification_id;
        RAISE NOTICE 'Notification de test supprimée';
    ELSE
        RAISE NOTICE 'Aucun utilisateur trouvé pour le test';
    END IF;
END $$;

-- 7. Vérifier les données de test existantes
SELECT 
    'Données de test' as type,
    'leases' as table_name,
    COUNT(*) as count
FROM leases
UNION ALL
SELECT 
    'Données de test' as type,
    'notifications' as table_name,
    COUNT(*) as count
FROM notifications
UNION ALL
SELECT 
    'Données de test' as type,
    'charge_regularizations_v2' as table_name,
    COUNT(*) as count
FROM charge_regularizations_v2
UNION ALL
SELECT 
    'Données de test' as type,
    'lease_revisions' as table_name,
    COUNT(*) as count
FROM lease_revisions;

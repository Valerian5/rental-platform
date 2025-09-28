-- Script de test pour vérifier l'envoi de notifications
-- Teste l'insertion de notifications avec service_role

-- 1. Vérifier les utilisateurs disponibles
SELECT 
  'Utilisateurs disponibles' as test_type,
  COUNT(*) as count,
  MIN(id::text) as first_user_id,
  MAX(id::text) as last_user_id
FROM users;

-- 2. Vérifier les baux disponibles
SELECT 
  'Baux disponibles' as test_type,
  COUNT(*) as count,
  MIN(id::text) as first_lease_id,
  MAX(id::text) as last_lease_id
FROM leases;

-- 3. Vérifier les régularisations disponibles
SELECT 
  'Régularisations disponibles' as test_type,
  COUNT(*) as count,
  MIN(id::text) as first_regularization_id,
  MAX(id::text) as last_regularization_id
FROM charge_regularizations_v2;

-- 4. Tester l'insertion d'une notification de test
-- (utilise un utilisateur existant)
INSERT INTO notifications (
  user_id,
  type,
  title,
  content,
  action_url,
  read
) 
SELECT 
  u.id,
  'charge_regularization',
  'Test régularisation charges 2024',
  'Ceci est un test de notification pour la régularisation des charges.',
  'https://example.com/test.pdf?data={"test": true}',
  false
FROM users u 
WHERE u.user_type = 'tenant'
LIMIT 1
RETURNING 
  'Notification de test créée' as result,
  id,
  user_id,
  type,
  title,
  created_at;

-- 5. Vérifier les notifications créées
SELECT 
  'Notifications créées' as test_type,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN read = false THEN 1 END) as unread_notifications,
  COUNT(CASE WHEN type = 'charge_regularization' THEN 1 END) as charge_regularization_notifications
FROM notifications;

-- 6. Afficher les dernières notifications
SELECT 
  'Dernières notifications' as test_type,
  id,
  user_id,
  type,
  title,
  read,
  created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Vérifier les politiques RLS sur notifications
SELECT 
  'Politiques RLS notifications' as test_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

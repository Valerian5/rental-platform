-- Script de test pour vérifier que les fonctions d'email fonctionnent
-- À exécuter dans Supabase SQL Editor après avoir exécuté le script alternatif

-- 1. Tester la fonction de bienvenue
SELECT public.trigger_welcome_email(
  'test-welcome@example.com',
  'tenant',
  gen_random_uuid(),
  'Test',
  'User'
);

-- 2. Tester la fonction de vérification
SELECT public.trigger_verification_email(
  'test-verify@example.com',
  'owner',
  gen_random_uuid()
);

-- 3. Tester la fonction de changement d'email
SELECT public.trigger_email_change(
  'new-email@example.com',
  'old-email@example.com',
  gen_random_uuid(),
  'Test'
);

-- 4. Tester la fonction de réinitialisation
SELECT public.trigger_password_reset(
  'test-reset@example.com',
  gen_random_uuid(),
  'Test'
);

-- 5. Vérifier que les événements ont été loggés
SELECT 
  event_type,
  user_email,
  created_at
FROM public.email_events
ORDER BY created_at DESC
LIMIT 10;

-- 6. Vérifier le résumé des événements
SELECT * FROM public.email_events_summary;

-- 7. Tester les fonctions helper
SELECT public.user_exists('test-welcome@example.com') as user_exists;
SELECT public.get_user_info(gen_random_uuid()) as user_info;

-- 8. Tester la fonction de nettoyage
SELECT public.cleanup_old_email_events(0) as deleted_count;

-- 9. Vérifier que tout fonctionne
DO $$
DECLARE
  event_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Compter les événements créés
  SELECT COUNT(*) INTO event_count
  FROM public.email_events
  WHERE user_email LIKE 'test-%@example.com';
  
  -- Compter les fonctions créées
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name LIKE 'trigger_%';
  
  IF event_count < 4 THEN
    RAISE EXCEPTION 'Événements manquants: % trouvés sur 4', event_count;
  END IF;
  
  IF function_count < 4 THEN
    RAISE EXCEPTION 'Fonctions manquantes: % trouvées sur 4', function_count;
  END IF;
  
  RAISE NOTICE '✅ Test des fonctions d''email réussi';
  RAISE NOTICE '📊 Événements créés: %', event_count;
  RAISE NOTICE '📊 Fonctions disponibles: %', function_count;
END $$;

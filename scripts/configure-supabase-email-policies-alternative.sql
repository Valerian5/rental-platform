-- Script alternatif pour configurer les politiques d'email Supabase
-- Ce script utilise les fonctionnalités disponibles sans permissions spéciales

-- 1. Créer des fonctions helper dans le schéma public
-- (Ces fonctions peuvent être créées avec les permissions standard)

-- Fonction pour vérifier si un utilisateur existe
CREATE OR REPLACE FUNCTION public.user_exists(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les informations d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_info(user_id uuid)
RETURNS json AS $$
DECLARE
  user_data json;
BEGIN
  SELECT json_build_object(
    'id', id,
    'email', email,
    'first_name', raw_user_meta_data->>'first_name',
    'last_name', raw_user_meta_data->>'last_name',
    'user_type', raw_user_meta_data->>'user_type',
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO user_data
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour logger les événements d'email
CREATE OR REPLACE FUNCTION public.log_email_event(
  event_type text,
  user_email text,
  user_id uuid DEFAULT NULL,
  metadata jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.email_events (
    event_type,
    user_email,
    user_id,
    metadata,
    created_at
  ) VALUES (
    event_type,
    user_email,
    user_id,
    metadata,
    NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorer les erreurs de log
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Créer une table pour logger les événements d'email
CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  user_email text NOT NULL,
  user_id uuid,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_email_events_type ON public.email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_email ON public.email_events(user_email);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON public.email_events(created_at);

-- 3. Créer des politiques RLS pour la table email_events
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion des événements
CREATE POLICY "Allow email event logging" ON public.email_events
FOR INSERT WITH CHECK (true);

-- Politique pour permettre la lecture des événements (admin seulement)
CREATE POLICY "Admins can view email events" ON public.email_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'user_type' = 'admin'
  )
);

-- 4. Créer des fonctions pour gérer les emails personnalisés

-- Fonction pour déclencher l'envoi d'email de bienvenue
CREATE OR REPLACE FUNCTION public.trigger_welcome_email(
  user_email text,
  user_type text,
  user_id uuid,
  first_name text DEFAULT NULL,
  last_name text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Logger l'événement
  PERFORM public.log_email_event(
    'welcome_email',
    user_email,
    user_id,
    jsonb_build_object(
      'user_type', user_type,
      'first_name', first_name,
      'last_name', last_name
    )
  );
  
  -- Notifier l'application via webhook
  PERFORM pg_notify('welcome_email', json_build_object(
    'user_id', user_id,
    'email', user_email,
    'user_type', user_type,
    'first_name', first_name,
    'last_name', last_name
  )::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour déclencher l'envoi d'email de vérification
CREATE OR REPLACE FUNCTION public.trigger_verification_email(
  user_email text,
  user_type text,
  user_id uuid
)
RETURNS void AS $$
BEGIN
  -- Logger l'événement
  PERFORM public.log_email_event(
    'verification_email',
    user_email,
    user_id,
    jsonb_build_object('user_type', user_type)
  );
  
  -- Notifier l'application via webhook
  PERFORM pg_notify('verification_email', json_build_object(
    'user_id', user_id,
    'email', user_email,
    'user_type', user_type
  )::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour déclencher l'envoi d'email de changement
CREATE OR REPLACE FUNCTION public.trigger_email_change(
  user_email text,
  old_email text,
  user_id uuid,
  first_name text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Logger l'événement
  PERFORM public.log_email_event(
    'email_change',
    user_email,
    user_id,
    jsonb_build_object(
      'old_email', old_email,
      'first_name', first_name
    )
  );
  
  -- Notifier l'application via webhook
  PERFORM pg_notify('email_change', json_build_object(
    'user_id', user_id,
    'email', user_email,
    'old_email', old_email,
    'first_name', first_name
  )::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour déclencher l'envoi d'email de réinitialisation
CREATE OR REPLACE FUNCTION public.trigger_password_reset(
  user_email text,
  user_id uuid,
  first_name text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Logger l'événement
  PERFORM public.log_email_event(
    'password_reset',
    user_email,
    user_id,
    jsonb_build_object('first_name', first_name)
  );
  
  -- Notifier l'application via webhook
  PERFORM pg_notify('password_reset', json_build_object(
    'user_id', user_id,
    'email', user_email,
    'first_name', first_name
  )::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Créer une vue pour surveiller les événements d'email
CREATE OR REPLACE VIEW public.email_events_summary AS
SELECT 
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_email) as unique_users,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event
FROM public.email_events
GROUP BY event_type
ORDER BY last_event DESC;

-- 6. Créer une fonction pour nettoyer les anciens événements
CREATE OR REPLACE FUNCTION public.cleanup_old_email_events(days_to_keep integer DEFAULT 30)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.email_events
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Vérifier que tout est configuré correctement
DO $$
DECLARE
  function_count INTEGER;
  table_exists BOOLEAN;
BEGIN
  -- Vérifier les fonctions
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name LIKE 'trigger_%' OR routine_name LIKE 'log_%';
  
  -- Vérifier la table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'email_events' 
    AND table_schema = 'public'
  ) INTO table_exists;
  
  IF function_count < 4 THEN
    RAISE EXCEPTION 'Fonctions manquantes: % trouvées sur 4', function_count;
  END IF;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION 'Table email_events manquante';
  END IF;
  
  RAISE NOTICE '✅ Configuration alternative des politiques d''email terminée';
  RAISE NOTICE '📊 Fonctions créées: %', function_count;
  RAISE NOTICE '📊 Table email_events: %', CASE WHEN table_exists THEN 'Créée' ELSE 'Manquante' END;
END $$;

-- 8. Instructions pour l'utilisation
DO $$
BEGIN
  RAISE NOTICE '📋 Instructions d''utilisation:';
  RAISE NOTICE '1. Désactiver les emails automatiques dans Authentication > Settings';
  RAISE NOTICE '2. Configurer les webhooks dans Database > Webhooks';
  RAISE NOTICE '3. Utiliser les fonctions trigger_* pour déclencher les emails';
  RAISE NOTICE '4. Surveiller les événements avec: SELECT * FROM email_events_summary;';
  RAISE NOTICE '5. Nettoyer les anciens événements: SELECT cleanup_old_email_events(30);';
END $$;

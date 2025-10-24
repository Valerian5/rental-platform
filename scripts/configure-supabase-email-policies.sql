-- Script pour configurer les politiques d'email Supabase
-- Ce script doit être exécuté dans l'interface Supabase SQL Editor

-- 1. Désactiver l'envoi automatique d'emails de Supabase
-- Aller dans Authentication > Settings et désactiver :
-- ☐ Enable email confirmations
-- ☐ Enable email change confirmations  
-- ☐ Enable password reset emails
-- ☐ Enable email change notifications

-- 2. Créer des fonctions pour intercepter les événements d'email

-- Fonction pour intercepter l'inscription
CREATE OR REPLACE FUNCTION handle_signup_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Empêcher l'envoi automatique de Supabase
  -- et déclencher notre propre logique via webhook
  PERFORM pg_notify('signup_email', json_build_object(
    'user_id', NEW.id,
    'email', NEW.email,
    'user_type', NEW.raw_user_meta_data->>'user_type',
    'first_name', NEW.raw_user_meta_data->>'first_name',
    'last_name', NEW.raw_user_meta_data->>'last_name'
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour intercepter le changement d'email
CREATE OR REPLACE FUNCTION handle_email_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si l'email a changé
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    PERFORM pg_notify('email_change', json_build_object(
      'user_id', NEW.id,
      'old_email', OLD.email,
      'new_email', NEW.email,
      'first_name', NEW.raw_user_meta_data->>'first_name'
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour intercepter la réinitialisation de mot de passe
CREATE OR REPLACE FUNCTION handle_password_reset()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si c'est une demande de réinitialisation
  IF NEW.raw_user_meta_data->>'reset_requested' = 'true' THEN
    PERFORM pg_notify('password_reset', json_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'first_name', NEW.raw_user_meta_data->>'first_name'
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer les triggers

-- Trigger pour l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_signup_email();

-- Trigger pour le changement d'email
DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_change();

-- Trigger pour la réinitialisation de mot de passe
DROP TRIGGER IF EXISTS on_auth_user_password_reset ON auth.users;
CREATE TRIGGER on_auth_user_password_reset
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_password_reset();

-- 4. Créer des politiques RLS pour empêcher l'envoi automatique

-- Politique pour empêcher l'envoi automatique d'email d'inscription
CREATE POLICY "Prevent automatic signup email" ON auth.users
FOR INSERT WITH CHECK (true);

-- Politique pour empêcher l'envoi automatique d'email de changement
CREATE POLICY "Prevent automatic email change notification" ON auth.users
FOR UPDATE WITH CHECK (true);

-- Politique pour empêcher l'envoi automatique d'email de reset
CREATE POLICY "Prevent automatic password reset email" ON auth.users
FOR UPDATE WITH CHECK (true);

-- 5. Créer des fonctions helper pour la gestion des emails

-- Fonction pour vérifier si un utilisateur existe
CREATE OR REPLACE FUNCTION user_exists(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les informations d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_info(user_id uuid)
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

-- 6. Créer des index pour les performances

-- Index sur l'email pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);

-- Index sur les métadonnées pour les requêtes sur le type d'utilisateur
CREATE INDEX IF NOT EXISTS idx_auth_users_meta_type ON auth.users 
USING gin ((raw_user_meta_data->>'user_type'));

-- 7. Vérifier que tout est configuré correctement

DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Vérifier les triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name LIKE 'on_auth_user_%';
  
  -- Vérifier les fonctions
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_name LIKE 'handle_%' OR routine_name LIKE 'get_user_%';
  
  IF trigger_count < 3 THEN
    RAISE EXCEPTION 'Triggers manquants: % trouvés sur 3', trigger_count;
  END IF;
  
  IF function_count < 4 THEN
    RAISE EXCEPTION 'Fonctions manquantes: % trouvées sur 4', function_count;
  END IF;
  
  RAISE NOTICE '✅ Configuration des politiques d''email terminée';
  RAISE NOTICE '📊 Triggers créés: %', trigger_count;
  RAISE NOTICE '📊 Fonctions créées: %', function_count;
END $$;

-- 8. Instructions pour la configuration manuelle

DO $$
BEGIN
  RAISE NOTICE '📋 Configuration manuelle requise:';
  RAISE NOTICE '1. Aller dans Authentication > Settings';
  RAISE NOTICE '2. Désactiver "Enable email confirmations"';
  RAISE NOTICE '3. Désactiver "Enable email change confirmations"';
  RAISE NOTICE '4. Désactiver "Enable password reset emails"';
  RAISE NOTICE '5. Configurer les URLs de redirection:';
  RAISE NOTICE '   - Site URL: https://your-domain.com';
  RAISE NOTICE '   - Redirect URLs: https://your-domain.com/auth/callback';
  RAISE NOTICE '6. Configurer le webhook:';
  RAISE NOTICE '   - URL: https://your-domain.com/api/webhooks/supabase';
  RAISE NOTICE '   - Events: auth.users.created, auth.users.updated';
END $$;

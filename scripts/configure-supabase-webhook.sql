-- Configuration du webhook Supabase pour les emails personnalisés
-- Ce script configure les fonctions et triggers pour intercepter les emails Supabase

-- 1. Créer une table pour les événements d'email
CREATE TABLE IF NOT EXISTS email_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_id UUID,
    data JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_email ON email_events(user_email);
CREATE INDEX IF NOT EXISTS idx_email_events_processed ON email_events(processed);

-- 3. Fonction pour déclencher l'envoi d'email de bienvenue
CREATE OR REPLACE FUNCTION trigger_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO email_events (event_type, user_email, user_id, data)
    VALUES (
        'welcome',
        NEW.email,
        NEW.id,
        jsonb_build_object(
            'first_name', COALESCE(NEW.raw_user_meta_data->>'first_name', 'Utilisateur'),
            'last_name', COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            'user_type', COALESCE(NEW.raw_user_meta_data->>'user_type', 'tenant')
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Fonction pour déclencher l'envoi d'email de vérification
CREATE OR REPLACE FUNCTION trigger_verification_email()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO email_events (event_type, user_email, user_id, data)
    VALUES (
        'verification',
        NEW.email,
        NEW.id,
        jsonb_build_object(
            'first_name', COALESCE(NEW.raw_user_meta_data->>'first_name', 'Utilisateur'),
            'user_type', COALESCE(NEW.raw_user_meta_data->>'user_type', 'tenant')
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction pour déclencher l'envoi d'email de réinitialisation
CREATE OR REPLACE FUNCTION trigger_password_reset()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO email_events (event_type, user_email, user_id, data)
    VALUES (
        'password_reset',
        NEW.email,
        NEW.id,
        jsonb_build_object(
            'first_name', COALESCE(NEW.raw_user_meta_data->>'first_name', 'Utilisateur')
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Fonction pour déclencher l'envoi d'email de changement d'email
CREATE OR REPLACE FUNCTION trigger_email_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier si l'email a changé
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        INSERT INTO email_events (event_type, user_email, user_id, data)
        VALUES (
            'email_change',
            NEW.email,
            NEW.id,
            jsonb_build_object(
                'first_name', COALESCE(NEW.raw_user_meta_data->>'first_name', 'Utilisateur'),
                'old_email', OLD.email
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer les triggers sur la table auth.users
-- ATTENTION: Ces triggers nécessitent des permissions spéciales
-- Ils doivent être créés par un utilisateur avec les droits appropriés

-- Trigger pour l'inscription (INSERT)
-- DROP TRIGGER IF EXISTS trigger_welcome_email_trigger ON auth.users;
-- CREATE TRIGGER trigger_welcome_email_trigger
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION trigger_welcome_email();

-- Trigger pour la vérification d'email (UPDATE)
-- DROP TRIGGER IF EXISTS trigger_verification_email_trigger ON auth.users;
-- CREATE TRIGGER trigger_verification_email_trigger
--     AFTER UPDATE ON auth.users
--     FOR EACH ROW
--     WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
--     EXECUTE FUNCTION trigger_verification_email();

-- Trigger pour la réinitialisation de mot de passe
-- DROP TRIGGER IF EXISTS trigger_password_reset_trigger ON auth.users;
-- CREATE TRIGGER trigger_password_reset_trigger
--     AFTER UPDATE ON auth.users
--     FOR EACH ROW
--     WHEN (OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password)
--     EXECUTE FUNCTION trigger_password_reset();

-- Trigger pour le changement d'email
-- DROP TRIGGER IF EXISTS trigger_email_change_trigger ON auth.users;
-- CREATE TRIGGER trigger_email_change_trigger
--     AFTER UPDATE ON auth.users
--     FOR EACH ROW
--     WHEN (OLD.email IS DISTINCT FROM NEW.email)
--     EXECUTE FUNCTION trigger_email_change();

-- 8. Fonction pour traiter les événements d'email
CREATE OR REPLACE FUNCTION process_email_events()
RETURNS void AS $$
DECLARE
    event_record RECORD;
BEGIN
    -- Traiter les événements non traités
    FOR event_record IN 
        SELECT * FROM email_events 
        WHERE processed = FALSE 
        ORDER BY created_at ASC 
        LIMIT 10
    LOOP
        -- Marquer comme traité
        UPDATE email_events 
        SET processed = TRUE, processed_at = NOW()
        WHERE id = event_record.id;
        
        -- Log de l'événement
        RAISE NOTICE 'Email event processed: % for %', 
            event_record.event_type, event_record.user_email;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. Créer un job pour traiter les événements (optionnel)
-- Cette fonction peut être appelée périodiquement
CREATE OR REPLACE FUNCTION schedule_email_processing()
RETURNS void AS $$
BEGIN
    PERFORM process_email_events();
END;
$$ LANGUAGE plpgsql;

-- 10. Configuration du webhook dans Supabase Dashboard
-- Aller dans Supabase Dashboard > Database > Webhooks
-- Créer un nouveau webhook avec les paramètres suivants :

-- URL: https://votre-domaine.com/api/webhooks/supabase
-- Events: INSERT, UPDATE sur la table auth.users
-- HTTP Method: POST
-- HTTP Headers: 
--   Content-Type: application/json
--   x-supabase-signature: [signature]

-- 11. Variables d'environnement requises
-- Assurez-vous que ces variables sont configurées :

/*
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
*/

-- 12. Test de la configuration
-- Pour tester le webhook :

-- 1. Créer un utilisateur de test
-- 2. Vérifier que l'événement est créé dans email_events
-- 3. Vérifier que l'email est envoyé
-- 4. Vérifier les logs du webhook

-- 13. Monitoring
-- Pour surveiller les événements d'email :

SELECT 
    event_type,
    COUNT(*) as count,
    COUNT(CASE WHEN processed = TRUE THEN 1 END) as processed_count,
    COUNT(CASE WHEN processed = FALSE THEN 1 END) as pending_count
FROM email_events 
GROUP BY event_type
ORDER BY event_type;

-- 14. Nettoyage (optionnel)
-- Pour nettoyer les anciens événements :

-- DELETE FROM email_events 
-- WHERE created_at < NOW() - INTERVAL '30 days'
-- AND processed = TRUE;

-- 15. Dépannage
-- Si le webhook ne fonctionne pas :

-- 1. Vérifier la configuration du webhook dans Supabase Dashboard
-- 2. Vérifier les logs du webhook
-- 3. Vérifier que les triggers sont créés
-- 4. Vérifier les permissions sur la table auth.users
-- 5. Tester manuellement les fonctions

-- 16. Sécurité
-- Pour sécuriser le webhook en production :

-- 1. Implémenter la vérification de signature
-- 2. Utiliser HTTPS uniquement
-- 3. Limiter l'accès par IP si possible
-- 4. Surveiller les tentatives d'accès non autorisées

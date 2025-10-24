-- Configuration des politiques d'email pour Supabase Auth
-- Ce script configure les redirections et templates d'email pour l'authentification

-- 1. Configurer les URLs de redirection pour l'authentification
-- Ces URLs doivent être configurées dans le dashboard Supabase > Authentication > URL Configuration

-- URL de redirection après confirmation d'email
-- Site URL: https://votre-domaine.com
-- Redirect URLs: 
--   - https://votre-domaine.com/auth/callback
--   - https://votre-domaine.com/reset-password
--   - http://localhost:3000/auth/callback (pour le développement)
--   - http://localhost:3000/reset-password (pour le développement)

-- 2. Configurer les templates d'email personnalisés
-- Dans le dashboard Supabase > Authentication > Email Templates

-- Template "Reset Password" :
-- Subject: Réinitialisation de votre mot de passe
-- Body HTML:
/*
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de votre mot de passe</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Réinitialisation de votre mot de passe</h1>
        </div>
        <div class="content">
            <p>Bonjour,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte.</p>
            <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Réinitialiser mon mot de passe</a>
            </p>
            <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
            <p>Ce lien est valide pendant 24 heures.</p>
        </div>
        <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
    </div>
</body>
</html>
*/

-- 3. Configurer les paramètres d'email
-- Dans le dashboard Supabase > Authentication > Settings

-- Email confirmation: Enabled
-- Secure email change: Enabled
-- Double confirm email changes: Enabled
-- Enable email confirmations: Enabled

-- 4. Variables d'environnement requises
-- Assurez-vous que ces variables sont configurées dans votre fichier .env.local :

/*
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
*/

-- 5. Test de la configuration
-- Pour tester la réinitialisation de mot de passe :

-- 1. Aller sur /forgot-password
-- 2. Saisir un email valide
-- 3. Vérifier que l'email est reçu
-- 4. Cliquer sur le lien dans l'email
-- 5. Vérifier que la redirection fonctionne vers /reset-password
-- 6. Saisir un nouveau mot de passe
-- 7. Vérifier que la réinitialisation fonctionne

-- 6. Dépannage
-- Si les emails ne sont pas envoyés :

-- Vérifier les logs dans Supabase Dashboard > Logs > Auth
-- Vérifier que les URLs de redirection sont correctement configurées
-- Vérifier que les variables d'environnement sont correctes
-- Vérifier que le domaine est autorisé dans les settings Supabase

-- 7. Configuration SMTP personnalisée (optionnel)
-- Si vous voulez utiliser votre propre serveur SMTP :

-- Dans le dashboard Supabase > Settings > Auth > SMTP Settings
-- Configurer votre serveur SMTP personnalisé
-- Cela remplacera l'envoi d'email par défaut de Supabase

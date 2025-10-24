-- Configuration complète des templates d'email Supabase
-- Ce script configure tous les templates d'email personnalisés pour Supabase

-- 1. Template de confirmation d'email (Email Confirmation)
-- À configurer dans Supabase Dashboard > Authentication > Email Templates > Email Confirmation

-- Subject: Confirmez votre adresse email
-- Body HTML:
/*
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmez votre adresse email</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .content {
            padding: 40px 30px;
        }
        .confirm-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 16px;
            color: #1f2937;
        }
        .confirm-subtitle {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 30px;
        }
        .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: background-color 0.2s;
        }
        .cta-button:hover {
            background: #1d4ed8;
        }
        .security-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 30px 0;
        }
        .security-notice p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
        }
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 8px 0;
            color: #6b7280;
            font-size: 14px;
        }
        .welcome-box {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        .welcome-box h3 {
            margin: 0 0 16px 0;
            color: #0c4a6e;
            font-size: 18px;
        }
        .welcome-box ul {
            margin: 0;
            padding-left: 20px;
            color: #0c4a6e;
            font-size: 14px;
        }
        .welcome-box li {
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 32px;">Louer Ici</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Plateforme de gestion locative</p>
        </div>

        <div class="content">
            <h1 class="confirm-title">Confirmez votre adresse email</h1>
            <p class="confirm-subtitle">
                Bonjour,<br>
                Pour activer votre compte et accéder à toutes les fonctionnalités, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
            </p>

            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="cta-button">
                    Confirmer mon adresse email
                </a>
            </div>

            <div class="security-notice">
                <p>
                    <strong>🔒 Sécurité :</strong> Ce lien est valide pendant 24 heures. 
                    Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
                </p>
            </div>

            <div class="welcome-box">
                <h3>🎉 Bienvenue sur Louer Ici !</h3>
                <p style="margin: 0 0 16px 0; color: #0c4a6e;">
                    Une fois votre email confirmé, vous pourrez :
                </p>
                <ul>
                    <li>Accéder à votre tableau de bord personnalisé</li>
                    <li>Gérer vos propriétés et locataires</li>
                    <li>Suivre vos revenus locatifs</li>
                    <li>Générer vos documents officiels</li>
                    <li>Bénéficier de notre support client</li>
                </ul>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                <span style="word-break: break-all; color: #2563eb;">{{ .ConfirmationURL }}</span>
            </p>

            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 30px 0;">
                <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
                    <strong>💡 Astuce :</strong> Après avoir confirmé votre email, vous recevrez un email de bienvenue avec toutes les informations pour commencer.
                </p>
            </div>
        </div>

        <div class="footer">
            <p><strong>Louer Ici</strong></p>
            <p>Plateforme de gestion locative</p>
            
            <p style="font-size: 12px; color: #9ca3af;">
                Cet email a été envoyé automatiquement. 
                Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
            </p>
        </div>
    </div>
</body>
</html>
*/

-- 2. Template de changement d'email (Email Change)
-- À configurer dans Supabase Dashboard > Authentication > Email Templates > Email Change

-- Subject: Confirmez votre nouvelle adresse email
-- Body HTML:
/*
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmez votre nouvelle adresse email</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .content {
            padding: 40px 30px;
        }
        .change-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 16px;
            color: #1f2937;
        }
        .change-subtitle {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 30px;
        }
        .cta-button {
            display: inline-block;
            background: #7c3aed;
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: background-color 0.2s;
        }
        .cta-button:hover {
            background: #5b21b6;
        }
        .security-notice {
            background: #fef2f2;
            border: 1px solid #fca5a5;
            border-radius: 8px;
            padding: 16px;
            margin: 30px 0;
        }
        .security-notice p {
            margin: 0;
            color: #991b1b;
            font-size: 14px;
        }
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 8px 0;
            color: #6b7280;
            font-size: 14px;
        }
        .info-box {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        .info-box h3 {
            margin: 0 0 16px 0;
            color: #0c4a6e;
            font-size: 18px;
        }
        .info-box p {
            margin: 0 0 12px 0;
            color: #0c4a6e;
            font-size: 14px;
        }
        .email-display {
            background: #f8fafc;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 12px;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            text-align: center;
            margin: 16px 0;
        }
        .warning-box {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
        }
        .warning-box p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 32px;">Louer Ici</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Plateforme de gestion locative</p>
        </div>

        <div class="content">
            <h1 class="change-title">Confirmez votre nouvelle adresse email</h1>
            <p class="change-subtitle">
                Bonjour,<br>
                Vous avez demandé à changer votre adresse email. Pour finaliser cette modification, veuillez confirmer votre nouvelle adresse email en cliquant sur le bouton ci-dessous.
            </p>

            <div class="info-box">
                <h3>📧 Changement d'adresse email</h3>
                <p><strong>Ancienne adresse :</strong> {{ .OldEmail }}</p>
                <p><strong>Nouvelle adresse :</strong></p>
                <div class="email-display">{{ .Email }}</div>
                <p>Cliquez sur le bouton ci-dessous pour confirmer cette nouvelle adresse.</p>
            </div>

            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="cta-button">
                    Confirmer ma nouvelle adresse email
                </a>
            </div>

            <div class="security-notice">
                <p>
                    <strong>🔒 Sécurité :</strong> Ce lien est valide pendant 24 heures. 
                    Si vous n'avez pas demandé ce changement, contactez immédiatement notre support.
                </p>
            </div>

            <div class="warning-box">
                <p>
                    <strong>⚠️ Important :</strong> Une fois confirmée, votre nouvelle adresse email remplacera l'ancienne pour toutes les communications et connexions à votre compte.
                </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                <span style="word-break: break-all; color: #7c3aed;">{{ .ConfirmationURL }}</span>
            </p>

            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 30px 0;">
                <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
                    <strong>💡 Astuce :</strong> Après la confirmation, vous recevrez un email de confirmation sur votre nouvelle adresse.
                </p>
            </div>
        </div>

        <div class="footer">
            <p><strong>Louer Ici</strong></p>
            <p>Plateforme de gestion locative</p>
            
            <p style="font-size: 12px; color: #9ca3af;">
                Cet email a été envoyé à {{ .Email }}. 
                Si vous n'avez pas demandé ce changement, contactez notre support.
            </p>
        </div>
    </div>
</body>
</html>
*/

-- 3. Template de réinitialisation de mot de passe (Reset Password)
-- À configurer dans Supabase Dashboard > Authentication > Email Templates > Reset Password

-- Subject: Réinitialisation de votre mot de passe
-- Body HTML: (Voir le template dans scripts/configure-supabase-password-reset-template.sql)

-- 4. Configuration des URLs de redirection
-- Dans Supabase Dashboard > Authentication > URL Configuration

-- Site URL: https://votre-domaine.com
-- Redirect URLs:
--   - https://votre-domaine.com/auth/callback
--   - https://votre-domaine.com/reset-password
--   - http://localhost:3000/auth/callback (développement)
--   - http://localhost:3000/reset-password (développement)

-- 5. Configuration des paramètres d'authentification
-- Dans Supabase Dashboard > Authentication > Settings

-- Email confirmations: Enabled
-- Secure email change: Enabled
-- Double confirm email changes: Enabled
-- Enable email confirmations: Enabled

-- 6. Variables d'environnement requises
-- Assurez-vous que ces variables sont configurées :

/*
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
*/

-- 7. Test de la configuration
-- Pour tester tous les templates :

-- 1. Test de confirmation d'email :
--    - Créer un compte
--    - Vérifier la réception de l'email de confirmation
--    - Cliquer sur le lien
--    - Vérifier la redirection

-- 2. Test de changement d'email :
--    - Aller dans les paramètres du compte
--    - Changer l'email
--    - Vérifier la réception de l'email de confirmation
--    - Cliquer sur le lien
--    - Vérifier le changement

-- 3. Test de réinitialisation de mot de passe :
--    - Aller sur /forgot-password
--    - Saisir l'email
--    - Vérifier la réception de l'email
--    - Cliquer sur le lien
--    - Vérifier la réinitialisation

-- 8. Personnalisation des templates
-- Pour personnaliser les templates :

-- 1. Modifier les couleurs dans le CSS
-- 2. Ajouter votre logo (si disponible)
-- 3. Modifier les textes selon vos besoins
-- 4. Ajuster la mise en page
-- 5. Ajouter des éléments de branding

-- 9. Monitoring
-- Pour surveiller l'envoi d'emails :

-- 1. Aller dans Supabase Dashboard > Logs > Auth
-- 2. Chercher les événements d'email
-- 3. Vérifier les taux de délivrabilité
-- 4. Surveiller les erreurs d'envoi

-- 10. Dépannage
-- Si les emails ne sont pas envoyés :

-- 1. Vérifier la configuration des templates
-- 2. Vérifier les URLs de redirection
-- 3. Vérifier les variables d'environnement
-- 4. Vérifier les logs Supabase
-- 5. Tester avec un email de développement

-- 11. Sécurité
-- Pour sécuriser les emails :

-- 1. Utiliser HTTPS uniquement
-- 2. Valider les liens de confirmation
-- 3. Limiter la durée de validité des liens
-- 4. Surveiller les tentatives d'accès non autorisées
-- 5. Implémenter la vérification de signature si nécessaire

-- 12. Performance
-- Pour optimiser les emails :

-- 1. Minimiser la taille des images
-- 2. Utiliser des CSS inline
-- 3. Tester sur différents clients email
-- 4. Optimiser pour mobile
-- 5. Surveiller les temps de chargement

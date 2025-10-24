-- Configuration du template d'email de réinitialisation de mot de passe dans Supabase
-- Ce script configure le template personnalisé pour la réinitialisation

-- 1. Template HTML personnalisé pour la réinitialisation de mot de passe
-- À configurer dans Supabase Dashboard > Authentication > Email Templates > Reset Password

-- Subject: Réinitialisation de votre mot de passe
-- Body HTML:
/*
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de votre mot de passe</title>
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
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .content {
            padding: 40px 30px;
        }
        .reset-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 16px;
            color: #1f2937;
        }
        .reset-subtitle {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 30px;
        }
        .cta-button {
            display: inline-block;
            background: #dc2626;
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
            background: #b91c1c;
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
        .steps {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        .steps h3 {
            margin: 0 0 16px 0;
            color: #0c4a6e;
            font-size: 16px;
        }
        .steps ol {
            margin: 0;
            padding-left: 20px;
            color: #0c4a6e;
            font-size: 14px;
        }
        .steps li {
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
            <h1 class="reset-title">Réinitialisation de votre mot de passe</h1>
            <p class="reset-subtitle">
                Bonjour,<br>
                Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe sécurisé.
            </p>

            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="cta-button">
                    Réinitialiser mon mot de passe
                </a>
            </div>

            <div class="security-notice">
                <p>
                    <strong>🔒 Sécurité :</strong> Ce lien est valide pendant 24 heures. 
                    Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
                </p>
            </div>

            <div class="warning-box">
                <p>
                    <strong>⚠️ Important :</strong> Pour votre sécurité, votre nouveau mot de passe doit contenir au moins 8 caractères, 
                    incluant une majuscule, une minuscule, un chiffre et un caractère spécial.
                </p>
            </div>

            <div class="steps">
                <h3>📋 Étapes de réinitialisation :</h3>
                <ol>
                    <li>Cliquez sur le bouton "Réinitialiser mon mot de passe"</li>
                    <li>Saisissez votre nouveau mot de passe sécurisé</li>
                    <li>Confirmez votre nouveau mot de passe</li>
                    <li>Connectez-vous avec vos nouveaux identifiants</li>
                </ol>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                <span style="word-break: break-all; color: #dc2626;">{{ .ConfirmationURL }}</span>
            </p>

            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 30px 0;">
                <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
                    <strong>💡 Astuce :</strong> Après la réinitialisation, nous vous recommandons de vous connecter immédiatement 
                    pour vérifier que tout fonctionne correctement.
                </p>
            </div>
        </div>

        <div class="footer">
            <p><strong>Louer Ici</strong></p>
            <p>Plateforme de gestion locative</p>
            
            <p style="font-size: 12px; color: #9ca3af;">
                Cet email a été envoyé automatiquement. 
                Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
            </p>
        </div>
    </div>
</body>
</html>
*/

-- 2. Configuration des URLs de redirection
-- Dans Supabase Dashboard > Authentication > URL Configuration

-- Site URL: https://votre-domaine.com
-- Redirect URLs:
--   - https://votre-domaine.com/auth/callback
--   - https://votre-domaine.com/reset-password
--   - http://localhost:3000/auth/callback (développement)
--   - http://localhost:3000/reset-password (développement)

-- 3. Configuration des paramètres d'authentification
-- Dans Supabase Dashboard > Authentication > Settings

-- Email confirmations: Enabled
-- Secure email change: Enabled
-- Double confirm email changes: Enabled
-- Enable email confirmations: Enabled

-- 4. Variables d'environnement requises
-- Assurez-vous que ces variables sont configurées :

/*
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
*/

-- 5. Test de la configuration
-- Pour tester la réinitialisation :

-- 1. Aller sur /forgot-password
-- 2. Saisir un email valide
-- 3. Vérifier que l'email est reçu avec le bon template
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

-- 7. Personnalisation avancée
-- Pour personnaliser davantage le template :

-- Modifier les couleurs dans le CSS
-- Ajouter votre logo (si disponible)
-- Modifier les textes selon vos besoins
-- Ajuster la mise en page

-- 8. Monitoring
-- Pour surveiller l'envoi d'emails :

-- Aller dans Supabase Dashboard > Logs > Auth
-- Chercher les événements "password reset"
-- Vérifier les taux de délivrabilité
-- Surveiller les erreurs d'envoi

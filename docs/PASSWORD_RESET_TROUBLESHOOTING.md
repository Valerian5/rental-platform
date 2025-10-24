# Guide de dépannage - Réinitialisation de mot de passe

## 🚨 Problème : Les emails de réinitialisation ne sont pas envoyés

### 🔍 Diagnostic rapide

#### 1. Vérifier les logs Supabase
```bash
# Aller dans Supabase Dashboard > Logs > Auth
# Chercher les erreurs liées à "password reset" ou "email"
```

#### 2. Vérifier la configuration des URLs
Dans Supabase Dashboard > Authentication > URL Configuration :

**Site URL :**
```
https://votre-domaine.com
```

**Redirect URLs :**
```
https://votre-domaine.com/auth/callback
https://votre-domaine.com/reset-password
http://localhost:3000/auth/callback
http://localhost:3000/reset-password
```

### 🛠️ Solutions étape par étape

#### **Étape 1 : Vérifier la configuration Supabase**

1. **Aller dans Supabase Dashboard**
2. **Authentication > Settings**
3. **Vérifier ces paramètres :**
   - ✅ Email confirmations: **Enabled**
   - ✅ Secure email change: **Enabled**
   - ✅ Double confirm email changes: **Enabled**

#### **Étape 2 : Configurer les templates d'email**

1. **Aller dans Authentication > Email Templates**
2. **Sélectionner "Reset Password"**
3. **Configurer le template :**

**Subject :**
```
Réinitialisation de votre mot de passe
```

**Body HTML :**
```html
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
```

#### **Étape 3 : Vérifier les variables d'environnement**

Dans votre fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
```

#### **Étape 4 : Tester le flux complet**

1. **Aller sur `/forgot-password`**
2. **Saisir un email valide**
3. **Vérifier la console pour les erreurs**
4. **Vérifier les logs Supabase**
5. **Vérifier la réception de l'email**

### 🔧 Solutions avancées

#### **Solution 1 : Configuration SMTP personnalisée**

Si les emails Supabase ne fonctionnent pas :

1. **Aller dans Supabase Dashboard > Settings > Auth > SMTP Settings**
2. **Configurer votre serveur SMTP :**
   ```
   Host: smtp.gmail.com (ou votre fournisseur)
   Port: 587
   Username: votre-email@gmail.com
   Password: votre-mot-de-passe-app
   ```

#### **Solution 2 : Vérifier les restrictions de domaine**

1. **Aller dans Supabase Dashboard > Settings > Auth**
2. **Vérifier "Allowed domains"**
3. **Ajouter votre domaine si nécessaire**

#### **Solution 3 : Tester avec un email de test**

```javascript
// Dans la console du navigateur sur /forgot-password
const { supabase } = await import('@/lib/supabase')
const { error } = await supabase.auth.resetPasswordForEmail('test@example.com', {
  redirectTo: 'https://votre-domaine.com/reset-password'
})
console.log('Erreur:', error)
```

### 📊 Monitoring et logs

#### **Logs à surveiller :**

1. **Supabase Dashboard > Logs > Auth**
   - Chercher : `password reset`
   - Chercher : `email sent`
   - Chercher : `error`

2. **Console du navigateur**
   - Erreurs JavaScript
   - Erreurs de réseau

3. **Logs de l'application**
   - Erreurs dans la console serveur
   - Erreurs dans les logs Vercel

### 🚀 Test de fonctionnement

#### **Test complet :**

1. **Créer un compte de test**
2. **Aller sur `/forgot-password`**
3. **Saisir l'email du compte**
4. **Vérifier la réception de l'email**
5. **Cliquer sur le lien dans l'email**
6. **Vérifier la redirection vers `/reset-password`**
7. **Saisir un nouveau mot de passe**
8. **Vérifier que la connexion fonctionne**

### ❌ Erreurs courantes

#### **Erreur : "Invalid redirect URL"**
- **Cause :** URL de redirection non configurée
- **Solution :** Ajouter l'URL dans Supabase Dashboard > Auth > URL Configuration

#### **Erreur : "Email not sent"**
- **Cause :** Configuration SMTP ou restrictions
- **Solution :** Vérifier la configuration SMTP ou utiliser un email de test

#### **Erreur : "User not found"**
- **Cause :** Email inexistant dans la base
- **Solution :** Vérifier que l'utilisateur existe dans la table `users`

### 📞 Support

Si le problème persiste :

1. **Vérifier les logs Supabase**
2. **Tester avec un email de développement**
3. **Vérifier la configuration des domaines**
4. **Contacter le support Supabase si nécessaire**

---

**Note :** Ce guide couvre les problèmes les plus courants. Pour des cas spécifiques, consultez la documentation officielle de Supabase.

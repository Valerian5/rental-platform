# Configuration des emails personnalisés

## Variables d'environnement requises

### 1. Configuration Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Configuration du site
```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**⚠️ IMPORTANT** : Remplacez `localhost:3000` par votre domaine de production !

### 3. Configuration email (optionnel)
```env
EMAIL_SERVICE_API_KEY=your_email_service_api_key
EMAIL_FROM=noreply@your-domain.com
```

## Configuration dans Supabase

### 1. Désactiver les emails automatiques de Supabase

1. **Aller dans Authentication > Settings**
2. **Désactiver "Enable email confirmations"**
3. **Ou configurer les templates personnalisés**

### 2. Configurer les URLs de redirection

1. **Aller dans Authentication > URL Configuration**
2. **Site URL** : `https://your-domain.com`
3. **Redirect URLs** : 
   - `https://your-domain.com/auth/callback`
   - `https://your-domain.com/auth/verify-email`

## Templates d'email personnalisés

### 1. Template de bienvenue
- **Fichier** : `templates/emails/welcome.html`
- **API** : `/api/emails/welcome`
- **Contenu** : Logo, informations du site, features personnalisées

### 2. Template de vérification
- **Fichier** : `templates/emails/verify-email.html`
- **API** : `/api/emails/verify-email`
- **Contenu** : Lien de vérification, instructions

## Test de la configuration

### 1. Vérifier les variables d'environnement
```bash
echo $NEXT_PUBLIC_SITE_URL
echo $NEXT_PUBLIC_SUPABASE_URL
```

### 2. Tester l'inscription
1. Aller sur `/register`
2. Créer un compte
3. Vérifier que l'email reçu contient :
   - Logo de votre société
   - Nom de votre société
   - URL de redirection correcte (pas localhost)

### 3. Tester la vérification
1. Cliquer sur le lien de vérification
2. Vérifier que la redirection va vers votre domaine
3. Vérifier que la vérification fonctionne

## Dépannage

### Problème : Email de Supabase au lieu de l'email personnalisé
**Solution** : Vérifier que `NEXT_PUBLIC_SITE_URL` est configuré correctement

### Problème : Redirection vers localhost
**Solution** : 
1. Vérifier `NEXT_PUBLIC_SITE_URL` dans `.env.local`
2. Redémarrer le serveur de développement
3. Vérifier la configuration Supabase

### Problème : Email non reçu
**Solution** :
1. Vérifier les logs du serveur
2. Vérifier la configuration du service d'email
3. Vérifier le dossier spam

## Configuration avancée

### 1. Service d'email externe
Si vous voulez utiliser un service d'email externe (SendGrid, Mailgun, etc.) :

1. **Installer le SDK** :
```bash
npm install @sendgrid/mail
# ou
npm install mailgun-js
```

2. **Configurer le service** dans `lib/email-service.ts`

3. **Mettre à jour les templates** selon le service

### 2. Templates personnalisés
Pour modifier les templates d'email :

1. **Éditer** `templates/emails/welcome.html`
2. **Éditer** `templates/emails/verify-email.html`
3. **Tester** avec un compte de test

### 3. Configuration multi-environnement
```env
# Développement
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Production
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Sécurité

### 1. Tokens de vérification
- Les tokens sont générés par Supabase
- Ils expirent automatiquement
- Ils sont uniques et sécurisés

### 2. URLs de redirection
- Vérifier que les URLs sont dans la liste autorisée
- Utiliser HTTPS en production
- Éviter les redirections vers des domaines externes

### 3. Données sensibles
- Ne pas exposer les clés API côté client
- Utiliser les variables d'environnement
- Vérifier les permissions RLS

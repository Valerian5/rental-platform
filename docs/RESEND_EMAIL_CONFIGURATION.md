# Configuration Resend pour les emails personnalisés

## 🚀 Configuration Resend

### 1. Créer un compte Resend

1. **Aller sur [resend.com](https://resend.com)**
2. **Créer un compte** avec votre email
3. **Vérifier votre email** pour activer le compte

### 2. Obtenir la clé API

1. **Aller dans Dashboard > API Keys**
2. **Créer une nouvelle clé API**
3. **Copier la clé** (elle ne sera affichée qu'une fois)

### 3. Configurer le domaine

1. **Aller dans Dashboard > Domains**
2. **Ajouter votre domaine** (ex: `louer-ici.com`)
3. **Configurer les enregistrements DNS** :
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.resend.com ~all
   
   Type: CNAME
   Name: resend._domainkey
   Value: resend._domainkey.resend.com
   ```

### 4. Variables d'environnement

Ajouter dans votre fichier `.env.local` :

```env
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_DOMAIN=louer-ici.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://louer-ici.com
```

### 5. Installation des dépendances

```bash
npm install resend
```

## 📧 Templates d'email personnalisés

### 1. Template de réinitialisation de mot de passe

Le template `templates/emails/password-reset-custom.html` inclut :

- ✅ **Design cohérent** avec votre branding
- ✅ **Logo dynamique** depuis la base de données
- ✅ **Informations personnalisées** (nom, email)
- ✅ **Instructions claires** pour l'utilisateur
- ✅ **Sécurité** (lien valide 24h)
- ✅ **Responsive** (mobile-friendly)

### 2. Variables disponibles dans les templates

```html
{{logoUrl}}           <!-- URL du logo -->
{{siteInfo.title}}    <!-- Nom du site -->
{{siteInfo.description}} <!-- Description du site -->
{{user.first_name}}   <!-- Prénom de l'utilisateur -->
{{user.email}}        <!-- Email de l'utilisateur -->
{{resetUrl}}          <!-- URL de réinitialisation -->
```

## 🔧 Configuration avancée

### 1. Configuration SMTP personnalisée

Si vous préférez utiliser votre propre serveur SMTP :

```typescript
// Dans app/api/emails/password-reset/route.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
})
```

### 2. Gestion des erreurs

```typescript
// Gestion des erreurs Resend
try {
  const { data, error } = await resend.emails.send({
    from: `${siteInfo.title} <noreply@${process.env.RESEND_DOMAIN}>`,
    to: [email],
    subject: `Réinitialisation de votre mot de passe - ${siteInfo.title}`,
    html: template,
  })

  if (error) {
    console.error('Erreur Resend:', error)
    // Fallback vers Supabase ou autre service
  }
} catch (error) {
  console.error('Erreur envoi email:', error)
}
```

### 3. Monitoring et logs

```typescript
// Ajouter des logs détaillés
console.log('Email de réinitialisation envoyé:', {
  to: email,
  subject: `Réinitialisation de votre mot de passe - ${siteInfo.title}`,
  timestamp: new Date().toISOString()
})
```

## 🧪 Tests

### 1. Test en développement

```bash
# Tester l'envoi d'email
curl -X POST http://localhost:3000/api/emails/password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "resetUrl": "http://localhost:3000/reset-password?email=test@example.com",
    "user": {
      "first_name": "Test",
      "email": "test@example.com"
    }
  }'
```

### 2. Test du flux complet

1. **Aller sur `/forgot-password`**
2. **Saisir un email valide**
3. **Vérifier la réception de l'email**
4. **Cliquer sur le lien**
5. **Vérifier la redirection vers `/reset-password`**
6. **Saisir un nouveau mot de passe**
7. **Vérifier la réinitialisation**

## 🚨 Dépannage

### Problème : Email non reçu

**Solutions :**
1. **Vérifier la clé API Resend**
2. **Vérifier la configuration du domaine**
3. **Vérifier les logs Resend Dashboard**
4. **Vérifier le dossier spam**

### Problème : Erreur "Invalid API key"

**Solutions :**
1. **Vérifier `RESEND_API_KEY` dans `.env.local`**
2. **Redémarrer le serveur de développement**
3. **Vérifier que la clé est correcte**

### Problème : Erreur "Domain not verified"

**Solutions :**
1. **Vérifier la configuration DNS**
2. **Attendre la propagation DNS (jusqu'à 24h)**
3. **Utiliser un domaine de test Resend**

### Problème : Template ne s'affiche pas

**Solutions :**
1. **Vérifier le chemin du template**
2. **Vérifier les variables dans le template**
3. **Vérifier les logs de l'API**

## 📊 Monitoring

### 1. Dashboard Resend

- **Aller dans Resend Dashboard > Logs**
- **Surveiller les emails envoyés**
- **Vérifier les taux de délivrabilité**

### 2. Logs applicatifs

```typescript
// Ajouter des logs détaillés
console.log('Email de réinitialisation:', {
  to: email,
  from: `${siteInfo.title} <noreply@${process.env.RESEND_DOMAIN}>`,
  subject: `Réinitialisation de votre mot de passe - ${siteInfo.title}`,
  timestamp: new Date().toISOString(),
  success: true
})
```

### 3. Métriques importantes

- **Taux de délivrabilité** : > 95%
- **Temps de livraison** : < 30 secondes
- **Taux d'ouverture** : > 20%
- **Taux de clic** : > 5%

## 🔒 Sécurité

### 1. Validation des emails

```typescript
// Valider l'email avant l'envoi
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  throw new Error('Email invalide')
}
```

### 2. Limitation du taux

```typescript
// Limiter le nombre d'emails par utilisateur
const rateLimit = new Map()
const userEmailCount = rateLimit.get(email) || 0
if (userEmailCount > 3) {
  throw new Error('Trop de demandes de réinitialisation')
}
rateLimit.set(email, userEmailCount + 1)
```

### 3. Validation de l'URL

```typescript
// Valider l'URL de réinitialisation
const resetUrl = new URL(resetUrl)
if (resetUrl.origin !== process.env.NEXT_PUBLIC_SITE_URL) {
  throw new Error('URL de réinitialisation invalide')
}
```

## 🚀 Déploiement

### 1. Variables d'environnement de production

```env
# Production
RESEND_API_KEY=re_prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_DOMAIN=louer-ici.com
NEXT_PUBLIC_SITE_URL=https://louer-ici.com
```

### 2. Configuration Vercel

```bash
# Ajouter les variables dans Vercel Dashboard
vercel env add RESEND_API_KEY
vercel env add RESEND_DOMAIN
vercel env add NEXT_PUBLIC_SITE_URL
```

### 3. Test en production

1. **Déployer sur Vercel**
2. **Tester le flux complet**
3. **Vérifier les emails en production**
4. **Monitorer les logs**

---

**Note :** Ce guide couvre la configuration complète de Resend pour les emails personnalisés. Pour des cas spécifiques, consultez la [documentation officielle de Resend](https://resend.com/docs).

# Configuration des politiques d'email Supabase

## Vue d'ensemble

Pour intercepter les emails de Supabase et les gérer nous-mêmes, nous devons :

1. **Configurer les politiques d'email** dans Supabase
2. **Désactiver l'envoi automatique** des emails
3. **Créer nos propres handlers** pour chaque type d'email
4. **Tester le flux complet**

## Configuration dans Supabase Dashboard

### 1. Aller dans Authentication > Settings

#### Désactiver les emails automatiques
```
☐ Enable email confirmations
☐ Enable email change confirmations  
☐ Enable password reset emails
☐ Enable email change notifications
```

#### Configurer les URLs de redirection
```
Site URL: https://your-domain.com
Redirect URLs:
- https://your-domain.com/auth/callback
- https://your-domain.com/auth/verify-email
- https://your-domain.com/auth/reset-password
```

### 2. Aller dans Database > Functions

#### Créer une fonction pour intercepter les emails
```sql
-- Fonction pour intercepter les emails d'inscription
CREATE OR REPLACE FUNCTION handle_signup_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Empêcher l'envoi automatique de Supabase
  -- et déclencher notre propre logique
  PERFORM pg_notify('signup_email', json_build_object(
    'user_id', NEW.id,
    'email', NEW.email,
    'user_type', NEW.raw_user_meta_data->>'user_type'
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_signup_email();
```

### 3. Aller dans Database > Webhooks

#### Créer des webhooks pour intercepter les événements
```
URL: https://your-domain.com/api/webhooks/supabase
Events: 
- auth.users.created
- auth.users.updated
- auth.users.deleted
```

## Configuration des politiques d'email

### 1. Politique pour l'inscription
```sql
-- Politique pour empêcher l'envoi automatique d'email d'inscription
CREATE POLICY "Prevent signup email" ON auth.users
FOR INSERT WITH CHECK (false);
```

### 2. Politique pour le changement d'email
```sql
-- Politique pour empêcher l'envoi automatique d'email de changement
CREATE POLICY "Prevent email change notification" ON auth.users
FOR UPDATE WITH CHECK (false);
```

### 3. Politique pour la réinitialisation de mot de passe
```sql
-- Politique pour empêcher l'envoi automatique d'email de reset
CREATE POLICY "Prevent password reset email" ON auth.users
FOR UPDATE WITH CHECK (false);
```

## Handlers personnalisés

### 1. Handler pour l'inscription
```typescript
// app/api/webhooks/supabase/route.ts
export async function POST(request: NextRequest) {
  const { type, record } = await request.json()
  
  switch (type) {
    case 'INSERT':
      if (record.table === 'users') {
        await handleSignupEmail(record)
      }
      break
    case 'UPDATE':
      if (record.table === 'users') {
        await handleEmailChange(record)
      }
      break
  }
}
```

### 2. Handler pour le changement d'email
```typescript
async function handleEmailChange(record: any) {
  // Vérifier si l'email a changé
  if (record.old_record.email !== record.new_record.email) {
    await sendEmailChangeConfirmation(record.new_record)
  }
}
```

### 3. Handler pour la réinitialisation de mot de passe
```typescript
async function handlePasswordReset(record: any) {
  // Envoyer l'email de réinitialisation personnalisé
  await sendPasswordResetEmail(record)
}
```

## Configuration SMTP Resend

### 1. Variables d'environnement
```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@your-domain.com
```

### 2. Configuration dans Supabase
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP Username: resend
SMTP Password: your_resend_api_key
```

## Test de la configuration

### 1. Test d'inscription
1. Créer un compte via `/register`
2. Vérifier que l'email reçu est personnalisé
3. Vérifier que l'URL de redirection est correcte

### 2. Test de changement d'email
1. Aller dans les paramètres du profil
2. Changer l'email
3. Vérifier que l'email de confirmation est personnalisé

### 3. Test de réinitialisation de mot de passe
1. Aller sur `/forgot-password`
2. Saisir l'email
3. Vérifier que l'email de reset est personnalisé

## Dépannage

### Problème : Emails de Supabase toujours envoyés
**Solution** : Vérifier que les politiques sont correctement configurées

### Problème : Emails personnalisés non envoyés
**Solution** : Vérifier les webhooks et les handlers

### Problème : URLs de redirection incorrectes
**Solution** : Vérifier `NEXT_PUBLIC_SITE_URL` et la configuration Supabase

## Sécurité

### 1. Validation des webhooks
```typescript
// Vérifier la signature du webhook
const signature = request.headers.get('x-supabase-signature')
if (!verifySignature(signature, body)) {
  return new Response('Unauthorized', { status: 401 })
}
```

### 2. Rate limiting
```typescript
// Limiter le nombre d'emails par utilisateur
const emailCount = await getEmailCount(userId)
if (emailCount > 10) {
  throw new Error('Too many emails sent')
}
```

### 3. Validation des données
```typescript
// Valider les données avant l'envoi
if (!isValidEmail(email) || !isValidUserType(userType)) {
  throw new Error('Invalid data')
}
```

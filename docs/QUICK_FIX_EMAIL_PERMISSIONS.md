# 🚨 Correction rapide : Permissions Supabase

## Problème
```
ERROR: 42501: must be owner of table users
```

## Solution immédiate

### 1. Exécuter le script alternatif
```sql
-- Dans Supabase SQL Editor
-- Exécuter le script : scripts/configure-supabase-email-policies-alternative.sql
```

### 2. Configuration manuelle dans Supabase Dashboard

#### Désactiver les emails automatiques
1. **Aller dans Authentication > Settings**
2. **Désactiver** :
   - ☐ Enable email confirmations
   - ☐ Enable email change confirmations  
   - ☐ Enable password reset emails
   - ☐ Enable email change notifications

#### Configurer les URLs
1. **Aller dans Authentication > URL Configuration**
2. **Configurer** :
   - Site URL : `https://your-domain.com`
   - Redirect URLs : `https://your-domain.com/auth/callback`

### 3. Tester la configuration
```sql
-- Dans Supabase SQL Editor
-- Exécuter le script : scripts/test-email-functions.sql
```

### 4. Vérifier que tout fonctionne
1. Aller sur `/admin/test-emails`
2. Envoyer un email de test
3. Vérifier que l'événement apparaît dans `email_events`

## Avantages de cette approche

### ✅ Pas de permissions spéciales
- Utilise les permissions standard de Supabase
- Fonctionne avec tous les plans
- Pas besoin d'être propriétaire de `auth.users`

### ✅ Contrôle total
- Déclenchement manuel des emails
- Logging complet des événements
- Surveillance des performances

### ✅ Intégration facile
- Fonctions disponibles via `supabase.rpc()`
- Intégration dans le code existant
- Gestion d'erreurs robuste

## Code mis à jour

Le service d'authentification a été mis à jour pour utiliser les fonctions Supabase :

```typescript
// Déclencher l'email de bienvenue
const { error } = await supabase.rpc('trigger_welcome_email', {
  user_email: userData.email,
  user_type: userData.userType,
  user_id: authData.user.id,
  first_name: userData.firstName,
  last_name: userData.lastName
});

// Déclencher l'email de vérification
const { error } = await supabase.rpc('trigger_verification_email', {
  user_email: userData.email,
  user_type: userData.userType,
  user_id: authData.user.id
});
```

## Surveillance

### Voir les événements
```sql
SELECT * FROM public.email_events_summary;
```

### Voir tous les événements
```sql
SELECT * FROM public.email_events 
ORDER BY created_at DESC 
LIMIT 100;
```

### Nettoyer les anciens événements
```sql
SELECT public.cleanup_old_email_events(30);
```

## Résultat

**Plus d'erreur de permissions !** Le système d'emails personnalisés fonctionne maintenant avec les permissions standard de Supabase.

### Fonctionnalités disponibles
- ✅ Emails de bienvenue personnalisés
- ✅ Emails de vérification personnalisés
- ✅ Emails de changement d'email
- ✅ Emails de réinitialisation de mot de passe
- ✅ Logging complet des événements
- ✅ Surveillance des performances

**L'inscription devrait maintenant fonctionner sans erreur de permissions !** 🎉

# Approche alternative pour les politiques d'email Supabase

## Problème résolu
L'erreur `must be owner of table users` se produit car la table `auth.users` est gérée par Supabase et nécessite des permissions spéciales que nous n'avons pas.

## Solution alternative

### 1. Configuration manuelle dans Supabase Dashboard

#### Désactiver les emails automatiques
1. **Aller dans Authentication > Settings**
2. **Désactiver ces options** :
   - ☐ Enable email confirmations
   - ☐ Enable email change confirmations  
   - ☐ Enable password reset emails
   - ☐ Enable email change notifications

#### Configurer les URLs de redirection
1. **Aller dans Authentication > URL Configuration**
2. **Configurer** :
   - Site URL : `https://your-domain.com`
   - Redirect URLs : `https://your-domain.com/auth/callback`

### 2. Exécuter le script alternatif

```sql
-- Exécuter dans Supabase SQL Editor
-- Ce script crée des fonctions helper et une table de logging
```

### 3. Configuration des webhooks

1. **Aller dans Database > Webhooks**
2. **Créer un nouveau webhook** :
   - URL : `https://your-domain.com/api/webhooks/supabase`
   - Events : `auth.users.created`, `auth.users.updated`
   - HTTP Headers : `Content-Type: application/json`

### 4. Utilisation des fonctions

#### Déclencher un email de bienvenue
```sql
-- Appeler cette fonction après la création d'un utilisateur
SELECT public.trigger_welcome_email(
  'user@example.com',
  'tenant',
  'user-uuid-here',
  'John',
  'Doe'
);
```

#### Déclencher un email de vérification
```sql
-- Appeler cette fonction pour envoyer l'email de vérification
SELECT public.trigger_verification_email(
  'user@example.com',
  'tenant',
  'user-uuid-here'
);
```

#### Déclencher un email de changement
```sql
-- Appeler cette fonction quand l'email change
SELECT public.trigger_email_change(
  'new@example.com',
  'old@example.com',
  'user-uuid-here',
  'John'
);
```

#### Déclencher un email de réinitialisation
```sql
-- Appeler cette fonction pour la réinitialisation de mot de passe
SELECT public.trigger_password_reset(
  'user@example.com',
  'user-uuid-here',
  'John'
);
```

### 5. Surveillance des événements

#### Voir le résumé des événements
```sql
SELECT * FROM public.email_events_summary;
```

#### Voir tous les événements
```sql
SELECT * FROM public.email_events 
ORDER BY created_at DESC 
LIMIT 100;
```

#### Nettoyer les anciens événements
```sql
-- Supprimer les événements de plus de 30 jours
SELECT public.cleanup_old_email_events(30);
```

### 6. Intégration avec l'application

#### Modifier le service d'authentification
```typescript
// Dans lib/auth-service.ts
async register(userData: RegisterData) {
  // ... logique d'inscription existante ...
  
  // Déclencher l'email de bienvenue via fonction Supabase
  const { error } = await supabase.rpc('trigger_welcome_email', {
    user_email: userData.email,
    user_type: userData.userType,
    user_id: authData.user.id,
    first_name: userData.firstName,
    last_name: userData.lastName
  });
  
  if (error) {
    console.warn('Erreur déclenchement email:', error);
  }
}
```

#### Modifier la page de changement d'email
```typescript
// Dans la page de changement d'email
async function handleEmailChange(newEmail: string) {
  // ... logique de changement d'email ...
  
  // Déclencher l'email de confirmation
  const { error } = await supabase.rpc('trigger_email_change', {
    user_email: newEmail,
    old_email: currentEmail,
    user_id: user.id,
    first_name: user.firstName
  });
}
```

### 7. Avantages de cette approche

#### ✅ Permissions standard
- Utilise les permissions standard de Supabase
- Pas besoin de permissions spéciales
- Fonctionne avec tous les plans Supabase

#### ✅ Contrôle total
- Déclenchement manuel des emails
- Logging complet des événements
- Surveillance des performances

#### ✅ Flexibilité
- Peut être intégré dans n'importe quelle partie de l'application
- Permet de personnaliser le moment d'envoi
- Gestion d'erreurs robuste

### 8. Dépannage

#### Problème : Fonctions non trouvées
**Solution** : Vérifier que le script alternatif a été exécuté correctement

#### Problème : Webhooks non déclenchés
**Solution** : Vérifier la configuration des webhooks dans Supabase

#### Problème : Emails non envoyés
**Solution** : Vérifier les logs dans `email_events` et la configuration du service d'email

### 9. Test de la configuration

#### Test des fonctions
```sql
-- Tester l'envoi d'email de bienvenue
SELECT public.trigger_welcome_email(
  'test@example.com',
  'tenant',
  gen_random_uuid(),
  'Test',
  'User'
);

-- Vérifier que l'événement a été loggé
SELECT * FROM public.email_events 
WHERE user_email = 'test@example.com';
```

#### Test des webhooks
1. Aller sur `/admin/test-emails`
2. Envoyer un email de test
3. Vérifier que l'événement apparaît dans `email_events`

### 10. Migration depuis l'approche précédente

Si vous aviez déjà configuré l'approche précédente :

1. **Désactiver les triggers** (si possible)
2. **Exécuter le script alternatif**
3. **Modifier le code** pour utiliser les fonctions `trigger_*`
4. **Tester** avec la page de test

## Résumé

Cette approche alternative résout le problème de permissions en :
- Utilisant des fonctions helper dans le schéma public
- Créant une table de logging pour surveiller les événements
- Permettant un déclenchement manuel des emails
- Gardant le contrôle total sur le processus d'envoi

**L'avantage principal** : Pas besoin de permissions spéciales, fonctionne avec tous les plans Supabase !

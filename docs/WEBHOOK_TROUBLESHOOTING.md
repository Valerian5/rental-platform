# Guide de dépannage - Webhook Supabase

## 🚨 Problème : Erreur 401 sur `/api/webhooks/supabase`

### 🔍 Diagnostic rapide

#### 1. Vérifier les logs du webhook
```bash
# Dans les logs de votre application
# Chercher les erreurs liées au webhook
```

#### 2. Vérifier la configuration Supabase
- **Aller dans Supabase Dashboard > Database > Webhooks**
- **Vérifier que le webhook est configuré**
- **Vérifier l'URL du webhook**

### 🛠️ Solutions étape par étape

#### **Étape 1 : Désactiver temporairement la vérification de signature**

Dans `app/api/webhooks/supabase/route.ts` :

```typescript
// Vérifier la signature du webhook Supabase
function verifySignature(signature: string | null, body: string): boolean {
  // Pour le développement, on accepte tous les webhooks
  // En production, implémenter la vérification de signature
  return true
}
```

#### **Étape 2 : Vérifier la configuration du webhook**

1. **Aller dans Supabase Dashboard > Database > Webhooks**
2. **Créer ou modifier le webhook :**

**Configuration requise :**
- **URL** : `https://votre-domaine.com/api/webhooks/supabase`
- **Events** : `INSERT`, `UPDATE` sur `auth.users`
- **HTTP Method** : `POST`
- **HTTP Headers** :
  ```
  Content-Type: application/json
  x-supabase-signature: [signature]
  ```

#### **Étape 3 : Tester le webhook**

```bash
# Test avec curl
curl -X POST https://votre-domaine.com/api/webhooks/supabase \
  -H "Content-Type: application/json" \
  -H "x-supabase-signature: test" \
  -d '{
    "type": "INSERT",
    "table": "users",
    "record": {
      "id": "test-id",
      "email": "test@example.com",
      "raw_user_meta_data": {
        "first_name": "Test",
        "user_type": "tenant"
      }
    }
  }'
```

#### **Étape 4 : Vérifier les logs**

```typescript
// Ajouter des logs détaillés dans le webhook
export async function POST(request: NextRequest) {
  try {
    console.log("🔔 Webhook reçu:", request.url)
    
    const body = await request.text()
    console.log("📦 Body reçu:", body)
    
    const signature = request.headers.get('x-supabase-signature')
    console.log("🔐 Signature:", signature)
    
    // ... reste du code
  } catch (error) {
    console.error("❌ Erreur webhook:", error)
  }
}
```

### 🔧 Solutions avancées

#### **Solution 1 : Configuration alternative sans webhook**

Si le webhook ne fonctionne pas, utiliser les fonctions RPC :

```typescript
// Dans lib/auth-service.ts
export async function register(userData: UserRegistrationData) {
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_type: userData.user_type
      }
    }
  })

  if (data.user) {
    // Appeler directement les fonctions d'email
    await supabase.rpc('trigger_welcome_email', {
      user_email: userData.email,
      user_data: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_type: userData.user_type
      }
    })
  }
}
```

#### **Solution 2 : Webhook local pour le développement**

```bash
# Installer ngrok pour exposer le webhook local
npm install -g ngrok

# Exposer le port 3000
ngrok http 3000

# Utiliser l'URL ngrok dans la configuration Supabase
# Ex: https://abc123.ngrok.io/api/webhooks/supabase
```

#### **Solution 3 : Vérification de signature sécurisée**

```typescript
import crypto from 'crypto'

function verifySignature(signature: string | null, body: string): boolean {
  if (!signature) return false
  
  const secret = process.env.SUPABASE_WEBHOOK_SECRET
  if (!secret) return true // Pas de secret configuré
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  
  return signature === expectedSignature
}
```

### 📊 Monitoring et logs

#### **Logs à surveiller :**

1. **Logs de l'application**
   - Erreurs 401 sur le webhook
   - Erreurs de parsing JSON
   - Erreurs de signature

2. **Logs Supabase**
   - Aller dans Supabase Dashboard > Logs > Database
   - Chercher les événements de webhook
   - Vérifier les erreurs de configuration

3. **Logs du webhook**
   - Ajouter des logs détaillés
   - Surveiller les tentatives d'accès
   - Vérifier les données reçues

### ❌ Erreurs courantes

#### **Erreur : "Unauthorized" (401)**
- **Cause** : Signature invalide ou manquante
- **Solution** : Désactiver temporairement la vérification de signature

#### **Erreur : "Invalid JSON"**
- **Cause** : Body malformé ou vide
- **Solution** : Vérifier le parsing JSON et ajouter des logs

#### **Erreur : "Webhook not found"**
- **Cause** : URL du webhook incorrecte
- **Solution** : Vérifier la configuration dans Supabase Dashboard

#### **Erreur : "Timeout"**
- **Cause** : Webhook trop lent à répondre
- **Solution** : Optimiser le code du webhook

### 🚀 Test de fonctionnement

#### **Test complet :**

1. **Configurer le webhook dans Supabase Dashboard**
2. **Tester avec un utilisateur de test**
3. **Vérifier les logs du webhook**
4. **Vérifier que les emails sont envoyés**
5. **Vérifier la réception des emails**

### 📞 Support

Si le problème persiste :

1. **Vérifier la configuration Supabase**
2. **Tester avec un webhook simple**
3. **Vérifier les permissions du webhook**
4. **Contacter le support Supabase si nécessaire**

---

**Note :** Ce guide couvre les problèmes les plus courants avec les webhooks Supabase. Pour des cas spécifiques, consultez la documentation officielle de Supabase.

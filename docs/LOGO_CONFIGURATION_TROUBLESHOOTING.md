# Dépannage - Configuration des logos

## 🚨 Problème : Données de test dans site_settings

### 🔍 Diagnostic
Vous avez un enregistrement de test dans votre table `site_settings` :
```sql
| id | setting_key | setting_value                        | created_at                    | updated_at                    |
| -- | ----------- | ------------------------------------ | ----------------------------- | ----------------------------- |
| 51 | test_logo   | {"main":"https://test.com/logo.png"} | 2025-10-24 17:49:05.532362+00 | 2025-10-24 17:49:05.532362+00 |
```

### 🛠️ Solutions

#### **1. Nettoyer les données de test**
```sql
-- Supprimer l'enregistrement de test
DELETE FROM site_settings WHERE setting_key = 'test_logo';
```

#### **2. Vérifier la configuration actuelle**
```sql
-- Vérifier les paramètres de logo
SELECT 
    setting_key,
    setting_value,
    updated_at
FROM site_settings 
WHERE setting_key = 'logos';
```

#### **3. Initialiser les paramètres par défaut**
```sql
-- Initialiser les paramètres s'ils n'existent pas
INSERT INTO site_settings (setting_key, setting_value, updated_at)
VALUES 
    ('logos', '{"main": null, "favicon": null, "footer": null}', NOW()),
    ('site_info', '{"title": "Louer Ici", "description": "Plateforme de gestion locative"}', NOW())
ON CONFLICT (setting_key) DO NOTHING;
```

### 📋 Configuration requise

#### **1. Structure de la table site_settings**
```sql
CREATE TABLE site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **2. Index requis**
```sql
CREATE INDEX idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX idx_site_settings_value ON site_settings USING GIN(setting_value);
```

#### **3. Contrainte unique**
```sql
ALTER TABLE site_settings ADD CONSTRAINT site_settings_setting_key_key UNIQUE (setting_key);
```

### 🔧 Scripts de correction

#### **1. `scripts/cleanup-test-data.sql`**
- ✅ **Nettoyage** : Suppression des données de test
- ✅ **Vérification** : Contrôle de l'intégrité
- ✅ **Initialisation** : Paramètres par défaut
- ✅ **Tests** : Validation de la configuration

#### **2. `scripts/verify-logo-configuration.sql`**
- ✅ **Diagnostic complet** : Structure, contraintes, index
- ✅ **Vérification des données** : Contenu et intégrité
- ✅ **Tests de performance** : Optimisation des requêtes
- ✅ **Validation finale** : Résumé de la configuration

### 🧪 Tests de fonctionnement

#### **1. Test de l'API publique**
```bash
# Tester l'API publique du logo
curl -X GET https://votre-domaine.com/api/public/logo
```

**Réponse attendue :**
```json
{
  "success": true,
  "logoUrl": null
}
```

#### **2. Test de l'upload de logo**
1. **Aller dans Admin > Dashboard**
2. **Sélectionner un fichier image**
3. **Cliquer sur "Uploader"**
4. **Vérifier qu'il n'y a plus d'erreur 500**
5. **Vérifier que le logo apparaît**

#### **3. Test des pages**
1. **Aller sur `/login`** → Vérifier l'affichage du logo
2. **Aller sur `/register`** → Vérifier l'affichage du logo
3. **Aller sur `/forgot-password`** → Vérifier l'affichage du logo
4. **Aller sur `/reset-password`** → Vérifier l'affichage du logo

### 🚨 Dépannage avancé

#### **Problème : Erreur 500 lors de l'upload**
**Solutions :**
1. **Exécuter le script de nettoyage** : `scripts/cleanup-test-data.sql`
2. **Vérifier les contraintes** : Contrainte unique sur `setting_key`
3. **Vérifier les permissions** : Table accessible
4. **Vérifier les index** : Index GIN pour les requêtes JSONB

#### **Problème : Logo ne s'affiche pas**
**Solutions :**
1. **Vérifier l'API** : `GET /api/public/logo`
2. **Vérifier la base** : `SELECT * FROM site_settings WHERE setting_key = 'logos'`
3. **Vérifier les permissions** : Bucket public
4. **Vérifier l'URL** : Format correct

#### **Problème : Données corrompues**
**Solutions :**
1. **Nettoyer la table** : Supprimer les données de test
2. **Réinitialiser** : Paramètres par défaut
3. **Vérifier l'intégrité** : Contraintes et index
4. **Tester l'upsert** : Insertion/mise à jour

### 📊 Monitoring

#### **1. Logs à surveiller**
- **API publique** : `GET /api/public/logo`
- **Upload** : `POST /api/admin/upload-logo`
- **Erreurs** : 500, 404, 403
- **Base de données** : Contraintes, index

#### **2. Métriques importantes**
- **Temps de réponse** : < 1 seconde
- **Taux d'erreur** : < 1%
- **Intégrité des données** : Pas de doublons
- **Performance** : Index optimisés

### 🔒 Sécurité

#### **1. Validation des données**
- ✅ **Type de fichier** : Images uniquement
- ✅ **Taille maximale** : 5MB
- ✅ **Extension** : PNG, JPEG, GIF, WebP
- ✅ **URL sécurisée** : HTTPS uniquement

#### **2. Gestion des erreurs**
- ✅ **Logs détaillés** : Traçabilité complète
- ✅ **Fallback** : Upload vers documents si logos échoue
- ✅ **Validation** : Vérification de l'existence de la table
- ✅ **Nettoyage** : Suppression des données de test

### 🚀 Optimisations

#### **1. Performance**
- ✅ **Index GIN** : Requêtes JSONB optimisées
- ✅ **Upsert** : Une seule opération DB
- ✅ **Cache** : Réutilisation des paramètres
- ✅ **Compression** : Images optimisées

#### **2. Maintenance**
- ✅ **Nettoyage régulier** : Suppression des données de test
- ✅ **Vérification** : Intégrité des données
- ✅ **Monitoring** : Surveillance des erreurs
- ✅ **Backup** : Sauvegarde des paramètres

### 📞 Support

#### **Si le problème persiste :**

1. **Exécuter les scripts** : `cleanup-test-data.sql` et `verify-logo-configuration.sql`
2. **Vérifier les logs** : Console du navigateur et logs serveur
3. **Tester l'API** : `GET /api/public/logo` et `POST /api/admin/upload-logo`
4. **Vérifier la base** : Structure et données de `site_settings`

#### **Logs à fournir :**
- Console du navigateur (erreurs JavaScript)
- Logs serveur (erreurs API)
- Structure de la table (requête SQL)
- Configuration des buckets Supabase

---

**Note :** Ce guide couvre les problèmes les plus courants avec la configuration des logos. Pour des cas spécifiques, consultez les scripts de nettoyage et de vérification fournis.

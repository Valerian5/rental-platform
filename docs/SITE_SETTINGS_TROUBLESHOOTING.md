# Guide de dépannage - Table site_settings

## 🚨 Problème : Erreur 500 lors de l'upload de logo

### 🔍 Erreur identifiée
```
duplicate key value violates unique constraint "site_settings_setting_key_key"
```

### 🛠️ Solutions implémentées

#### **1. Correction de l'API upload-logo**
- ✅ **Ajout de `onConflict`** : Gestion de la contrainte unique
- ✅ **Upsert correct** : Insertion ou mise à jour selon l'existence

#### **2. Correction de l'API settings**
- ✅ **Ajout de `onConflict`** : Même correction pour l'API générale
- ✅ **Gestion des conflits** : Évite les erreurs de contrainte

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

### 🔧 Scripts de correction

#### **1. `scripts/fix-site-settings-table.sql`**
- Vérification de la structure de la table
- Correction des contraintes et index
- Initialisation des paramètres par défaut
- Tests de fonctionnement

#### **2. Exécution du script**
```bash
# Exécuter le script de correction
psql $DATABASE_URL -f scripts/fix-site-settings-table.sql
```

### 🧪 Tests de fonctionnement

#### **1. Test de l'upload de logo**
1. **Aller dans Admin > Dashboard**
2. **Tenter d'uploader un logo**
3. **Vérifier qu'il n'y a plus d'erreur 500**
4. **Vérifier que le logo est sauvegardé**

#### **2. Test de l'API settings**
```bash
# Test avec curl
curl -X POST https://votre-domaine.com/api/admin/settings \
  -H "Content-Type: application/json" \
  -d '{"key": "test", "value": {"test": "value"}}'
```

#### **3. Vérification en base de données**
```sql
-- Vérifier les paramètres sauvegardés
SELECT setting_key, setting_value, updated_at 
FROM site_settings 
ORDER BY setting_key;
```

### 🚨 Dépannage avancé

#### **Problème : Contrainte unique manquante**
**Solution :**
```sql
-- Ajouter la contrainte unique
ALTER TABLE site_settings ADD CONSTRAINT site_settings_setting_key_key UNIQUE (setting_key);
```

#### **Problème : Doublons dans la table**
**Solution :**
```sql
-- Nettoyer les doublons
DELETE FROM site_settings 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM site_settings 
    GROUP BY setting_key
);
```

#### **Problème : Permissions insuffisantes**
**Solution :**
```sql
-- Accorder les permissions
GRANT ALL ON site_settings TO authenticated;
GRANT ALL ON site_settings TO service_role;
```

### 📊 Monitoring

#### **1. Logs à surveiller**
- **Upload réussi** : `✅ Upload logo terminé avec succès`
- **Paramètres mis à jour** : `✅ Paramètres mis à jour`
- **Erreurs de contrainte** : `⚠️ Erreur update settings`

#### **2. Vérifications régulières**
```sql
-- Vérifier l'intégrité de la table
SELECT 
    setting_key,
    CASE 
        WHEN setting_value IS NULL THEN 'NULL'
        ELSE 'OK'
    END as value_status,
    updated_at
FROM site_settings 
ORDER BY setting_key;
```

### 🔒 Sécurité

#### **1. Validation des données**
- ✅ **Type de fichier** : Images uniquement
- ✅ **Taille maximale** : 5MB
- ✅ **Extension** : PNG, JPEG, GIF, WebP

#### **2. Gestion des erreurs**
- ✅ **Logs détaillés** : Traçabilité complète
- ✅ **Fallback** : Upload vers documents si logos échoue
- ✅ **Validation** : Vérification de l'existence de la table

### 🚀 Optimisations

#### **1. Performance**
- ✅ **Index GIN** : Requêtes JSONB optimisées
- ✅ **Upsert** : Une seule opération DB
- ✅ **Cache** : Réutilisation des paramètres

#### **2. Maintenance**
- ✅ **Nettoyage** : Suppression des anciens logos
- ✅ **Backup** : Sauvegarde des paramètres
- ✅ **Monitoring** : Surveillance des erreurs

### 📞 Support

#### **Si le problème persiste :**

1. **Vérifier les logs** dans la console du navigateur
2. **Exécuter le script** `scripts/fix-site-settings-table.sql`
3. **Vérifier les permissions** sur la table
4. **Tester avec un utilisateur admin**

#### **Logs à fournir :**
- Console du navigateur (erreurs JavaScript)
- Logs serveur (erreurs API)
- Structure de la table (requête SQL)

---

**Note :** Ce guide couvre les problèmes les plus courants avec la table `site_settings`. Pour des cas spécifiques, consultez les logs détaillés de l'application.

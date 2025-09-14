# Configuration de l'État des Lieux

## 🚀 Installation et Configuration

### 1. Exécuter les Migrations

Exécutez le script de configuration pour créer toutes les tables nécessaires :

```bash
node scripts/setup-etat-des-lieux.js
```

Ce script va :
- Créer la table `etat_des_lieux_documents` pour stocker les documents
- Créer la table `etat_des_lieux_templates` pour les modèles admin
- Configurer les politiques RLS (Row Level Security)
- Créer les index pour optimiser les performances

### 2. Vérifier l'Accès Admin

1. Connectez-vous avec un compte admin
2. Allez sur `/admin`
3. Cliquez sur "Modèles État des Lieux" dans le menu de gauche
4. Vous devriez voir l'interface de gestion des modèles

### 3. Tester l'État des Lieux

1. Allez sur un bail existant : `/owner/leases/[id]`
2. Cliquez sur l'onglet "État des lieux"
3. Testez le téléchargement de modèles
4. Testez l'état des lieux numérique

## 📋 Fonctionnalités Disponibles

### Pour les Propriétaires
- **Téléchargement de modèles PDF** : Modèles adaptés au nombre de pièces
- **État des lieux numérique** : Interface complète pour créer des états des lieux détaillés
- **Upload de documents** : Uploader des états des lieux complétés
- **Gestion des pièces** : Ajouter/supprimer des pièces dynamiquement

### Pour les Locataires
- **Consultation des documents** : Voir et télécharger les états des lieux
- **Accès en lecture seule** : Interface simplifiée pour consulter

### Pour les Admins
- **Gestion des modèles** : Uploader des modèles PDF personnalisés
- **Configuration par type** : Modèles d'entrée/sortie par nombre de pièces
- **Activation/désactivation** : Contrôler quels modèles sont disponibles

## 🗄️ Structure de la Base de Données

### Table `etat_des_lieux_documents`
```sql
- id (UUID)
- lease_id (UUID) - Référence vers le bail
- property_id (UUID) - Référence vers la propriété
- type (VARCHAR) - 'entree' ou 'sortie'
- status (VARCHAR) - 'draft', 'completed', 'signed'
- file_url (TEXT) - URL du fichier uploadé
- file_name (VARCHAR) - Nom du fichier
- file_size (INTEGER) - Taille en octets
- digital_data (JSONB) - Données de l'état numérique
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Table `etat_des_lieux_templates`
```sql
- id (UUID)
- name (VARCHAR) - Nom du modèle
- type (VARCHAR) - 'entree' ou 'sortie'
- room_count (INTEGER) - Nombre de pièces
- description (TEXT) - Description optionnelle
- file_url (TEXT) - URL du fichier PDF
- file_name (VARCHAR) - Nom du fichier
- file_size (INTEGER) - Taille en octets
- mime_type (VARCHAR) - Type MIME
- is_active (BOOLEAN) - Modèle actif ou non
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🔐 Sécurité

### Politiques RLS (Row Level Security)

**Pour `etat_des_lieux_documents` :**
- Les propriétaires peuvent gérer les documents de leurs baux
- Les locataires peuvent voir les documents de leurs baux
- Les admins ont accès complet

**Pour `etat_des_lieux_templates` :**
- Les admins peuvent gérer tous les modèles
- Les utilisateurs peuvent voir les modèles actifs (lecture seule)

## 🛠️ Dépannage

### Problème : "Cannot find module 'react'"
- Vérifiez que les dépendances sont installées : `npm install`
- Redémarrez le serveur de développement

### Problème : Accès refusé à `/admin/etat-des-lieux-templates`
- Vérifiez que l'utilisateur a le rôle "admin"
- Exécutez les migrations : `node scripts/setup-etat-des-lieux.js`
- Vérifiez les politiques RLS dans Supabase

### Problème : Erreur de compilation JSX
- Vérifiez que tous les imports sont corrects
- Assurez-vous que les composants UI sont bien installés

### Problème : Tables non trouvées
- Exécutez le script de migration
- Vérifiez les permissions Supabase
- Vérifiez les variables d'environnement

## 📚 API Endpoints

### Documents d'État des Lieux
- `GET /api/leases/[id]/etat-des-lieux` - Liste des documents
- `POST /api/leases/[id]/etat-des-lieux/upload` - Upload d'un document
- `POST /api/leases/[id]/etat-des-lieux/digital` - Sauvegarde numérique

### Modèles Admin
- `GET /api/admin/etat-des-lieux-templates` - Liste des modèles
- `POST /api/admin/etat-des-lieux-templates` - Créer un modèle
- `PUT /api/admin/etat-des-lieux-templates/[id]` - Modifier un modèle
- `DELETE /api/admin/etat-des-lieux-templates/[id]` - Supprimer un modèle

### Génération de Modèles
- `POST /api/etat-des-lieux/template` - Générer un modèle PDF

## 🎯 Prochaines Étapes

1. **Signatures numériques** : Ajouter la fonctionnalité de signature
2. **Photos** : Implémenter l'upload de photos
3. **Export PDF** : Générer des PDFs à partir des données numériques
4. **Notifications** : Notifier les parties lors des changements
5. **Historique** : Tracker les modifications des documents

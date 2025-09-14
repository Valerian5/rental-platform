# Gestion des Modèles d'État des Lieux - Interface Admin

Cette fonctionnalité permet aux administrateurs de gérer les modèles PDF d'état des lieux qui seront utilisés par les propriétaires.

## Vue d'ensemble

Le système fonctionne en deux niveaux :
1. **Modèles par défaut** : Générés automatiquement par l'application
2. **Modèles personnalisés** : Uploadés par l'admin et prioritaires sur les modèles par défaut

## Installation

### 1. Migration de la Base de Données

Exécutez le script de migration :

```bash
node scripts/run-etat-des-lieux-templates-migration.js
```

Ou exécutez manuellement le SQL dans l'interface Supabase :

```sql
-- Voir le fichier scripts/create-etat-des-lieux-templates-table.sql
```

### 2. Configuration des Variables d'Environnement

Assurez-vous que les variables suivantes sont configurées :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Utilisation

### Accès à l'Interface Admin

1. Connectez-vous en tant qu'administrateur
2. Allez sur `/admin`
3. Cliquez sur "Modèles État des Lieux" dans la sidebar

### Gestion des Modèles

#### Ajouter un Nouveau Modèle

1. Cliquez sur "Nouveau modèle"
2. Remplissez le formulaire :
   - **Nom** : Nom descriptif du modèle
   - **Type** : Entrée ou Sortie
   - **Nombre de pièces** : 1 à 6+ pièces
   - **Description** : Description optionnelle
   - **Fichier PDF** : Sélectionnez le fichier PDF
3. Cliquez sur "Uploader"

#### Modifier un Modèle Existant

1. Cliquez sur l'icône "Modifier" (crayon) dans la liste
2. Modifiez les informations souhaitées
3. Cliquez sur "Mettre à jour"

#### Activer/Désactiver un Modèle

1. Cliquez sur "Activer" ou "Désactiver" dans la liste
2. Les modèles désactivés ne seront plus utilisés par les propriétaires

#### Supprimer un Modèle

1. Cliquez sur l'icône "Supprimer" (poubelle) dans la liste
2. Confirmez la suppression
3. Le fichier sera supprimé du stockage et de la base de données

### Filtrage et Recherche

- **Recherche** : Tapez dans le champ de recherche pour filtrer par nom ou description
- **Type** : Filtrez par "Entrée" ou "Sortie"
- **Pièces** : Filtrez par nombre de pièces

## Structure des Modèles

### Types de Modèles

- **Entrée** : État des lieux d'entrée (remise des clés)
- **Sortie** : État des lieux de sortie (restitution des clés)

### Nombre de Pièces

Les modèles sont organisés par nombre de pièces :
- 1 pièce (Studio)
- 2 pièces (T2)
- 3 pièces (T3)
- 4 pièces (T4)
- 5 pièces (T5)
- 6+ pièces

### Contrainte d'Unicité

Il ne peut y avoir qu'un seul modèle actif par combinaison (type + nombre de pièces).
Si vous uploadez un nouveau modèle pour une combinaison existante, l'ancien sera automatiquement désactivé.

## API Endpoints

### GET `/api/admin/etat-des-lieux-templates`
Récupère tous les modèles d'état des lieux.

### POST `/api/admin/etat-des-lieux-templates`
Crée un nouveau modèle.

**Body (FormData)** :
- `name` : Nom du modèle
- `type` : "entree" ou "sortie"
- `room_count` : Nombre de pièces
- `description` : Description optionnelle
- `file` : Fichier PDF

### GET `/api/admin/etat-des-lieux-templates/[id]`
Récupère un modèle spécifique.

### PUT `/api/admin/etat-des-lieux-templates/[id]`
Met à jour un modèle.

### PATCH `/api/admin/etat-des-lieux-templates/[id]`
Met à jour partiellement un modèle (ex: statut actif/inactif).

### DELETE `/api/admin/etat-des-lieux-templates/[id]`
Supprime un modèle.

## Intégration avec les Propriétaires

### Priorité des Modèles

1. **Modèle personnalisé actif** : Si un modèle personnalisé existe pour le type et nombre de pièces
2. **Modèle par défaut** : Sinon, génération automatique par l'application

### Utilisation par les Propriétaires

Quand un propriétaire clique sur "Télécharger" dans l'onglet "État des lieux" :

1. L'API `/api/etat-des-lieux/template` est appelée
2. Elle cherche d'abord un modèle personnalisé actif
3. Si trouvé, elle retourne le fichier PDF personnalisé
4. Sinon, elle génère un modèle par défaut

## Structure de la Base de Données

### Table `etat_des_lieux_templates`

```sql
CREATE TABLE etat_des_lieux_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('entree', 'sortie')),
  room_count INTEGER NOT NULL CHECK (room_count > 0),
  description TEXT,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Index et Contraintes

- **Index** : Sur `type`, `room_count`, `is_active`, et combinaison `(type, room_count)`
- **Contrainte d'unicité** : Un seul modèle actif par `(type, room_count)`
- **RLS** : Seuls les admins peuvent modifier, tous peuvent lire les modèles actifs

## Stockage des Fichiers

Les fichiers PDF sont stockés dans Supabase Storage :
- **Bucket** : `etat-des-lieux-templates`
- **Chemin** : `admin/etat-des-lieux-templates/{filename}`
- **Format** : `etat-des-lieux-template-{type}-{room_count}pieces-{timestamp}.pdf`

## Bonnes Pratiques

### Création de Modèles

1. **Nommage** : Utilisez des noms descriptifs (ex: "État des lieux T3 - Entrée - Modèle 2024")
2. **Description** : Ajoutez des détails sur le modèle (version, date, spécificités)
3. **Qualité** : Assurez-vous que les PDF sont de bonne qualité et lisibles
4. **Taille** : Optimisez la taille des fichiers pour un téléchargement rapide

### Gestion des Versions

1. **Désactiver l'ancien** : Avant d'uploader une nouvelle version
2. **Tester** : Vérifiez que le nouveau modèle fonctionne correctement
3. **Documenter** : Notez les changements dans la description

### Maintenance

1. **Nettoyage** : Supprimez les modèles obsolètes
2. **Monitoring** : Surveillez l'utilisation des modèles
3. **Sauvegarde** : Gardez une copie des modèles importants

## Dépannage

### Erreur d'Upload

- Vérifiez la taille du fichier (limite Supabase)
- Vérifiez le format (PDF uniquement)
- Vérifiez les permissions de stockage

### Modèle Non Utilisé

- Vérifiez que le modèle est actif
- Vérifiez la correspondance type/nombre de pièces
- Vérifiez l'URL du fichier

### Erreur de Migration

- Vérifiez les permissions de la clé de service
- Exécutez manuellement le SQL dans Supabase
- Vérifiez que la fonction `exec_sql` existe

## Améliorations Futures

- [ ] Prévisualisation des modèles dans l'interface admin
- [ ] Historique des versions des modèles
- [ ] Statistiques d'utilisation des modèles
- [ ] Import/export en lot des modèles
- [ ] Validation automatique des modèles PDF
- [ ] Notifications lors de l'upload de nouveaux modèles

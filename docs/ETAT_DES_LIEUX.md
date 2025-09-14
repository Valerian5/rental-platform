# Fonctionnalité État des Lieux

Cette fonctionnalité permet aux propriétaires de gérer les états des lieux d'entrée et de sortie pour leurs baux, et aux locataires de consulter ces documents.

## Fonctionnalités

### Côté Propriétaire (Owner)

1. **Téléchargement de modèles PDF** : Génération automatique de modèles PDF adaptés au nombre de pièces du logement
2. **État des lieux numérique** : Interface pour créer un état des lieux directement en ligne
3. **Upload de documents** : Possibilité d'uploader des documents d'état des lieux complétés
4. **Gestion des documents** : Visualisation et gestion de tous les documents d'état des lieux

### Côté Locataire (Tenant)

1. **Consultation des documents** : Accès en lecture seule aux documents d'état des lieux
2. **Téléchargement** : Possibilité de télécharger les documents PDF
3. **Informations contextuelles** : Explications sur l'importance des états des lieux

## Structure de la Base de Données

### Table `etat_des_lieux_documents`

```sql
CREATE TABLE etat_des_lieux_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('entree', 'sortie')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'signed')),
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  digital_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Installation

### 1. Migration de la Base de Données

Exécutez le script de migration :

```bash
node scripts/run-etat-des-lieux-migration.js
```

Ou exécutez manuellement le SQL dans l'interface Supabase :

```sql
-- Voir le fichier scripts/create-etat-des-lieux-table.sql
```

### 2. Configuration des Variables d'Environnement

Assurez-vous que les variables suivantes sont configurées :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Utilisation

### Pour les Propriétaires

1. **Accéder à l'état des lieux** :
   - Aller sur `/owner/leases/[id]`
   - Cliquer sur l'onglet "État des lieux"

2. **Télécharger un modèle** :
   - Choisir entre "Entrée" ou "Sortie"
   - Le PDF sera généré automatiquement selon le nombre de pièces

3. **Créer un état numérique** :
   - Cliquer sur l'onglet "État numérique"
   - Remplir les informations générales
   - Détailler l'état de chaque pièce
   - Sauvegarder

4. **Uploader un document** :
   - Utiliser le formulaire d'upload
   - Sélectionner le type (entrée/sortie)
   - Le document sera stocké et accessible au locataire

### Pour les Locataires

1. **Consulter les documents** :
   - Aller sur `/tenant/leases/[id]`
   - Cliquer sur l'onglet "État des lieux"

2. **Télécharger un document** :
   - Cliquer sur "Télécharger" pour un document PDF
   - Cliquer sur "Voir" pour visualiser en ligne

## API Endpoints

### GET `/api/leases/[id]/etat-des-lieux`
Récupère tous les documents d'état des lieux pour un bail.

### POST `/api/leases/[id]/etat-des-lieux`
Crée un nouveau document d'état des lieux.

### POST `/api/leases/[id]/etat-des-lieux/upload`
Upload un fichier d'état des lieux.

### POST `/api/leases/[id]/etat-des-lieux/digital`
Sauvegarde un état des lieux numérique.

### POST `/api/etat-des-lieux/template`
Génère un modèle PDF d'état des lieux.

## Modèles PDF

Les modèles PDF sont générés dynamiquement selon :
- Le nombre de pièces du logement (1 à 5+ pièces)
- Le type (entrée ou sortie)
- Les informations du bail et de la propriété

### Structure des modèles

1. **Informations générales** : Propriétaire, locataire, adresse, date
2. **Relevés de compteurs** : Électricité, gaz, eau
3. **Nombre de clés** : Comptage des clés remises
4. **État des pièces** : Détail pièce par pièce
5. **Signatures** : Espaces pour les signatures

## Sécurité

- **RLS (Row Level Security)** : Les locataires ne peuvent voir que leurs propres documents
- **Validation des types** : Seuls les types "entree" et "sortie" sont autorisés
- **Contrôle d'accès** : Vérification des permissions propriétaire/locataire

## Personnalisation

### Ajouter de nouveaux types de pièces

Modifiez le fichier `lib/etat-des-lieux-pdf-generator.ts` :

```typescript
const roomTypes = {
  1: ["Pièce principale"],
  2: ["Pièce principale", "Chambre"],
  // Ajouter d'autres configurations...
}
```

### Modifier les critères d'évaluation

Dans `components/EtatDesLieuxSection.tsx`, modifiez les options :

```typescript
<SelectItem value="excellent">Très bon état</SelectItem>
<SelectItem value="good">Bon état</SelectItem>
<SelectItem value="fair">État moyen</SelectItem>
<SelectItem value="poor">Mauvais état</SelectItem>
```

## Dépannage

### Erreur de migration

Si la migration échoue :

1. Vérifiez les permissions de la clé de service
2. Exécutez manuellement le SQL dans l'interface Supabase
3. Vérifiez que la fonction `exec_sql` existe

### Erreur de génération PDF

Si la génération PDF échoue :

1. Vérifiez que les données de propriété sont correctes
2. Vérifiez les logs du serveur
3. Testez avec un logement simple (1 pièce)

### Problème d'accès aux documents

Si les documents ne s'affichent pas :

1. Vérifiez les politiques RLS
2. Vérifiez que l'utilisateur est bien propriétaire/locataire du bail
3. Vérifiez les permissions de stockage Supabase

## Améliorations Futures

- [ ] Intégration avec des services de signature électronique
- [ ] Génération de PDF plus avancée avec images
- [ ] Notifications automatiques pour les états des lieux
- [ ] Comparaison automatique entre entrée et sortie
- [ ] Export des données en Excel/CSV
- [ ] Intégration avec des services de stockage cloud

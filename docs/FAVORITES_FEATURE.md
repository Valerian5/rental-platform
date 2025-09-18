# Fonctionnalité de Favoris

## Vue d'ensemble

La fonctionnalité de favoris permet aux utilisateurs (principalement les locataires) de sauvegarder les propriétés qui les intéressent pour un accès rapide ultérieur.

## Structure de la base de données

### Table `favorites`

```sql
CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_user_id_property_id_key UNIQUE (user_id, property_id)
) TABLESPACE pg_default;
```

**Contraintes :**
- Clé primaire : `id` (UUID auto-généré)
- Clé unique : `(user_id, property_id)` - Un utilisateur ne peut ajouter une propriété qu'une seule fois
- Clés étrangères : `user_id` et `property_id` référencent les tables `users` et `properties`

## API Endpoints

### GET `/api/favorites`
Récupère tous les favoris de l'utilisateur connecté.

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "property_id": "uuid",
      "created_at": "timestamp",
      "property": {
        "id": "uuid",
        "title": "string",
        "address": "string",
        "city": "string",
        "postal_code": "string",
        "price": "number",
        "surface": "number",
        "rooms": "number",
        "property_images": [...],
        "owner": {...}
      }
    }
  ]
}
```

### POST `/api/favorites`
Ajoute une propriété aux favoris.

**Body :**
```json
{
  "property_id": "uuid"
}
```

### DELETE `/api/favorites?property_id=uuid`
Retire une propriété des favoris.

### POST `/api/favorites/toggle`
Toggle l'état favori d'une propriété (ajoute ou retire).

**Body :**
```json
{
  "property_id": "uuid"
}
```

**Réponse :**
```json
{
  "success": true,
  "isFavorite": true,
  "message": "Bien ajouté aux favoris"
}
```

### GET `/api/favorites/check?property_id=uuid`
Vérifie si une propriété est en favori.

**Réponse :**
```json
{
  "success": true,
  "isFavorite": true
}
```

## Composants Frontend

### `FavoriteButton`
Bouton réutilisable pour ajouter/retirer des favoris.

**Props :**
- `propertyId`: string - ID de la propriété
- `userId`: string - ID de l'utilisateur (optionnel)
- `initialIsFavorite`: boolean - État initial
- `size`: "sm" | "md" | "lg" - Taille du bouton
- `variant`: "default" | "ghost" | "outline" - Style du bouton
- `onToggle`: (isFavorite: boolean) => void - Callback

**Utilisation :**
```tsx
<FavoriteButton
  propertyId={property.id}
  userId={currentUser?.id}
  size="sm"
  variant="outline"
  onToggle={(isFavorite) => console.log('Favori:', isFavorite)}
/>
```

### `FavoritesList`
Composant pour afficher la liste des favoris de l'utilisateur.

**Props :**
- `userId`: string - ID de l'utilisateur
- `onRemove`: (propertyId: string) => void - Callback de suppression

**Utilisation :**
```tsx
<FavoritesList 
  userId={currentUser.id}
  onRemove={(propertyId) => console.log('Supprimé:', propertyId)}
/>
```

### `EnhancedPropertyCard`
Carte de propriété améliorée avec bouton de favoris intégré.

**Props :**
- `property`: Property - Données de la propriété
- `userId`: string - ID de l'utilisateur
- `showFavoriteButton`: boolean - Afficher le bouton favori
- `onFavoriteToggle`: (propertyId: string, isFavorite: boolean) => void

## Pages

### `/favorites`
Page publique pour afficher les favoris (nécessite authentification).

### `/tenant/favorites`
Page des favoris dans l'espace locataire.

## Service Backend

### `favoritesService`
Service pour gérer les opérations de favoris.

**Méthodes :**
- `addToFavorites(userId, propertyId)` - Ajouter aux favoris
- `removeFromFavorites(userId, propertyId)` - Retirer des favoris
- `isFavorite(userId, propertyId)` - Vérifier si en favori
- `getUserFavorites(userId)` - Récupérer les favoris d'un utilisateur
- `toggleFavorite(userId, propertyId)` - Toggle l'état favori

## Intégration

### Dans les pages de propriétés
Le bouton de favoris est automatiquement intégré dans :
- Page de détail d'une propriété (`/properties/[id]`)
- Page de recherche des locataires (`/tenant/search`)

### Dans la navigation
- Lien "Favoris" dans le menu des locataires
- Lien dans la page de navigation de développement

## Sécurité

- Tous les endpoints vérifient l'authentification
- Les utilisateurs ne peuvent gérer que leurs propres favoris
- Validation des données d'entrée
- Gestion des erreurs appropriée

## Tests

Un script de test SQL est disponible dans `scripts/test-favorites.sql` pour tester :
- La structure de la table
- Les contraintes d'unicité
- Les opérations CRUD
- Les jointures avec les propriétés

## Utilisation

1. **Ajouter aux favoris :** Cliquer sur l'icône cœur dans les cartes de propriétés
2. **Voir ses favoris :** Aller dans "Favoris" dans le menu de navigation
3. **Retirer des favoris :** Cliquer sur l'icône cœur remplie ou utiliser le bouton "Retirer" dans la liste

## Notes techniques

- Utilisation de Supabase pour la base de données
- Gestion d'état locale avec React hooks
- Notifications toast pour le feedback utilisateur
- Interface responsive et accessible
- Optimisation des requêtes avec jointures

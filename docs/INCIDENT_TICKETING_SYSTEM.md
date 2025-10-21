# Système de Ticketing pour les Incidents

## Vue d'ensemble

Le système de ticketing pour les incidents permet aux propriétaires et locataires de communiquer directement sur les incidents via un système de messagerie intégré, similaire au système de messaging existant.

## Architecture

### Composants principaux

1. **Service de ticketing** (`lib/incident-ticketing-service.ts`)
   - Gestion des tickets/messages pour les incidents
   - API pour créer, récupérer et marquer les tickets comme lus
   - Statistiques et métriques

2. **Composant de ticketing** (`components/incident-ticketing.tsx`)
   - Interface utilisateur pour afficher et envoyer des messages
   - Gestion des pièces jointes
   - Auto-scroll et notifications

3. **API Routes** (`app/api/incidents/[id]/tickets/route.ts`)
   - Endpoints pour gérer les tickets
   - GET : Récupérer les tickets d'un incident
   - POST : Créer un nouveau ticket

4. **Hook personnalisé** (`hooks/use-incident-ticketing.ts`)
   - Logique métier réutilisable
   - Gestion de l'état et des effets de bord
   - Auto-refresh et notifications

## Fonctionnalités

### Pour les Propriétaires
- Voir tous les messages liés à leurs incidents
- Répondre aux locataires directement
- Marquer les messages comme lus
- Recevoir des notifications pour les nouveaux messages

### Pour les Locataires
- Voir tous les messages liés à leurs incidents
- Répondre aux propriétaires directement
- Ajouter des pièces jointes aux messages
- Suivre l'historique des échanges

### Fonctionnalités communes
- Interface de messagerie en temps réel
- Support des pièces jointes
- Notifications visuelles pour les nouveaux messages
- Auto-scroll vers les nouveaux messages
- Historique complet des échanges

## Structure de la base de données

### Table `incident_responses`
```sql
- id: UUID (clé primaire)
- incident_id: UUID (référence vers incidents)
- author_id: UUID (référence vers users)
- author_name: TEXT (nom complet de l'auteur)
- author_type: TEXT ('owner' ou 'tenant')
- message: TEXT (contenu du message)
- attachments: TEXT[] (liste des pièces jointes)
- is_read: BOOLEAN (message lu ou non)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Intégration dans les pages

### Pages Owner
- `app/owner/rental-management/incidents/[id]/page.tsx`
- Remplacement de l'historique des échanges par le composant `IncidentTicketing`

### Pages Tenant
- `app/tenant/incidents/[id]/page.tsx`
- Remplacement de l'historique des échanges par le composant `IncidentTicketing`

## Utilisation

### Composant de base
```tsx
import IncidentTicketing from "@/components/incident-ticketing"

<IncidentTicketing
  incidentId={incident.id}
  currentUser={currentUser}
  onTicketSent={loadIncidentData}
/>
```

### Hook personnalisé
```tsx
import { useIncidentTicketing } from "@/hooks/use-incident-ticketing"

const {
  tickets,
  loading,
  sending,
  sendTicket,
  hasUnreadMessages,
  unreadCount
} = useIncidentTicketing({
  incidentId: "incident-id",
  currentUser: currentUser,
  autoRefresh: true
})
```

### Service de ticketing
```tsx
import { incidentTicketingService } from "@/lib/incident-ticketing-service"

// Récupérer les tickets
const tickets = await incidentTicketingService.getIncidentTickets(incidentId)

// Créer un ticket
const ticket = await incidentTicketingService.createIncidentTicket({
  incident_id: incidentId,
  user_id: userId,
  user_type: "owner",
  message: "Message content",
  attachments: []
})
```

## Composants supplémentaires

### Dashboard de ticketing
- `components/incident-ticketing-dashboard.tsx`
- Vue d'ensemble des statistiques
- Activité récente
- Métriques de performance

### Liste des incidents avec tickets
- `components/incident-list-with-tickets.tsx`
- Affichage des incidents avec indicateurs de nouveaux messages
- Compteurs de messages non lus

### Notifications
- `components/incident-ticket-notification.tsx`
- Badges de notification
- Indicateurs visuels pour les nouveaux messages

## Migration

### Script SQL
Le fichier `scripts/update_incident_responses_table.sql` contient les modifications nécessaires pour la base de données :

- Ajout des colonnes manquantes
- Création des index pour les performances
- Mise à jour des données existantes

### Étapes de migration
1. Exécuter le script SQL
2. Déployer les nouveaux composants
3. Mettre à jour les pages existantes
4. Tester le système de ticketing

## Avantages

1. **Expérience utilisateur améliorée**
   - Interface familière basée sur le système de messaging
   - Communication en temps réel
   - Notifications visuelles

2. **Gestion centralisée**
   - Tous les échanges dans un seul endroit
   - Historique complet
   - Suivi des statuts

3. **Performance**
   - Requêtes optimisées
   - Index de base de données
   - Mise en cache intelligente

4. **Extensibilité**
   - Architecture modulaire
   - Composants réutilisables
   - API RESTful

## Maintenance

### Surveillance
- Logs détaillés pour le debugging
- Métriques de performance
- Alertes en cas d'erreur

### Mises à jour
- Versioning des composants
- Migration des données
- Tests de régression

## Sécurité

- Validation des données côté serveur
- Authentification requise
- Autorisation basée sur les rôles
- Protection contre les injections SQL
- Validation des pièces jointes

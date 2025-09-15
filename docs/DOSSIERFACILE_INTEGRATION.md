# Intégration DossierFacile Connect

## Vue d'ensemble

Cette intégration utilise **DossierFacile Connect** pour permettre aux locataires de choisir entre deux méthodes pour créer leur dossier de location :
1. **Dossier manuel** : Création via l'interface de l'application
2. **Dossier DossierFacile Connect** : Import automatique via OAuth2 depuis la plateforme officielle DossierFacile

L'intégration suit la [documentation officielle DossierFacile Connect](https://partenaire.dossierfacile.logement.gouv.fr/documentation-technique/dossierfacile-connect).

## Fonctionnalités

### Pour les locataires

- **Choix de méthode** : Interface claire pour choisir entre dossier manuel et DossierFacile
- **Vérification automatique** : Import des données via code de vérification DossierFacile
- **Conversion intelligente** : Transformation automatique des données DossierFacile en format RentalFile
- **Scoring amélioré** : Bonus de score pour les dossiers certifiés DossierFacile

### Pour les propriétaires

- **Badge de certification** : Affichage clair des dossiers DossierFacile
- **Informations détaillées** : Accès aux données extraites du dossier DossierFacile
- **Téléchargement** : Possibilité de télécharger le PDF du dossier certifié
- **Score de confiance** : Bonus dans le calcul de compatibilité

## Architecture technique

### Services

- **`dossierfacile-service.ts`** : Service principal pour la gestion des dossiers DossierFacile
- **`scoring-preferences-service.ts`** : Intégration du bonus DossierFacile dans le scoring
- **`rental-file-service.ts`** : Extension pour supporter les données DossierFacile

### API

- **`/api/dossierfacile`** : CRUD des dossiers DossierFacile
- **`/api/dossierfacile/convert`** : Conversion vers RentalFile

### Composants

- **`DossierFacileIntegration`** : Interface de choix et import
- **`DossierFacileBadge`** : Badge de certification
- **`ApplicationDossierFacileInfo`** : Affichage pour les propriétaires

### Base de données

- **Table `dossierfacile_dossiers`** : Stockage des dossiers importés
- **Extension `rental_files`** : Colonnes pour l'intégration DossierFacile

## Installation

### 1. Migration de la base de données

```bash
node scripts/run-dossierfacile-migration.js
```

### 2. Configuration des variables d'environnement

Exécutez le script de configuration :

```bash
node scripts/setup-dossierfacile-connect.js
```

Puis mettez à jour `.env.local` avec vos vrais identifiants :

```env
# DossierFacile Connect OAuth2 (obtenez auprès de DossierFacile)
DOSSIERFACILE_CLIENT_ID=your_client_id_here
DOSSIERFACILE_CLIENT_SECRET=your_client_secret_here

# URL de base de votre application
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Clé API pour les webhooks (optionnel)
DOSSIERFACILE_WEBHOOK_API_KEY=your_webhook_api_key_here
```

### 3. Test de l'intégration

```bash
node scripts/test-dossierfacile-integration.js
```

## Utilisation

### Pour les locataires

1. Accédez à `/tenant/profile/rental-file`
2. Choisissez "Dossier DossierFacile"
3. Saisissez votre code de vérification DossierFacile
4. Cliquez sur "Vérifier" pour importer vos données
5. Cliquez sur "Convertir en RentalFile" pour finaliser

### Pour les propriétaires

1. Consultez les candidatures avec badge DossierFacile
2. Cliquez sur "Détails" pour voir les informations extraites
3. Téléchargez le PDF du dossier certifié si nécessaire

## Structure des données

### DossierFacileData

```typescript
interface DossierFacileData {
  id: string
  tenant_id: string
  dossierfacile_id?: string
  dossierfacile_verification_code?: string
  dossierfacile_pdf_url?: string
  dossierfacile_status?: "pending" | "verified" | "rejected" | "converted"
  dossierfacile_verified_at?: string
  dossierfacile_data?: {
    personal_info: { ... }
    professional_info: { ... }
    financial_info: { ... }
    documents: { ... }
    verification: { ... }
  }
}
```

### Bonus de scoring

- **Dossier certifié** : +10 points
- **Dossier vérifié** : +5 points supplémentaires
- **Données complètes** : +2 points par type de données (revenus, profession, documents)

## Sécurité

- **RLS activé** : Les utilisateurs ne voient que leurs propres dossiers
- **Vérification API** : Validation des codes via l'API officielle DossierFacile
- **Chiffrement** : Stockage sécurisé des données sensibles

## Monitoring

- **Logs détaillés** : Suivi des opérations d'import et de conversion
- **Métriques de scoring** : Tracking du bonus DossierFacile
- **Erreurs API** : Gestion des échecs de vérification

## Évolutions futures

- **API officielle** : Intégration avec la vraie API DossierFacile
- **Synchronisation** : Mise à jour automatique des dossiers
- **Analytics** : Statistiques d'utilisation des dossiers DossierFacile
- **Notifications** : Alertes pour les changements de statut

## Support

Pour toute question ou problème :
1. Vérifiez les logs de l'application
2. Consultez la documentation DossierFacile officielle
3. Testez avec le script de test fourni
4. Contactez l'équipe de développement

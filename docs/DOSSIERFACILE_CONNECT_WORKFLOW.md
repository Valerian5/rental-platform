# Workflow DossierFacile Connect

## 🎯 Objectif

DossierFacile Connect permet d'importer automatiquement les données déjà vérifiées par DossierFacile, sans avoir à les ressaisir manuellement.

## 🔄 Workflow complet

### 1. **Création du dossier sur DossierFacile** (obligatoire)

Le locataire doit d'abord créer son dossier sur la plateforme officielle :

1. Aller sur [DossierFacile.gouv.fr](https://www.dossierfacile.logement.gouv.fr)
2. Créer un compte et se connecter
3. Remplir son dossier de location :
   - Informations personnelles
   - Justificatifs de revenus (fiches de paie, etc.)
   - Documents d'identité
   - Avis d'imposition
   - Tous les documents requis
4. Soumettre le dossier pour vérification
5. Attendre la certification par DossierFacile

### 2. **Connexion via votre plateforme**

Une fois le dossier certifié sur DossierFacile :

1. Le locataire va sur votre page de création de dossier
2. Choisit "Via DossierFacile"
3. Clique sur "Se connecter à DossierFacile"
4. Est redirigé vers DossierFacile (OAuth2)
5. Autorise l'accès à ses données
6. Est redirigé vers votre plateforme

### 3. **Import automatique des données**

Votre API récupère automatiquement :
- ✅ Informations personnelles
- ✅ Revenus mensuels
- ✅ Profession et entreprise
- ✅ Type de contrat
- ✅ Statut de certification

### 4. **Conversion en RentalFile**

Les données importées sont converties en format RentalFile :
- Badge "Certifié DossierFacile" affiché
- Bonus dans le calcul de compatibilité
- Dossier prêt pour les candidatures

## ⚠️ Points importants

### Ce que DossierFacile Connect NE fait PAS :
- ❌ Ne permet pas d'uploader des documents
- ❌ Ne vérifie pas les documents
- ❌ Ne remplace pas la création sur DossierFacile.gouv.fr

### Ce que DossierFacile Connect FAIT :
- ✅ Importe les données déjà vérifiées
- ✅ Certifie le dossier
- ✅ Améliore le scoring de compatibilité
- ✅ Évite la ressaisie manuelle

## 🔧 Configuration technique

### Variables d'environnement requises :
```env
DOSSIERFACILE_CLIENT_ID=your_client_id
DOSSIERFACILE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SITE_URL=https://www.louerici.fr
```

### URLs de callback :
- **Callback** : `https://www.louerici.fr/api/dossierfacile/callback`
- **Webhook** : `https://www.louerici.fr/api/dossierfacile/webhook`

## 📊 Avantages pour le locataire

1. **Gain de temps** : Pas besoin de ressaisir les informations
2. **Certification officielle** : Dossier conforme aux exigences légales
3. **Meilleur scoring** : Bonus dans le calcul de compatibilité
4. **Confiance des propriétaires** : Dossier certifié plus attractif

## 📊 Avantages pour le propriétaire

1. **Dossiers vérifiés** : Documents authentifiés par DossierFacile
2. **Données fiables** : Informations déjà validées
3. **Gain de temps** : Moins de vérifications manuelles
4. **Conformité légale** : Respect des exigences réglementaires

## 🚀 Prochaines étapes

1. **Obtenir les identifiants OAuth2** auprès de DossierFacile
2. **Configurer les variables d'environnement**
3. **Tester l'intégration** en préproduction
4. **Déployer en production**

## 📞 Support

- **Documentation DossierFacile** : [partenaire.dossierfacile.logement.gouv.fr](https://partenaire.dossierfacile.logement.gouv.fr/documentation-technique/dossierfacile-connect)
- **Support technique** : contact@louer-ici.fr

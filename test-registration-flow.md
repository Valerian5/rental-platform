# Test du flux d'inscription

## Étapes de test

### 1. Test inscription propriétaire
1. Aller sur `/register`
2. Sélectionner "Propriétaire"
3. Cliquer sur "Créer mon profil propriétaire"
4. Remplir le formulaire d'inscription
5. Cliquer sur "Créer mon compte"
6. **Résultat attendu** : Redirection vers `/owner/dashboard` avec message de succès

### 2. Test inscription locataire
1. Aller sur `/register`
2. Sélectionner "Locataire"
3. Cliquer sur "Créer mon profil locataire"
4. Remplir le formulaire d'inscription
5. Cliquer sur "Créer mon compte"
6. **Résultat attendu** : Redirection vers `/tenant/dashboard` avec message de succès

### 3. Test connexion propriétaire
1. Aller sur `/owner/login`
2. Saisir les identifiants d'un compte propriétaire existant
3. Cliquer sur "Se connecter"
4. **Résultat attendu** : Redirection vers `/owner/dashboard`

### 4. Test connexion générale
1. Aller sur `/login`
2. Saisir les identifiants d'un compte existant
3. Cliquer sur "Se connecter"
4. **Résultat attendu** : Redirection vers le dashboard approprié selon le type d'utilisateur

## Vérifications techniques

### APIs à tester
- `GET /api/public/logo` - Doit retourner le logo ou null
- `POST /api/admin/upload-logo` - Upload de logo depuis l'admin
- `GET /api/admin/settings` - Récupération des paramètres

### Base de données
- Table `site_settings` doit contenir les paramètres par défaut
- Table `users` doit être accessible pour l'inscription
- RLS doit être configuré correctement

## Problèmes potentiels

1. **Logo ne s'affiche pas** : Vérifier que `site_settings.logos.main` contient une URL valide
2. **Redirection vers login** : Vérifier que `authService.register()` connecte automatiquement l'utilisateur
3. **Erreur 401** : Vérifier que les APIs utilisent le bon token d'authentification
4. **Page dashboard inaccessible** : Vérifier que les pages de dashboard existent et sont accessibles

# Configuration des templates d'email Supabase

## 🚀 Configuration complète des templates d'email

### 1. Templates disponibles

#### **1.1 Confirmation d'email (Email Confirmation)**
- **Fichier** : `templates/emails/email-confirmation-supabase.html`
- **Usage** : Envoyé lors de la création de compte
- **Couleur** : Bleu (#2563eb)
- **Fonctionnalités** :
  - Design moderne et responsive
  - Instructions claires pour l'utilisateur
  - Informations sur les fonctionnalités disponibles
  - Sécurité et validité du lien

#### **1.2 Changement d'email (Email Change)**
- **Fichier** : `templates/emails/email-change-supabase.html`
- **Usage** : Envoyé lors du changement d'adresse email
- **Couleur** : Violet (#7c3aed)
- **Fonctionnalités** :
  - Affichage de l'ancienne et nouvelle adresse
  - Avertissements de sécurité
  - Instructions de confirmation

#### **1.3 Réinitialisation de mot de passe (Reset Password)**
- **Fichier** : `templates/emails/password-reset-custom.html` (existant)
- **Usage** : Envoyé lors de la demande de réinitialisation
- **Couleur** : Rouge (#dc2626)
- **Fonctionnalités** :
  - Instructions de réinitialisation
  - Critères de sécurité du mot de passe
  - Étapes détaillées

### 2. Configuration dans Supabase Dashboard

#### **2.1 Accéder aux templates**
1. **Aller dans Supabase Dashboard**
2. **Authentication > Email Templates**
3. **Sélectionner le template à configurer**

#### **2.2 Template de confirmation d'email**
1. **Sélectionner "Email Confirmation"**
2. **Configurer le Subject :**
   ```
   Confirmez votre adresse email
   ```
3. **Copier le contenu HTML** depuis `templates/emails/email-confirmation-supabase.html`
4. **Coller dans le champ "Body HTML"**
5. **Sauvegarder**

#### **2.3 Template de changement d'email**
1. **Sélectionner "Email Change"**
2. **Configurer le Subject :**
   ```
   Confirmez votre nouvelle adresse email
   ```
3. **Copier le contenu HTML** depuis `templates/emails/email-change-supabase.html`
4. **Coller dans le champ "Body HTML"**
5. **Sauvegarder**

#### **2.4 Template de réinitialisation de mot de passe**
1. **Sélectionner "Reset Password"**
2. **Configurer le Subject :**
   ```
   Réinitialisation de votre mot de passe
   ```
3. **Copier le contenu HTML** depuis `scripts/configure-supabase-password-reset-template.sql`
4. **Coller dans le champ "Body HTML"**
5. **Sauvegarder**

### 3. Configuration des URLs de redirection

#### **3.1 URLs de redirection requises**
Dans **Supabase Dashboard > Authentication > URL Configuration** :

**Site URL :**
```
https://votre-domaine.com
```

**Redirect URLs :**
```
https://votre-domaine.com/auth/callback
https://votre-domaine.com/reset-password
http://localhost:3000/auth/callback
http://localhost:3000/reset-password
```

### 4. Configuration des paramètres d'authentification

#### **4.1 Paramètres requis**
Dans **Supabase Dashboard > Authentication > Settings** :

- ✅ **Email confirmations** : Enabled
- ✅ **Secure email change** : Enabled
- ✅ **Double confirm email changes** : Enabled
- ✅ **Enable email confirmations** : Enabled

### 5. Variables d'environnement

#### **5.1 Variables requises**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
```

### 6. Test des templates

#### **6.1 Test de confirmation d'email**
1. **Créer un compte de test**
2. **Vérifier la réception de l'email**
3. **Vérifier le design et le contenu**
4. **Cliquer sur le lien de confirmation**
5. **Vérifier la redirection**

#### **6.2 Test de changement d'email**
1. **Se connecter avec un compte existant**
2. **Aller dans les paramètres du compte**
3. **Changer l'adresse email**
4. **Vérifier la réception de l'email**
5. **Cliquer sur le lien de confirmation**
6. **Vérifier le changement**

#### **6.3 Test de réinitialisation de mot de passe**
1. **Aller sur `/forgot-password`**
2. **Saisir un email valide**
3. **Vérifier la réception de l'email**
4. **Cliquer sur le lien de réinitialisation**
5. **Vérifier la redirection vers `/reset-password`**
6. **Saisir un nouveau mot de passe**
7. **Vérifier la réinitialisation**

### 7. Personnalisation des templates

#### **7.1 Modifier les couleurs**
```css
/* Couleur principale */
.header {
    background: linear-gradient(135deg, #votre-couleur 0%, #couleur-foncee 100%);
}

.cta-button {
    background: #votre-couleur;
}
```

#### **7.2 Ajouter votre logo**
```html
<div class="header">
    <img src="https://votre-domaine.com/logo.png" alt="Votre Logo" class="logo">
    <h1>Votre Nom</h1>
</div>
```

#### **7.3 Modifier les textes**
- **Titre** : Modifier les classes `.confirm-title`, `.change-title`
- **Sous-titre** : Modifier les classes `.confirm-subtitle`, `.change-subtitle`
- **Contenu** : Modifier les paragraphes et listes

### 8. Monitoring et logs

#### **8.1 Logs Supabase**
- **Aller dans Supabase Dashboard > Logs > Auth**
- **Chercher les événements d'email**
- **Vérifier les taux de délivrabilité**

#### **8.2 Métriques importantes**
- **Taux de délivrabilité** : > 95%
- **Temps de livraison** : < 30 secondes
- **Taux d'ouverture** : > 20%
- **Taux de clic** : > 5%

### 9. Dépannage

#### **9.1 Emails non reçus**
**Solutions :**
1. **Vérifier la configuration des templates**
2. **Vérifier les URLs de redirection**
3. **Vérifier les variables d'environnement**
4. **Vérifier le dossier spam**
5. **Tester avec un email de développement**

#### **9.2 Liens ne fonctionnent pas**
**Solutions :**
1. **Vérifier que `NEXT_PUBLIC_SITE_URL` est correct**
2. **Vérifier que les URLs de redirection sont configurées**
3. **Vérifier que le domaine est autorisé**

#### **9.3 Design cassé**
**Solutions :**
1. **Vérifier que le HTML est valide**
2. **Tester sur différents clients email**
3. **Vérifier que les CSS sont corrects**
4. **Optimiser pour mobile**

### 10. Sécurité

#### **10.1 Bonnes pratiques**
- **Utiliser HTTPS uniquement**
- **Valider les liens de confirmation**
- **Limiter la durée de validité des liens**
- **Surveiller les tentatives d'accès non autorisées**

#### **10.2 Variables sensibles**
- **Ne pas exposer les clés API**
- **Utiliser des variables d'environnement**
- **Sécuriser les URLs de redirection**

### 11. Performance

#### **11.1 Optimisation**
- **Minimiser la taille des images**
- **Utiliser des CSS inline**
- **Tester sur différents clients email**
- **Optimiser pour mobile**

#### **11.2 Tests de compatibilité**
- **Gmail** : Test principal
- **Outlook** : Test important
- **Apple Mail** : Test mobile
- **Thunderbird** : Test alternatif

### 12. Maintenance

#### **12.1 Mises à jour régulières**
- **Vérifier les templates tous les 3 mois**
- **Tester les liens de redirection**
- **Vérifier les variables d'environnement**
- **Mettre à jour les textes si nécessaire**

#### **12.2 Backup**
- **Sauvegarder les templates personnalisés**
- **Documenter les modifications**
- **Tester après chaque changement**

---

**Note :** Ce guide couvre la configuration complète des templates d'email Supabase. Pour des cas spécifiques, consultez la [documentation officielle de Supabase](https://supabase.com/docs/guides/auth).

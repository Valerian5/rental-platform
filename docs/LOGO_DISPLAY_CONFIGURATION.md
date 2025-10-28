# Configuration de l'affichage du logo

## 🎨 Configuration du logo sur les pages d'authentification

### 1. Pages concernées

#### **1.1 Pages avec logo**
- ✅ **`/login`** : Page de connexion
- ✅ **`/register`** : Page d'inscription  
- ✅ **`/forgot-password`** : Page de mot de passe oublié
- ✅ **`/reset-password`** : Page de réinitialisation

#### **1.2 Position du logo**
- **Section gauche** : Logo affiché dans la partie branding
- **Taille** : 120x120px
- **Position** : Centré avec marge inférieure
- **Fallback** : Icône Building si pas de logo

### 2. Configuration technique

#### **2.1 API publique du logo**
```typescript
// Récupération du logo depuis l'API
useEffect(() => {
  const fetchLogo = async () => {
    try {
      const response = await fetch('/api/public/logo')
      if (response.ok) {
        const data = await response.json()
        setLogoUrl(data.logoUrl)
      }
    } catch (error) {
      console.warn('Erreur récupération logo:', error)
    }
  }
  fetchLogo()
}, [])
```

#### **2.2 Affichage conditionnel**
```tsx
{logoUrl ? (
  <Image
    src={logoUrl}
    alt="Logo"
    width={120}
    height={120}
    className="mb-6"
  />
) : (
  <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center mb-6">
    <Building className="h-10 w-10 text-white" />
  </div>
)}
```

### 3. Structure de la base de données

#### **3.1 Table site_settings**
```sql
CREATE TABLE site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **3.2 Structure JSONB des logos**
```json
{
  "main": "https://example.com/logo.png",
  "favicon": "https://example.com/favicon.ico",
  "footer": "https://example.com/footer-logo.png"
}
```

### 4. API endpoints

#### **4.1 API publique**
- **Endpoint** : `GET /api/public/logo`
- **Réponse** : `{ "success": true, "logoUrl": "https://example.com/logo.png" }`
- **Usage** : Récupération du logo principal

#### **4.2 API d'upload**
- **Endpoint** : `POST /api/admin/upload-logo`
- **Body** : `multipart/form-data` avec `file` et `logoType`
- **Réponse** : `{ "success": true, "data": { "url": "...", "filename": "...", "logoType": "main" } }`

### 5. Configuration dans Supabase

#### **5.1 Bucket de stockage**
- **Nom** : `logos` (préféré) ou `documents` (fallback)
- **Permissions** : Public read
- **Types autorisés** : PNG, JPEG, GIF, WebP
- **Taille max** : 5MB

#### **5.2 Variables d'environnement**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
```

### 6. Design et UX

#### **6.1 Section gauche (branding)**
- **Background** : Gradient bleu (`from-blue-600 to-indigo-700`)
- **Logo** : 120x120px, centré
- **Titre** : "Bienvenue sur Louer Ici"
- **Description** : Texte explicatif
- **Fonctionnalités** : 3 points clés avec icônes

#### **6.2 Responsive design**
- **Desktop** : Section gauche visible (lg:flex)
- **Mobile** : Section gauche cachée (hidden lg:flex)
- **Logo** : Taille adaptative selon l'écran

### 7. Tests de fonctionnement

#### **7.1 Test de l'API publique**
```bash
curl -X GET https://votre-domaine.com/api/public/logo
```

#### **7.2 Test de l'upload**
```bash
curl -X POST https://votre-domaine.com/api/admin/upload-logo \
  -F "file=@logo.png" \
  -F "logoType=main"
```

#### **7.3 Test visuel**
1. **Aller sur `/login`**
2. **Vérifier l'affichage du logo**
3. **Tester sur mobile et desktop**
4. **Vérifier le fallback si pas de logo**

### 8. Dépannage

#### **8.1 Logo ne s'affiche pas**
**Solutions :**
1. **Vérifier l'API** : `GET /api/public/logo`
2. **Vérifier la base** : `SELECT * FROM site_settings WHERE setting_key = 'logos'`
3. **Vérifier les permissions** : Bucket public
4. **Vérifier l'URL** : Format correct

#### **8.2 Erreur 500 lors de l'upload**
**Solutions :**
1. **Exécuter le script** : `scripts/fix-site-settings-table.sql`
2. **Vérifier les contraintes** : Contrainte unique sur `setting_key`
3. **Vérifier les permissions** : Table accessible

#### **8.3 Logo déformé**
**Solutions :**
1. **Vérifier les dimensions** : 120x120px recommandé
2. **Vérifier le CSS** : `object-fit: contain`
3. **Tester différents formats** : PNG, JPEG, SVG

### 9. Optimisations

#### **9.1 Performance**
- ✅ **Cache** : Logo mis en cache côté client
- ✅ **Lazy loading** : Chargement différé si nécessaire
- ✅ **Compression** : Images optimisées
- ✅ **CDN** : Utilisation de Supabase Storage

#### **9.2 Sécurité**
- ✅ **Validation** : Type de fichier vérifié
- ✅ **Taille limitée** : 5MB maximum
- ✅ **HTTPS** : URLs sécurisées
- ✅ **Permissions** : Accès contrôlé

### 10. Maintenance

#### **10.1 Tâches régulières**
- **Nettoyage** : Supprimer les anciens logos
- **Vérification** : Tester l'affichage sur toutes les pages
- **Mise à jour** : Logo de saison si nécessaire
- **Monitoring** : Surveiller l'utilisation du stockage

#### **10.2 Scripts de maintenance**
- **`scripts/test-logo-display.sql`** : Tests complets
- **`scripts/fix-site-settings-table.sql`** : Correction des problèmes
- **`scripts/configure-supabase-email-templates.sql`** : Configuration

### 11. Personnalisation

#### **11.1 Modifier l'affichage**
```tsx
// Changer la taille du logo
<Image
  src={logoUrl}
  alt="Logo"
  width={150}  // Nouvelle taille
  height={150}
  className="mb-6"
/>
```

#### **11.2 Modifier le fallback**
```tsx
// Changer l'icône de fallback
<div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center mb-6">
  <Building2 className="h-10 w-10 text-white" />  // Nouvelle icône
</div>
```

### 12. Monitoring

#### **12.1 Métriques importantes**
- **Temps de chargement** : < 1 seconde
- **Taux d'erreur** : < 1%
- **Taille des fichiers** : < 5MB
- **Utilisation stockage** : Surveiller l'espace

#### **12.2 Logs à surveiller**
- **API publique** : `GET /api/public/logo`
- **Upload** : `POST /api/admin/upload-logo`
- **Erreurs** : 500, 404, 403

---

**Note :** Ce guide couvre la configuration complète de l'affichage du logo. Pour des cas spécifiques, consultez les scripts de test et de correction fournis.

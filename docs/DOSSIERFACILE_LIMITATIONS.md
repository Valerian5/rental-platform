# Limitations DossierFacile - Fichiers et Documents

## 🚫 **Ce que vous NE pouvez PAS faire**

### **1. Télécharger les fichiers DossierFacile**
- ❌ **Pas d'API de téléchargement** : DossierFacile ne fournit pas d'API pour télécharger les fichiers
- ❌ **Pas de stockage local** : Les documents restent hébergés sur les serveurs DossierFacile
- ❌ **Pas d'accès aux fichiers bruts** : Seulement via les liens de partage

### **2. Accéder aux documents directement**
- ❌ **Pas de webhook de fichiers** : DossierFacile ne notifie pas des changements de fichiers
- ❌ **Pas de synchronisation** : Les fichiers ne sont pas synchronisés avec votre plateforme
- ❌ **Pas de backup** : Vous ne pouvez pas sauvegarder les documents

## ✅ **Ce que vous POUVEZ faire**

### **1. Lien simple (recommandé pour commencer)**
```typescript
// L'utilisateur partage son lien DossierFacile
const dossierfacileUrl = "https://locataire.dossierfacile.logement.gouv.fr/file/abc123"

// Vous stockez le lien dans votre base
await updateRentalFile({
  dossierfacile_share_url: dossierfacileUrl,
  dossierfacile_status: "shared",
  is_dossierfacile_certified: true
})
```

**Avantages :**
- ✅ Simple à implémenter
- ✅ Pas d'API requise
- ✅ L'utilisateur garde le contrôle
- ✅ Conforme à la documentation officielle

**Limitations :**
- ❌ Pas d'accès aux fichiers
- ❌ Seulement le lien de partage

### **2. DossierFacile Connect (OAuth2) - ACCÈS COMPLET**
```typescript
// Récupération de TOUTES les données via API
const completeData = await dossierFacileService.getCompleteDossierData(accessToken, dossierId)

// Accès aux pièces justificatives
const documents = completeData.documents // Tous les documents
const guarantorDocs = completeData.guarantor_documents // Documents du garant
const status = completeData.status // Statut du dossier

// Stockage des données complètes
await updateRentalFile({
  dossierfacile_data: completeData,
  dossierfacile_status: "verified",
  is_dossierfacile_certified: true
})
```

**Avantages :**
- ✅ **Accès aux pièces justificatives** (ensemble ou séparément)
- ✅ **Pièces du garant** accessibles
- ✅ **Statut en temps réel** (validé, refusé, en attente)
- ✅ **Informations complètes** (nom, email, situation pro, etc.)
- ✅ **Liens dossier** automatiques
- ✅ **Synchronisation** des données
- ✅ **Meilleure expérience utilisateur**

**Options de confidentialité :**
- ✅ **Session uniquement** : accès pendant la durée de la session
- ✅ **Persistant** : accès tant que l'utilisateur ne modifie pas les paramètres

## 🔄 **Workflow recommandé**

### **Étape 1 : Lien simple (immédiat)**
1. L'utilisateur crée son dossier sur DossierFacile.gouv.fr
2. Il partage le lien sur votre plateforme
3. Vous stockez le lien et marquez le dossier comme "certifié"
4. Affichage du badge "Certifié DossierFacile"

### **Étape 2 : DossierFacile Connect (futur)**
1. Demander l'accès à l'API DossierFacile Connect
2. Implémenter l'OAuth2 flow
3. Récupérer automatiquement les données
4. Synchroniser les informations

## 📊 **Structure de données recommandée**

```sql
-- Table rental_files (existante)
ALTER TABLE rental_files ADD COLUMN dossierfacile_share_url text;
ALTER TABLE rental_files ADD COLUMN dossierfacile_public_url text;
ALTER TABLE rental_files ADD COLUMN dossierfacile_status varchar(50);
ALTER TABLE rental_files ADD COLUMN is_dossierfacile_certified boolean;

-- Table dossierfacile_dossiers (nouvelle)
CREATE TABLE dossierfacile_dossiers (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES users(id),
  dossierfacile_id varchar(255),
  access_token text,
  refresh_token text,
  dossierfacile_data jsonb,
  status varchar(50)
);
```

## 🎯 **Stratégie recommandée**

### **Phase 1 : Lien simple (maintenant)**
- ✅ Implémentation immédiate
- ✅ Pas d'approbation requise
- ✅ Conforme à la documentation
- ✅ L'utilisateur partage son lien

### **Phase 2 : DossierFacile Connect (plus tard)**
- 🔄 Demander l'accès API
- 🔄 Implémenter OAuth2
- 🔄 Import automatique des données
- 🔄 Meilleure expérience utilisateur

## 📝 **Exemple d'implémentation**

```typescript
// Composant pour saisir le lien DossierFacile
function DossierFacileLinkInput({ onLinkSubmit }) {
  const [link, setLink] = useState('')
  
  const handleSubmit = () => {
    // Valider le format du lien
    if (link.includes('dossierfacile.logement.gouv.fr')) {
      onLinkSubmit(link)
    } else {
      toast.error('Lien DossierFacile invalide')
    }
  }
  
  return (
    <div>
      <Input
        placeholder="https://locataire.dossierfacile.logement.gouv.fr/file/..."
        value={link}
        onChange={(e) => setLink(e.target.value)}
      />
      <Button onClick={handleSubmit}>
        Valider le lien DossierFacile
      </Button>
    </div>
  )
}
```

## ⚠️ **Points importants**

1. **Les fichiers restent sur DossierFacile** : C'est par design et pour la sécurité
2. **Seuls les liens sont partagés** : L'utilisateur contrôle l'accès
3. **Pas de synchronisation automatique** : Les changements ne sont pas détectés
4. **Conformité légale** : DossierFacile gère la conformité des documents

## 🔗 **Liens utiles**

- [Documentation DossierFacile Partenaire](https://partenaire.dossierfacile.logement.gouv.fr/documentation-technique/lien-simple)
- [DossierFacile Connect](https://partenaire.dossierfacile.logement.gouv.fr/documentation-technique/dossierfacile-connect)
- [Kit de communication](https://partenaire.dossierfacile.logement.gouv.fr/ressources/kit-de-communication)

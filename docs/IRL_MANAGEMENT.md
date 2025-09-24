# Gestion des Indices IRL

## 📋 Vue d'ensemble

Le système de gestion des indices IRL (Indice de Référence des Loyers) permet aux administrateurs de gérer manuellement les indices utilisés pour les révisions de loyer dans l'application.

## 🚀 Installation

### 1. Créer la table IRL

Exécutez le script de migration pour créer la table et insérer les données de base :

```bash
node scripts/run-irl-migration.js
```

### 2. Vérifier l'installation

Testez que tout fonctionne correctement :

```bash
node scripts/test-irl-api.js
```

## 🎯 Fonctionnalités

### Page d'administration (`/admin/irl-management`)

- **Visualisation** : Tableau de bord avec statistiques
- **Gestion** : Ajout, modification, suppression d'indices
- **Activation/Désactivation** : Contrôle de la disponibilité des indices
- **Filtrage** : Par année et trimestre
- **Historique** : Suivi des modifications

### API REST (`/api/revisions/irl`)

- **GET** : Récupération des indices par année/trimestre
- **Format** : JSON avec données structurées
- **Cache** : Optimisation des performances
- **Sécurité** : RLS (Row Level Security) activé

## 📊 Structure des données

### Table `irl_indices`

```sql
CREATE TABLE irl_indices (
    id UUID PRIMARY KEY,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
    value DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(year, quarter)
);
```

### Format API

```json
{
  "success": true,
  "data": [
    {
      "quarter": "2024-Q1",
      "value": 142.40,
      "year": 2024,
      "quarter_number": 1
    }
  ],
  "source": "database"
}
```

## 🔧 Utilisation

### 1. Accès administrateur

1. Connectez-vous en tant qu'administrateur
2. Allez dans **Administration** → **Indices IRL**
3. Gérez les indices via l'interface

### 2. Ajout d'un nouvel indice

1. Cliquez sur **"Ajouter un indice"**
2. Renseignez :
   - **Année** : 2024, 2025, etc.
   - **Trimestre** : 1, 2, 3, ou 4
   - **Valeur** : Indice IRL (ex: 142.45)
   - **Statut** : Actif/Inactif
3. Cliquez sur **"Créer"**

### 3. Modification d'un indice

1. Cliquez sur l'icône **"Modifier"** (✏️)
2. Modifiez les valeurs nécessaires
3. Cliquez sur **"Mettre à jour"**

### 4. Activation/Désactivation

- Cliquez sur **"Activer"** ou **"Désactiver"** pour contrôler la disponibilité
- Les indices inactifs ne sont pas utilisés dans les révisions

## 🔒 Sécurité

### RLS (Row Level Security)

- **Administrateurs** : Accès complet (CRUD)
- **Propriétaires** : Lecture seule
- **Locataires** : Lecture seule
- **Autres** : Aucun accès

### Politiques de sécurité

```sql
-- Administrateurs
CREATE POLICY "Admins can manage IRL indices" ON irl_indices
    FOR ALL USING (users.role = 'admin');

-- Propriétaires et locataires
CREATE POLICY "Users can read IRL indices" ON irl_indices
    FOR SELECT USING (users.role IN ('owner', 'tenant'));
```

## 📈 Intégration

### Dans la création de bail

Le composant `IRLSelector` utilise automatiquement les données de la base :

```tsx
<IRLSelector
  value={formData.trimestre_reference_irl}
  onValueChange={(value) => handleInputChange("trimestre_reference_irl", value)}
  label="Trimestre de référence IRL"
/>
```

### Dans la révision de loyer

L'API est appelée automatiquement pour récupérer les indices :

```typescript
const response = await fetch(`/api/revisions/irl?year=${year}&quarter=${quarter}`)
const result = await response.json()
```

## 🛠️ Maintenance

### Mise à jour des indices

1. **INSEE** : Récupérez les nouveaux indices sur le site INSEE
2. **Administration** : Ajoutez/modifiez via l'interface admin
3. **Vérification** : Testez avec l'API

### Sauvegarde

```sql
-- Exporter les données
SELECT * FROM irl_indices ORDER BY year, quarter;

-- Sauvegarde complète
pg_dump -t irl_indices your_database > irl_backup.sql
```

## 🐛 Dépannage

### Problèmes courants

1. **Table non trouvée**
   ```bash
   node scripts/run-irl-migration.js
   ```

2. **Données manquantes**
   ```bash
   node scripts/test-irl-api.js
   ```

3. **Erreur RLS**
   - Vérifiez les politiques de sécurité
   - Assurez-vous que l'utilisateur a le bon rôle

### Logs

```bash
# Vérifier les logs de l'API
tail -f logs/api.log | grep irl

# Vérifier les erreurs Supabase
# Dans le dashboard Supabase → Logs
```

## 📚 Ressources

- [INSEE - Indices de référence des loyers](https://www.insee.fr/fr/statistiques/serie/001763607)
- [Documentation Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [API REST Next.js](https://nextjs.org/docs/api-routes/introduction)

## 🔄 Mise à jour

Pour mettre à jour le système :

1. **Sauvegardez** les données existantes
2. **Exécutez** les nouvelles migrations
3. **Testez** avec le script de test
4. **Vérifiez** l'interface d'administration

---

*Dernière mise à jour : Décembre 2024*

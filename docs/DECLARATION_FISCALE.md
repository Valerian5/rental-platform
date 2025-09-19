# Fonctionnalité Déclaration Fiscale

Cette fonctionnalité permet aux propriétaires de gérer leur déclaration fiscale locative de manière automatisée, avec calculs fiscaux, simulations et génération de documents.

## Fonctionnalités

### 🧮 Calculs fiscaux automatiques

- **Revenus bruts** : Calcul automatique basé sur les quittances de loyer validées
- **Charges récupérables** : Montants non imposables récupérés auprès des locataires
- **Dépenses déductibles** : Gestion des dépenses par catégorie avec validation automatique
- **Revenu net locatif** : Calcul automatique du revenu imposable

### 📊 Simulations fiscales

#### Micro-foncier (Location nue)
- Abattement forfaitaire de 30%
- Limite : 15 000 € de revenus bruts
- Formulaire : 2044

#### Micro-BIC (Location meublée)
- Abattement forfaitaire de 50%
- Limite : 77 700 € de revenus bruts
- Formulaire : 2042-C-PRO

#### Régime réel
- Déduction des charges réelles
- Toujours applicable
- Optimisation possible avec amortissements

### 🎯 Recommandation automatique

Le système calcule automatiquement le régime le plus avantageux et recommande :
- Le régime optimal
- L'économie d'impôt estimée
- Les justifications du choix

### 📋 Gestion des dépenses

#### Catégories déductibles
- **Réparations** : Fuites, pannes, réparations urgentes
- **Entretien** : Peinture, nettoyage, maintenance préventive
- **Taxes** : Taxe foncière, charges de copropriété
- **Assurance** : Assurance PNO, assurance propriétaire
- **Intérêts** : Intérêts d'emprunt immobilier
- **Gestion** : Frais de gestion locative

#### Catégories non déductibles
- **Améliorations** : Agrandissements, rénovations importantes

### 📄 Génération de documents

#### Exports de données
- **CSV** : Données complètes pour tableur
- **PDF** : Récapitulatif fiscal complet

#### Formulaires préremplis
- **Formulaire 2044** : Revenus fonciers (location nue)
- **Formulaire 2042-C-PRO** : BIC/LMNP (location meublée)

## Structure de la base de données

### Table `expenses`

```sql
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  lease_id uuid REFERENCES leases(id),
  type varchar(20) NOT NULL CHECK (type IN ('incident', 'maintenance', 'annual_charge')),
  category varchar(20) NOT NULL CHECK (category IN ('repair', 'maintenance', 'improvement', 'tax', 'insurance', 'interest', 'management')),
  amount numeric(10,2) NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  deductible boolean NOT NULL DEFAULT true,
  receipt_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### Table `charge_regularizations`

```sql
CREATE TABLE charge_regularizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL REFERENCES leases(id),
  year integer NOT NULL,
  total_charges_paid numeric(10,2) NOT NULL,
  actual_charges numeric(10,2) NOT NULL,
  difference numeric(10,2) NOT NULL,
  type varchar(20) NOT NULL CHECK (type IN ('additional_payment', 'refund')),
  status varchar(20) NOT NULL DEFAULT 'calculated' CHECK (status IN ('calculated', 'paid', 'pending')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

## Installation

### 1. Migration de la base de données

Exécutez le script de migration :

```bash
node scripts/run-expenses-migration.js
```

Ou exécutez manuellement le SQL dans l'interface Supabase :

```sql
-- Voir le fichier scripts/create-expenses-table.sql
```

### 2. Installation des dépendances PDF

```bash
npm install jspdf jspdf-autotable
```

### 3. Configuration

Aucune configuration supplémentaire n'est requise. La fonctionnalité utilise les données existantes des baux et quittances.

## Utilisation

### Accès à la fonctionnalité

1. Connectez-vous en tant que propriétaire
2. Allez dans **Gestion locative** > **Déclaration fiscale**
3. Sélectionnez l'année à analyser

### Ajout de dépenses

1. Cliquez sur **Ajouter une dépense**
2. Remplissez les informations :
   - Type de dépense (incident, maintenance, charge annuelle)
   - Catégorie (déductible ou non)
   - Montant et date
   - Description
   - Justificatif (optionnel)
3. Le système calcule automatiquement la déductibilité

### Consultation des simulations

1. Allez dans l'onglet **Simulations**
2. Consultez les 3 régimes fiscaux
3. La recommandation automatique est mise en évidence
4. Comparez les revenus imposables

### Génération de documents

1. Allez dans l'onglet **Documents**
2. Choisissez le type d'export :
   - **CSV** : Pour import dans un tableur
   - **PDF** : Pour impression et archivage
3. Téléchargez les formulaires préremplis

## API Endpoints

### GET /api/fiscal
- `?action=calculate&year=2024` : Calcul des données fiscales
- `?action=stats` : Statistiques fiscales
- `?action=years` : Années disponibles
- `?action=summary&year=2024` : Récapitulatif complet

### POST /api/fiscal
- `{action: "export-csv", year: 2024}` : Export CSV
- `{action: "export-pdf", year: 2024}` : Export PDF

### POST /api/fiscal/forms
- `{formType: "2044", year: 2024}` : Formulaire 2044
- `{formType: "2042-C-PRO", year: 2024}` : Formulaire 2042-C-PRO

### GET /api/expenses
- `?year=2024` : Dépenses par année
- `?property_id=uuid` : Dépenses par bien
- `?category=repair` : Dépenses par catégorie
- `?deductible=true` : Dépenses déductibles uniquement

### POST /api/expenses
- Création d'une nouvelle dépense

### PUT /api/expenses/[id]
- Modification d'une dépense

### DELETE /api/expenses/[id]
- Suppression d'une dépense

## Logique fiscale

### Calculs automatiques

1. **Revenus bruts** = Somme des loyers encaissés (quittances payées)
2. **Charges récupérables** = Somme des charges récupérées (non imposables)
3. **Dépenses déductibles** = Somme des dépenses marquées comme déductibles
4. **Revenu net** = Revenus bruts - Dépenses déductibles

### Simulations

#### Micro-foncier
- **Condition** : Revenus ≤ 15 000 €
- **Calcul** : Revenus bruts - (Revenus bruts × 30%)
- **Avantage** : Simplicité, pas de justificatifs

#### Micro-BIC
- **Condition** : Revenus ≤ 77 700 € ET location meublée
- **Calcul** : Revenus bruts - (Revenus bruts × 50%)
- **Avantage** : Abattement plus important

#### Régime réel
- **Condition** : Toujours applicable
- **Calcul** : Revenus bruts - Dépenses déductibles
- **Avantage** : Déduction réelle des charges

### Recommandation

Le système choisit le régime avec le revenu imposable le plus faible, en tenant compte des conditions d'éligibilité.

## Exemple d'utilisation

### Scénario : Appartement non meublé, 9 600 € de loyers

**Données d'entrée :**
- Loyers encaissés : 9 600 €
- Charges récupérables : 900 €
- Dépenses déductibles : 3 520 €

**Simulations :**
- **Micro-foncier** : 9 600 - (9 600 × 30%) = 6 720 €
- **Régime réel** : 9 600 - 3 520 = 6 080 €

**Recommandation :** Régime réel (économie de 640 €)

## Limitations

1. **Amortissements** : Non implémentés en V1 (prévu pour V2)
2. **Déficit foncier** : Non géré (prévu pour V2)
3. **Multi-propriétaires** : Optimisation globale non implémentée
4. **Changements de régime** : Historique non géré

## Roadmap

### V2 (Prochaine version)
- [ ] Gestion des amortissements pour meublés
- [ ] Calcul du déficit foncier
- [ ] Optimisation multi-propriétés
- [ ] Historique des changements de régime
- [ ] Import de données bancaires

### V3 (Future)
- [ ] Intégration avec les logiciels de comptabilité
- [ ] Transmission électronique des déclarations
- [ ] Alertes fiscales personnalisées
- [ ] Optimisation fiscale avancée

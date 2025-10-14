-- Ajouter les colonnes features et quotas à pricing_plans
ALTER TABLE pricing_plans 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS quotas JSONB DEFAULT '{}'::jsonb;

-- Index pour les requêtes sur les fonctionnalités
CREATE INDEX IF NOT EXISTS idx_pricing_plans_features ON pricing_plans USING GIN (features);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_quotas ON pricing_plans USING GIN (quotas);

-- Mettre à jour les plans existants avec des fonctionnalités par défaut
UPDATE pricing_plans 
SET features = '[]'::jsonb, quotas = '{}'::jsonb 
WHERE features IS NULL OR quotas IS NULL;

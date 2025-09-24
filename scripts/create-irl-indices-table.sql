-- Création de la table pour gérer les indices IRL
CREATE TABLE IF NOT EXISTS public.irl_indices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
    value DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité pour éviter les doublons
    UNIQUE(year, quarter)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_irl_indices_year_quarter ON public.irl_indices(year, quarter);
CREATE INDEX IF NOT EXISTS idx_irl_indices_active ON public.irl_indices(is_active) WHERE is_active = true;

-- RLS (Row Level Security)
ALTER TABLE public.irl_indices ENABLE ROW LEVEL SECURITY;

-- Politique pour les administrateurs (accès complet)
CREATE POLICY "Admins can manage IRL indices" ON public.irl_indices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Politique pour les propriétaires (lecture seule)
CREATE POLICY "Owners can read IRL indices" ON public.irl_indices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'owner'
        )
    );

-- Politique pour les locataires (lecture seule)
CREATE POLICY "Tenants can read IRL indices" ON public.irl_indices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'tenant'
        )
    );

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_irl_indices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_irl_indices_updated_at
    BEFORE UPDATE ON public.irl_indices
    FOR EACH ROW
    EXECUTE FUNCTION update_irl_indices_updated_at();

-- Insertion de données de base pour 2024
INSERT INTO public.irl_indices (year, quarter, value, is_active) VALUES
    (2024, 1, 142.40, true),
    (2024, 2, 143.00, true),
    (2024, 3, 143.60, true),
    (2024, 4, 144.20, true)
ON CONFLICT (year, quarter) DO NOTHING;

-- Insertion de données pour 2023
INSERT INTO public.irl_indices (year, quarter, value, is_active) VALUES
    (2023, 1, 140.20, true),
    (2023, 2, 140.80, true),
    (2023, 3, 141.30, true),
    (2023, 4, 141.90, true)
ON CONFLICT (year, quarter) DO NOTHING;

-- Insertion de données pour 2025 (projections)
INSERT INTO public.irl_indices (year, quarter, value, is_active) VALUES
    (2025, 1, 144.80, true),
    (2025, 2, 145.40, true),
    (2025, 3, 146.00, true),
    (2025, 4, 146.60, true)
ON CONFLICT (year, quarter) DO NOTHING;

-- Commentaires sur la table
COMMENT ON TABLE public.irl_indices IS 'Table de gestion des indices IRL (Indice de Référence des Loyers) pour les révisions de loyer';
COMMENT ON COLUMN public.irl_indices.year IS 'Année de l''indice IRL';
COMMENT ON COLUMN public.irl_indices.quarter IS 'Trimestre (1 à 4)';
COMMENT ON COLUMN public.irl_indices.value IS 'Valeur de l''indice IRL';
COMMENT ON COLUMN public.irl_indices.is_active IS 'Indique si l''indice est actif et disponible pour les révisions';

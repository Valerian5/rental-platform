-- Création de la table pour les paramètres de charges du bail
CREATE TABLE IF NOT EXISTS public.lease_charge_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
    charge_categories JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité pour éviter les doublons
    UNIQUE(lease_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_lease_charge_settings_lease_id ON public.lease_charge_settings(lease_id);

-- RLS (Row Level Security)
ALTER TABLE public.lease_charge_settings ENABLE ROW LEVEL SECURITY;

-- Politique pour les propriétaires (accès complet)
CREATE POLICY "Owners can manage lease charge settings" ON public.lease_charge_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.leases l
            JOIN public.properties p ON l.property_id = p.id
            WHERE l.id = lease_charge_settings.lease_id
            AND p.owner_id = auth.uid()
        )
    );

-- Politique pour les locataires (lecture seule)
CREATE POLICY "Tenants can read lease charge settings" ON public.lease_charge_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.leases l
            WHERE l.id = lease_charge_settings.lease_id
            AND l.tenant_id = auth.uid()
        )
    );

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_lease_charge_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_lease_charge_settings_updated_at
    BEFORE UPDATE ON public.lease_charge_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_lease_charge_settings_updated_at();

-- Commentaires sur la table
COMMENT ON TABLE public.lease_charge_settings IS 'Paramètres des charges récupérables pour chaque bail';
COMMENT ON COLUMN public.lease_charge_settings.lease_id IS 'ID du bail associé';
COMMENT ON COLUMN public.lease_charge_settings.charge_categories IS 'Liste des catégories de charges avec leurs paramètres (JSON)';

-- Exemple de structure JSON pour charge_categories :
-- [
--   {
--     "name": "Eau froide",
--     "category": "eau",
--     "recoverable": true,
--     "included_in_provisions": true,
--     "default_amount": 0
--   },
--   {
--     "name": "Électricité parties communes",
--     "category": "electricite",
--     "recoverable": true,
--     "included_in_provisions": true,
--     "default_amount": 0
--   },
--   {
--     "name": "Ascenseur",
--     "category": "ascenseur",
--     "recoverable": true,
--     "included_in_provisions": true,
--     "default_amount": 0
--   },
--   {
--     "name": "Chauffage collectif",
--     "category": "chauffage",
--     "recoverable": true,
--     "included_in_provisions": true,
--     "default_amount": 0
--   },
--   {
--     "name": "Taxe ordures ménagères (TEOM)",
--     "category": "teom",
--     "recoverable": true,
--     "included_in_provisions": true,
--     "default_amount": 0
--   },
--   {
--     "name": "Assurance propriétaire",
--     "category": "assurance",
--     "recoverable": false,
--     "included_in_provisions": false,
--     "default_amount": 0
--   }
-- ]

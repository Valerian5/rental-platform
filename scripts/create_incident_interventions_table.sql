-- Script pour créer la table incident_interventions
-- Cette table stocke les interventions programmées pour les incidents

CREATE TABLE IF NOT EXISTS incident_interventions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('owner', 'external')),
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT NOT NULL,
    provider_name TEXT,
    provider_contact TEXT,
    estimated_cost DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_incident_interventions_incident_id ON incident_interventions(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_interventions_created_by ON incident_interventions(created_by);
CREATE INDEX IF NOT EXISTS idx_incident_interventions_scheduled_date ON incident_interventions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_incident_interventions_status ON incident_interventions(status);

-- Créer un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_incident_interventions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_incident_interventions_updated_at
    BEFORE UPDATE ON incident_interventions
    FOR EACH ROW
    EXECUTE FUNCTION update_incident_interventions_updated_at();

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE incident_interventions IS 'Table pour stocker les interventions programmées pour les incidents';
COMMENT ON COLUMN incident_interventions.incident_id IS 'ID de l''incident associé';
COMMENT ON COLUMN incident_interventions.type IS 'Type d''intervention (owner ou external)';
COMMENT ON COLUMN incident_interventions.scheduled_date IS 'Date et heure programmées pour l''intervention';
COMMENT ON COLUMN incident_interventions.description IS 'Description de l''intervention à effectuer';
COMMENT ON COLUMN incident_interventions.provider_name IS 'Nom du prestataire (si intervention externe)';
COMMENT ON COLUMN incident_interventions.provider_contact IS 'Contact du prestataire (téléphone, email)';
COMMENT ON COLUMN incident_interventions.estimated_cost IS 'Coût estimé de l''intervention';
COMMENT ON COLUMN incident_interventions.status IS 'Statut de l''intervention (scheduled, in_progress, completed, cancelled)';
COMMENT ON COLUMN incident_interventions.created_by IS 'ID de l''utilisateur qui a programmé l''intervention';
COMMENT ON COLUMN incident_interventions.created_at IS 'Date de création de l''intervention';
COMMENT ON COLUMN incident_interventions.updated_at IS 'Date de dernière modification';

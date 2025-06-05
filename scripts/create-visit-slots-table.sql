-- Créer la table pour les créneaux de visite des propriétés
CREATE TABLE IF NOT EXISTS property_visit_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_capacity INTEGER NOT NULL DEFAULT 1,
    is_group_visit BOOLEAN NOT NULL DEFAULT false,
    current_bookings INTEGER NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_property_visit_slots_property_id ON property_visit_slots(property_id);
CREATE INDEX IF NOT EXISTS idx_property_visit_slots_date ON property_visit_slots(date);
CREATE INDEX IF NOT EXISTS idx_property_visit_slots_available ON property_visit_slots(is_available);

-- Politique RLS pour la sécurité
ALTER TABLE property_visit_slots ENABLE ROW LEVEL SECURITY;

-- Politique pour les propriétaires : ils peuvent tout faire sur leurs propriétés
CREATE POLICY "Owners can manage visit slots for their properties" ON property_visit_slots
    FOR ALL USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

-- Politique pour les locataires : ils peuvent voir les créneaux disponibles
CREATE POLICY "Tenants can view available visit slots" ON property_visit_slots
    FOR SELECT USING (
        is_available = true 
        AND date >= CURRENT_DATE
    );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_property_visit_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_property_visit_slots_updated_at ON property_visit_slots;
CREATE TRIGGER update_property_visit_slots_updated_at
    BEFORE UPDATE ON property_visit_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_property_visit_slots_updated_at();

-- Insérer quelques données de test (optionnel)
INSERT INTO property_visit_slots (property_id, date, start_time, end_time, max_capacity, is_group_visit, is_available)
SELECT 
    p.id,
    CURRENT_DATE + INTERVAL '1 day',
    '14:00:00',
    '15:00:00',
    1,
    false,
    true
FROM properties p
WHERE p.owner_id = auth.uid()
LIMIT 1
ON CONFLICT DO NOTHING;

-- Supprimer le trigger problématique qui cause l'erreur updated_at
DROP TRIGGER IF EXISTS update_charge_regularizations_updated_at ON charge_regularizations;

-- Vérifier si la colonne updated_at existe
DO $$
BEGIN
    -- Ajouter la colonne updated_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'charge_regularizations' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE charge_regularizations 
        ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- Recréer le trigger correctement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_charge_regularizations_updated_at 
    BEFORE UPDATE ON charge_regularizations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

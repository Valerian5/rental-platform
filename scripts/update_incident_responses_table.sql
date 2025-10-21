-- Script pour mettre à jour la table incident_responses pour le système de ticketing
-- Ce script ajoute les colonnes manquantes si elles n'existent pas

-- Ajouter la colonne is_read si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incident_responses' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE incident_responses ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Ajouter la colonne attachments si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incident_responses' 
        AND column_name = 'attachments'
    ) THEN
        ALTER TABLE incident_responses ADD COLUMN attachments TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Ajouter la colonne author_name si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incident_responses' 
        AND column_name = 'author_name'
    ) THEN
        ALTER TABLE incident_responses ADD COLUMN author_name TEXT;
    END IF;
END $$;

-- Ajouter la colonne author_type si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incident_responses' 
        AND column_name = 'author_type'
    ) THEN
        ALTER TABLE incident_responses ADD COLUMN author_type TEXT;
    END IF;
END $$;

-- Ajouter la colonne updated_at si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incident_responses' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE incident_responses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Créer un index sur incident_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_incident_responses_incident_id ON incident_responses(incident_id);

-- Créer un index sur author_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_incident_responses_author_id ON incident_responses(author_id);

-- Créer un index sur created_at pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_incident_responses_created_at ON incident_responses(created_at);

-- Créer un index sur is_read pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_incident_responses_is_read ON incident_responses(is_read);

-- Mettre à jour les enregistrements existants pour remplir les colonnes manquantes
UPDATE incident_responses 
SET 
    author_name = COALESCE(author_name, 'Utilisateur'),
    author_type = COALESCE(author_type, 'tenant'),
    is_read = COALESCE(is_read, FALSE),
    attachments = COALESCE(attachments, '{}'),
    updated_at = COALESCE(updated_at, created_at)
WHERE 
    author_name IS NULL 
    OR author_type IS NULL 
    OR is_read IS NULL 
    OR attachments IS NULL 
    OR updated_at IS NULL;

-- Commentaire final
COMMENT ON TABLE incident_responses IS 'Table pour le système de ticketing des incidents - Messages et réponses entre propriétaires et locataires';
COMMENT ON COLUMN incident_responses.incident_id IS 'ID de l''incident associé';
COMMENT ON COLUMN incident_responses.author_id IS 'ID de l''utilisateur qui a écrit le message';
COMMENT ON COLUMN incident_responses.author_name IS 'Nom complet de l''auteur du message';
COMMENT ON COLUMN incident_responses.author_type IS 'Type d''utilisateur (owner ou tenant)';
COMMENT ON COLUMN incident_responses.message IS 'Contenu du message';
COMMENT ON COLUMN incident_responses.attachments IS 'Liste des pièces jointes (URLs)';
COMMENT ON COLUMN incident_responses.is_read IS 'Indique si le message a été lu';
COMMENT ON COLUMN incident_responses.created_at IS 'Date de création du message';
COMMENT ON COLUMN incident_responses.updated_at IS 'Date de dernière modification';

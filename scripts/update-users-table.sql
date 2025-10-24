-- Script pour mettre à jour la table users avec les colonnes manquantes
-- Ce script peut être exécuté plusieurs fois sans problème

-- Ajouter les colonnes si elles n'existent pas
DO $$ 
BEGIN
    -- Ajouter password_hash si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash character varying(255);
    END IF;

    -- Ajouter avatar_url si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url text;
    END IF;

    -- Ajouter is_verified si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified boolean DEFAULT false;
    END IF;

    -- Ajouter agency_id si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'agency_id') THEN
        ALTER TABLE users ADD COLUMN agency_id uuid;
    END IF;

    -- Ajouter created_at si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at timestamp with time zone DEFAULT now();
    END IF;

    -- Ajouter updated_at si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- Créer les index s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_type_id ON users(user_type, id);
CREATE INDEX IF NOT EXISTS idx_users_email_type ON users(email, user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_agency_id ON users(agency_id);

-- Créer la contrainte de clé étrangère pour agency_id si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'users_agency_id_fkey') THEN
        ALTER TABLE users ADD CONSTRAINT users_agency_id_fkey 
        FOREIGN KEY (agency_id) REFERENCES agencies(id);
    END IF;
END $$;

-- Créer la contrainte de vérification du user_type si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'users_user_type_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_user_type_check 
        CHECK (user_type IN ('tenant', 'owner', 'admin', 'agency'));
    END IF;
END $$;

-- Créer la contrainte unique sur l'email si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'users_email_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END $$;

-- Créer la contrainte de clé primaire si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'users_pkey') THEN
        ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- Activer RLS sur la table users si ce n'est pas déjà fait
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour la table users
-- 1. Les utilisateurs peuvent voir et modifier leur propre profil
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- 2. Les utilisateurs peuvent créer leur propre profil
CREATE POLICY "Users can create their own profile" ON users
    FOR INSERT WITH CHECK (id = auth.uid());

-- 3. Politique système : permettre aux APIs backend d'accéder à tous les utilisateurs
CREATE POLICY "System can manage all users" ON users
    FOR ALL USING (true);

-- 4. Politique pour les administrateurs : accès complet
CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Vérification que toutes les colonnes existent
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    required_columns TEXT[] := ARRAY[
        'id', 'email', 'password_hash', 'first_name', 'last_name', 
        'phone', 'user_type', 'avatar_url', 'is_verified', 
        'created_at', 'updated_at', 'agency_id'
    ];
    col TEXT;
BEGIN
    FOREACH col IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;

    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Colonnes manquantes dans la table users: %', array_to_string(missing_columns, ', ');
    END IF;

    RAISE NOTICE '✅ Table users mise à jour avec succès';
END $$;

-- Vérification des contraintes
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints
    WHERE table_name = 'users' AND constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY', 'CHECK');
    
    IF constraint_count < 5 THEN
        RAISE EXCEPTION 'Contraintes manquantes sur la table users';
    END IF;
    
    RAISE NOTICE '✅ Contraintes vérifiées: % contraintes trouvées', constraint_count;
END $$;

-- Script de correction pour les colonnes de la table leases
-- À exécuter si vous avez déjà créé les tables avec les mauvais noms de colonnes

-- Vérifier si les colonnes existent et les renommer si nécessaire
DO $$
BEGIN
    -- Renommer bailleur_id en owner_id si elle existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'leases' AND column_name = 'bailleur_id') THEN
        ALTER TABLE public.leases RENAME COLUMN bailleur_id TO owner_id;
        RAISE NOTICE 'Colonne bailleur_id renommée en owner_id';
    END IF;
    
    -- Renommer locataire_id en tenant_id si elle existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'leases' AND column_name = 'locataire_id') THEN
        ALTER TABLE public.leases RENAME COLUMN locataire_id TO tenant_id;
        RAISE NOTICE 'Colonne locataire_id renommée en tenant_id';
    END IF;
    
    -- Vérifier que les colonnes correctes existent
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leases' AND column_name = 'owner_id') THEN
        RAISE NOTICE 'ATTENTION: La colonne owner_id n''existe pas dans la table leases';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leases' AND column_name = 'tenant_id') THEN
        RAISE NOTICE 'ATTENTION: La colonne tenant_id n''existe pas dans la table leases';
    END IF;
END $$;

-- Vérifier la structure de la table leases
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'leases' 
AND column_name IN ('owner_id', 'tenant_id', 'bailleur_id', 'locataire_id')
ORDER BY column_name;

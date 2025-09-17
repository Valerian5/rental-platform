-- Requête SQL pour ajouter les colonnes manquantes à la table properties
-- À exécuter dans Supabase SQL Editor

-- Ajouter les colonnes manquantes
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS hot_water_production character varying(50) NULL,
ADD COLUMN IF NOT EXISTS heating_mode character varying(50) NULL,
ADD COLUMN IF NOT EXISTS wc_count integer NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS wc_separate boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS wheelchair_accessible boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS availability_date date NULL,
ADD COLUMN IF NOT EXISTS rent_control_zone boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reference_rent numeric(10, 2) NULL,
ADD COLUMN IF NOT EXISTS reference_rent_increased numeric(10, 2) NULL,
ADD COLUMN IF NOT EXISTS rent_supplement numeric(10, 2) NULL,
ADD COLUMN IF NOT EXISTS agency_fees_tenant numeric(10, 2) NULL,
ADD COLUMN IF NOT EXISTS inventory_fees_tenant numeric(10, 2) NULL,
ADD COLUMN IF NOT EXISTS colocation_possible boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS max_colocation_occupants integer NULL;

-- Commenter les colonnes pour la documentation
COMMENT ON COLUMN public.properties.hot_water_production IS 'Mode de production d''eau chaude (individuel/collectif + type)';
COMMENT ON COLUMN public.properties.heating_mode IS 'Mode de chauffage (individuel/collectif + type)';
COMMENT ON COLUMN public.properties.wc_count IS 'Nombre de WC dans le logement';
COMMENT ON COLUMN public.properties.wc_separate IS 'Indique si les WC sont séparés des salles de bain';
COMMENT ON COLUMN public.properties.wheelchair_accessible IS 'Indique si le logement est accessible aux fauteuils roulants';
COMMENT ON COLUMN public.properties.availability_date IS 'Date de disponibilité du logement';
COMMENT ON COLUMN public.properties.rent_control_zone IS 'Indique si le logement est dans une zone soumise à l''encadrement des loyers';
COMMENT ON COLUMN public.properties.reference_rent IS 'Loyer de référence en €/m² pour les zones d''encadrement';
COMMENT ON COLUMN public.properties.reference_rent_increased IS 'Loyer de référence majoré en €/m² pour les zones d''encadrement';
COMMENT ON COLUMN public.properties.rent_supplement IS 'Complément de loyer en €';
COMMENT ON COLUMN public.properties.agency_fees_tenant IS 'Frais d''agence pour le locataire en €';
COMMENT ON COLUMN public.properties.inventory_fees_tenant IS 'Frais d''état des lieux pour le locataire en €';
COMMENT ON COLUMN public.properties.colocation_possible IS 'Indique si la colocation est possible dans ce logement';
COMMENT ON COLUMN public.properties.max_colocation_occupants IS 'Nombre maximum d''occupants en cas de colocation';

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND table_schema = 'public'
AND column_name IN (
  'hot_water_production',
  'heating_mode', 
  'wc_count',
  'wc_separate',
  'wheelchair_accessible',
  'availability_date',
  'rent_control_zone',
  'reference_rent',
  'reference_rent_increased',
  'rent_supplement',
  'agency_fees_tenant',
  'inventory_fees_tenant',
  'colocation_possible',
  'max_colocation_occupants'
)
ORDER BY column_name;

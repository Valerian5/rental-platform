-- Script SQL pour créer la table des travaux de maintenance
-- Ce script crée la table maintenance_works pour gérer les travaux programmés par les propriétaires

-- 1. Créer la table maintenance_works
CREATE TABLE IF NOT EXISTS public.maintenance_works (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  lease_id uuid NOT NULL,
  title varchar(255) NOT NULL,
  description text NOT NULL,
  type varchar(20) NOT NULL CHECK (type IN ('preventive', 'corrective', 'improvement')),
  category varchar(20) NOT NULL CHECK (category IN ('plumbing', 'electrical', 'heating', 'painting', 'other')),
  status varchar(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_date date NOT NULL,
  completed_date date,
  cost numeric(10,2),
  provider_name varchar(255),
  provider_contact varchar(255),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT maintenance_works_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_works_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE,
  CONSTRAINT maintenance_works_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases (id) ON DELETE CASCADE
);

-- 2. Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_maintenance_works_property_id ON public.maintenance_works USING btree (property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_works_lease_id ON public.maintenance_works USING btree (lease_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_works_status ON public.maintenance_works USING btree (status);
CREATE INDEX IF NOT EXISTS idx_maintenance_works_type ON public.maintenance_works USING btree (type);
CREATE INDEX IF NOT EXISTS idx_maintenance_works_category ON public.maintenance_works USING btree (category);
CREATE INDEX IF NOT EXISTS idx_maintenance_works_scheduled_date ON public.maintenance_works USING btree (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_works_completed_date ON public.maintenance_works USING btree (completed_date);

-- 3. Créer une fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_maintenance_works_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer le trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_maintenance_works_updated_at ON public.maintenance_works;
CREATE TRIGGER trigger_update_maintenance_works_updated_at
  BEFORE UPDATE ON public.maintenance_works
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_works_updated_at();

-- 5. Créer une vue pour faciliter les requêtes
CREATE OR REPLACE VIEW maintenance_works_summary AS
SELECT 
  mw.id,
  mw.title,
  mw.description,
  mw.type,
  mw.category,
  mw.status,
  mw.scheduled_date,
  mw.completed_date,
  mw.cost,
  mw.provider_name,
  mw.provider_contact,
  p.title as property_title,
  p.address as property_address,
  l.tenant_id,
  u.first_name as tenant_first_name,
  u.last_name as tenant_last_name,
  l.owner_id
FROM public.maintenance_works mw
JOIN public.properties p ON mw.property_id = p.id
JOIN public.leases l ON mw.lease_id = l.id
JOIN public.users u ON l.tenant_id = u.id;

-- 6. Insérer des données d'exemple (optionnel)
-- INSERT INTO public.maintenance_works (property_id, lease_id, title, description, type, category, status, scheduled_date, cost, provider_name, provider_contact) VALUES
-- ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Révision chaudière', 'Contrôle et entretien annuel de la chaudière', 'preventive', 'heating', 'scheduled', '2024-03-15', 150.00, 'Chauffage Pro', '01 23 45 67 89'),
-- ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Réparation robinet', 'Remplacement du robinet de cuisine qui fuit', 'corrective', 'plumbing', 'completed', '2024-02-10', 80.00, 'Plomberie Express', '01 98 76 54 32', '2024-02-10'),
-- ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Peinture salon', 'Rafraîchissement peinture du salon', 'improvement', 'painting', 'scheduled', '2024-04-20', 300.00, 'Peinture & Co', '01 11 22 33 44');

-- 7. Créer une fonction pour calculer les statistiques de maintenance
CREATE OR REPLACE FUNCTION get_maintenance_stats(owner_id_param uuid, year_param integer DEFAULT NULL)
RETURNS TABLE (
  total_works bigint,
  scheduled_works bigint,
  in_progress_works bigint,
  completed_works bigint,
  cancelled_works bigint,
  total_cost numeric,
  avg_cost numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_works,
    COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_works,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_works,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_works,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_works,
    COALESCE(SUM(cost), 0) as total_cost,
    COALESCE(AVG(cost), 0) as avg_cost
  FROM public.maintenance_works mw
  JOIN public.leases l ON mw.lease_id = l.id
  WHERE l.owner_id = owner_id_param
    AND (year_param IS NULL OR EXTRACT(YEAR FROM mw.scheduled_date) = year_param);
END;
$$ LANGUAGE plpgsql;

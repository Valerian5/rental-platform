-- Script SQL pour créer les tables DossierFacile dans Supabase
-- Ce script étend la table rental_files existante et crée les tables nécessaires

-- 1. Ajouter les colonnes DossierFacile à la table rental_files existante
ALTER TABLE public.rental_files 
ADD COLUMN IF NOT EXISTS dossierfacile_id character varying(255) NULL,
ADD COLUMN IF NOT EXISTS dossierfacile_verification_code text NULL,
ADD COLUMN IF NOT EXISTS dossierfacile_pdf_url text NULL,
ADD COLUMN IF NOT EXISTS dossierfacile_status character varying(50) NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS dossierfacile_verified_at timestamp with time zone NULL,
ADD COLUMN IF NOT EXISTS dossierfacile_data jsonb NULL,
ADD COLUMN IF NOT EXISTS dossierfacile_share_url text NULL,
ADD COLUMN IF NOT EXISTS dossierfacile_public_url text NULL;

-- 2. Créer la table pour stocker les données DossierFacile Connect (OAuth2)
CREATE TABLE IF NOT EXISTS public.dossierfacile_dossiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  dossierfacile_id character varying(255) NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamp with time zone NOT NULL,
  dossierfacile_data jsonb NULL,
  status character varying(50) NULL DEFAULT 'active',
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT dossierfacile_dossiers_pkey PRIMARY KEY (id),
  CONSTRAINT dossierfacile_dossiers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT dossierfacile_dossiers_dossierfacile_id_key UNIQUE (dossierfacile_id)
) TABLESPACE pg_default;

-- 3. Créer les index pour la table dossierfacile_dossiers
CREATE INDEX IF NOT EXISTS idx_dossierfacile_dossiers_tenant_id 
ON public.dossierfacile_dossiers USING btree (tenant_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dossierfacile_dossiers_dossierfacile_id 
ON public.dossierfacile_dossiers USING btree (dossierfacile_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dossierfacile_dossiers_status 
ON public.dossierfacile_dossiers USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dossierfacile_dossiers_token_expires 
ON public.dossierfacile_dossiers USING btree (token_expires_at) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dossierfacile_dossiers_data_gin 
ON public.dossierfacile_dossiers USING gin (dossierfacile_data) TABLESPACE pg_default;

-- 4. Créer la table pour les webhooks DossierFacile
CREATE TABLE IF NOT EXISTS public.dossierfacile_webhooks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dossierfacile_id character varying(255) NOT NULL,
  event_type character varying(100) NOT NULL,
  payload jsonb NOT NULL,
  processed boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  processed_at timestamp with time zone NULL,
  CONSTRAINT dossierfacile_webhooks_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 5. Créer les index pour la table webhooks
CREATE INDEX IF NOT EXISTS idx_dossierfacile_webhooks_dossierfacile_id 
ON public.dossierfacile_webhooks USING btree (dossierfacile_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dossierfacile_webhooks_event_type 
ON public.dossierfacile_webhooks USING btree (event_type) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dossierfacile_webhooks_processed 
ON public.dossierfacile_webhooks USING btree (processed) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dossierfacile_webhooks_created_at 
ON public.dossierfacile_webhooks USING btree (created_at) TABLESPACE pg_default;

-- 6. Créer la table pour les logs d'intégration
CREATE TABLE IF NOT EXISTS public.dossierfacile_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  dossierfacile_id character varying(255) NULL,
  action character varying(100) NOT NULL,
  status character varying(50) NOT NULL,
  message text NULL,
  error_details jsonb NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT dossierfacile_logs_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 7. Créer les index pour la table logs
CREATE INDEX IF NOT EXISTS idx_dossierfacile_logs_tenant_id 
ON public.dossierfacile_logs USING btree (tenant_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dossierfacile_logs_dossierfacile_id 
ON public.dossierfacile_webhooks USING btree (dossierfacile_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dossierfacile_logs_action 
ON public.dossierfacile_logs USING btree (action) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dossierfacile_logs_status 
ON public.dossierfacile_logs USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_dossierfacile_logs_created_at 
ON public.dossierfacile_logs USING btree (created_at) TABLESPACE pg_default;

-- 8. Créer les fonctions de mise à jour des timestamps
CREATE OR REPLACE FUNCTION update_dossierfacile_dossiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_rental_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Créer les triggers pour les timestamps
DROP TRIGGER IF EXISTS trigger_update_dossierfacile_dossiers_updated_at ON public.dossierfacile_dossiers;
CREATE TRIGGER trigger_update_dossierfacile_dossiers_updated_at
  BEFORE UPDATE ON public.dossierfacile_dossiers
  FOR EACH ROW
  EXECUTE FUNCTION update_dossierfacile_dossiers_updated_at();

DROP TRIGGER IF EXISTS trigger_update_rental_files_updated_at ON public.rental_files;
CREATE TRIGGER trigger_update_rental_files_updated_at
  BEFORE UPDATE ON public.rental_files
  FOR EACH ROW
  EXECUTE FUNCTION update_rental_files_updated_at();

-- 10. Créer les vues utiles
CREATE OR REPLACE VIEW public.rental_files_with_dossierfacile AS
SELECT 
  rf.*,
  dd.dossierfacile_id,
  dd.status as dossierfacile_connect_status,
  dd.dossierfacile_data as dossierfacile_connect_data,
  dd.created_at as dossierfacile_connected_at
FROM public.rental_files rf
LEFT JOIN public.dossierfacile_dossiers dd ON rf.tenant_id = dd.tenant_id;

-- 11. Créer les politiques RLS (Row Level Security)
-- Activer RLS sur les nouvelles tables
ALTER TABLE public.dossierfacile_dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossierfacile_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossierfacile_logs ENABLE ROW LEVEL SECURITY;

-- Politiques pour dossierfacile_dossiers
CREATE POLICY "Users can view their own dossierfacile data" ON public.dossierfacile_dossiers
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own dossierfacile data" ON public.dossierfacile_dossiers
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own dossierfacile data" ON public.dossierfacile_dossiers
  FOR UPDATE USING (tenant_id = auth.uid());

-- Politiques pour dossierfacile_webhooks (lecture seule pour les utilisateurs)
CREATE POLICY "Users can view webhooks for their dossierfacile" ON public.dossierfacile_webhooks
  FOR SELECT USING (dossierfacile_id IN (
    SELECT dossierfacile_id FROM public.dossierfacile_dossiers WHERE tenant_id = auth.uid()
  ));

-- Politiques pour dossierfacile_logs
CREATE POLICY "Users can view their own logs" ON public.dossierfacile_logs
  FOR SELECT USING (tenant_id = auth.uid());

-- 12. Commentaires sur les tables
COMMENT ON TABLE public.dossierfacile_dossiers IS 'Stockage des données DossierFacile Connect (OAuth2)';
COMMENT ON TABLE public.dossierfacile_webhooks IS 'Webhooks reçus de DossierFacile';
COMMENT ON TABLE public.dossierfacile_logs IS 'Logs des opérations DossierFacile';

COMMENT ON COLUMN public.rental_files.dossierfacile_id IS 'ID du dossier DossierFacile';
COMMENT ON COLUMN public.rental_files.dossierfacile_verification_code IS 'Code de vérification pour le lien simple';
COMMENT ON COLUMN public.rental_files.dossierfacile_pdf_url IS 'URL du PDF DossierFacile';
COMMENT ON COLUMN public.rental_files.dossierfacile_status IS 'Statut du dossier DossierFacile';
COMMENT ON COLUMN public.rental_files.dossierfacile_verified_at IS 'Date de vérification DossierFacile';
COMMENT ON COLUMN public.rental_files.dossierfacile_data IS 'Données extraites de DossierFacile';
COMMENT ON COLUMN public.rental_files.dossierfacile_share_url IS 'URL de partage DossierFacile';
COMMENT ON COLUMN public.rental_files.dossierfacile_public_url IS 'URL publique DossierFacile';

-- 13. Insérer des données de test (optionnel)
-- INSERT INTO public.dossierfacile_logs (tenant_id, action, status, message) 
-- VALUES (auth.uid(), 'migration', 'success', 'Tables DossierFacile créées avec succès');

-- 14. Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Tables DossierFacile créées avec succès dans Supabase !';
  RAISE NOTICE 'Colonnes ajoutées à rental_files: dossierfacile_id, dossierfacile_verification_code, dossierfacile_pdf_url, dossierfacile_status, dossierfacile_verified_at, dossierfacile_data, dossierfacile_share_url, dossierfacile_public_url';
  RAISE NOTICE 'Nouvelles tables créées: dossierfacile_dossiers, dossierfacile_webhooks, dossierfacile_logs';
  RAISE NOTICE 'Vues créées: rental_files_with_dossierfacile';
  RAISE NOTICE 'Politiques RLS activées pour la sécurité';
END $$;

-- Table de préavis de départ (demande de congé)
CREATE TABLE IF NOT EXISTS public.lease_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  -- Données de préavis
  notice_date date NOT NULL, -- date d'envoi par le locataire
  notice_period_months integer NOT NULL DEFAULT 1 CHECK (notice_period_months IN (1,2,3)),
  is_tense_zone boolean NOT NULL DEFAULT true, -- zone tendue => 1 mois
  move_out_date date NOT NULL, -- date de départ calculée

  -- Document généré (courrier)
  letter_title varchar(200) NOT NULL DEFAULT 'Lettre de congé du locataire',
  letter_html text NOT NULL,
  document_url text, -- si export PDF/stockage ajouté plus tard

  -- Statut du préavis
  status varchar(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('draft','sent','acknowledged','closed')),

  -- Métadonnées
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_lease_notices_lease_id ON public.lease_notices(lease_id);
CREATE INDEX IF NOT EXISTS idx_lease_notices_tenant_id ON public.lease_notices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lease_notices_owner_id ON public.lease_notices(owner_id);
CREATE INDEX IF NOT EXISTS idx_lease_notices_property_id ON public.lease_notices(property_id);
CREATE INDEX IF NOT EXISTS idx_lease_notices_created_at ON public.lease_notices(created_at);

-- RLS
ALTER TABLE public.lease_notices ENABLE ROW LEVEL SECURITY;

-- Le locataire du bail peut lire/créer ses préavis
CREATE POLICY IF NOT EXISTS "Tenant can read own lease notices" ON public.lease_notices
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Tenant can insert own lease notices" ON public.lease_notices
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- Le propriétaire du bien peut lire les préavis de ses locataires
CREATE POLICY IF NOT EXISTS "Owner can read lease notices" ON public.lease_notices
  FOR SELECT USING (
    owner_id = auth.uid()
  );

-- Mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lease_notices_updated_at ON public.lease_notices;
CREATE TRIGGER trg_lease_notices_updated_at
BEFORE UPDATE ON public.lease_notices
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();



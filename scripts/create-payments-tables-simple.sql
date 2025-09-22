-- Script SQL simplifié pour créer les tables de gestion des paiements
-- À exécuter dans l'ordre dans Supabase SQL Editor

-- 1. Table des paiements
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL,
  month varchar(7) NOT NULL,
  year integer NOT NULL,
  month_name varchar(20) NOT NULL,
  amount_due numeric(10,2) NOT NULL,
  rent_amount numeric(10,2) NOT NULL,
  charges_amount numeric(10,2) NOT NULL,
  due_date timestamp with time zone NOT NULL,
  payment_date timestamp with time zone,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method varchar(20) CHECK (payment_method IN ('virement', 'cheque', 'especes', 'prelevement')),
  reference varchar(100) NOT NULL,
  receipt_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases (id) ON DELETE CASCADE
);

-- 2. Table des quittances
CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  lease_id uuid NOT NULL,
  reference varchar(100) NOT NULL,
  month varchar(7) NOT NULL,
  year integer NOT NULL,
  rent_amount numeric(10,2) NOT NULL,
  charges_amount numeric(10,2) NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  pdf_path text,
  pdf_filename varchar(255),
  generated_at timestamp with time zone DEFAULT now(),
  sent_to_tenant boolean DEFAULT false,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT receipts_pkey PRIMARY KEY (id),
  CONSTRAINT receipts_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE CASCADE,
  CONSTRAINT receipts_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases (id) ON DELETE CASCADE
);

-- 3. Table des rappels
CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  lease_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  message text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  reminder_type varchar(20) NOT NULL CHECK (reminder_type IN ('first', 'second', 'final')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reminders_pkey PRIMARY KEY (id),
  CONSTRAINT reminders_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE CASCADE,
  CONSTRAINT reminders_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases (id) ON DELETE CASCADE,
  CONSTRAINT reminders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 4. Table de configuration des paiements par bail
CREATE TABLE IF NOT EXISTS public.lease_payment_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL UNIQUE,
  property_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  monthly_rent numeric(10,2) NOT NULL,
  monthly_charges numeric(10,2) NOT NULL,
  payment_day integer NOT NULL CHECK (payment_day >= 1 AND payment_day <= 31),
  payment_method varchar(20) NOT NULL CHECK (payment_method IN ('virement', 'cheque', 'especes', 'prelevement')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lease_payment_configs_pkey PRIMARY KEY (id),
  CONSTRAINT lease_payment_configs_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases (id) ON DELETE CASCADE,
  CONSTRAINT lease_payment_configs_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE,
  CONSTRAINT lease_payment_configs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 5. Ajouter la contrainte de clé étrangère pour receipt_id
ALTER TABLE public.payments 
ADD CONSTRAINT payments_receipt_id_fkey 
FOREIGN KEY (receipt_id) REFERENCES receipts (id) ON DELETE SET NULL;

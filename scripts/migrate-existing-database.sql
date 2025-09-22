-- Script de migration pour corriger la base de données existante
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure actuelle de la table leases
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'leases' 
AND column_name IN ('id', 'owner_id', 'tenant_id', 'property_id')
ORDER BY column_name;

-- 2. Vérifier les contraintes de clé étrangère existantes
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'leases'
    AND kcu.column_name IN ('owner_id', 'tenant_id', 'property_id');

-- 3. Créer les tables de paiements (si elles n'existent pas)
-- Table des paiements
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL,
    amount_due NUMERIC(10,2) NOT NULL,
    amount_paid NUMERIC(10,2) DEFAULT 0,
    due_date DATE NOT NULL,
    payment_date DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) NULL,
    reference VARCHAR(100) NULL,
    notes TEXT NULL,
    receipt_id UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT payments_pkey PRIMARY KEY (id),
    CONSTRAINT payments_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE CASCADE,
    CONSTRAINT payments_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE SET NULL,
    CONSTRAINT payments_status_check CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled'))
);

-- Table des quittances
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    lease_id UUID NOT NULL,
    receipt_number VARCHAR(50) NOT NULL,
    month VARCHAR(7) NOT NULL, -- Format: 2025-03
    year INTEGER NOT NULL,
    rent_amount NUMERIC(10,2) NOT NULL,
    charges_amount NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL,
    pdf_url TEXT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT receipts_pkey PRIMARY KEY (id),
    CONSTRAINT receipts_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    CONSTRAINT receipts_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE CASCADE,
    CONSTRAINT receipts_receipt_number_unique UNIQUE (receipt_number)
);

-- Table des rappels
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    lease_id UUID NOT NULL,
    reminder_type VARCHAR(20) NOT NULL DEFAULT 'payment_due',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_to_email VARCHAR(255) NOT NULL,
    message TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT reminders_pkey PRIMARY KEY (id),
    CONSTRAINT reminders_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    CONSTRAINT reminders_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE CASCADE,
    CONSTRAINT reminders_type_check CHECK (reminder_type IN ('payment_due', 'payment_overdue', 'payment_reminder')),
    CONSTRAINT reminders_status_check CHECK (status IN ('sent', 'delivered', 'failed'))
);

-- Table de configuration des paiements par bail
CREATE TABLE IF NOT EXISTS public.lease_payment_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL,
    rent_amount NUMERIC(10,2) NOT NULL,
    charges_amount NUMERIC(10,2) DEFAULT 0,
    payment_day INTEGER NOT NULL DEFAULT 1, -- Jour du mois (1-31)
    payment_method VARCHAR(50) DEFAULT 'virement',
    auto_generate BOOLEAN DEFAULT true,
    reminder_days INTEGER DEFAULT 3, -- Jours avant échéance pour rappel
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT lease_payment_configs_pkey PRIMARY KEY (id),
    CONSTRAINT lease_payment_configs_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE CASCADE,
    CONSTRAINT lease_payment_configs_lease_id_unique UNIQUE (lease_id),
    CONSTRAINT lease_payment_configs_payment_day_check CHECK (payment_day >= 1 AND payment_day <= 31)
);

-- 4. Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_payments_lease_id ON public.payments USING btree (lease_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments USING btree (status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_receipts_lease_id ON public.receipts USING btree (lease_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON public.receipts USING btree (payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_month ON public.receipts USING btree (month);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON public.receipts USING btree (receipt_number);

CREATE INDEX IF NOT EXISTS idx_reminders_lease_id ON public.reminders USING btree (lease_id);
CREATE INDEX IF NOT EXISTS idx_reminders_payment_id ON public.reminders USING btree (payment_id);
CREATE INDEX IF NOT EXISTS idx_reminders_sent_at ON public.reminders USING btree (sent_at);

CREATE INDEX IF NOT EXISTS idx_lease_payment_configs_lease_id ON public.lease_payment_configs USING btree (lease_id);

-- 5. Ajouter la contrainte de clé étrangère pour receipts dans payments (après création des tables)
ALTER TABLE public.payments 
ADD CONSTRAINT IF NOT EXISTS payments_receipt_id_fkey 
FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE SET NULL;

-- 6. Activer RLS (Row Level Security) sur toutes les tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_payment_configs ENABLE ROW LEVEL SECURITY;

-- 7. Créer les politiques RLS pour les propriétaires
-- Politique pour les paiements
CREATE POLICY "Propriétaires peuvent voir leurs paiements" ON public.payments
    FOR ALL USING (
        lease_id IN (
            SELECT id FROM leases WHERE owner_id = auth.uid()
        )
    );

-- Politique pour les quittances
CREATE POLICY "Propriétaires peuvent voir leurs quittances" ON public.receipts
    FOR ALL USING (
        lease_id IN (
            SELECT id FROM leases WHERE owner_id = auth.uid()
        )
    );

-- Politique pour les rappels
CREATE POLICY "Propriétaires peuvent voir leurs rappels" ON public.reminders
    FOR ALL USING (
        lease_id IN (
            SELECT id FROM leases WHERE owner_id = auth.uid()
        )
    );

-- Politique pour les configurations de paiement
CREATE POLICY "Propriétaires peuvent gérer leurs configurations" ON public.lease_payment_configs
    FOR ALL USING (
        lease_id IN (
            SELECT id FROM leases WHERE owner_id = auth.uid()
        )
    );

-- 8. Créer la fonction pour générer les paiements mensuels
CREATE OR REPLACE FUNCTION generate_monthly_payments(target_month VARCHAR(7))
RETURNS TABLE(
    id UUID,
    lease_id UUID,
    amount_due NUMERIC(10,2),
    due_date DATE,
    status VARCHAR(20)
) AS $$
BEGIN
    -- Insérer les paiements pour le mois cible
    INSERT INTO payments (lease_id, amount_due, due_date, status)
    SELECT 
        l.id as lease_id,
        COALESCE(lpc.rent_amount, l.monthly_rent) as amount_due,
        DATE(target_month || '-01') + INTERVAL '1 month' - INTERVAL '1 day' as due_date,
        'pending' as status
    FROM leases l
    LEFT JOIN lease_payment_configs lpc ON l.id = lpc.lease_id
    WHERE l.status = 'active'
    AND NOT EXISTS (
        SELECT 1 FROM payments p 
        WHERE p.lease_id = l.id 
        AND TO_CHAR(p.due_date, 'YYYY-MM') = target_month
    );
    
    -- Retourner les paiements créés
    RETURN QUERY
    SELECT p.id, p.lease_id, p.amount_due, p.due_date, p.status
    FROM payments p
    WHERE TO_CHAR(p.due_date, 'YYYY-MM') = target_month
    AND p.created_at >= NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Créer un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lease_payment_configs_updated_at 
    BEFORE UPDATE ON lease_payment_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Vérifier que tout est créé correctement
SELECT 
    'payments' as table_name,
    COUNT(*) as row_count
FROM payments
UNION ALL
SELECT 
    'receipts' as table_name,
    COUNT(*) as row_count
FROM receipts
UNION ALL
SELECT 
    'reminders' as table_name,
    COUNT(*) as row_count
FROM reminders
UNION ALL
SELECT 
    'lease_payment_configs' as table_name,
    COUNT(*) as row_count
FROM lease_payment_configs;

-- Script final corrigé pour les fonctions de paiements - TOUS les conflits résolus
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer toutes les fonctions existantes
DROP FUNCTION IF EXISTS generate_monthly_payments(character varying);
DROP FUNCTION IF EXISTS mark_payment_as_paid(uuid, timestamp with time zone, character varying);
DROP FUNCTION IF EXISTS mark_payment_as_unpaid(uuid, text);
DROP FUNCTION IF EXISTS create_payment_reminder(uuid, character varying, text);
DROP FUNCTION IF EXISTS generate_receipt(uuid);
DROP FUNCTION IF EXISTS get_owner_payment_stats(uuid, timestamp with time zone, timestamp with time zone);

-- 2. Créer la fonction pour générer les paiements mensuels
CREATE OR REPLACE FUNCTION generate_monthly_payments(target_month VARCHAR(7))
RETURNS TABLE(
    id UUID,
    lease_id UUID,
    amount_due NUMERIC(10,2),
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20)
) AS $$
DECLARE
    current_year INTEGER;
    current_month INTEGER;
    month_names TEXT[] := ARRAY['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                               'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    month_name TEXT;
    due_date_calc TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Extraire l'année et le mois de la chaîne target_month (format: "2025-03")
    current_year := CAST(SPLIT_PART(target_month, '-', 1) AS INTEGER);
    current_month := CAST(SPLIT_PART(target_month, '-', 2) AS INTEGER);
    month_name := month_names[current_month];
    
    -- Calculer la date d'échéance (dernier jour du mois)
    due_date_calc := DATE_TRUNC('month', (current_year || '-' || current_month || '-01')::DATE) + INTERVAL '1 month' - INTERVAL '1 day';
    
    -- Insérer les paiements pour le mois cible
    INSERT INTO payments (
        lease_id, 
        month, 
        year, 
        month_name, 
        amount_due, 
        rent_amount, 
        charges_amount, 
        due_date, 
        status, 
        reference
    )
    SELECT 
        l.id as lease_id,
        target_month as month,
        current_year as year,
        month_name as month_name,
        COALESCE(l.monthly_rent, 0) + COALESCE(l.charges, 0) as amount_due,
        COALESCE(l.monthly_rent, 0) as rent_amount,
        COALESCE(l.charges, 0) as charges_amount,
        due_date_calc,
        'pending' as status,
        'PAY-' || target_month || '-' || LPAD(EXTRACT(DAY FROM due_date_calc)::TEXT, 2, '0') || '-' || SUBSTRING(l.id::TEXT, 1, 8) as reference
    FROM leases l
    WHERE l.status = 'active'
    AND l.owner_id IS NOT NULL
    AND l.tenant_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM payments p 
        WHERE p.lease_id = l.id 
        AND p.month = target_month
    );
    
    -- Retourner les paiements créés
    RETURN QUERY
    SELECT p.id, p.lease_id, p.amount_due, p.due_date, p.status
    FROM payments p
    WHERE p.month = target_month
    AND p.created_at >= NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer la fonction pour marquer un paiement comme payé
CREATE OR REPLACE FUNCTION mark_payment_as_paid(
    payment_id_param UUID,
    payment_date_param TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method VARCHAR(20) DEFAULT 'virement'
)
RETURNS TABLE(
    id UUID,
    status VARCHAR(20),
    payment_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Mettre à jour le paiement
    UPDATE payments 
    SET 
        status = 'paid',
        payment_date = payment_date_param,
        payment_method = payment_method,
        updated_at = NOW()
    WHERE id = payment_id_param;
    
    -- Retourner le paiement mis à jour
    RETURN QUERY
    SELECT p.id, p.status, p.payment_date
    FROM payments p
    WHERE p.id = payment_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Créer la fonction pour marquer un paiement comme impayé
CREATE OR REPLACE FUNCTION mark_payment_as_unpaid(
    payment_id_param UUID,
    notes_param TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    status VARCHAR(20),
    notes TEXT
) AS $$
BEGIN
    -- Mettre à jour le paiement
    UPDATE payments 
    SET 
        status = 'overdue',
        payment_date = NULL,
        payment_method = NULL,
        notes = COALESCE(notes_param, 'Marqué comme impayé'),
        updated_at = NOW()
    WHERE id = payment_id_param;
    
    -- Retourner le paiement mis à jour
    RETURN QUERY
    SELECT p.id, p.status, p.notes
    FROM payments p
    WHERE p.id = payment_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Créer la fonction pour créer un rappel
CREATE OR REPLACE FUNCTION create_payment_reminder(
    payment_id_param UUID,
    reminder_type VARCHAR(20) DEFAULT 'first',
    custom_message TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    payment_id UUID,
    lease_id UUID,
    tenant_id UUID,
    message TEXT,
    status VARCHAR(20)
) AS $$
DECLARE
    payment_record RECORD;
    reminder_message TEXT;
BEGIN
    -- Récupérer les informations du paiement
    SELECT p.*, l.tenant_id, l.owner_id
    INTO payment_record
    FROM payments p
    JOIN leases l ON p.lease_id = l.id
    WHERE p.id = payment_id_param;
    
    -- Construire le message de rappel
    IF custom_message IS NOT NULL THEN
        reminder_message := custom_message;
    ELSE
        reminder_message := 'Rappel de paiement pour le loyer de ' || payment_record.month_name || 
                          '. Montant dû: ' || payment_record.amount_due || '€. ' ||
                          'Échéance: ' || TO_CHAR(payment_record.due_date, 'DD/MM/YYYY');
    END IF;
    
    -- Insérer le rappel
    INSERT INTO reminders (
        payment_id,
        lease_id,
        tenant_id,
        message,
        status,
        reminder_type
    ) VALUES (
        payment_id_param,
        payment_record.lease_id,
        payment_record.tenant_id,
        reminder_message,
        'sent',
        reminder_type
    );
    
    -- Retourner le rappel créé
    RETURN QUERY
    SELECT r.id, r.payment_id, r.lease_id, r.tenant_id, r.message, r.status
    FROM reminders r
    WHERE r.payment_id = payment_id_param
    ORDER BY r.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Créer la fonction pour générer une quittance
CREATE OR REPLACE FUNCTION generate_receipt(
    payment_id_param UUID
)
RETURNS TABLE(
    id UUID,
    payment_id UUID,
    lease_id UUID,
    reference VARCHAR(100),
    total_amount NUMERIC(10,2)
) AS $$
DECLARE
    payment_record RECORD;
    receipt_reference VARCHAR(100);
BEGIN
    -- Récupérer les informations du paiement
    SELECT p.*, l.owner_id, l.tenant_id
    INTO payment_record
    FROM payments p
    JOIN leases l ON p.lease_id = l.id
    WHERE p.id = payment_id_param;
    
    -- Générer la référence de la quittance
    receipt_reference := 'QUITTANCE-' || payment_record.month || '-' || 
                        SUBSTRING(payment_record.lease_id::TEXT, 1, 8);
    
    -- Insérer la quittance
    INSERT INTO receipts (
        payment_id,
        lease_id,
        reference,
        month,
        year,
        rent_amount,
        charges_amount,
        total_amount,
        sent_to_tenant
    ) VALUES (
        payment_id_param,
        payment_record.lease_id,
        receipt_reference,
        payment_record.month,
        payment_record.year,
        payment_record.rent_amount,
        payment_record.charges_amount,
        payment_record.amount_due,
        false
    );
    
    -- Mettre à jour le paiement avec l'ID de la quittance
    UPDATE payments 
    SET receipt_id = (SELECT id FROM receipts WHERE payment_id = payment_id_param ORDER BY created_at DESC LIMIT 1)
    WHERE id = payment_id_param;
    
    -- Retourner la quittance créée
    RETURN QUERY
    SELECT r.id, r.payment_id, r.lease_id, r.reference, r.total_amount
    FROM receipts r
    WHERE r.payment_id = payment_id_param
    ORDER BY r.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Créer la fonction pour obtenir les statistiques d'un propriétaire
CREATE OR REPLACE FUNCTION get_owner_payment_stats(
    owner_id_param UUID,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
    total_received NUMERIC(10,2),
    total_pending NUMERIC(10,2),
    total_overdue NUMERIC(10,2),
    collection_rate NUMERIC(5,2),
    average_delay NUMERIC(5,2)
) AS $$
DECLARE
    total_received NUMERIC(10,2) := 0;
    total_pending NUMERIC(10,2) := 0;
    total_overdue NUMERIC(10,2) := 0;
    total_amount NUMERIC(10,2) := 0;
    collection_rate NUMERIC(5,2) := 0;
    average_delay NUMERIC(5,2) := 0;
    paid_count INTEGER := 0;
    total_delay NUMERIC(10,2) := 0;
BEGIN
    -- Calculer les montants par statut
    SELECT 
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount_due ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount_due ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN p.status = 'overdue' THEN p.amount_due ELSE 0 END), 0)
    INTO total_received, total_pending, total_overdue
    FROM payments p
    JOIN leases l ON p.lease_id = l.id
    WHERE l.owner_id = owner_id_param
    AND (start_date IS NULL OR p.created_at >= start_date)
    AND (end_date IS NULL OR p.created_at <= end_date);
    
    -- Calculer le taux de recouvrement
    total_amount := total_received + total_pending + total_overdue;
    IF total_amount > 0 THEN
        collection_rate := (total_received / total_amount) * 100;
    END IF;
    
    -- Calculer le délai moyen de paiement
    SELECT 
        COUNT(*),
        COALESCE(SUM(EXTRACT(EPOCH FROM (p.payment_date - p.due_date)) / 86400), 0)
    INTO paid_count, total_delay
    FROM payments p
    JOIN leases l ON p.lease_id = l.id
    WHERE l.owner_id = owner_id_param
    AND p.status = 'paid'
    AND p.payment_date IS NOT NULL
    AND (start_date IS NULL OR p.created_at >= start_date)
    AND (end_date IS NULL OR p.created_at <= end_date);
    
    IF paid_count > 0 THEN
        average_delay := total_delay / paid_count;
    END IF;
    
    -- Retourner les statistiques
    RETURN QUERY
    SELECT total_received, total_pending, total_overdue, collection_rate, average_delay;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Vérifier que toutes les fonctions ont été créées
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'generate_monthly_payments',
    'mark_payment_as_paid',
    'mark_payment_as_unpaid',
    'create_payment_reminder',
    'generate_receipt',
    'get_owner_payment_stats'
)
ORDER BY routine_name;

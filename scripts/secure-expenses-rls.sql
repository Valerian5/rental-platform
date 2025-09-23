-- Script RLS sécurisé pour la table expenses
-- À exécuter dans Supabase SQL Editor

-- 1. Activer RLS sur expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON expenses;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable update for users based on owner_id" ON expenses;
DROP POLICY IF EXISTS "Enable delete for users based on owner_id" ON expenses;

-- 3. Créer une politique SELECT pour les propriétaires sur leurs propres dépenses
CREATE POLICY "Owners can view their own expenses" ON expenses
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- 4. Créer une politique pour les opérations de service (backend)
-- Cette politique permet au service_role de faire toutes les opérations
CREATE POLICY "Service role can manage all expenses" ON expenses
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Vérifier les politiques créées
SELECT 
    'Politiques RLS expenses' as type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'expenses';

-- 6. Vérifier le statut RLS
SELECT 
    'Status RLS expenses' as type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'expenses';

-- 7. Tester la politique avec un utilisateur authentifié
-- (Cette requête ne fonctionnera que si l'utilisateur est connecté)
SELECT 
    'Test expenses avec utilisateur connecté' as type,
    e.id,
    e.owner_id,
    e.property_id,
    e.lease_id,
    e.type,
    e.category,
    e.amount,
    e.date,
    e.deductible
FROM expenses e
WHERE e.owner_id = auth.uid()
LIMIT 5;

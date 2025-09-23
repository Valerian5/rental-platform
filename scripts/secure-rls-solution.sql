-- Solution RLS sécurisée et appropriée
-- À exécuter dans Supabase SQL Editor

-- 1. Réactiver RLS sur receipts
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Owners can view their receipts" ON receipts;
DROP POLICY IF EXISTS "Users can view receipts for their own leases" ON receipts;
DROP POLICY IF EXISTS "Authenticated users can view all receipts" ON receipts;

-- 3. Créer une politique RLS basée sur l'owner_id via la relation
-- Cette politique utilise la relation payments -> leases -> owner_id
CREATE POLICY "Owners can view receipts via lease ownership" ON receipts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM payments p
    JOIN leases l ON p.lease_id = l.id
    WHERE p.id = receipts.payment_id
    AND l.owner_id = (
      SELECT id FROM users 
      WHERE id = auth.uid()
    )
  )
);

-- 4. Créer une politique pour les opérations de service (backend)
-- Cette politique permet au service_role de faire toutes les opérations
CREATE POLICY "Service role can manage all receipts" ON receipts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Vérifier les politiques créées
SELECT 
    'Politiques RLS finales' as type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'receipts';

-- 6. Tester la politique avec un utilisateur authentifié
-- (Cette requête ne fonctionnera que si l'utilisateur est connecté)
SELECT 
    'Test avec utilisateur connecté' as type,
    r.id,
    r.lease_id,
    r.year,
    r.month,
    r.rent_amount,
    r.charges_amount,
    r.total_amount
FROM receipts r
WHERE r.year = 2025;

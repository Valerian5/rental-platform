-- Politiques RLS pour la table maintenance_works
-- Permettre aux locataires de voir les travaux programmés pour leurs propriétés

-- Activer RLS sur la table maintenance_works
ALTER TABLE maintenance_works ENABLE ROW LEVEL SECURITY;

-- Politique pour les locataires : peuvent voir les travaux des propriétés qu'ils louent
CREATE POLICY "Tenants can view maintenance works for their properties" ON maintenance_works
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM properties p
    JOIN leases l ON l.property_id = p.id
    WHERE p.id = maintenance_works.property_id 
    AND l.tenant_id = auth.uid()
  )
);

-- Politique pour les propriétaires : peuvent voir et gérer les travaux de leurs propriétés
CREATE POLICY "Owners can manage maintenance works for their properties" ON maintenance_works
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM properties p
    WHERE p.id = maintenance_works.property_id 
    AND p.owner_id = auth.uid()
  )
);

-- Politique pour les administrateurs : accès complet
CREATE POLICY "Admins can manage all maintenance works" ON maintenance_works
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM users u
    WHERE u.id = auth.uid() 
    AND u.user_type = 'admin'
  )
);

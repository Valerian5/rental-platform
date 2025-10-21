-- Désactiver temporairement RLS sur incident_responses pour permettre Realtime
-- ATTENTION: Ceci expose les réponses à tous les utilisateurs authentifiés
-- À utiliser uniquement pour tester Realtime

-- Désactiver RLS
ALTER TABLE public.incident_responses DISABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Incident responses visible to related lease parties" ON public.incident_responses;
DROP POLICY IF EXISTS "Incident responses can be inserted by related parties" ON public.incident_responses;

-- Créer une politique simple pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can access incident responses" ON public.incident_responses
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Activer Realtime sur la table
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_responses;

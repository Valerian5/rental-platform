import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const server = createServerClient()
    
    // Vérifier que l'utilisateur est admin
    const { data: { user } } = await server.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: userData } = await server
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Script de migration
    const migrationSQL = `
      -- Table des documents d'état des lieux
      CREATE TABLE IF NOT EXISTS etat_des_lieux_documents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('entree', 'sortie')),
        status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'signed')),
        file_url TEXT,
        file_name VARCHAR(255),
        file_size INTEGER,
        digital_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Table des modèles d'état des lieux
      CREATE TABLE IF NOT EXISTS etat_des_lieux_templates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('entree', 'sortie')),
        room_count INTEGER NOT NULL CHECK (room_count > 0),
        description TEXT,
        file_url TEXT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Index pour etat_des_lieux_documents
      CREATE INDEX IF NOT EXISTS idx_etat_des_lieux_documents_lease_id ON etat_des_lieux_documents(lease_id);
      CREATE INDEX IF NOT EXISTS idx_etat_des_lieux_documents_property_id ON etat_des_lieux_documents(property_id);
      CREATE INDEX IF NOT EXISTS idx_etat_des_lieux_documents_type ON etat_des_lieux_documents(type);

      -- Index pour etat_des_lieux_templates
      CREATE INDEX IF NOT EXISTS idx_etat_des_lieux_templates_type ON etat_des_lieux_templates(type);
      CREATE INDEX IF NOT EXISTS idx_etat_des_lieux_templates_room_count ON etat_des_lieux_templates(room_count);
      CREATE INDEX IF NOT EXISTS idx_etat_des_lieux_templates_is_active ON etat_des_lieux_templates(is_active);

      -- RLS pour etat_des_lieux_documents
      ALTER TABLE etat_des_lieux_documents ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Propriétaires peuvent gérer leurs documents d'état des lieux" ON etat_des_lieux_documents
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM leases 
            WHERE leases.id = etat_des_lieux_documents.lease_id 
            AND leases.bailleur_id = auth.uid()
          )
        );

      CREATE POLICY "Locataires peuvent voir leurs documents d'état des lieux" ON etat_des_lieux_documents
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM leases 
            WHERE leases.id = etat_des_lieux_documents.lease_id 
            AND leases.locataire_id = auth.uid()
          )
        );

      -- RLS pour etat_des_lieux_templates
      ALTER TABLE etat_des_lieux_templates ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Admins peuvent gérer les modèles d'état des lieux" ON etat_des_lieux_templates
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
          )
        );

      CREATE POLICY "Utilisateurs peuvent voir les modèles actifs" ON etat_des_lieux_templates
        FOR SELECT USING (is_active = true);
    `

    // Exécuter la migration
    const { error } = await server.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error("Erreur migration:", error)
      return NextResponse.json({ error: "Erreur lors de la migration" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Migration des états des lieux terminée avec succès" 
    })

  } catch (error) {
    console.error("Erreur migration:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
